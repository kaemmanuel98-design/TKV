const UA = 'TKV-App/1.0 (heritage)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  for (let i = 0; i < 6; i++) {
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
      headers: { 'User-Agent': UA },
    });
    const text = await r.text();
    if (text.startsWith('You are')) {
      await sleep(6000 * (i + 1));
      continue;
    }
    return JSON.parse(text);
  }
  throw new Error('rate limit');
}

async function searchPick(query) {
  const p = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: `filetype:bitmap ${query}`,
    srnamespace: '6',
    srlimit: '8',
    format: 'json',
  });
  const d = await api(p);
  for (const hit of d.query?.search || []) {
    const name = hit.title.replace(/^File:/, '');
    const p2 = new URLSearchParams({
      action: 'query',
      titles: `File:${name}`,
      prop: 'imageinfo',
      iiprop: 'thumburl',
      iiurlwidth: '800',
      format: 'json',
    });
    const d2 = await api(p2);
    const page = Object.values(d2.query.pages)[0];
    if (page?.missing === undefined && page.imageinfo?.[0]?.thumburl) {
      return name;
    }
    await sleep(3000);
  }
  return null;
}

const fixes = {
  'minimal-facts': 'Resurrection Christ Correggio',
  'modern-skeptics': 'historical Jesus research',
  'archaeology-proofs': 'Caesarea Pilate inscription',
  'manuscript-proofs': 'Codex Sinaiticus manuscript',
  jesus: 'Christ Pantocrator mosaic',
  manuscripts: 'Codex Vaticanus Bible',
  resurrection: 'Resurrection Correggio',
  'problem-evil': 'Crucifixion medieval painting',
  gospels: 'Codex Bezae Luke',
  archaeology: 'Qumran cave scrolls',
  'crucifixion-resurrection': 'Resurrection Correggio',
  pentecost: 'Pentecost Rubens painting',
  'jerusalem-70': 'Arch of Titus Rome',
  'constantine-legalization': 'Constantine Hagia Sophia mosaic',
  chalcedon: 'Fourth Ecumenical Council',
  'fall-rome-476': 'Romulus Augustulus coin',
  'gregory-great': 'Pope Gregory I portrait',
  'great-schism': 'Hagia Sophia Istanbul 2013',
  'western-schism': 'Palais des Papes Avignon',
  'fall-constantinople': 'Constantinople painting 1453',
  'printing-reformation': 'Gutenberg Bible page',
  reformation: 'Martin Luther portrait Cranach',
  'zwingli-reform': 'Ulrich Zwingli portrait',
  'anabaptist-reform': 'Anabaptist martyrs',
  'calvin-geneva': 'John Calvin portrait',
  'council-trent': 'Council of Trent fresco',
  azusa: 'Azusa Street Mission Los Angeles',
  'vatican-ii': 'Second Vatican Council 1962',
  transfiguration: 'Transfiguration Giovanni Bellini',
  sinaiticus: 'Codex Sinaiticus folio',
  'dead-sea-scrolls': 'Isaiah scroll Dead Sea',
  'empty-tomb': 'Garden Tomb Jerusalem rock',
};

const out = {};
for (const [slug, q] of Object.entries(fixes)) {
  const name = await searchPick(q);
  out[slug] = name;
  console.log(`${slug}: ${name ? name : 'NONE'}`);
  await sleep(4500);
}

console.log('\n--- JSON ---');
console.log(JSON.stringify(out, null, 2));
