import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { verifyUser, getUserProfile } from './lib/supabaseAdmin.js';
import { checkAndIncrementUsage } from './lib/quota.js';
import { checkAndIncrementConfessionalUsage } from './lib/confessionalQuota.js';
import { handleChat, handlePerspectives } from './lib/agentService.js';
import { loadChunks } from './lib/vectorStore.js';
import { synthesizeSpeech } from './lib/tts.js';
import { translateTexts } from './lib/translateService.js';
import { exportUserData, deleteUserData } from './lib/userData.js';
import { recordFriendPresence } from './lib/friendsService.js';
import { listCustomCells, createCustomCell } from './lib/cellsService.js';
import { resolveCanHostVisio } from './lib/cellHost.js';
import {
  handleConfessionalChat,
  listActivePrayers,
  createPrayerRequest,
  incrementPrayerCount,
  createCompanionRequest,
  listSessionMessages,
  listOpenConfessionSessions,
  closeConfessionSession,
  listUserCompanionRequests,
} from './lib/confessionalService.js';
import { companionAccessDenied } from './lib/companionAuth.js';
import {
  listCompanionQueue,
  getCompanionRequestDetail,
  assignCompanionRequest,
  updateCompanionRequestStatus,
  setCompanionAvailability,
  addCompanionNote,
  triggerCompanionEmergency,
  listCompanionChatMessages,
  sendCompanionChatMessage,
  listRecentCrisisEvents,
  getCompanionMe,
  listTeamCompanions,
  transferCompanionRequest,
} from './lib/companionService.js';
import {
  listSupportGroups,
  joinSupportGroup,
  leaveSupportGroup,
  listSupportGroupMessages,
  postSupportGroupMessage,
} from './lib/confessionalSupportService.js';
import { rateLimit, securityHeaders, safeErrorMessage } from './lib/security.js';
import {
  createSubscriptionOrder,
  capturePayPalOrder,
  getOrderForUser,
  devCompleteOrder,
  handleWaveWebhook,
  verifyWaveWebhookAuth,
} from './lib/paymentService.js';
import { getPlanPricing, PLAN_IDS } from './lib/paymentPlans.js';

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

function requireCompanion(req, res) {
  if (!requireUser(req, res)) return false;
  const denied = companionAccessDenied(req);
  if (denied) {
    res.status(denied.status).json({ error: denied.error });
    return false;
  }
  return true;
}

app.get('/api/health', (_req, res) => {
  if (config.isProduction) {
    return res.json({ ok: true, tts: Boolean(config.openaiKey), translate: true });
  }
  res.json({
    ok: true,
    openai: Boolean(config.openaiKey),
    translate: true,
    chunks: loadChunks().length,
    supabase: Boolean(config.supabaseUrl),
  });
});

function resolveCanCreateCell(user, profile) {
  return resolveCanHostVisio(user, profile, config.jitsiHostEmails);
}

app.get('/api/cells/capabilities', authMiddleware, (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const canCreateCell = resolveCanCreateCell(req.user, req.profile);
  res.json({
    canCreateCell,
    plan: req.profile?.plan_type || 'free',
  });
});

app.get('/api/cells/custom', async (_req, res) => {
  try {
    const cells = await listCustomCells();
    res.json({ cells });
  } catch (err) {
    console.error('cells list error', err);
    res.status(500).json({ error: 'cells_list_failed', message: safeErrorMessage(err) });
  }
});

app.post('/api/cells', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    if (!resolveCanCreateCell(req.user, req.profile)) {
      return res.status(403).json({
        error: 'cells_create_forbidden',
        message: 'Premium+ or TKV host profile required to create a cell.',
      });
    }

    const cell = await createCustomCell({
      userId: req.user.id,
      name: req.body?.name,
      description: req.body?.description,
      language: req.body?.language,
    });

    res.status(201).json({ ok: true, cell });
  } catch (err) {
    if (err.code === 'invalid_name') {
      return res.status(400).json({ error: 'cells_invalid_name' });
    }
    console.error('cells create error', err);
    res.status(500).json({ error: 'cells_create_failed', message: safeErrorMessage(err) });
  }
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

