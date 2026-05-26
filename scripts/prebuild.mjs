import { spawnSync } from 'child_process';

function run(script) {
  const r = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run('scripts/generate-pwa-icons.mjs');

// Bible JSON is already committed under public/bible/ — skip heavy download on Vercel.
if (process.env.VERCEL === '1' || process.env.VERCEL_ENV) {
  console.log('Skipping bible Strong build on Vercel (using public/bible/ from repo).');
  process.exit(0);
}

run('scripts/build-bible-strong.mjs');
