/**
 * Sync .env → Vercel (production, preview, development).
 * Skips local-only keys. Does not print secret values.
 */
import fs from 'fs';
import { spawnSync } from 'child_process';

const SKIP = new Set(['API_PORT', 'VERCEL_OIDC_TOKEN']);
const TARGETS = ['production', 'preview', 'development'];

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
  const res = spawnSync(
    'npx',
    ['vercel', 'env', 'add', key, target, '--force', '--yes'],
    {
      input: value,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    }
  );
  if (res.status === 0) {
    console.log(`  ✓ ${key} → ${target}`);
    return true;
  }
  const err = (res.stderr || res.stdout || '').trim();
  if (/already exists|duplicate/i.test(err)) {
    console.log(`  · ${key} → ${target} (exists, skipped)`);
    return true;
  }
  console.error(`  ✗ ${key} → ${target}: ${err.slice(0, 120)}`);
  return false;
}

const envPath = '.env';
if (!fs.existsSync(envPath)) {
  console.error('.env introuvable');
  process.exit(1);
}

const env = parseEnv(fs.readFileSync(envPath, 'utf8'));

// Production URL for CORS / redirects
if (!env.CORS_ORIGINS?.includes('tkv-app.vercel.app')) {
  env.CORS_ORIGINS = [env.CORS_ORIGINS, 'https://tkv-app.vercel.app'].filter(Boolean).join(',');
}
env.APP_PUBLIC_URL = 'https://tkv-app.vercel.app';

console.log('Sync variables Vercel…\n');
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