const agentRateLimit = rateLimit({
  windowMs: 60_000,
  max: config.isProduction ? 20 : 60,
  keyPrefix: 'agent',
});

const confessionalRateLimit = rateLimit({
  windowMs: 60_000,
  max: config.isProduction ? 15 : 40,
  keyPrefix: 'confessional',
});

app.post('/api/confessional/chat', authMiddleware, confessionalRateLimit, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const { message, language = 'fr', situation = 'other', sessionId, history = [] } = req.body || {};
    if (!message?.trim()) {
      return res.status(400).json({ error: 'message_required' });
    }
    if (!req.body?.consent) {
      return res.status(400).json({ error: 'consent_required' });
    }

    const usage = await checkAndIncrementConfessionalUsage(req.user.id);
    if (!usage.allowed) {
      return res.status(402).json({ error: 'quota_exceeded', plan: usage.plan, limit: usage.limit });
    }

    const country = req.profile?.country || null;
    const result = await handleConfessionalChat({
      userId: req.user.id,
      message: message.trim(),
      language,
      situation,
      sessionId: sessionId || null,
      country,
      history: Array.isArray(history) ? history.slice(-12) : [],
    });

    res.json({ ...result, usage: { plan: usage.plan, remaining: usage.remaining } });
  } catch (err) {
    console.error('confessional chat error', err);
    res.status(500).json({ error: 'confessional_error', message: safeErrorMessage(err) });
  }
});

app.get('/api/confessional/prayers', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const prayers = await listActivePrayers();
    res.json({ prayers });
  } catch (err) {
    console.error('confessional prayers error', err);
    res.status(500).json({ error: 'prayers_error' });
  }
});

app.post('/api/confessional/prayers', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const text = String(req.body?.prayerText || '').trim();
    if (!text || text.length > 1200) {
      return res.status(400).json({ error: 'prayer_text_invalid' });
    }
    const row = await createPrayerRequest(req.user.id, text);
    res.status(201).json({ ok: true, id: row.id });
  } catch (err) {
    console.error('confessional prayer create error', err);
    res.status(500).json({ error: 'prayer_create_error' });
  }
});

app.post('/api/confessional/prayers/:id/pray', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const data = await incrementPrayerCount(req.params.id);
    if (!data) return res.status(404).json({ error: 'prayer_not_found' });
    res.json({ prayer_count: data.prayer_count });
  } catch (err) {
    console.error('confessional prayer count error', err);
    res.status(500).json({ error: 'prayer_count_error' });
  }
});

app.post('/api/confessional/companion-request', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const row = await createCompanionRequest(req.user.id, {
      sessionId: req.body?.sessionId,
      firstName: req.body?.firstName,
      availability: req.body?.availability,
      message: req.body?.message,
      situation: req.body?.situation || 'other',
      urgency: req.body?.urgency,
    });
    res.status(201).json({ ok: true, id: row.id });
  } catch (err) {
    console.error('companion request error', err);
    res.status(500).json({ error: 'companion_request_error' });
  }
});

app.get('/api/confessional/sessions', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const sessions = await listOpenConfessionSessions(req.user.id);
    res.json({ sessions });
  } catch (err) {
    console.error('confessional sessions error', err);
    res.status(500).json({ error: 'sessions_error' });
  }
});

app.patch('/api/confessional/sessions/:sessionId/close', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const row = await closeConfessionSession(req.user.id, req.params.sessionId);
    if (!row) return res.status(404).json({ error: 'session_not_found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('confessional close session error', err);
    res.status(500).json({ error: 'sessions_error' });
  }
});

app.get('/api/confessional/companion-requests', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const requests = await listUserCompanionRequests(req.user.id);
    res.json({ requests });
  } catch (err) {
    console.error('confessional companion requests list error', err);
    res.status(500).json({ error: 'companion_requests_error' });
  }
});

