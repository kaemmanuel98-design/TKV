import app from './app.js';
import { config } from './config.js';
import { loadChunks } from './lib/vectorStore.js';

app.listen(config.port, () => {
  const n = loadChunks().length;
  console.log(`TKV API — http://localhost:${config.port}`);
  console.log(`  chunks: ${n} | openai: ${config.openaiKey ? 'oui' : 'non'}`);
  if (n === 0) console.log('  → lancez: npm run ingest:knowledge');
});
