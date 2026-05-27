import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { verifyUser, getUserProfile } from './lib/supabaseAdmin.js';
import { checkAndIncrementUsage } from './lib/quota.js';
import { handleChat, handlePerspectives } from './lib/agentService.js';
import { loadChunks } from './lib/vectorStore.js';
import { synthesizeSpeech } from './lib/tts.js';
import { translateTexts } from './lib/translateService.js';
import { exportUserData, deleteUserData } from './lib/userData.js';
import { resolveJitsiJoin } from './lib/jitsiToken.js';
import { recordFriendPresence } from './lib/friendsService.js';
import { rateLimit, securityHeaders, safeErrorMessage } from './lib/security.js';

const app = express();

app.use(securityHeaders);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (!config.isProduction) return callback(null, true);
    if (config.corsOrigins.length === 0) {
      if (config.appPublicUrl && origin === config.appPublicUrl) return callback(null, true);
      if (origin && /\.vercel\.app$/i.test(origin)) return callback(null, true);
      return callback(null, false);
    }
    if (config.corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('cors_not_allowed'));
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

app.use(
  rateLimit({
    windowMs: 60_000,
    max: config.isProduction ? 120 : 300,
    keyPrefix: 'global',
  })
);

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace(/^Bearer\s+/i, '');
  req.user = token ? await verifyUser(token) : null;
  req.profile = req.user ? await getUserProfile(req.user.id) : null;
  next();
}

function requireUser(req, res) {
  if (!req.user?.id) {
    res.status(401).json({ error: 'unauthorized' });
    return false;
  }
  return true;
}

app.get('/api/health', (_req, res) => {
  if (config.isProduction) {
    return res.json({ ok: true, tts: Boolean(config.openaiKey), translate: true });
  }
  const jitsiConfigured = Boolean(
    config.jitsiDomain && config.jitsiAppId && config.jitsiAppSecret
  );
  res.json({
    ok: true,
    openai: Boolean(config.openaiKey),
    translate: true,
    chunks: loadChunks().length,
    supabase: Boolean(config.supabaseUrl),
    jitsi: {
      configured: jitsiConfigured,
      publicUrl: config.jitsiPublicUrl || null,
      fallback: config.jitsiAllowPublicFallback,
      available: jitsiConfigured || config.jitsiAllowPublicFallback,
    },
  });
});

app.get('/api/jitsi/status', (_req, res) => {
  const configured = Boolean(config.jitsiDomain && config.jitsiAppId && config.jitsiAppSecret);
  const available = configured || config.jitsiAllowPublicFallback;
  res.json({
    available,
    mode: configured ? 'secured' : config.jitsiAllowPublicFallback ? 'fallback' : 'disabled',
    publicUrl: config.jitsiPublicUrl || null,
  });
});

app.get('/api/user/export', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const payload = await exportUserData(req.user.id);
    res.json(payload);
  } catch (err) {
    console.error('export error', err);
    res.status(500).json({ error: 'export_failed', message: safeErrorMessage(err) });
  }
});

app.delete('/api/user', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    await deleteUserData(req.user.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('delete user error', err);
    res.status(500).json({ error: 'delete_failed', message: safeErrorMessage(err) });
  }
});

app.post('/api/friends/presence', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const result = await recordFriendPresence(req.user);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('friends presence error', err);
    res.status(500).json({ error: 'presence_failed', message: safeErrorMessage(err) });
  }
});

app.post('/api/jitsi/join', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const cellSlug = String(req.body?.cellSlug || 'global').replace(/[^a-z0-9_-]/gi, '').slice(0, 32);
    const plan = req.profile?.plan_type || 'free';
    const isPremium = plan === 'premium' || plan === 'premium_plus' || req.profile?.is_premium;

    const join = resolveJitsiJoin({
      cellSlug: cellSlug || 'global',
      userId: req.user.id,
      displayName: req.profile?.name || req.user.email?.split('@')[0] || 'Membre',
      isPremium,
    });

    if (join.mode === 'disabled') {
      return res.status(503).json({
        error: 'jitsi_not_configured',
        message: 'Configure JITSI_DOMAIN, JITSI_APP_ID and JITSI_APP_SECRET on the server.',
      });
    }

    res.json(join);
  } catch (err) {
    console.error('jitsi join error', err);
    res.status(500).json({ error: 'jitsi_error', message: safeErrorMessage(err) });
  }
});

const agentRateLimit = rateLimit({
  windowMs: 60_000,
  max: config.isProduction ? 20 : 60,
  keyPrefix: 'agent',
});

