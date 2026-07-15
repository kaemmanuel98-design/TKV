#!/usr/bin/env python3
"""
Transcription offline (faster-whisper) pour prédications longues.
Découpe automatiquement en segments (~8 min) pour limiter la RAM.

Usage:
  python scripts/transcribe-sermon-local.py public/audio/sermons/predication-2026-07-13.mp3
  python scripts/transcribe-sermon-local.py input.mp3 --model=small --lang=fr --out=output.json
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

try:
    from faster_whisper import WhisperModel
except ImportError:
    print("Installez faster-whisper: pip install faster-whisper", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
BIBLICAL_PROMPT = (
    "Prédication chrétienne en français. Vocabulaire biblique : Dieu, Jésus-Christ, "
    "Saint-Esprit, Écritures, foi, grâce, Évangile, prière, royaume de Dieu."
)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Transcription offline d'une prédication")
    p.add_argument("input", help="Fichier audio (mp3/wav/m4a)")
    p.add_argument("--model", default="small", help="tiny|base|small|medium|large-v3")
    p.add_argument("--lang", default="fr", help="Code langue source")
    p.add_argument("--out", default="", help="Fichier JSON de sortie")
    p.add_argument("--device", default="cpu", help="cpu ou cuda")
    p.add_argument("--compute-type", default="int8", help="int8|float16|float32")
    p.add_argument("--chunk-sec", type=int, default=480, help="Durée d'un segment (s)")
    return p.parse_args()


def node_bin_path(relative: str) -> Path | None:
    candidate = ROOT / "node_modules" / relative
    return candidate if candidate.exists() else None


def resolve_ffmpeg() -> str:
    win = node_bin_path("ffmpeg-static/ffmpeg.exe")
    if win:
        return str(win)
    p = node_bin_path("ffmpeg-static/ffmpeg")
    if p:
        return str(p)
    res = subprocess.run(
        ["node", "-e", "import ffmpegPath from 'ffmpeg-static'; console.log(ffmpegPath)"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if res.returncode == 0 and res.stdout.strip():
        return res.stdout.strip()
    found = shutil.which("ffmpeg")
    if found:
        return found
    raise RuntimeError("ffmpeg introuvable (npm install ffmpeg-static)")


def resolve_ffprobe() -> str:
    win = node_bin_path("ffprobe-static/bin/win32/x64/ffprobe.exe")
    if win:
        return str(win)
    for rel in ("ffprobe-static/ffprobe.exe", "ffprobe-static/bin/linux/x64/ffprobe"):
        p = node_bin_path(rel)
        if p:
            return str(p)
    res = subprocess.run(
        ["node", "-e", "import ffprobe from 'ffprobe-static'; console.log(ffprobe.path)"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if res.returncode == 0 and res.stdout.strip():
        return res.stdout.strip()
    found = shutil.which("ffprobe")
    if found:
        return found
    raise RuntimeError("ffprobe introuvable (npm install ffprobe-static)")


def run_cmd(cmd: list[str]) -> None:
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(res.stderr or res.stdout or "command failed")


def probe_duration(path: Path) -> float:
    ffprobe = resolve_ffprobe()
    res = subprocess.run(
        [ffprobe, "-v", "error", "-show_entries", "format=duration", "-of", "default=nk=1:nw=1", str(path)],
        capture_output=True,
        text=True,
    )
    if res.returncode != 0:
        raise RuntimeError(res.stderr or "ffprobe failed")
    return float(res.stdout.strip())


def split_audio(input_path: Path, tmp_dir: Path, chunk_sec: int) -> list[Path]:
    ffmpeg = resolve_ffmpeg()
    pattern = tmp_dir / "chunk-%03d.mp3"
    run_cmd(
        [
            ffmpeg,
            "-hide_banner",
            "-y",
            "-i",
            str(input_path),
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-c:a",
            "libmp3lame",
            "-b:a",
            "64k",
            "-f",
            "segment",
            "-segment_time",
            str(chunk_sec),
            "-reset_timestamps",
            "1",
            str(pattern),
        ]
    )
    return sorted(tmp_dir.glob("chunk-*.mp3"))


def clean_text(text: str) -> str:
    t = re.sub(r"\s+", " ", text or "").strip()
    t = re.sub(r"\s+([,.;:!?])", r"\1", t)
    return t


def merge_segments_to_paragraphs(segments: list[dict], gap_sec: float = 1.8) -> list[dict]:
    if not segments:
        return []

    paragraphs: list[dict] = []
    buf: list[str] = []
    start = segments[0]["start"]
    prev_end = segments[0]["start"]

    def flush(end_time: float) -> None:
        nonlocal buf, start
        if not buf:
            return
        text = clean_text(" ".join(buf))
        if text:
            paragraphs.append({"start": round(start, 2), "end": round(end_time, 2), "text": text})
        buf = []

    for seg in segments:
        gap = seg["start"] - prev_end
        text = clean_text(seg["text"])
        if not text:
            continue
        if buf and gap >= gap_sec:
            flush(prev_end)
            start = seg["start"]
        if not buf:
            start = seg["start"]
        buf.append(text)
        prev_end = seg["end"]

    if buf:
        flush(prev_end)

    return paragraphs


def build_chapters(segments: list[dict], interval_sec: float = 300.0) -> list[dict]:
    if not segments:
        return []

    chapters: list[dict] = []
    next_mark = 0.0
    idx = 1

    for seg in segments:
        if seg["start"] >= next_mark:
            snippet = clean_text(seg["text"])[:72]
            if len(clean_text(seg["text"])) > 72:
                snippet += "…"
            chapters.append({"start": round(seg["start"], 2), "title": snippet or f"Partie {idx}"})
            idx += 1
            next_mark += interval_sec

    if not chapters:
        chapters.append({"start": 0.0, "title": "Introduction"})

    return chapters


def transcribe_chunk(model: WhisperModel, chunk_path: Path, lang: str, offset: float) -> list[dict]:
    raw_segments, _info = model.transcribe(
        str(chunk_path),
        language=lang,
        beam_size=3,
        best_of=3,
        temperature=0.0,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 500},
        initial_prompt=BIBLICAL_PROMPT,
        cpu_threads=min(4, os.cpu_count() or 2),
    )

    out: list[dict] = []
    for seg in raw_segments:
        text = clean_text(seg.text)
        if not text:
            continue
        out.append(
            {
                "start": round(offset + float(seg.start), 2),
                "end": round(offset + float(seg.end), 2),
                "text": text,
            }
        )
    return out


def main() -> None:
    args = parse_args()
    input_path = Path(args.input).resolve()
    if not input_path.exists():
        print(f"Fichier introuvable: {input_path}", file=sys.stderr)
        sys.exit(1)

    out_path = Path(args.out).resolve() if args.out else input_path.with_suffix(".transcript.json")
    duration = probe_duration(input_path)

    print(f"Modèle: {args.model} ({args.device}, {args.compute_type})")
    print(f"Source: {input_path}")
    print(f"Durée: {int(duration // 60)} min {int(duration % 60)} s")
    print(f"Découpage: {args.chunk_sec}s par segment")
    print("Chargement du modèle… (première exécution = téléchargement)")

    model = WhisperModel(
        args.model,
        device=args.device,
        compute_type=args.compute_type,
        cpu_threads=min(4, os.cpu_count() or 2),
    )

    tmp_dir = Path(tempfile.mkdtemp(prefix="tkv-whisper-"))
    segments: list[dict] = []

    try:
        chunks = split_audio(input_path, tmp_dir, args.chunk_sec)
        print(f"Segments audio: {len(chunks)}")

        for i, chunk in enumerate(chunks):
            offset = i * args.chunk_sec
            print(f"Transcription {i + 1}/{len(chunks)} ({chunk.name})…", flush=True)
            part = transcribe_chunk(model, chunk, args.lang, offset)
            segments.extend(part)
            print(f"  → {len(part)} segments", flush=True)

        for idx, seg in enumerate(segments):
            seg["id"] = idx

        paragraphs = merge_segments_to_paragraphs(segments)
        chapters = build_chapters(segments)

        summary = ""
        if paragraphs:
            summary = paragraphs[0]["text"][:280]
            if len(paragraphs[0]["text"]) > 280:
                summary += "…"

        payload = {
            "slug": input_path.stem.replace(".transcript", ""),
            "language": args.lang,
            "duration_seconds": int(round(duration)),
            "model": args.model,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "summary": summary,
            "chapters": chapters,
            "segments": segments,
            "paragraphs": paragraphs,
        }

        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

        txt_path = out_path.with_suffix(".txt")
        txt_path.write_text("\n\n".join(p["text"] for p in paragraphs), encoding="utf-8")

        print(f"✓ {len(segments)} segments, {len(paragraphs)} paragraphes")
        print(f"✓ JSON: {out_path}")
        print(f"✓ TXT : {txt_path}")
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
