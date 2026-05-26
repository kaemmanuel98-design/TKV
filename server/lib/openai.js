import OpenAI from 'openai';
import { config } from '../config.js';

let client = null;

export function getOpenAI() {
  if (!config.openaiKey) return null;
  if (!client) client = new OpenAI({ apiKey: config.openaiKey });
  return client;
}

export async function embedText(text) {
  const openai = getOpenAI();
  if (!openai) return null;
  try {
    const res = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    });
    return res.data[0].embedding;
  } catch (err) {
    if (err?.code === 'insufficient_quota' || err?.status === 429) return { error: 'quota' };
    return null;
  }
}

const SYSTEM_PROMPTS = {
  believer: 'L\'utilisateur est un croyant actif : approfondis, cite les sources TKV, reste chaleureux et rigoureux.',
  skeptic: 'L\'utilisateur est sceptique : réponds avec preuves, logique et bienveillance, sans pression religieuse.',
  curious: 'L\'utilisateur explore la foi : sois pédagogue, accueillant, clair et honnête sur les limites de tes sources.',
};

export function buildSystemPrompt(userType) {
  const tone = SYSTEM_PROMPTS[userType] || SYSTEM_PROMPTS.curious;
  return `Tu es l'Assistant Biblique de "The Kingdom's Voice" (TKV).
Tu aides croyants, sceptiques et curieux à explorer la foi chrétienne avec bienveillance et rigueur.
${tone}

Règles strictes:
1. Appuie-toi PRIORITAIREMENT sur le contexte TKV fourni ci-dessous.
2. Si le contexte est insuffisant, dis-le honnêtement — ne invente pas.
3. Cite les titres/chapitres des sources TKV utilisées.
4. Ne prends jamais position politique.
5. Rappelle que tu es une IA au service du discernement humain.`;
}

export async function chatCompletion({ system, userMessage, history = [] }) {
  const openai = getOpenAI();
  if (!openai) return null;

  const messages = [
    { role: 'system', content: system },
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  try {
    const res = await openai.chat.completions.create({
      model: config.openaiChatModel,
      messages,
      temperature: 0.6,
      max_tokens: 900,
    });

    return res.choices[0]?.message?.content?.trim() || '';
  } catch (err) {
    if (err?.code === 'insufficient_quota' || err?.status === 429) {
      const e = new Error('insufficient_quota');
      e.code = 'insufficient_quota';
      throw e;
    }
    return null;
  }
}

export async function analyzePerspectives(question, context, userType) {
  const openai = getOpenAI();
  if (!openai) return null;

  const prompt = `${buildSystemPrompt(userType)}

Contexte TKV:
${context}

Question: "${question}"

Produis une analyse en 3 sections JSON strictes (pas de markdown):
{
  "believers": "perspective croyante équilibrée",
  "skeptics": "perspective sceptique équilibrée",
  "synthesis": "synthèse neutre invitant au dialogue"
}`;

  const res = await openai.chat.completions.create({
    model: config.openaiChatModel,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    response_format: { type: 'json_object' },
  });

  try {
    return JSON.parse(res.choices[0]?.message?.content || '{}');
  } catch {
    return null;
  }
}
