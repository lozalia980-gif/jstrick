@echo off
rem Abre Xidecode en el navegador. Si Python esta instalado usa un servidor local (mas compatible);
rem si no, abre index.html directamente.
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel%==0 (
  echo Iniciando Xidecode en http://localhost:5173  (cierra esta ventana para detenerlo)
  start "" http://localhost:5173
  python -m http.server 5173 --bind 127.0.0.1
) else (
  start "" "%~dp0index.html"
)
