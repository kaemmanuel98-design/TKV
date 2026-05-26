import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { verifyUser, getUserProfile } from './lib/supabaseAdmin.js';
import { checkAndIncrementUsage } from './lib/quota.js';
import { handleChat, handlePerspectives } from './lib/agentService.js';
import { loadChunks } from './lib/vectorStore.js';
import { synthesizeSpeech } from './lib/tts.js';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace(/^Bearer\s+/i, '');
  req.user = token ? await verifyUser(token) : null;
  req.profile = req.user ? await getUserProfile(req.user.id) : null;
  next();
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    openai: Boolean(config.openaiKey),
    chunks: loadChunks().length,
    supabase: Boolean(config.supabaseUrl),
  });
});

app.post('/api/agent/chat', authMiddleware, async (req, res) => {
  try {
    const { message, language = 'fr', history = [] } = req.body || {};
    if (!message?.trim()) {
      return res.status(400).json({ error: 'message_required' });
    }

    const userType = req.profile?.user_type || req.body?.userType || 'curious';
    const usage = await checkAndIncrementUsage(req.user?.id, 'chat');

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
      history,
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
    res.status(500).json({ error: 'agent_error', message: err.message });
  }
});

app.post('/api/tts', async (req, res) => {
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
    res.setHeader('Cache-Control', 'no-store');
    res.send(audio);
  } catch (err) {
    console.error('tts error', err);
    res.status(500).json({ error: 'tts_error', message: err.message });
  }
});

app.post('/api/agent/perspectives', authMiddleware, async (req, res) => {
  try {
    const { question, language = 'fr' } = req.body || {};
    if (!question?.trim()) {
      return res.status(400).json({ error: 'question_required' });
    }

    const userType = req.profile?.user_type || 'curious';
    const usage = await checkAndIncrementUsage(req.user?.id, 'perspectives');

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
    res.status(500).json({ error: 'agent_error', message: err.message });
  }
});

export default app;
