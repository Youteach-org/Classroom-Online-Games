@echo off
setlocal

if "%~1"=="" (
  echo Usage: flash-windows.bat COM5
  exit /b 2
)

set PORT=%~1

echo.
echo Educational AED trainer - FIRST FLASH
echo Target: ESP32-WROOM-32, 4 MB
echo Port: %PORT%
echo.

py -m esptool --chip esp32 --port %PORT% erase-flash
if errorlevel 1 exit /b %errorlevel%

py -m esptool --chip esp32 --port %PORT% --baud 460800 ^
  write-flash --flash-mode dio --flash-size 4MB ^
  0x1000 bootloader.bin ^
  0x8000 partitions.bin ^
  0x10000 firmware.bin ^
  0x210000 littlefs.bin

if errorlevel 1 exit /b %errorlevel%

echo.
echo Flash complete. Reset/reconnect the ESP32 if it does not restart automatically.
