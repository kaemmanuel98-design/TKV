/**
 * Sync .env → Vercel (production, preview, development).
 * Skips local-only keys. Does not print secret values.
 *
 * Preview on Vercel CLI v55+ requires a git branch (default: main).
 * Usage:
 *   node scripts/sync-vercel-env.mjs
 *   node scripts/sync-vercel-env.mjs --preview-only
 */
import fs from 'fs';
import { spawnSync } from 'child_process';

const SKIP = new Set(['API_PORT', 'VERCEL_OIDC_TOKEN']);
const previewOnly = process.argv.includes('--preview-only');
const TARGETS = previewOnly
  ? ['preview']
  : ['production', 'preview', 'development'];

function parseEnv(content) {
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

function addEnv(key, value, target) {
  const args = [
    'vercel@55',
    'env',
    'add',
    key,
    target,
    '--value',
    value,
    '--force',
    '--yes',
    '--non-interactive',
  ];

  const res = spawnSync('npx', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env, npm_config_devdir: '' },
  });

  const out = `${res.stdout || ''}\n${res.stderr || ''}`.trim();
  if (res.status === 0) {
    console.log(`  ✓ ${key} → ${target}`);
    return true;
  }
  if (/already exists|duplicate/i.test(out)) {
    console.log(`  · ${key} → ${target} (exists)`);
    return true;
  }
  const reason = out.replace(/\s+/g, ' ').slice(0, 160);
  console.error(`  ✗ ${key} → ${target}: ${reason}`);
  return false;
}

const envPath = '.env';
if (!fs.existsSync(envPath)) {
  console.error('.env introuvable');
  process.exit(1);
}

const env = parseEnv(fs.readFileSync(envPath, 'utf8'));

if (!env.CORS_ORIGINS?.includes('tkv-app.vercel.app')) {
  env.CORS_ORIGINS = [env.CORS_ORIGINS, 'https://tkv-app.vercel.app'].filter(Boolean).join(',');
}
env.APP_PUBLIC_URL = 'https://tkv-app.vercel.app';

console.log(
  previewOnly ? 'Sync preview Vercel (toutes branches)…\n' : 'Sync variables Vercel…\n'
);

let ok = 0;
let fail = 0;

for (const [key, value] of Object.entries(env)) {
  if (SKIP.has(key) || !value) continue;
  for (const target of TARGETS) {
    if (addEnv(key, value, target)) ok += 1;
    else fail += 1;
  }
}

console.log(`\nTerminé : ${ok} ok, ${fail} échecs`);
process.exit(fail > 0 ? 1 : 0);
