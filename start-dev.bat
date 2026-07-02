@echo off
cd /d "C:\dev\Whatsapp ConsoleMix"
echo Iniciando ConsoleMix Bot...
echo Dashboard: http://localhost:3000/dashboard
echo Webhook:   http://localhost:3000/webhook/whatsapp
echo.
npx ts-node src/index.ts
pause