app.get('/api/confessional/sessions/:sessionId/messages', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const rows = await listSessionMessages(req.user.id, req.params.sessionId);
    if (rows === null) return res.status(404).json({ error: 'session_not_found' });
    res.json({ messages: rows });
  } catch (err) {
    console.error('confessional messages error', err);
    res.status(500).json({ error: 'messages_error' });
  }
});

app.get('/api/confessional/companion-chat/:requestId', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const rows = await listCompanionChatMessages(req.params.requestId, req.user.id);
    if (rows === null) return res.status(404).json({ error: 'request_not_found' });
    res.json({ messages: rows });
  } catch (err) {
    if (err.code === 'forbidden') return res.status(403).json({ error: 'forbidden' });
    console.error('companion chat list error', err);
    res.status(500).json({ error: 'chat_error' });
  }
});

app.post('/api/confessional/companion-chat/:requestId', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const row = await sendCompanionChatMessage(
      req.params.requestId,
      req.user.id,
      'user',
      req.body?.message
    );
    if (!row) return res.status(404).json({ error: 'request_not_found' });
    res.status(201).json({ message: row });
  } catch (err) {
    if (err.code === 'forbidden') return res.status(403).json({ error: 'forbidden' });
    if (err.code === 'message_invalid') return res.status(400).json({ error: 'message_invalid' });
    console.error('companion chat send error', err);
    res.status(500).json({ error: 'chat_error' });
  }
});

app.get('/api/companion/me', authMiddleware, async (req, res) => {
  try {
    if (!requireCompanion(req, res)) return;
    const me = await getCompanionMe(req.user.id);
    res.json({ me, encryption: Boolean(config.confessionalEncryptionKey) });
  } catch (err) {
    console.error('companion me error', err);
    res.status(500).json({ error: 'companion_error' });
  }
});

app.get('/api/companion/queue', authMiddleware, async (req, res) => {
  try {
    if (!requireCompanion(req, res)) return;
    const queue = await listCompanionQueue(req.user.id);
    res.json({ queue });
  } catch (err) {
    console.error('companion queue error', err);
    res.status(500).json({ error: 'companion_error' });
  }
});

app.get('/api/companion/crises', authMiddleware, async (req, res) => {
  try {
    if (!requireCompanion(req, res)) return;
    const crises = await listRecentCrisisEvents();
    res.json({ crises });
  } catch (err) {
    console.error('companion crises error', err);
    res.status(500).json({ error: 'companion_error' });
  }
});

app.get('/api/companion/requests/:id', authMiddleware, async (req, res) => {
  try {
    if (!requireCompanion(req, res)) return;
    const detail = await getCompanionRequestDetail(req.params.id, req.user.id);
    if (!detail) return res.status(404).json({ error: 'not_found' });
    res.json(detail);
  } catch (err) {
    if (err.code === 'forbidden') return res.status(403).json({ error: 'forbidden' });
    console.error('companion request detail error', err);
    res.status(500).json({ error: 'companion_error' });
  }
});

app.post('/api/companion/requests/:id/assign', authMiddleware, async (req, res) => {
  try {
    if (!requireCompanion(req, res)) return;
    const row = await assignCompanionRequest(req.params.id, req.user.id);
    if (!row) return res.status(404).json({ error: 'not_found' });
    res.json({ ok: true, request: row });
  } catch (err) {
    if (err.code === 'already_assigned') return res.status(409).json({ error: 'already_assigned' });
    console.error('companion assign error', err);
    res.status(500).json({ error: 'companion_error' });
  }
});

app.patch('/api/companion/requests/:id/status', authMiddleware, async (req, res) => {
  try {
    if (!requireCompanion(req, res)) return;
    const row = await updateCompanionRequestStatus(req.params.id, req.user.id, req.body?.status);
    res.json({ ok: true, request: row });
  } catch (err) {
    if (err.code === 'forbidden') return res.status(403).json({ error: 'forbidden' });
    if (err.code === 'invalid_status') return res.status(400).json({ error: 'invalid_status' });
    console.error('companion status error', err);
    res.status(500).json({ error: 'companion_error' });
  }
});

