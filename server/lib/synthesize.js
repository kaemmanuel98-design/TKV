import { config } from '../config.js';

const FOOTNOTES = {
  fr: {
    quota:
      '\n\n*Réponse construite à partir des textes TKV. Le quota OpenAI est épuisé — activez la facturation sur platform.openai.com pour des réponses conversationnelles complètes.*',
    offline:
      '\n\n*Réponse construite à partir des textes TKV (mode local).*',
    ia: '\n\n*Je suis une IA au service de votre discernement — vérifiez toujours les sources citées.*',
  },
  en: {
    quota:
      '\n\n*Answer built from TKV texts. OpenAI quota exceeded — enable billing at platform.openai.com for full conversational replies.*',
    offline: '\n\n*Answer built from TKV texts (local mode).*',
    ia: '\n\n*I am an AI serving your discernment — always check the cited sources.*',
  },
};

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function extractSentences(chunks, { max = 5, topicFilter = null } = {}) {
  const seen = new Set();
  const out = [];

  for (const chunk of chunks) {
    const parts = chunk.chunk_text.split(/(?<=[.!?])\s+/);
    for (let s of parts) {
      s = s.replace(/\n+/g, ' ').trim();
      if (s.length < 35 || s.length > 420) continue;
      const key = s.slice(0, 80);
      if (seen.has(key)) continue;
      if (topicFilter && !topicFilter(s)) continue;
      seen.add(key);
      out.push(s);
      if (out.length >= max) return out;
    }
  }
  return out;
}

function isAboutGod(question) {
  const q = normalize(question);
  return /\bdieu\b|\bgod\b|\bcreator\b|\bcreateur\b|\bcréateur\b/.test(q);
}

export function synthesizeFromChunks(question, chunks, userType = 'curious', { language = 'fr', openaiError = null } = {}) {
  const lang = language?.split('-')[0] || 'fr';
  const foot = FOOTNOTES[lang] || FOOTNOTES.fr;
  const aboutGod = isAboutGod(question);

  const godFilter = (s) => /dieu|christ|jésus|jesus|connaître|connaitre|éternelle|père|padre|verbe|parole/i.test(s);
  const sentences = extractSentences(chunks, {
    max: 5,
    topicFilter: aboutGod ? godFilter : null,
  });

  const intros = {
    fr: {
      believer: 'Voici ce que les enseignements TKV soulignent, pour approfondir votre relation avec Dieu :',
      skeptic:
        'Les textes TKV ne prétendent pas tout prouver, mais voici ce qu’ils affirment clairement sur Dieu — à examiner avec esprit critique :',
      curious:
        'Pour commencer à cerner qui est Dieu selon TKV, voici les idées centrales des contenus de la plateforme :',
    },
    en: {
      believer: 'Here is what TKV teaching emphasizes to deepen your walk with God:',
      skeptic: 'TKV texts do not claim to prove everything, but here is what they clearly affirm about God — worth examining critically:',
      curious: 'To begin understanding who God is according to TKV, here are the central ideas from the platform’s content:',
    },
  };

  const L = intros[lang] || intros.fr;
  const intro = aboutGod ? L[userType] || L.curious : (L[userType] || L.curious).replace(/Dieu|God/, 'cette question');

  let body = `${intro}\n\n`;

  if (aboutGod) {
    body += `Qui est Dieu, selon TKV ?\n\n`;
    body += `Dieu n'y est pas présenté comme une notion vague, mais comme le seul vrai Dieu, Père de Jésus-Christ, qu'on peut connaître personnellement — pas seulement croire en une idée.\n\n`;
    if (sentences.length) {
      body += sentences.map((s, i) => `${i + 1}. ${s}`).join('\n\n');
      body += '\n\n';
    }
    body += `En synthèse : la « vie éternelle » est décrite comme cette connaissance vivante du Père et du Fils (Jean 17:3). GYNOSKO invite à dépasser la religion formelle pour entrer dans une relation de révélation, prière et Parole.`;
  } else if (sentences.length) {
    body += sentences.map((s, i) => `${i + 1}. ${s}`).join('\n\n');
  } else if (chunks[0]) {
    body += chunks[0].chunk_text.slice(0, 500) + (chunks[0].chunk_text.length > 500 ? '…' : '');
  } else {
    body +=
      lang === 'en'
        ? 'Explore the GYNOSKO library and Heritage section for more on this topic.'
        : 'Explorez la bibliothèque GYNOSKO et l’onglet Héritage pour aller plus loin.';
  }

  const footnote = openaiError === 'quota' ? foot.quota : config.openaiKey ? foot.ia : foot.offline;
  return body + footnote;
}
