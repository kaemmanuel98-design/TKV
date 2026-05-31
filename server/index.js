import app from './app.js';
import { config } from './config.js';
import { loadChunks } from './lib/vectorStore.js';

const server = app.listen(config.port, () => {
  const n = loadChunks().length;
  const supabaseOk = Boolean(config.supabaseUrl && config.supabaseServiceKey);
  const paypalOk = Boolean(config.paypalClientId && config.paypalClientSecret);
  console.log(`TKV API — http://localhost:${config.port}`);
  console.log(`  chunks: ${n} | openai: ${config.openaiKey ? 'oui' : 'non'}`);
  console.log(
    `  supabase: ${supabaseOk ? 'oui' : 'non — SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY dans .env'}`
  );
  console.log(`  paypal: ${paypalOk ? (config.paypalSandbox ? 'oui (sandbox)' : 'oui') : 'non'}`);
  if (!supabaseOk) {
    console.log('  → paiements / export : redémarrez l’API après avoir rempli .env');
  }
  if (n === 0) console.log('  → lancez: npm run ingest:knowledge');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\nLe port ${config.port} est déjà utilisé — l’API TKV tourne probablement déjà.\n` +
        `  → Test : http://localhost:${config.port}/api/health\n` +
        `  → Pour relancer : arrêtez l’ancien processus (PID via netstat -ano | findstr :${config.port})\n`
    );
    process.exit(1);
  }
  throw err;
});
