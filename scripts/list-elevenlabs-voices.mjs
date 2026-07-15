/**
 * Affiche les voix ElevenLabs de votre compte (pour copier ELEVENLABS_VOICE_ID).
 * Usage: node scripts/list-elevenlabs-voices.mjs
 */
import dotenv from 'dotenv';
import { listElevenLabsVoices, elevenlabsConfigured } from '../server/lib/elevenlabsTts.js';

dotenv.config();

async function main() {
  if (!elevenlabsConfigured(false)) {
    console.error('Définissez ELEVENLABS_API_KEY dans .env');
    process.exit(1);
  }

  const voices = await listElevenLabsVoices();
  if (!voices.length) {
    console.log('Aucune voix trouvée.');
    return;
  }

  console.log('Voix ElevenLabs disponibles :\n');
  for (const v of voices) {
    const labels = v.labels ? Object.entries(v.labels).map(([k, val]) => `${k}=${val}`).join(', ') : '';
    console.log(`  ${v.name}`);
    console.log(`    ID: ${v.voice_id}`);
    if (labels) console.log(`    ${labels}`);
    if (v.category) console.log(`    catégorie: ${v.category}`);
    console.log('');
  }
  console.log('Copiez l’ID de votre voix clonée dans .env → ELEVENLABS_VOICE_ID=...');
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
