@echo off

title RedeemX Localhost

cd /d "%~dp0"

REM Node 22+: System-CAs nötig für Bitrefill TLS (sonst "fetch failed" / leerer Shop)
set NODE_OPTIONS=--use-system-ca

echo.

echo  ========================================

echo   RedeemX Localhost

echo   URL: http://127.0.0.1:5320/

echo  ========================================

echo.

echo  WICHTIG: Nicht localhost:5173 verwenden!

echo  Port 5173 ist oft von anderen Apps belegt.

echo.

echo  Dieses Fenster OFFEN lassen.

echo.

npm run dev

pause

