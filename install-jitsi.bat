@echo off
title Installation Jitsi Meet pour TKV
cd /d "%~dp0"
echo.
echo Installation Jitsi dans : %CD%
echo Docker Desktop doit etre demarre.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-jitsi-windows.ps1"
echo.
pause
