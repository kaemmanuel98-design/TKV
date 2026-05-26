import app from './app.js';
import { config } from './config.js';
import { loadChunks } from './lib/vectorStore.js';

const server = app.listen(config.port, () => {
  const n = loadChunks().length;
  const jitsiOk = Boolean(config.jitsiDomain && config.jitsiAppId && config.jitsiAppSecret);
  console.log(`TKV API — http://localhost:${config.port}`);
  console.log(`  chunks: ${n} | openai: ${config.openaiKey ? 'oui' : 'non'}`);
  console.log(
    `  jitsi: ${jitsiOk ? `oui (${config.jitsiPublicUrl || config.jitsiDomain})` : 'non — copiez jitsi-local-credentials.txt → .env'}`
  );
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