app.post('/api/agent/chat', authMiddleware, agentRateLimit, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const { message, language = 'fr', history = [] } = req.body || {};
    if (!message?.trim()) {
      return res.status(400).json({ error: 'message_required' });
    }

    const userType = req.profile?.user_type || req.body?.userType || 'curious';
    const usage = await checkAndIncrementUsage(req.user.id, 'chat', req);

    if (!usage.allowed) {
      return res.status(402).json({
        error: 'quota_exceeded',
        plan: usage.plan,
        limit: usage.limit,
        used: usage.used,
      });
    }

    const result = await handleChat({
      message: message.trim(),
      language,
      userType,
      history: Array.isArray(history) ? history.slice(-20) : [],
    });

    res.json({
      ...result,
      usage: {
        plan: usage.plan,
        used: usage.used,
        limit: usage.limit,
        remaining: usage.remaining,
      },
    });
  } catch (err) {
    console.error('chat error', err);
    res.status(500).json({ error: 'agent_error', message: safeErrorMessage(err) });
  }
});

const ttsRateLimit = rateLimit({
  windowMs: 60_000,
  max: config.isProduction ? 15 : 40,
  keyPrefix: 'tts',
});

const translateRateLimit = rateLimit({
  windowMs: 60_000,
  max: config.isProduction ? 25 : 80,
  keyPrefix: 'translate',
});

app.post('/api/translate', translateRateLimit, async (req, res) => {
  try {
    const { texts, to, from = 'fr' } = req.body || {};
    const target = String(to || '')
      .split('-')[0]
      .toLowerCase();
    const source = String(from || 'fr')
      .split('-')[0]
      .toLowerCase();
    const allowed = ['fr', 'en', 'es', 'nl', 'pt', 'ar'];

    if (!allowed.includes(target)) {
      return res.status(400).json({ error: 'invalid_target' });
    }
    if (!allowed.includes(source)) {
      return res.status(400).json({ error: 'invalid_source' });
    }

    const list = Array.isArray(texts) ? texts : texts != null ? [texts] : [];
    if (!list.length || list.length > 24) {
      return res.status(400).json({ error: 'texts_required' });
    }

    const totalChars = list.reduce((n, t) => n + String(t || '').length, 0);
    if (totalChars > 120_000) {
      return res.status(413).json({ error: 'payload_too_large' });
    }

    const translations = await translateTexts(list, { from: source, to: target });
    res.json({ translations, from: source, to: target });
  } catch (err) {
    console.error('translate error', err);
    const msg = err.message || '';
    const status = /too many requests/i.test(msg) ? 429 : 500;
    res.status(status).json({
      error: status === 429 ? 'translate_rate_limited' : 'translate_error',
      message: safeErrorMessage(err),
    });
  }
});

app.post('/api/tts', authMiddleware, ttsRateLimit, async (req, res) => {
  try {
    const { text, locale = 'fr-FR' } = req.body || {};
    if (!text?.trim()) {
      return res.status(400).json({ error: 'text_required' });
    }
    if (!config.openaiKey) {
      return res.status(503).json({ error: 'tts_unavailable' });
    }

    const audio = await synthesizeSpeech(text.trim().slice(0, 4096), locale);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(audio);
  } catch (err) {
    console.error('tts error', err);
    const msg = err.message || '';
    const status = /quota|429/i.test(msg) ? 429 : 500;
    res.status(status).json({
      error: status === 429 ? 'tts_quota_exceeded' : 'tts_error',
      message: safeErrorMessage(err),
    });
  }
});

app.post('/api/agent/perspectives', authMiddleware, agentRateLimit, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const { question, language = 'fr' } = req.body || {};
    if (!question?.trim()) {
      return res.status(400).json({ error: 'question_required' });
    }

    const userType = req.profile?.user_type || 'curious';
    const usage = await checkAndIncrementUsage(req.user.id, 'perspectives', req);

    if (!usage.allowed) {
      return res.status(402).json({
        error: 'quota_exceeded',
        plan: usage.plan,
        limit: usage.limit,
        used: usage.used,
      });
    }

    const result = await handlePerspectives({
      question: question.trim(),
      language,
      userType,
    });

    res.json({
      ...result,
      usage: {
        plan: usage.plan,
        used: usage.used,
        limit: usage.limit,
        remaining: usage.remaining,
      },
    });
  } catch (err) {
    console.error('perspectives error', err);
    res.status(500).json({ error: 'agent_error', message: safeErrorMessage(err) });
  }
});

export default app;
