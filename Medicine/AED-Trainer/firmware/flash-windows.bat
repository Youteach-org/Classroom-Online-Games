@echo off
setlocal EnableExtensions EnableDelayedExpansion
title DEA Educativo - Instalador

cd /d "%~dp0"

echo ============================================================
echo   DEA EDUCATIVO - INSTALADOR ESP32-WROOM-32
echo ============================================================
echo.
echo Esta version incluye:
echo   - funcionamiento autonomo sin Teacher Monitor
echo   - PADS/OK manual
echo   - ECG simulado en OLED
echo   - advertencia grafica para SHOCK
echo   - cronometro RCP 02:00 a 00:00
echo   - 61 audios locales
echo   - mayor nivel digital de audio
echo   - Bluetooth Teacher Monitor opcional
echo.
echo Cierra Arduino Serial Monitor, VS Code y cualquier programa
echo que tenga abierto el puerto COM antes de continuar.
echo.

set "ESPTOOL="

where py >nul 2>&1
if %errorlevel%==0 (
  py -m esptool version >nul 2>&1
  if %errorlevel%==0 set "ESPTOOL=py -m esptool"
)

if not defined ESPTOOL (
  where python >nul 2>&1
  if %errorlevel%==0 (
    python -m esptool version >nul 2>&1
    if %errorlevel%==0 set "ESPTOOL=python -m esptool"
  )
)

if not defined ESPTOOL (
  echo No se encontro esptool.
  echo Intentando instalarlo automaticamente...
  where py >nul 2>&1
  if %errorlevel%==0 (
    py -m pip install --upgrade esptool
    if not errorlevel 1 set "ESPTOOL=py -m esptool"
  )
)

if not defined ESPTOOL (
  echo.
  echo ERROR: No fue posible encontrar o instalar esptool.
  echo Instala Python 3 y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)

echo Puertos COM detectados:
powershell -NoProfile -Command "$p=[System.IO.Ports.SerialPort]::GetPortNames() ^| Sort-Object; if($p){$p ^| ForEach-Object {Write-Host ('  '+$_)}} else {Write-Host '  Ninguno'}"
echo.

if not "%~1"=="" (
  set "PORT=%~1"
) else (
  set /p PORT="Escribe el puerto del ESP32 (ejemplo COM9): "
)

if "%PORT%"=="" (
  echo ERROR: No se indico puerto.
  pause
  exit /b 1
)

echo %PORT% | findstr /r /i "^COM[0-9][0-9]*$" >nul
if errorlevel 1 (
  echo %PORT% | findstr /r "^[0-9][0-9]*$" >nul
  if not errorlevel 1 set "PORT=COM%PORT%"
)

echo.
echo Se programara %PORT%.
echo Se borrara completamente la flash antes de instalar.
set /p CONFIRM="Continuar? (S/N): "
if /i not "%CONFIRM%"=="S" (
  echo Cancelado.
  pause
  exit /b 0
)

echo.
echo [1/2] Borrando flash...
%ESPTOOL% --chip esp32 --port %PORT% erase-flash
if errorlevel 1 (
  echo.
  echo ERROR: No se pudo borrar la flash.
  echo Si aparece Acceso denegado, cierra el Monitor Serial y vuelve a intentar.
  pause
  exit /b 1
)

echo.
echo [2/2] Instalando firmware y audios...
%ESPTOOL% --chip esp32 --port %PORT% --baud 460800 ^
  write-flash --flash-mode dio --flash-size 4MB ^
  0x1000 bootloader.bin ^
  0x8000 partitions.bin ^
  0x10000 firmware.bin ^
  0x210000 littlefs.bin

if errorlevel 1 (
  echo.
  echo ERROR: Fallo la programacion.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo   INSTALACION COMPLETADA
echo ============================================================
echo.
echo Al reiniciar deben sonar dos tonos.
echo En la OLED debe aparecer el DEA listo.
echo.
echo Botones:
echo   START     GPIO33 a GND
echo   MODE      GPIO14 a GND
echo   PADS/OK   GPIO13 a GND
echo   RESET     GPIO17 a GND
echo   SHOCK     GPIO32 a GND
echo.
pause
exit /b 0
