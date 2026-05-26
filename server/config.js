import 'dotenv/config';

export const config = {
  port: Number(process.env.API_PORT) || 3001,
  openaiKey: process.env.OPENAI_API_KEY || '',
  openaiChatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  ragThreshold: Number(process.env.RAG_SIMILARITY_THRESHOLD) || 0.72,
  ragTopK: Number(process.env.RAG_TOP_K) || 5,
};

export const PLAN_LIMITS = {
  free: { chat: 3, perspectives: 0 },
  premium: { chat: 30, perspectives: 2 },
  premium_plus: { chat: 9999, perspectives: 9999 },
};
