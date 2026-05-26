# Copie les variables JITSI_* de jitsi-local-credentials.txt vers .env
# Usage : .\scripts\sync-jitsi-to-env.ps1

$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$credFile = Join-Path $root 'jitsi-local-credentials.txt'
$envFile = Join-Path $root '.env'

if (-not (Test-Path $credFile)) {
  Write-Host "Fichier introuvable : $credFile — lancez d'abord setup-jitsi-windows.ps1" -ForegroundColor Red
  exit 1
}

$keys = @('JITSI_DOMAIN', 'JITSI_PUBLIC_URL', 'JITSI_JWT_SUB', 'JITSI_APP_ID', 'JITSI_APP_SECRET', 'JITSI_ROOM_SECRET')
$values = @{}
foreach ($line in Get-Content $credFile) {
  if ($line -match '^(JITSI_[A-Z_]+)=(.+)$') {
    $values[$Matches[1]] = $Matches[2].Trim()
  }
}
if (-not $values['JITSI_PUBLIC_URL'] -and $values['JITSI_DOMAIN'] -eq 'localhost') {
  $values['JITSI_PUBLIC_URL'] = 'https://localhost:8443'
}
if (-not $values['JITSI_JWT_SUB'] -and $values['JITSI_DOMAIN']) {
  $values['JITSI_JWT_SUB'] = $values['JITSI_DOMAIN']
}

$content = if (Test-Path $envFile) { Get-Content $envFile -Raw } else { '' }
foreach ($key in $keys) {
  if (-not $values[$key]) { continue }
  $line = "$key=$($values[$key])"
  if ($content -match "(?m)^$([regex]::Escape($key))=") {
    $content = [regex]::Replace($content, "(?m)^$([regex]::Escape($key))=.*$", $line)
  } else {
    if ($content -and -not $content.EndsWith("`n")) { $content += "`n" }
    $content += "$line`n"
  }
}

$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($envFile, $content.TrimEnd() + "`n", $utf8)
Write-Host "Variables Jitsi écrites dans $envFile — redémarrez : npm run dev:api" -ForegroundColor Green
