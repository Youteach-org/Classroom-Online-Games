@echo off
setlocal
cd /d "%~dp0.."

where node >nul 2>nul
if %errorlevel%==0 (
  node "Wordy\preview-local.mjs" --open
  exit /b %errorlevel%
)

where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://127.0.0.1:4173/Wordy/"
  py -m http.server 4173 --bind 127.0.0.1
  exit /b %errorlevel%
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://127.0.0.1:4173/Wordy/"
  python -m http.server 4173 --bind 127.0.0.1
  exit /b %errorlevel%
)

echo.
echo Wordy local preview needs Node.js or Python.
echo Nothing was deployed online.
echo.
pause
