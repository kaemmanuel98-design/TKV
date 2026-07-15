#!/usr/bin/env python3
"""Génère une boucle piano ambient (worship / méditation) pour fond de podcast."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 44100
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "audio" / "beds"
DEFAULT_OUT = OUT_DIR / "piano-worship-loop.mp3"

# Fréquences (Hz)
NOTES = {
    "A3": 220.00,
    "B3": 246.94,
    "C4": 261.63,
    "D4": 293.66,
    "E4": 329.63,
    "F4": 349.23,
    "G4": 392.00,
    "A4": 440.00,
    "B4": 493.88,
    "C5": 523.25,
    "D5": 587.33,
    "E5": 659.25,
    "G5": 783.99,
}

# I – vi – IV – V en Do majeur (ambiance douce)
CHORDS = [
    ["C4", "E4", "G4", "C5"],
    ["A3", "C4", "E4", "A4"],
    ["F4", "A4", "C5", "F4"],
    ["G4", "B4", "D5", "G5"],
]

BPM = 54
BEAT = 60.0 / BPM


def find_ffmpeg() -> str:
    win = ROOT / "node_modules" / "ffmpeg-static" / "ffmpeg.exe"
    return str(win) if win.exists() else "ffmpeg"


def karplus_strong(freq: float, duration: float, decay: float = 0.9968) -> np.ndarray:
    n_buf = max(int(SR / freq), 4)
    buf = (np.random.randn(n_buf) * 0.6).astype(np.float64)
    n = max(int(duration * SR), 1)
    out = np.zeros(n, dtype=np.float64)
    for i in range(n):
        out[i] = buf[0]
        buf[:-1] = buf[1:]
        buf[-1] = (buf[0] + buf[1]) * 0.5 * decay
    return out


def piano_note(freq: float, duration: float, velocity: float = 0.38) -> np.ndarray:
    tone = karplus_strong(freq, duration, decay=0.9972)
    n = len(tone)
    attack = min(int(0.008 * SR), n // 4 or 1)
    release = min(int(0.45 * SR), n)
    env = np.ones(n, dtype=np.float64)
    if attack > 0:
        env[:attack] = np.linspace(0.0, 1.0, attack)
    if release > 0 and release <= n:
        env[-release:] *= np.linspace(1.0, 0.0, release)
    return tone * env * velocity


def render_loop(duration_sec: float = 240.0) -> np.ndarray:
    total = int(duration_sec * SR)
    mix = np.zeros(total, dtype=np.float64)
    note_dur = BEAT * 0.95
    gap = BEAT * 0.05

    t = 0.0
    chord_idx = 0
    while t < duration_sec - note_dur:
        chord = CHORDS[chord_idx % len(CHORDS)]
        for i, note_name in enumerate(chord):
            freq = NOTES[note_name]
            vel = 0.32 if i == 0 else 0.26 - i * 0.02
            note = piano_note(freq, note_dur + 0.4, velocity=max(vel, 0.14))
            start = int((t + i * (note_dur * 0.22)) * SR)
            end = min(start + len(note), total)
            seg = note[: end - start]
            mix[start:end] += seg
        t += len(chord) * (note_dur * 0.22) + gap + BEAT * 0.6
        chord_idx += 1

    # Légère réverb simulée
    delay1 = int(0.047 * SR)
    delay2 = int(0.071 * SR)
    wet = np.zeros_like(mix)
    wet[delay1:] += mix[:-delay1] * 0.22
    wet[delay2:] += mix[:-delay2] * 0.14
    mix = mix * 0.78 + wet * 0.22

    peak = np.max(np.abs(mix)) or 1.0
    mix = mix / peak * 0.72
    return mix.astype(np.float32)


def write_mp3(wav_path: Path, mp3_path: Path) -> None:
    ffmpeg = find_ffmpeg()
    subprocess.run(
        [
            ffmpeg,
            "-hide_banner",
            "-y",
            "-i",
            str(wav_path),
            "-af",
            "lowpass=f=4200,highpass=f=80",
            "-c:a",
            "libmp3lame",
            "-b:a",
            "128k",
            str(mp3_path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )


def main() -> None:
    duration = float(sys.argv[1]) if len(sys.argv) > 1 else 240.0
    out_mp3 = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUT
    out_mp3.parent.mkdir(parents=True, exist_ok=True)

    print(f"Piano ambient · {duration:.0f}s · {BPM} BPM")
    mono = render_loop(duration)

    # Stéréo léger (L/R décalés pour profondeur)
    delay = int(0.011 * SR)
    left = mono.copy()
    right = np.zeros_like(mono)
    right[delay:] = mono[:-delay] * 0.92
    stereo = np.column_stack([left, right])

    import wave

    wav_path = out_mp3.with_suffix(".wav")
    with wave.open(str(wav_path), "w") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        pcm = (stereo * 32767).astype(np.int16)
        wf.writeframes(pcm.tobytes())

    write_mp3(wav_path, out_mp3)
    wav_path.unlink(missing_ok=True)
    print(f"✓ {out_mp3}")


if __name__ == "__main__":
    main()
