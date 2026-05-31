import { getSupabaseAdmin } from './supabaseAdmin.js';
import { chatCompletion } from './openai.js';
import { detectCrisisLevel, maxCrisisLevel, SITUATION_LEVEL } from './confessionalCrisis.js';
import {
  decryptConfessionalContent,
  encryptConfessionalContent,
} from './confessionalCrypto.js';
import { notifyCompanionsCrisis } from './confessionalNotify.js';

const CONFESSIONAL_SYSTEM = `Tu es un compagnon d'écoute bienveillant pour The Kingdom's Voice — module Confessionnal.
Cette personne traverse un moment difficile. Ton rôle est uniquement d'écouter, de valider sa douleur et de l'orienter vers les bonnes ressources.
Tu n'es PAS un thérapeute, un médecin ni un conseiller professionnel.

RÈGLES ABSOLUES :
1) Si tu détectes des pensées suicidaires ou un danger immédiat : réponds UNIQUEMENT par le tag [CRISE] suivi d'une phrase courte, chaleureuse, invitant à appeler les numéros d'urgence affichés à l'écran.
2) Jamais de diagnostic (dépression, addiction clinique, etc.).
3) Ne minimise jamais la souffrance.
4) Ton : chaleureux, calme, non jugeant ; ancrage dans la foi seulement si la personne l'ouvre.
5) Chaque réponse propose une action concrète (prière, accompagnateur, ressource TKV).
6) Ne promets pas que « tout ira bien » sans ressource concrète.`;

const CRISIS_REPLY = {
  fr: "Je t'entends. Tu n'es pas seul. Des personnes sont là pour toi — appelle un numéro d'urgence maintenant, ils peuvent t'aider tout de suite.",
  en: "I hear you. You are not alone. People are here for you — please call an emergency line now; they can help you right away.",
  es: 'Te escucho. No estás solo/a. Hay personas para ayudarte — llama a una línea de emergencia ahora.',
  pt: 'Ouço-te. Não estás sozinho/a. Há pessoas que podem ajudar — liga agora para uma linha de emergência.',
};

