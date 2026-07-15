#!/usr/bin/env python3
"""
Synthèse vocale naturelle (Edge TTS) — prédications et podcasts texte.
- Voix chaleureuse, débit posé
- Un paragraphe = une prise (pauses naturelles entre les idées)
- Silence court inséré entre les paragraphes
"""
from __future__ import annotations

import asyncio
import re
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    import edge_tts
except ImportError:
    print("pip install edge-tts", file=sys.stderr)
    sys.exit(1)

VOICES = {
    "fr": "fr-FR-DeniseNeural",
    "en": "en-US-JennyNeural",
    "es": "es-ES-ElviraNeural",
    "nl": "nl-NL-ColetteNeural",
    "pt": "pt-PT-RaquelNeural",
    "ar": "ar-SA-ZariyahNeural",
}

# Débit posé mais pas « robot lent »
SPEECH_RATE = "-6%"
SPEECH_PITCH = "-1Hz"
PARAGRAPH_PAUSE_SEC = 0.45
MAX_SYNTH_CHARS = 1400

ORDINALS_FR = {
    1: "Premièrement",
    2: "Deuxièmement",
    3: "Troisièmement",
    4: "Quatrièmement",
    5: "Cinquièmement",
    6: "Sixièmement",
    7: "Septièmement",
    8: "Huitièmement",
}


# Livre biblique + chapitre:verset — évite « 3 heures 1 » au lieu de « chapitre 3 verset 1 »
_BIBLE_BOOK = (
    r"(?:\d+\s+)?"
    r"[A-ZÀ-ÜÉÈÊËÎÏÔÙÛÜÇ][\wàâäéèêëïîôùûüç'-]*"
    r"(?:\s+[\wàâäéèêëïîôùûüç'-]+)?"
)
_BIBLE_REF_COLON = re.compile(
    rf"({_BIBLE_BOOK})\s+(\d{{1,3}})\s*:\s*(\d{{1,3}})(?:\s*[-–]\s*(\d{{1,3}}))?",
    re.UNICODE,
)


def spoken_bible_refs(text: str, lang: str = "fr") -> str:
    """Transforme « Jacques 3:1 » en forme parlée pour le TTS."""
    if not text or ":" not in text:
        return text

    def repl_fr(m: re.Match[str]) -> str:
        book, chapter, verse, end = m.group(1), m.group(2), m.group(3), m.group(4)
        if end:
            verses = f"versets {verse} à {end}"
        else:
            verses = f"verset {verse}"
        return f"{book.strip()} chapitre {chapter}, {verses}"

    def repl_en(m: re.Match[str]) -> str:
        book, chapter, verse, end = m.group(1), m.group(2), m.group(3), m.group(4)
        if end:
            verses = f"verses {verse} to {end}"
        else:
            verses = f"verse {verse}"
        return f"{book.strip()} chapter {chapter}, {verses}"

    repl = repl_en if lang.split("-")[0] == "en" else repl_fr
    return _BIBLE_REF_COLON.sub(repl, text)


def split_paragraphs(text: str) -> list[str]:
    return [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]


def prepare_paragraph(raw: str, lang: str = "fr") -> str:
    p = raw.replace("\n", " ").strip()
    p = re.sub(r"\s+", " ", p)

    # Titres de section : "1. Titre" → "Premièrement. Titre"
    m = re.match(r"^(\d+)\.\s+(.+)$", p)
    if m:
        num = int(m.group(1))
        rest = m.group(2)
        lead = ORDINALS_FR.get(num, f"Partie {num}")
        p = f"{lead}. {rest}"

    lower = p.lower()
    if lower in ("introduction", "conclusion et appel", "prière", "conclusion"):
        p = f"{p}…"

    # Pause légère après les citations bibliques longues
    if "«" in p and "»" in p:
        p = p.replace("»", "»…")

    # Questions rhétoriques : laisser respirer
    p = re.sub(r"\?\s+", "?.. ", p)
    p = re.sub(r";\s+", ";.. ", p)

    # Guillemets : plus fluides à l'oral
    p = p.replace("«", "").replace("»", "")

    p = spoken_bible_refs(p, lang)

    return p.strip()


