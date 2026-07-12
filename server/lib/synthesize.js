const FOOTNOTES = {
  fr: {
    quota:
      '\n\n*(Réponse tirée des Écritures et ressources indexées — pour des échanges plus fluides, vérifiez la clé OpenAI sur Vercel.)*',
    offline: '',
    ia: '',
  },
  en: {
    quota:
      '\n\n*(Answer drawn from Scripture and indexed resources — for smoother conversation, check the OpenAI key on Vercel.)*',
    offline: '',
    ia: '',
  },
};

function isBibleChunk(c) {
  return (
    c._liveBible ||
    c._strongMatch ||
    c.metadata?.content_type === 'bible_strong'
  );
}

function sortBibleFirst(chunks) {
  return [...chunks].sort((a, b) => {
    const ba = isBibleChunk(a) ? 1 : 0;
    const bb = isBibleChunk(b) ? 1 : 0;
    return bb - ba;
  });
}

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function extractSentences(chunks, { max = 4, topicFilter = null } = {}) {
  const seen = new Set();
  const out = [];

  for (const chunk of sortBibleFirst(chunks)) {
    const parts = chunk.chunk_text.split(/(?<=[.!?])\s+/);
    for (let s of parts) {
      s = s.replace(/\n+/g, ' ').trim();
      if (s.length < 40 || s.length > 380) continue;
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

function joinNaturally(sentences, lang) {
  if (sentences.length <= 1) return sentences[0] || '';
  const connectors =
    lang === 'en'
      ? ['Also, ', 'What strikes me too is that ', 'And ']
      : ['Aussi, ', 'Ce qui me frappe aussi, c’est que ', 'Et '];
  let out = sentences[0];
  for (let i = 1; i < sentences.length; i += 1) {
    const c = connectors[(i - 1) % connectors.length];
    const s = sentences[i].charAt(0).toLowerCase() + sentences[i].slice(1);
    out += ` ${c}${s}`;
  }
  return out;
}

export function synthesizeFromChunks(question, chunks, userType = 'curious', { language = 'fr', openaiError = null } = {}) {
  const lang = language?.split('-')[0] || 'fr';
  const foot = FOOTNOTES[lang] || FOOTNOTES.fr;
  const aboutGod = isAboutGod(question);
  const ordered = sortBibleFirst(chunks);

  const godFilter = (s) => /dieu|christ|jésus|jesus|connaître|connaitre|éternelle|père|verbe|parole|scripture|bible|écri/i.test(s);
  const sentences = extractSentences(ordered, {
    max: 4,
    topicFilter: aboutGod ? godFilter : null,
  });

  const openers = {
    fr: {
      believer: 'Je suis content que tu poses ça. ',
      skeptic: 'C’est une vraie question — merci de la formuler ainsi. ',
      curious: 'Content de marcher un peu avec toi là-dessus. ',
    },
    en: {
      believer: "I'm glad you're asking this. ",
      skeptic: "That's a fair question — thanks for putting it plainly. ",
      curious: "Happy to walk through this with you. ",
    },
  };

  const L = openers[lang] || openers.fr;
  const opener = L[userType] || L.curious;

  let body = opener;

  if (aboutGod) {
    body +=
      lang === 'en'
        ? "Scripture presents God not as a vague idea but as the living Father of Jesus Christ — someone we can know through faith, not merely speculate about. "
        : "La Bible présente Dieu non pas comme une idée floue, mais comme le Père vivant de Jésus-Christ — qu’on peut connaître par la foi, pas seulement spéculer. ";
    if (sentences.length) {
      body += joinNaturally(sentences, lang) + ' ';
    }
    body +=
      lang === 'en'
        ? "Eternal life is described as knowing the Father and the Son (John 17:3) — the Bible invites us beyond formal religion into prayer, the Word, and real relationship."
        : "La vie éternelle, c’est cette connaissance du Père et du Fils (Jean 17:3) — la Bible nous invite au-delà de la religion formelle, vers la prière, la Parole et une relation réelle.";
  } else if (sentences.length) {
    body +=
      lang === 'en'
        ? 'From what Scripture clearly teaches on this, '
        : 'D’après ce que la Bible enseigne clairement sur ce sujet, ';
    body += joinNaturally(sentences, lang);
  } else if (ordered[0]) {
    const excerpt = ordered[0].chunk_text.slice(0, 480).trim();
    const sourceLabel =
      lang === 'en'
        ? isBibleChunk(ordered[0])
          ? 'this passage from Scripture'
          : 'this complementary note from the TKV library'
        : isBibleChunk(ordered[0])
          ? 'ce passage des Écritures'
          : 'cette note complémentaire de la bibliothèque TKV';
    body +=
      lang === 'en'
        ? `I found ${sourceLabel} that might help: ${excerpt}${ordered[0].chunk_text.length > 480 ? '…' : ''}`
        : `J’ai retrouvé ${sourceLabel} — ça pourrait t’aider : ${excerpt}${ordered[0].chunk_text.length > 480 ? '…' : ''}`;
  } else {
    body +=
      lang === 'en'
        ? "I don't have much indexed on that yet — try the Bible tab or GYNOSKO library, and come back; we can dig into Scripture together."
        : "Je n’ai pas encore beaucoup de matière indexée là-dessus — explore l’onglet Bible ou la bibliothèque GYNOSKO, et reviens me voir ; on creusera les Écritures ensemble.";
  }

  const closers = {
    fr: ' Qu’est-ce qui te parle le plus dans tout ça ?',
    en: ' What resonates most with you in all this?',
  };
  if (!body.includes('?')) {
    body += closers[lang] || closers.fr;
  }

  const footnote = openaiError === 'quota' ? foot.quota : '';
  return body + footnote;
}
