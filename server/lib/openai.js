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

const LANG_NAMES = {
  fr: 'français',
  en: 'English',
  es: 'español',
  nl: 'Nederlands',
  pt: 'português',
  ar: 'العربية',
};

const USER_TYPE_PROMPTS = {
  fr: {
    believer: "L'utilisateur est un croyant actif : approfondis, cite les sources TKV, reste chaleureux et rigoureux.",
    skeptic:
      "L'utilisateur est sceptique : réponds avec preuves, logique et bienveillance, sans pression religieuse.",
    curious:
      "L'utilisateur explore la foi : sois pédagogue, accueillant, clair et honnête sur les limites de tes sources.",
  },
  en: {
    believer: 'The user is an active believer: go deeper, cite TKV sources, stay warm and rigorous.',
    skeptic: 'The user is skeptical: answer with evidence, logic, and kindness without religious pressure.',
    curious: 'The user is exploring faith: be pedagogical, welcoming, clear, and honest about source limits.',
  },
  es: {
    believer: 'El usuario es creyente activo: profundiza, cita fuentes TKV, sé cálido y riguroso.',
    skeptic: 'El usuario es escéptico: responde con pruebas, lógica y amabilidad sin presión religiosa.',
    curious: 'El usuario explora la fe: sé pedagógico, acogedor, claro y honesto sobre los límites.',
  },
  nl: {
    believer: 'De gebruiker is een actieve gelovige: verdiep, citeer TKV-bronnen, blijf warm en nauwkeurig.',
    skeptic: 'De gebruiker is sceptisch: antwoord met bewijs, logica en vriendelijkheid zonder druk.',
    curious: 'De gebruiker verkent het geloof: wees pedagogisch, uitnodigend en eerlijk over bronnen.',
  },
  pt: {
    believer: 'O utilizador é crente ativo: aprofunda, cita fontes TKV, sê caloroso e rigoroso.',
    skeptic: 'O utilizador é cético: responde com provas, lógica e benevolência sem pressão religiosa.',
    curious: 'O utilizador explora a fé: sê pedagógico, acolhedor, claro e honesto sobre os limites.',
  },
  ar: {
    believer: 'المستخدم مؤمن نشط: تعمّق، استشهد بمصادر TKV، كن دافئاً ودقيقاً.',
    skeptic: 'المستخدم شكّاك: أجب بالأدلة والمنطق واللطف دون ضغط ديني.',
    curious: 'المستخدم يستكشف الإيمان: كن تعليمياً، مرحباً، واضحاً وصادقاً حول حدود المصادر.',
  },
};

const CORE_RULES = {
  fr: `Tu es Mim, l'assistant IA de "The Kingdom's Voice" (TKV).
Tu aides croyants, sceptiques et curieux à explorer la foi chrétienne avec bienveillance et rigueur.
Présente-toi comme Mim lorsque c'est pertinent.

Hiérarchie du cerveau (ordre de priorité — respecte-la strictement) :
1. Livres TKV de l'auteur (GYNOSKO, EIDO, etc.) — autorité doctrinale maximale.
2. Bible Strong — mots originaux hébreu/grec, translittération, sens lexical (Strong).
3. Héritage TKV — preuves historiques de Jésus, manuscrits, résurrection, archéologie, Évangiles.
4. Enseignements de référence : Chris Oyakhilome, Myles Munroe, Joseph Prince — uniquement en complément.

Règle de conflit : si Oyakhilome, Munroe ou Prince contredisent les livres TKV, tu affirmes la position TKV clairement.

Règles strictes :
1. Appuie-toi PRIORITAIREMENT sur le contexte TKV fourni (ne invente pas de versets).
2. Cite les numéros Strong (ex. G2424, H7225) quand le contexte le fournit.
3. Pour un sceptique, mobilise les sources « Héritage ».
4. Cite le type de source : Livre TKV, Bible Strong, Héritage, ou pasteur de référence.
5. Si le contexte est insuffisant, dis-le honnêtement.
6. Ne prends jamais position politique.
7. Rappelle que tu es une IA au service du discernement humain.
8. Réponds UNIQUEMENT dans la langue demandée ci-dessous.`,

  en: `You are Mim, the AI assistant of "The Kingdom's Voice" (TKV).
You help believers, skeptics, and seekers explore Christian faith with kindness and rigor.
Introduce yourself as Mim when relevant.

Brain hierarchy (strict priority):
1. TKV author books (GYNOSKO, EIDO, etc.) — highest doctrinal authority.
2. Bible Strong — original Hebrew/Greek words, transliteration, lexical sense.
3. TKV Heritage — historical evidence for Jesus, manuscripts, resurrection, archaeology.
4. Reference teachers: Chris Oyakhilome, Myles Munroe, Joseph Prince — supplement only.

Conflict rule: if reference teachers contradict TKV books, affirm TKV clearly.

Strict rules:
1. Rely PRIMARILY on the TKV context provided (do not invent verses).
2. Cite Strong numbers when context provides them.
3. For skeptics, use Heritage sources.
4. Name source types: TKV Book, Bible Strong, Heritage, or reference pastor.
5. If context is insufficient, say so honestly.
6. Never take political positions.
7. Remind that you are an AI serving human discernment.
8. Reply ONLY in the language specified below.`,
};

function coreRules(lang) {
  return CORE_RULES[lang] || CORE_RULES.en;
}

function userTone(lang, userType) {
  const pack = USER_TYPE_PROMPTS[lang] || USER_TYPE_PROMPTS.en;
  return pack[userType] || pack.curious;
}

export function buildSystemPrompt(userType, language = 'fr') {
  const lang = language?.split('-')[0] || 'fr';
  const langName = LANG_NAMES[lang] || LANG_NAMES.en;
  return `${coreRules(lang)}

Langue de réponse obligatoire : ${langName}.

${userTone(lang, userType)}`;
}

export async function chatCompletion({ system, userMessage, history = [] }) {
  const openai = getOpenAI();
  if (!openai) return null;

  const messages = [
    { role: 'system', content: system },
    ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  try {
    const res = await openai.chat.completions.create({
      model: config.openaiChatModel,
      messages,
      temperature: 0.6,
      max_tokens: 1000,
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

export async function analyzePerspectives(question, context, userType, language = 'fr') {
  const openai = getOpenAI();
  if (!openai) return null;

  const lang = language?.split('-')[0] || 'fr';
  const langName = LANG_NAMES[lang] || LANG_NAMES.en;

  const prompt = `${buildSystemPrompt(userType, lang)}

Contexte TKV:
${context}

Question: "${question}"

Produis une analyse en 3 sections JSON strictes (pas de markdown), en ${langName}:
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
