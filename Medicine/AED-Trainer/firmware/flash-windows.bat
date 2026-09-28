@echo off
setlocal EnableExtensions
title DEA Educativo SALON - Instalador ESP32

cd /d "%~dp0"

echo ============================================================
echo   DEA EDUCATIVO SALON - INSTALADOR ESP32-WROOM-32
echo ============================================================
echo.
echo IMPORTANTE:
echo   Cierra Arduino Serial Monitor, VS Code y cualquier programa
echo   que tenga abierto el puerto COM antes de continuar.
echo.

for %%F in (bootloader.bin partitions.bin firmware.bin littlefs.bin) do (
  if not exist "%%F" (
    echo ERROR: Falta %%F en esta carpeta.
    echo Descomprime TODO el ZIP antes de ejecutar el instalador.
    pause
    exit /b 1
  )
)

set "ESPTOOL="

rem 1) Intentar usar el esptool incluido por Arduino ESP32.
if exist "%LOCALAPPDATA%\Arduino15\packages\esp32\tools\esptool_py" (
  for /r "%LOCALAPPDATA%\Arduino15\packages\esp32\tools\esptool_py" %%E in (esptool.exe) do (
    if not defined ESPTOOL set "ESPTOOL=%%E"
  )
)

if not defined ESPTOOL if exist "%USERPROFILE%\.arduino15\packages\esp32\tools\esptool_py" (
  for /r "%USERPROFILE%\.arduino15\packages\esp32\tools\esptool_py" %%E in (esptool.exe) do (
    if not defined ESPTOOL set "ESPTOOL=%%E"
  )
)

if defined ESPTOOL (
  set "ESPTOOL_CMD="%ESPTOOL%""
  goto :TOOL_READY
)

rem 2) Intentar Python Launcher.
where py >nul 2>&1
if not errorlevel 1 (
  py -m esptool version >nul 2>&1
  if not errorlevel 1 (
    set "ESPTOOL_CMD=py -m esptool"
    goto :TOOL_READY
  )
)

rem 3) Intentar python.exe.
where python >nul 2>&1
if not errorlevel 1 (
  python -m esptool version >nul 2>&1
  if not errorlevel 1 (
    set "ESPTOOL_CMD=python -m esptool"
    goto :TOOL_READY
  )
)

rem 4) Si hay Python pero falta esptool, instalarlo.
where py >nul 2>&1
if not errorlevel 1 (
  echo Instalando esptool...
  py -m pip install --user --upgrade esptool
  if not errorlevel 1 (
    py -m esptool version >nul 2>&1
    if not errorlevel 1 (
      set "ESPTOOL_CMD=py -m esptool"
      goto :TOOL_READY
    )
  )
)

where python >nul 2>&1
if not errorlevel 1 (
  echo Instalando esptool...
  python -m pip install --user --upgrade esptool
  if not errorlevel 1 (
    python -m esptool version >nul 2>&1
    if not errorlevel 1 (
      set "ESPTOOL_CMD=python -m esptool"
      goto :TOOL_READY
    )
  )
)

echo.
echo ERROR: No se encontro esptool ni una instalacion de Python utilizable.
echo Si Arduino IDE tiene instalado ESP32, abre el IDE una vez y vuelve a intentar.
pause
exit /b 1

:TOOL_READY
echo Herramienta de programacion encontrada.
echo.
echo Revisa en Administrador de dispositivos el puerto del ESP32.
echo Ejemplo: COM9
echo.
set /p "PORT=Escribe el puerto COM del ESP32: "

if "%PORT%"=="" (
  echo ERROR: No escribiste un puerto.
  pause
  exit /b 1
)

if /i not "%PORT:~0,3%"=="COM" set "PORT=COM%PORT%"

echo.
echo Puerto seleccionado: %PORT%
echo Se borrara la flash del ESP32 y se instalara el DEA completo.
set /p "CONFIRM=Escribe S para continuar: "
if /i not "%CONFIRM%"=="S" (
  echo Instalacion cancelada.
  pause
  exit /b 0
)

echo.
echo [1/2] Borrando flash...
%ESPTOOL_CMD% --chip esp32 --port "%PORT%" erase-flash
if errorlevel 1 (
  echo.
  echo ERROR: No se pudo comunicar con %PORT%.
  echo Cierra el Monitor Serial y verifica que el ESP32 este en ese puerto.
  echo Si es necesario, manten presionado BOOT mientras inicia la conexion.
  pause
  exit /b 1
)

echo.
echo [2/2] Instalando firmware y los 61 audios...
%ESPTOOL_CMD% --chip esp32 --port "%PORT%" --baud 460800 ^
  write-flash --flash-mode dio --flash-size 4MB ^
  0x1000 bootloader.bin ^
  0x8000 partitions.bin ^
  0x10000 firmware.bin ^
  0x210000 littlefs.bin

if errorlevel 1 (
  echo.
  echo ERROR: Fallo la escritura del firmware.
  echo No desconectes nada hasta revisar el mensaje anterior.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo   INSTALACION COMPLETADA
echo ============================================================
echo.
echo Desconecta y vuelve a conectar el ESP32 si no reinicia solo.
echo Debes escuchar los dos tonos de autoprueba.
echo.
echo PINES:
echo   START     GPIO33 - boton - GND
echo   MODE      GPIO14 - boton - GND
echo   PADS/OK   GPIO13 - boton - GND
echo   RESET     GPIO17 - boton - GND
echo   SHOCK     GPIO32 - boton - GND
echo.
pause
exit /b 0
