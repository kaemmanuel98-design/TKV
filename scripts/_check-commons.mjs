const files = [
  'Tacitus Roman historian bust.jpg',
  'Tacitus bust Museo Capitolino.jpg',
  'Publius Cornelius Tacitus.jpg',
  "Trajan's Column (Rome).jpg",
  'Trajans Column close-up view.jpg',
  'Suetonius.jpg',
  'Josephus.jpg',
  'Pilates inscription.jpg',
  'Caesarea Maritima Pilate inscription.jpg',
  'Garden Tomb Jerusalem.jpg',
  'Azusa Street Mission 1906.jpg',
  'Colosseum in Rome, Italy - April 2007.jpg',
  'Qumran Caves, West Bank, 2019.jpg',
  'Codex Sinaiticus (Matthew 1).jpg',
];

async function check(name) {
  const p = new URLSearchParams({
    action: 'query',
    titles: `File:${name}`,
    prop: 'imageinfo',
    iiprop: 'url|thumburl',
    iiurlwidth: '800',
    format: 'json',
  });
  const r = await fetch(`https://commons.wikimedia.org/w/api.php?${p}`, {
    headers: { 'User-Agent': 'TKV-App/1.0 (heritage)' },
  });
  const d = await r.json();
  const page = Object.values(d.query.pages)[0];
  const ok = page && page.missing === undefined;
  console.log(ok ? 'OK' : 'NO', name);
  if (ok) console.log('   ', page.imageinfo?.[0]?.thumburl?.slice(0, 120));
  await new Promise((res) => setTimeout(res, 1500));
}

for (const f of files) {
  await check(f);
}
