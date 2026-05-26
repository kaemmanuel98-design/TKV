#!/usr/bin/env bash
# Lance l’installateur Jitsi depuis Git Bash (MINGW64)
# Usage : cd /c/Users/Ange/Documents/TKV-APP && bash scripts/setup-jitsi-windows.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PS1="$ROOT/scripts/setup-jitsi-windows.ps1"

if ! command -v powershell.exe >/dev/null 2>&1 && ! command -v pwsh >/dev/null 2>&1; then
  echo "PowerShell introuvable. Ouvrez Windows PowerShell et exécutez :"
  echo "  cd $ROOT"
  echo "  .\\scripts\\setup-jitsi-windows.ps1"
  exit 1
fi

if command -v pwsh >/dev/null 2>&1; then
  exec pwsh -NoProfile -ExecutionPolicy Bypass -File "$PS1"
else
  exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PS1"
fi
