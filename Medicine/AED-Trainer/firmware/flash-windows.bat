@echo off
setlocal EnableExtensions
title DEA Educativo SALON - Instalador

cd /d "%~dp0"

echo ============================================================
echo   DEA EDUCATIVO SALON - INSTALADOR
echo ============================================================
echo.
echo Cierra Arduino Serial Monitor antes de continuar.
echo.

for %%F in (bootloader.bin partitions.bin firmware.bin littlefs.bin) do (
  if not exist "%%F" (
    echo ERROR: Falta %%F.
    echo Descomprime TODO el ZIP y vuelve a ejecutar este archivo.
    pause
    exit /b 1
  )
)

set "PY="

where py >nul 2>&1
if not errorlevel 1 set "PY=py"
if defined PY goto HAVE_PY

where python >nul 2>&1
if not errorlevel 1 set "PY=python"
if defined PY goto HAVE_PY

echo ERROR: No se encontro Python.
echo Instala Python 3 o abre Arduino IDE para revisar tu entorno.
pause
exit /b 1

:HAVE_PY
%PY% -m esptool version >nul 2>&1
if not errorlevel 1 goto TOOL_READY

echo Esptool no esta instalado. Intentando instalarlo...
%PY% -m pip install --user --upgrade esptool
if errorlevel 1 (
  echo ERROR: No se pudo instalar esptool.
  pause
  exit /b 1
)

%PY% -m esptool version >nul 2>&1
if errorlevel 1 (
  echo ERROR: Esptool sigue sin estar disponible.
  pause
  exit /b 1
)

:TOOL_READY
echo Herramienta lista.
echo.
echo Escribe el puerto del ESP32, por ejemplo COM9.
echo Tambien puedes escribir solamente 9.
set /p "PORT=Puerto COM: "

if "%PORT%"=="" (
  echo ERROR: No escribiste un puerto.
  pause
  exit /b 1
)

if /i not "%PORT:~0,3%"=="COM" set "PORT=COM%PORT%"

echo.
echo Se usara: %PORT%
set /p "CONFIRM=Escribe S para instalar: "
if /i not "%CONFIRM%"=="S" (
  echo Cancelado.
  pause
  exit /b 0
)

echo.
echo [1/2] Borrando flash...
%PY% -m esptool --chip esp32 --port "%PORT%" erase-flash
if errorlevel 1 (
  echo.
  echo ERROR: No se pudo abrir %PORT%.
  echo Cierra Arduino Serial Monitor y verifica el puerto.
  pause
  exit /b 1
)

echo.
echo [2/2] Instalando firmware y audios...
%PY% -m esptool --chip esp32 --port "%PORT%" --baud 460800 ^
  write-flash --flash-mode dio --flash-size 4MB ^
  0x1000 bootloader.bin ^
  0x8000 partitions.bin ^
  0x10000 firmware.bin ^
  0x210000 littlefs.bin

if errorlevel 1 (
  echo.
  echo ERROR: Fallo la escritura del firmware.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo   INSTALACION COMPLETADA
echo ============================================================
echo.
echo Si no reinicia automaticamente, desconecta y conecta el ESP32.
echo Debes escuchar los dos tonos de autoprueba.
echo.
pause
exit /b 0
