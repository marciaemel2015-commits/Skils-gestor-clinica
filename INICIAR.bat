@echo off
rem (c) 2026 - Metodo Clinica de Estetica 6D. Todos os direitos reservados a titular.
rem Dois cliques: liga o sistema e abre o navegador. Feche esta janela para desligar.
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  O Node.js nao esta instalado neste computador.
  echo  Instale a versao LTS em https://nodejs.org e depois abra este arquivo de novo.
  echo.
  pause
  exit /b 1
)
echo.
echo  Iniciando o Metodo Clinica de Estetica 6D...
echo  O navegador vai abrir em http://localhost:4766
echo  Para desligar, feche esta janela.
echo.
start "" cmd /c "timeout /t 2 >nul & start http://localhost:4766"
node app\server.js
pause
