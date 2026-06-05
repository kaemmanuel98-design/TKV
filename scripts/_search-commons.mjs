const UA = 'TKV-App/1.0 (heritage photo sync)';

async function searchFiles(query) {
  const p = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: `filetype:bitmap ${query}`,
    srnamespace: '6',
    srlimit: '5',
    format: 'json',
  });
  const r = await fetch(`https://commons.wikimedia.org/w/api.php?${p}`, {
    headers: { 'User-Agent': UA },
  });
  const d = await r.json();
  return (d.query?.search || []).map((x) => x.title.replace(/^File:/, ''));
}

async function thumbForFile(name) {
  const p = new URLSearchParams({
    action: 'query',
    titles: `File:${name}`,
    prop: 'imageinfo',
    iiprop: 'url|thumburl',
    iiurlwidth: '960',
    format: 'json',
  });
  const r = await fetch(`https://commons.wikimedia.org/w/api.php?${p}`, {
    headers: { 'User-Agent': UA },
  });
  const d = await r.json();
  const page = Object.values(d.query.pages)[0];
  if (!page || page.missing !== undefined) return null;
  return page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url;
}

const queries = {
  tacitus: 'Tacitus Roman',
  'pliny-trajan': 'Trajan Column Rome',
  suetonius: 'Suetonius',
  'talmud-mentions': 'Talmud manuscript',
  'early-martyrdom': 'Good Shepherd catacomb',
  'pagan-critics': 'Marcus Aurelius',
  'minimal-facts': 'Resurrection Christ painting',
  'modern-skeptics': 'Bart Ehrman',
  'archaeology-proofs': 'Pilate inscription Caesarea',
  'manuscript-proofs': 'Codex Sinaiticus',
  jesus: 'Christ Pantocrator Hagia Sophia',
  manuscripts: 'Codex Vaticanus',
  resurrection: 'Resurrection Correggio',
  'problem-evil': 'Crucifixion painting',
  gospels: 'Codex Bezae',
  archaeology: 'Qumran caves',
  pentecost: 'Pentecost Rubens',
  'nero-persecution': 'Colosseum Rome',
  'jerusalem-70': 'Arch of Titus',
  'constantine-legalization': 'Constantine mosaic Hagia Sophia',
  nicaea: 'Council of Nicaea',
  'constantinople-381': 'Hagia Sophia',
  'ephesus-431': 'Ephesus library',
  chalcedon: 'Council of Chalcedon',
  'fall-rome-476': 'Romulus Augustulus',
  'gregory-great': 'Pope Gregory the Great',
  charlemagne: 'Charlemagne',
  'great-schism': 'Hagia Sophia Istanbul',
  crusades: 'Siege of Antioch',
  'western-schism': 'Palais des Papes Avignon',
  'fall-constantinople': 'Constantinople 1453',
  'printing-reformation': 'Gutenberg Bible',
  reformation: 'Martin Luther portrait',
  'zwingli-reform': 'Huldrych Zwingli',
  'anabaptist-reform': 'Anabaptists',
  'calvin-geneva': 'John Calvin',
  'english-reformation': 'Henry VIII portrait',
  'council-trent': 'Council of Trent',
  'great-awakening': 'George Whitefield',
  'vatican-i': 'St Peter Basilica Vatican',
  azusa: 'Azusa Street revival',
  'vatican-ii': 'Second Vatican Council',
  transfiguration: 'Transfiguration Bellini',
  sinaiticus: 'Codex Sinaiticus Matthew',
  'dead-sea-scrolls': 'Dead Sea Scrolls Isaiah',
  'empty-tomb': 'Garden Tomb Jerusalem',
};

for (const [slug, q] of Object.entries(queries)) {
  const files = await searchFiles(q);
  let url = null;
  let picked = null;
  for (const f of files) {
    url = await thumbForFile(f);
    if (url) {
      picked = f;
      break;
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  console.log(slug, picked ? `OK → ${picked}` : 'NONE');
  if (url) console.log('   ', url.slice(0, 100));
  await new Promise((r) => setTimeout(r, 1200));
}
