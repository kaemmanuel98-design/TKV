# Installe Jitsi Meet (Docker) sur Windows pour TKV
# PowerShell (en admin si Docker l’exige) :
#   Set-ExecutionPolicy -Scope Process Bypass
#   cd C:\Users\Ange\Documents\TKV-APP
#   .\scripts\setup-jitsi-windows.ps1
#
# Prérequis : Docker Desktop démarré

$ErrorActionPreference = 'Stop'

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

function New-Secret([int]$len = 48) {
  $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  -join (1..$len | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
}

function Set-EnvLine([string]$content, [string]$key, [string]$value) {
  $line = "$key=$value"
  if ($content -match "(?m)^$([regex]::Escape($key))=") {
    return [regex]::Replace($content, "(?m)^$([regex]::Escape($key))=.*$", $line)
  }
  return "$content`n$line"
}

$installDir = Join-Path $env:USERPROFILE 'jitsi-docker-meet'
$configDir = Join-Path $env:USERPROFILE '.jitsi-meet-cfg'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

function Write-Utf8NoBom([string]$path, [string]$text) {
  $utf8 = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($path, $text, $utf8)
}

Write-Step 'Vérification de Docker'
& docker version 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Installez Docker Desktop : https://www.docker.com/products/docker-desktop/' -ForegroundColor Red
  exit 1
}
& docker compose version 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Mettez à jour Docker Desktop (Compose v2 requis).' -ForegroundColor Red
  exit 1
}

Write-Step "Installation dans $installDir"
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host 'Git est requis : https://git-scm.com/download/win' -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $installDir)) {
  git clone https://github.com/jitsi/docker-jitsi-meet.git $installDir
} else {
  Push-Location $installDir
  git pull --ff-only
  Pop-Location
}

Set-Location $installDir

if (-not (Test-Path '.env')) {
  Copy-Item 'env.example' '.env'
}

Write-Step 'Mots de passe internes + JWT TKV'
$jwtSecret = New-Secret 64
$jwtAppId = 'tkv'
$roomSecret = New-Secret 48

$envContent = Get-Content '.env' -Raw
$keys = @{
  CONFIG = $configDir
  HTTP_PORT = '8000'
  HTTPS_PORT = '8443'
  TZ = 'Europe/Paris'
  PUBLIC_URL = 'https://localhost:8443'
  DISABLE_HTTPS = '0'
  ENABLE_AUTH = '1'
  ENABLE_GUESTS = '0'
  AUTH_TYPE = 'jwt'
  JWT_APP_ID = $jwtAppId
  JWT_APP_SECRET = $jwtSecret
  JWT_ACCEPTED_ISSUERS = 'tkv'
  JWT_ACCEPTED_AUDIENCES = 'tkv'
  ENABLE_LOBBY = '0'
  ENABLE_LETSENCRYPT = '0'
  RESTART_POLICY = 'unless-stopped'
  JICOFO_AUTH_PASSWORD = (New-Secret)
  JVB_AUTH_PASSWORD = (New-Secret)
  JIGASI_XMPP_PASSWORD = (New-Secret)
  JIGASI_TRANSCRIBER_PASSWORD = (New-Secret)
  JIBRI_RECORDER_PASSWORD = (New-Secret)
  JIBRI_XMPP_PASSWORD = (New-Secret)
}

foreach ($pair in $keys.GetEnumerator()) {
  $envContent = Set-EnvLine $envContent $pair.Key $pair.Value
}

Write-Utf8NoBom (Join-Path $installDir '.env') $envContent.TrimEnd()

Write-Step 'Téléchargement des images (5–15 min la première fois)'
docker compose pull

Write-Step 'Démarrage des conteneurs'
docker compose up -d

$credFile = Join-Path $repoRoot 'jitsi-local-credentials.txt'
$tkvBlock = @"
# Généré par setup-jitsi-windows.ps1 — NE PAS COMMITER (déjà dans .gitignore)

Copier ces lignes dans TKV-APP\.env puis redémarrer l'API : npm run dev:api

JITSI_DOMAIN=localhost
JITSI_PUBLIC_URL=https://localhost:8443
JITSI_JWT_SUB=localhost
JITSI_APP_ID=$jwtAppId
JITSI_APP_SECRET=$jwtSecret
JITSI_ROOM_SECRET=$roomSecret

Interface Jitsi : https://localhost:8443
(accepter l'avertissement certificat auto-signé dans le navigateur)

Dossier Jitsi : $installDir
Arrêter : docker compose down
"@
Write-Utf8NoBom $credFile $tkvBlock

Write-Host @"

Installation terminée.

  1. Ouvrez https://localhost:8443 et acceptez le certificat (local).
  2. Copiez $credFile vers .env de TKV.
  3. npm run dev:api  puis testez Cellules mondiales → Visio.

"@ -ForegroundColor Green
