# Flashing the AED trainer — ESP32-WROOM-32

This package is for the **current 4 MB ESP32-WROOM-32 bench prototype**.

It contains:

- `bootloader.bin`
- `partitions.bin`
- `firmware.bin`
- `littlefs.bin` — the 61 local AED/paramedic voice clips
- Windows and Linux/macOS flashing scripts
- SHA-256 checksums

The flash layout is fixed by the project's current `partitions.csv`:

| Offset | File |
|---:|---|
| `0x1000` | `bootloader.bin` |
| `0x8000` | `partitions.bin` |
| `0x10000` | `firmware.bin` |
| `0x210000` | `littlefs.bin` |

## Before flashing

Use the working ESP32-WROOM-32 board with its USB connection. The TFT, MAX98357A and SHOCK button may remain connected using the documented bench wiring.

Install Python 3 and esptool once:

### Windows

```bat
py -m pip install --upgrade esptool
```

### Linux / macOS

```bash
python3 -m pip install --upgrade esptool
```

## Windows

Open a terminal in the extracted package folder and run, replacing `COM5` with the board's actual port:

```bat
flash-windows.bat COM5
```

## Linux / macOS

Replace `/dev/ttyUSB0` with the actual serial device:

```bash
./flash-linux-macos.sh /dev/ttyUSB0
```

The first-flash scripts deliberately erase the complete 4 MB flash before writing the new bootloader, partition table, firmware and LittleFS image. This avoids leaving an incompatible old partition layout behind.

## Expected first boot

The provisional TFT should show the idle Teacher Monitor/Bluetooth message. If LittleFS mounts correctly the serial monitor prints `AUDIO_FS_READY`. If the filesystem is unavailable, the trainer remains functional and displays text, but it does **not** auto-format or silently erase the audio partition.

After flashing, continue with:

1. `BENCH-ACCEPTANCE.md`
2. `../REAL-DEVICE-ACCEPTANCE.md`

Do not merge the hardware PR as released until those physical checks pass.