app.post('/api/companion/requests/:id/notes', authMiddleware, async (req, res) => {
  try {
    if (!requireCompanion(req, res)) return;
    const note = await addCompanionNote(req.params.id, req.user.id, req.body?.noteText);
    res.status(201).json({ note });
  } catch (err) {
    if (err.code === 'forbidden') return res.status(403).json({ error: 'forbidden' });
    if (err.code === 'note_invalid') return res.status(400).json({ error: 'note_invalid' });
    console.error('companion note error', err);
    res.status(500).json({ error: 'companion_error' });
  }
});

app.post('/api/companion/requests/:id/emergency', authMiddleware, async (req, res) => {
  try {
    if (!requireCompanion(req, res)) return;
    const result = await triggerCompanionEmergency(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    if (err.code === 'forbidden') return res.status(403).json({ error: 'forbidden' });
    console.error('companion emergency error', err);
    res.status(500).json({ error: 'companion_error' });
  }
});

app.get('/api/companion/requests/:id/messages', authMiddleware, async (req, res) => {
  try {
    if (!requireCompanion(req, res)) return;
    const rows = await listCompanionChatMessages(req.params.id, req.user.id);
    if (rows === null) return res.status(404).json({ error: 'not_found' });
    res.json({ messages: rows });
  } catch (err) {
    if (err.code === 'forbidden') return res.status(403).json({ error: 'forbidden' });
    console.error('companion messages error', err);
    res.status(500).json({ error: 'companion_error' });
  }
});

app.post('/api/companion/requests/:id/messages', authMiddleware, async (req, res) => {
  try {
    if (!requireCompanion(req, res)) return;
    const row = await sendCompanionChatMessage(
      req.params.id,
      req.user.id,
      'companion',
      req.body?.message
    );
    if (!row) return res.status(404).json({ error: 'not_found' });
    res.status(201).json({ message: row });
  } catch (err) {
    if (err.code === 'forbidden') return res.status(403).json({ error: 'forbidden' });
    if (err.code === 'message_invalid') return res.status(400).json({ error: 'message_invalid' });
    console.error('companion send error', err);
    res.status(500).json({ error: 'companion_error' });
  }
});

app.patch('/api/companion/availability', authMiddleware, async (req, res) => {
  try {
    if (!requireCompanion(req, res)) return;
    const row = await setCompanionAvailability(req.user.id, req.body?.availability);
    res.json({ availability: row.companion_availability });
  } catch (err) {
    if (err.code === 'invalid_availability') return res.status(400).json({ error: 'invalid_availability' });
    console.error('companion availability error', err);
    res.status(500).json({ error: 'companion_error' });
  }
});

app.get('/api/companion/team', authMiddleware, async (req, res) => {
  try {
    if (!requireCompanion(req, res)) return;
    const team = await listTeamCompanions(req.user.id);
    res.json({ team });
  } catch (err) {
    console.error('companion team error', err);
    res.status(500).json({ error: 'companion_error' });
  }
});

app.post('/api/confessional/support-groups/:id/join', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const result = await joinSupportGroup(req.user.id, req.params.id);
    res.json(result);
  } catch (err) {
    console.error('support join error', err);
    res.status(500).json({ error: 'support_error' });
  }
});

app.delete('/api/confessional/support-groups/:id/join', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    await leaveSupportGroup(req.user.id, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('support leave error', err);
    res.status(500).json({ error: 'support_error' });
  }
});

app.get('/api/confessional/support-groups', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const language = req.query?.language || 'fr';
    const groups = await listSupportGroups(req.user.id, language);
    res.json({ groups });
  } catch (err) {
    console.error('support groups error', err);
    res.status(500).json({ error: 'support_error' });
  }
});

app.get('/api/confessional/support-groups/:id/messages', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const messages = await listSupportGroupMessages(req.user.id, req.params.id);
    res.json({ messages });
  } catch (err) {
    if (err.code === 'not_member') return res.status(403).json({ error: 'not_member' });
    console.error('support messages list error', err);
    res.status(500).json({ error: 'support_error' });
  }
});

