import { HERITAGE_COMMONS_FILES } from '../src/data/heritage/heritageCommonsFiles.js';

const UA = 'TKV-App/1.0 (heritage)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function check(slug, name) {
  const p = new URLSearchParams({
    action: 'query',
    titles: `File:${name}`,
    prop: 'imageinfo',
    iiprop: 'thumburl',
    iiurlwidth: '800',
    format: 'json',
  });
  const r = await fetch(`https://commons.wikimedia.org/w/api.php?${p}`, {
    headers: { 'User-Agent': UA },
  });
  const text = await r.text();
  if (text.startsWith('You are')) {
    console.log('RATE', slug);
    await sleep(5000);
    return check(slug, name);
  }
  const d = JSON.parse(text);
  const page = Object.values(d.query.pages)[0];
  const ok = page && page.missing === undefined;
  console.log(ok ? 'OK' : 'NO', slug, ok ? '' : name);
}

for (const [slug, name] of Object.entries(HERITAGE_COMMONS_FILES)) {
  await check(slug, name);
  await sleep(2500);
}
