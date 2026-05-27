import 'dotenv/config';

function envTrim(key) {
  const v = process.env[key];
  return typeof v === 'string' ? v.trim() : '';
}

/** URL iframe (peut inclure le port, ex. https://localhost:8443). */
export function resolveJitsiPublicUrl(domain, explicit) {
  const pub = (explicit || '').replace(/\/$/, '');
  if (pub) return pub;
  if (!domain) return '';
  if (domain.includes(':')) return `https://${domain}`;
  if (domain === 'localhost' || domain === '127.0.0.1') return `https://${domain}:8443`;
  return `https://${domain}`;
}

const isProduction = process.env.NODE_ENV === 'production';

export const config = {
  isProduction,
  port: Number(process.env.API_PORT) || 3001,
  openaiKey: process.env.OPENAI_API_KEY || '',
  openaiChatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  ragThreshold: Number(process.env.RAG_SIMILARITY_THRESHOLD) || 0.72,
  ragTopK: Number(process.env.RAG_TOP_K) || 5,
  /** Secret pour noms de salles (défaut : clé service Supabase) */
  jitsiRoomSecret: envTrim('JITSI_ROOM_SECRET'),
  jitsiDomain: envTrim('JITSI_DOMAIN'),
  jitsiPublicUrl: resolveJitsiPublicUrl(envTrim('JITSI_DOMAIN'), envTrim('JITSI_PUBLIC_URL')),
  jitsiAppId: envTrim('JITSI_APP_ID'),
  jitsiAppSecret: envTrim('JITSI_APP_SECRET'),
  /** Claim JWT `sub` (souvent `meet.jitsi` en Docker, ou `localhost` en local) */
  jitsiJwtSub: envTrim('JITSI_JWT_SUB') || envTrim('JITSI_DOMAIN'),
  /** Dev uniquement — meet.jit.si sans JWT (non recommandé en production) */
  jitsiAllowPublicFallback:
    process.env.JITSI_ALLOW_PUBLIC_FALLBACK === 'true' ||
    (!isProduction && process.env.JITSI_ALLOW_PUBLIC_FALLBACK !== 'false'),
  /** URL publique de l’app (liens e-mail amis) */
  appPublicUrl:
    envTrim('APP_PUBLIC_URL') ||
    (envTrim('VERCEL_URL') ? `https://${envTrim('VERCEL_URL')}` : ''),
  resendApiKey: envTrim('RESEND_API_KEY'),
  emailFrom: envTrim('EMAIL_FROM') || 'TKV <onboarding@resend.dev>',
  /** Origines CORS autorisées (virgules). Vide = refléter l’Origin en dev uniquement. */
  corsOrigins: envTrim('CORS_ORIGINS')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};

export const PLAN_LIMITS = {
  free: { chat: 3, perspectives: 0 },
  premium: { chat: 30, perspectives: 2 },
  premium_plus: { chat: 9999, perspectives: 9999 },
};
