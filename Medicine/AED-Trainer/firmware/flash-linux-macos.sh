#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 /dev/ttyUSB0"
  exit 2
fi

PORT="$1"

echo
echo "Educational AED trainer - FIRST FLASH"
echo "Target: ESP32-WROOM-32, 4 MB"
echo "Port: $PORT"
echo

python3 -m esptool --chip esp32 --port "$PORT" erase-flash

python3 -m esptool --chip esp32 --port "$PORT" --baud 460800   write-flash --flash-mode dio --flash-size 4MB   0x1000 bootloader.bin   0x8000 partitions.bin   0x10000 firmware.bin   0x210000 littlefs.bin

echo
echo "Flash complete. Reset/reconnect the ESP32 if it does not restart automatically."