def split_long_units(paragraphs: list[str]) -> list[str]:
    """Découpe les blocs trop longs (citations bibliques) en phrases."""
    units: list[str] = []
    for para in paragraphs:
        if len(para) <= MAX_SYNTH_CHARS:
            units.append(para)
            continue
        sentences = re.split(r"(?<=[.!?…])\s+", para)
        buf = ""
        for s in sentences:
            s = s.strip()
            if not s:
                continue
            candidate = f"{buf} {s}".strip() if buf else s
            if len(candidate) > MAX_SYNTH_CHARS and buf:
                units.append(buf)
                buf = s
            else:
                buf = candidate
        if buf:
            units.append(buf)
    return units


def find_ffmpeg() -> str:
    root = Path(__file__).resolve().parent.parent
    win = root / "node_modules" / "ffmpeg-static" / "ffmpeg.exe"
    if win.exists():
        return str(win)
    return "ffmpeg"


def make_silence_mp3(path: Path, duration: float, sample_rate: int = 24000) -> None:
    ffmpeg = find_ffmpeg()
    subprocess.run(
        [
            ffmpeg,
            "-hide_banner",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"anullsrc=r={sample_rate}:cl=mono",
            "-t",
            str(duration),
            "-c:a",
            "libmp3lame",
            "-b:a",
            "64k",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )


def concat_mp3(files: list[Path], out: Path) -> None:
    ffmpeg = find_ffmpeg()
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
        for p in files:
            escaped = str(p.resolve()).replace("'", "'\\''")
            f.write(f"file '{escaped}'\n")
        list_path = f.name
    try:
        subprocess.run(
            [
                ffmpeg,
                "-hide_banner",
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                list_path,
                "-c:a",
                "libmp3lame",
                "-b:a",
                "96k",
                "-ar",
                "44100",
                str(out),
            ],
            check=True,
            capture_output=True,
            text=True,
        )
    finally:
        Path(list_path).unlink(missing_ok=True)


async def synth_paragraph(text: str, voice: str, out: Path) -> None:
    last_err = None
    for attempt in range(4):
        try:
            communicate = edge_tts.Communicate(text, voice, rate=SPEECH_RATE, pitch=SPEECH_PITCH)
            await communicate.save(str(out))
            return
        except Exception as err:
            last_err = err
            await asyncio.sleep(0.8 * (attempt + 1))
    raise last_err


async def main_async() -> None:
    if len(sys.argv) < 3:
        print("Usage: python scripts/edge-tts-batch.py <input.txt> <output.mp3> [lang]", file=sys.stderr)
        sys.exit(1)

    src = Path(sys.argv[1]).read_text(encoding="utf-8")
    out = Path(sys.argv[2])
    lang = sys.argv[3] if len(sys.argv) > 3 else "fr"
    voice = VOICES.get(lang.split("-")[0], VOICES["fr"])

    paragraphs = [prepare_paragraph(p, lang) for p in split_paragraphs(src)]
    paragraphs = [p for p in paragraphs if p]
    units = split_long_units(paragraphs)

    print(f"Edge TTS naturel · {voice} · {SPEECH_RATE} · {len(units)} unité(s)")

    tmp_dir = Path(tempfile.mkdtemp(prefix="tkv-edge-"))
    silence_path = tmp_dir / "silence.mp3"
    make_silence_mp3(silence_path, PARAGRAPH_PAUSE_SEC)

    concat_list: list[Path] = []
    try:
        for i, para in enumerate(units):
            part = tmp_dir / f"para-{i:03d}.mp3"
            print(f"  {i + 1}/{len(units)}…", flush=True)
            await synth_paragraph(para, voice, part)
            concat_list.append(part)
            if i < len(units) - 1:
                concat_list.append(silence_path)
            await asyncio.sleep(0.2)

        out.parent.mkdir(parents=True, exist_ok=True)
        concat_mp3(concat_list, out)
        print(f"✓ {out}")
    finally:
        import shutil

        shutil.rmtree(tmp_dir, ignore_errors=True)


if __name__ == "__main__":
    asyncio.run(main_async())