app.post('/api/confessional/support-groups/:id/messages', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const message = await postSupportGroupMessage(
      req.user.id,
      req.params.id,
      req.body?.text
    );
    res.json({ message });
  } catch (err) {
    if (err.code === 'not_member') return res.status(403).json({ error: 'not_member' });
    if (err.code === 'message_invalid') return res.status(400).json({ error: 'message_invalid' });
    if (err.code === 'rate_limit') return res.status(429).json({ error: 'rate_limit' });
    console.error('support message post error', err);
    res.status(500).json({ error: 'support_error' });
  }
});

app.post('/api/companion/requests/:id/transfer', authMiddleware, async (req, res) => {
  try {
    if (!requireCompanion(req, res)) return;
    const toId = req.body?.toCompanionId;
    const row = await transferCompanionRequest(req.params.id, req.user.id, toId);
    res.json({ ok: true, request: row });
  } catch (err) {
    if (err.code === 'forbidden') return res.status(403).json({ error: 'forbidden' });
    if (err.code === 'invalid_target') return res.status(400).json({ error: 'invalid_target' });
    console.error('companion transfer error', err);
    res.status(500).json({ error: 'companion_error' });
  }
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

const paymentRateLimit = rateLimit({
  windowMs: 60_000,
  max: config.isProduction ? 15 : 40,
  keyPrefix: 'payments',
});

app.get('/api/payments/plans', (_req, res) => {
  res.json({
    plans: PLAN_IDS.map((id) => getPlanPricing(id)),
    methods: ['paypal'],
    sandbox: config.paymentSandbox,
  });
});

app.post('/api/payments/checkout', authMiddleware, paymentRateLimit, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const { planType, paymentMethod } = req.body || {};
    if (!PLAN_IDS.includes(planType)) {
      return res.status(400).json({ error: 'invalid_plan' });
    }
    const method = String(paymentMethod || '');
    if (method !== 'paypal') {
      return res.status(400).json({ error: 'invalid_payment_method' });
    }

    const appBase = config.appPublicUrl || `${req.protocol}://${req.get('host')}`;
    const returnUrl = `${appBase}/payment/return?status=success`;
    const cancelUrl = `${appBase}/payment/return?status=cancel`;

    const result = await createSubscriptionOrder({
      userId: req.user.id,
      planType,
      paymentMethod: method,
      returnUrl,
      cancelUrl,
    });

    res.json(result);
  } catch (err) {
    console.error('checkout error', err);
    res.status(500).json({ error: 'checkout_failed', message: safeErrorMessage(err) });
  }
});

app.get('/api/payments/orders/:orderId', authMiddleware, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const order = await getOrderForUser(req.params.orderId, req.user.id);
    if (!order) return res.status(404).json({ error: 'not_found' });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: 'order_fetch_failed' });
  }
});

app.post('/api/payments/paypal/capture', authMiddleware, paymentRateLimit, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const { orderId, paypalOrderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'order_id_required' });

    const order = await capturePayPalOrder(orderId, req.user.id, paypalOrderId);
    res.json({ ok: true, order });
  } catch (err) {
    console.error('paypal capture', err);
    res.status(500).json({ error: 'capture_failed', message: safeErrorMessage(err) });
  }
});

app.post('/api/payments/dev/complete', authMiddleware, paymentRateLimit, async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    const { orderId, secret } = req.body || {};
    const order = await devCompleteOrder(orderId, req.user.id, secret);
    res.json({ ok: true, order });
  } catch (err) {
    res.status(403).json({ error: 'forbidden' });
  }
});

app.post('/api/payments/wave/webhook', async (req, res) => {
  try {
    if (!verifyWaveWebhookAuth(req.headers.authorization)) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const order = await handleWaveWebhook(req.body || {});
    res.json({ ok: true, processed: Boolean(order) });
  } catch (err) {
    console.error('wave webhook', err);
    res.status(500).json({ error: 'webhook_failed' });
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
