/**
 * Synthèse podcast par unités de discours (ElevenLabs) + concat + polish.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { synthesizeElevenLabs } from '../../server/lib/elevenlabsTts.js';
import {
  buildSpeechUnits,
  unitsToParagraphs,
  prepareOralParagraph,
  splitParagraphs,
} from './prepareSpeech.mjs';
import {
  probeDuration,
  makeSilenceMp3,
  concatMp3,
  polishVoiceMp3,
  buildChapters,
} from './podcastAudio.mjs';

const REQUEST_GAP_MS = Number(process.env.ELEVENLABS_GAP_MS) || 380;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export async function synthesizeFromText({
  rawText,
  lang = 'fr',
  outPath,
  polish = true,
  onProgress,
}) {
  const units = buildSpeechUnits(rawText, lang);
  if (!units.length) throw new Error('empty_speech_text');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tkv-11l-'));
  const rawParts = concatPartsFromUnits(units, tmpDir, lang, onProgress);
  const voiceRaw = path.join(tmpDir, 'voice-raw.mp3');
  concatMp3(rawParts, voiceRaw);

  const voiceOut = polish ? path.join(tmpDir, 'voice-polished.mp3') : voiceRaw;
  if (polish) polishVoiceMp3(voiceRaw, voiceOut);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.copyFileSync(voiceOut, outPath);

  const duration = probeDuration(outPath);
  const displayParagraphs = unitsToParagraphs(units);
  const timed = buildTimedParagraphs(displayParagraphs, units, duration);

  fs.rmSync(tmpDir, { recursive: true, force: true });

  return {
    duration,
    units,
    paragraphs: timed,
    chapters: buildChapters(timed),
    summary:
      displayParagraphs[0]?.slice(0, 280) +
      (displayParagraphs[0]?.length > 280 ? '…' : ''),
  };
}

async function concatPartsFromUnits(units, tmpDir, lang, onProgress) {
  const concatParts = [];
  const allTexts = units.map((u) => u.text);

  for (let i = 0; i < units.length; i += 1) {
    const { text, pauseAfter } = units[i];
    onProgress?.({ index: i + 1, total: units.length, chars: text.length });

    const audio = await synthesizeElevenLabs(text, {
      previousText: allTexts[i - 1],
      nextText: allTexts[i + 1],
    });

    const partPath = path.join(tmpDir, `u-${String(i).padStart(3, '0')}.mp3`);
    fs.writeFileSync(partPath, audio);
    concatParts.push(partPath);

    if (pauseAfter > 0 && i < units.length - 1) {
      const silPath = path.join(tmpDir, `sil-${i}.mp3`);
      makeSilenceMp3(silPath, pauseAfter);
      concatParts.push(silPath);
    }

    await delay(REQUEST_GAP_MS);
  }

  return concatParts;
}

function buildTimedParagraphs(displayParagraphs, units, totalDuration) {
  const unitDurations = [];
  let unitTimeBudget = totalDuration;
  const pauseTotal = units.reduce((s, u) => s + (u.pauseAfter || 0), 0);
  const speechDuration = Math.max(1, totalDuration - pauseTotal);

  for (const u of units) {
    const weight = u.text.length;
    unitDurations.push({ weight, pause: u.pauseAfter || 0 });
  }
  const weightSum = unitDurations.reduce((s, u) => s + u.weight, 0) || 1;

  let cursor = 0;
  const timed = [];

  for (let ui = 0; ui < units.length; ui += 1) {
    const unit = units[ui];
    const unitDur = speechDuration * (unit.text.length / weightSum);
    const paras = splitParagraphs(unit.text).map((p) => prepareOralParagraph(p));
    const paraWeight = paras.reduce((s, p) => s + p.length, 0) || 1;
    let inner = cursor;

    for (const text of paras) {
      const dur = unitDur * (text.length / paraWeight);
      timed.push({
        start: Math.round(inner * 100) / 100,
        end: Math.round((inner + dur) * 100) / 100,
        text,
      });
      inner += dur;
    }

    cursor = inner + (unit.pauseAfter || 0);
  }

  if (timed.length) {
    timed[timed.length - 1].end = Math.round(totalDuration * 100) / 100;
  }

  return timed;
}

export { buildSpeechUnits, prepareOralParagraph };
