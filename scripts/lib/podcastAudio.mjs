/**
 * Utilitaires audio podcast — concat, silence, légère coloration « salle ».
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';

export function probeDuration(file) {
  const res = spawnSync(
    ffprobePath.path,
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nk=1:nw=1', file],
    { encoding: 'utf8' }
  );
  return parseFloat(String(res.stdout).trim()) || 0;
}

export function makeSilenceMp3(outPath, seconds, sampleRate = 44100) {
  spawnSync(
    ffmpegPath,
    [
      '-hide_banner',
      '-y',
      '-f',
      'lavfi',
      '-i',
      `anullsrc=r=${sampleRate}:cl=mono`,
      '-t',
      String(Math.max(0.05, seconds)),
      '-c:a',
      'libmp3lame',
      '-b:a',
      '64k',
      outPath,
    ],
    { stdio: 'pipe' }
  );
}

export function concatMp3(files, outPath) {
  const listPath = path.join(os.tmpdir(), `tkv-pod-${Date.now()}.txt`);
  const listContent = files.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n');
  fs.writeFileSync(listPath, listContent);
  const res = spawnSync(
    ffmpegPath,
    ['-hide_banner', '-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', outPath],
    { encoding: 'utf8' }
  );
  fs.unlinkSync(listPath);
  if (res.status !== 0) throw new Error(res.stderr || 'ffmpeg concat failed');
}

/**
 * Voix plus chaleureuse : léger écho de salle + compression douce (pas « studio sec »).
 */
export function polishVoiceMp3(input, output) {
  const filter = [
    'highpass=f=70',
    'compand=attacks=0.08:decays=0.25:points=-80/-900|-45/-45|-27/-25|0/-10|20/-7',
    'aecho=0.82:0.88:24:0.18',
    'loudnorm=I=-16:TP=-1.5:LRA=11',
  ].join(',');

  const res = spawnSync(
    ffmpegPath,
    [
      '-hide_banner',
      '-y',
      '-i',
      input,
      '-af',
      filter,
      '-c:a',
      'libmp3lame',
      '-b:a',
      '128k',
      '-ar',
      '44100',
      output,
    ],
    { encoding: 'utf8', maxBuffer: 80 * 1024 * 1024 }
  );

  if (res.status !== 0) {
    fs.copyFileSync(input, output);
    return false;
  }
  return true;
}

export function buildChapters(paragraphs, intervalSec = 300) {
  const chapters = [];
  let next = 0;
  for (const p of paragraphs) {
    if (p.start >= next) {
      chapters.push({
        start: p.start,
        title: p.text.slice(0, 72) + (p.text.length > 72 ? '…' : ''),
      });
      next += intervalSec;
    }
  }
  return chapters.length ? chapters : [{ start: 0, title: 'Introduction' }];
}

export function paragraphsWithTiming(texts, duration) {
  const total = texts.reduce((n, t) => n + t.length, 0) || 1;
  let cursor = 0;
  return texts.map((text) => {
    const start = cursor;
    cursor += duration * (text.length / total);
    return {
      start: Math.round(start * 100) / 100,
      end: Math.round(cursor * 100) / 100,
      text,
    };
  });
}
