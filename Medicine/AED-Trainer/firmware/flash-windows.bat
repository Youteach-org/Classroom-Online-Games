@echo off
setlocal EnableExtensions
title V15

cd /d "%~dp0"

echo ============================================================
echo   V15
echo ============================================================
echo.
echo Cierra Arduino Serial Monitor antes de continuar.
echo.

for %%F in (esptool.exe bootloader.bin partitions.bin firmware.bin littlefs.bin) do (
  if not exist "%%F" (
    echo ERROR: Falta %%F.
    echo Descomprime TODO V15.zip en una carpeta.
    pause
    exit /b 1
  )
)

echo Escribe el puerto del ESP32.
echo Ejemplo: COM9
echo Tambien puedes escribir solamente 9.
echo.
set /p "PORT=Puerto COM: "

if "%PORT%"=="" (
  echo ERROR: No escribiste un puerto.
  pause
  exit /b 1
)

if /i not "%PORT:~0,3%"=="COM" set "PORT=COM%PORT%"

echo.
echo Puerto: %PORT%
set /p "CONFIRM=Escribe S para instalar V15: "
if /i not "%CONFIRM%"=="S" (
  echo Cancelado.
  pause
  exit /b 0
)

echo.
echo [1/2] Borrando flash...
"%~dp0esptool.exe" --chip esp32 --port "%PORT%" erase-flash
if errorlevel 1 (
  echo.
  echo ERROR: No se pudo abrir %PORT%.
  echo Cierra Arduino Serial Monitor y verifica el puerto.
  echo Si el ESP32 no entra en modo carga, manten BOOT presionado
  echo mientras comienza la conexion.
  pause
  exit /b 1
)

echo.
echo [2/2] Instalando V15...
"%~dp0esptool.exe" --chip esp32 --port "%PORT%" --baud 460800 ^
  write-flash --flash-mode dio --flash-size 4MB ^
  0x1000 bootloader.bin ^
  0x8000 partitions.bin ^
  0x10000 firmware.bin ^
  0x210000 littlefs.bin

if errorlevel 1 (
  echo.
  echo ERROR: Fallo la escritura.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo   V15 INSTALADA
echo ============================================================
echo.
echo Si el ESP32 no reinicia solo, desconecta y vuelve a conectarlo.
echo Debes escuchar los dos tonos de autoprueba.
echo.
pause
exit /b 0