export async function ensureConfessionSession({
  userId,
  sessionId,
  situation = 'other',
  country = null,
  consent = true,
}) {
  const admin = getSupabaseAdmin();
  const baseLevel = SITUATION_LEVEL[situation] || 'medium';

  if (sessionId) {
    const { data } = await admin
      .from('confession_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();
    if (data) return data.id;
  }

  const row = {
    user_id: userId,
    session_type: situation === 'suicidal' ? 'crisis' : 'support',
    situation,
    crisis_level: baseLevel,
    country_detected: country,
    status: 'open',
    consent_at: consent ? new Date().toISOString() : null,
    completed: false,
  };

  const { data, error } = await admin.from('confession_sessions').insert(row).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function logCrisisEvent({ userId, sessionId, level, keywords, country, situation }) {
  const admin = getSupabaseAdmin();
  await admin.from('confession_crisis_events').insert({
    user_id: userId,
    session_id: sessionId,
    crisis_level: level,
    keywords_detected: keywords,
    country_detected: country,
  });
  notifyCompanionsCrisis({ level, situation, sessionId }).catch((err) =>
    console.error('confessional crisis notify', err)
  );
}

export async function saveMessage({ sessionId, userId, role, content }) {
  const admin = getSupabaseAdmin();
  const stored = encryptConfessionalContent(content, sessionId);
  await admin.from('confession_messages').insert({
    session_id: sessionId,
    user_id: userId,
    role,
    content: stored,
  });
}

export async function listSessionMessages(userId, sessionId) {
  const admin = getSupabaseAdmin();
  const { data: session } = await admin
    .from('confession_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!session) return null;

  const { data, error } = await admin
    .from('confession_messages')
    .select('id, role, content, created_at')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) throw error;

  return (data || []).map((m) => ({
    id: m.id,
    role: m.role,
    content: decryptConfessionalContent(m.content, sessionId),
    created_at: m.created_at,
  }));
}

export async function updateSessionCrisis(sessionId, level, keywords) {
  const admin = getSupabaseAdmin();
  await admin
    .from('confession_sessions')
    .update({
      crisis_level: level,
      keywords_detected: keywords,
      session_type: level === 'critical' ? 'crisis' : 'support',
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
}

export async function handleConfessionalChat({
  userId,
  message,
  language = 'fr',
  situation = 'other',
  sessionId = null,
  country = null,
  history = [],
}) {
  const lang = language?.split('-')[0] || 'fr';
  const detected = detectCrisisLevel(message);
  const situationLevel = SITUATION_LEVEL[situation] || 'medium';
  const crisisLevel = maxCrisisLevel(detected.level, situationLevel);

  const sid = await ensureConfessionSession({
    userId,
    sessionId,
    situation,
    country,
  });

  await saveMessage({ sessionId: sid, userId, role: 'user', content: message });
  await updateSessionCrisis(sid, crisisLevel, detected.keywords);

  if (crisisLevel === 'critical' || detected.level === 'critical') {
    await logCrisisEvent({
      userId,
      sessionId: sid,
      level: 'critical',
      keywords: detected.keywords,
      country,
      situation,
    });
    const reply = CRISIS_REPLY[lang] || CRISIS_REPLY.fr;
    await saveMessage({ sessionId: sid, userId, role: 'ai', content: reply });
    return {
      sessionId: sid,
      reply,
      crisisLevel: 'critical',
      crisisTriggered: true,
      keywords: detected.keywords,
    };
  }

  const system = `${CONFESSIONAL_SYSTEM}\nLangue de réponse : ${lang}.`;
  let reply = await chatCompletion({ system, userMessage: message, history });

  if (reply?.includes('[CRISE]')) {
    await logCrisisEvent({
      userId,
      sessionId: sid,
      level: 'critical',
      keywords: ['ai_crise_tag'],
      country,
      situation,
    });
    reply = (CRISIS_REPLY[lang] || CRISIS_REPLY.fr);
    await updateSessionCrisis(sid, 'critical', ['ai_crise_tag']);
    await saveMessage({ sessionId: sid, userId, role: 'ai', content: reply });
    return {
      sessionId: sid,
      reply,
      crisisLevel: 'critical',
      crisisTriggered: true,
      keywords: ['ai_crise_tag'],
    };
  }

  if (!reply) {
    reply =
      lang === 'en'
        ? "Thank you for sharing this. Your pain matters. Would you like to speak with a TKV companion, or submit an anonymous prayer request?"
        : "Merci de nous faire confiance. Votre souffrance compte. Souhaitez-vous parler à un accompagnateur TKV ou déposer une demande de prière anonyme ?";
  }

  await saveMessage({ sessionId: sid, userId, role: 'ai', content: reply });

  if (crisisLevel === 'high' || detected.level === 'high') {
    await logCrisisEvent({
      userId,
      sessionId: sid,
      level: 'high',
      keywords: detected.keywords,
      country,
      situation,
    });
  }

  return {
    sessionId: sid,
    reply,
    crisisLevel,
    crisisTriggered: crisisLevel === 'critical' || crisisLevel === 'high',
    keywords: detected.keywords,
  };
}

export async function listActivePrayers() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('prayer_requests')
    .select('id, prayer_text, prayer_count, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(40);
  if (error) throw error;
  return data || [];
}

export async function createPrayerRequest(userId, prayerText) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('prayer_requests')
    .insert({
      user_id: userId,
      prayer_text: prayerText.trim(),
      is_anonymous: true,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function incrementPrayerCount(prayerId) {
  const admin = getSupabaseAdmin();
  const { data: row } = await admin
    .from('prayer_requests')
    .select('prayer_count')
    .eq('id', prayerId)
    .eq('status', 'active')
    .maybeSingle();
  if (!row) return null;
  const { data, error } = await admin
    .from('prayer_requests')
    .update({ prayer_count: (row.prayer_count || 0) + 1 })
    .eq('id', prayerId)
    .select('prayer_count')
    .single();
  if (error) throw error;
  return data;
}

export async function listOpenConfessionSessions(userId) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('confession_sessions')
    .select('id, situation, crisis_level, status, created_at, updated_at')
    .eq('user_id', userId)
    .eq('status', 'open')
    .order('updated_at', { ascending: false })
    .limit(12);
  if (error) throw error;
  return data || [];
}

export async function closeConfessionSession(userId, sessionId) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('confession_sessions')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listUserCompanionRequests(userId) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('companion_requests')
    .select('id, status, urgency, situation, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data || [];
}

export async function createCompanionRequest(userId, payload) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('companion_requests')
    .insert({
      user_id: userId,
      session_id: payload.sessionId || null,
      first_name: payload.firstName?.trim() || null,
      availability: payload.availability?.trim() || null,
      message: payload.message?.trim() || null,
      situation: payload.situation || 'other',
      urgency: Boolean(payload.urgency),
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}
