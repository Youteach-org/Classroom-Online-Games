# AED local voice pack

The physical trainer plays all required speech from **internal LittleFS flash**. No Wi-Fi, mobile data, SD card, or streamed audio is required during a training session.

## Voices

- **AED device:** female Latin-American Spanish, HeyGen voice `fWZozqyB99JyQDYA98eg`, speed 1.05.
- **Paramedic companion:** male Spanish voice `050c403a43e047c796f8a6257ed2533e`, speed 1.02.

The 61 development clips were generated after the two audition clips were approved. The full source set is recorded in `audio-sources.generated.json`.

## Flash format

The source WAVs are converted consistently to:

- WAV IMA-ADPCM
- mono
- 10,000 Hz
- 4-bit ADPCM
- stored under `audio/assets/`

10 kHz was selected for the current 4 MB ESP32-WROOM bench unit because the complete 287-second voice set is too large as PCM16. The final ESP32-S3 can use a higher-rate rebuild later without changing prompt IDs or the `AudioPlayer` API.

The WROOM build uses a no-OTA custom partition with a larger LittleFS region. Audio pack budget: **1,750,000 bytes**.

## Build-time vs runtime

Internet is used only when preparing/updating the voice assets. The generated files are committed to the firmware branch and copied into LittleFS for the device. Runtime remains fully offline and BLE-only.

## Verification

Run:

```bash
python Medicine/AED-Trainer/audio/tools/verify-audio-pack.py
```

The verifier fails if a prompt file is missing/extra, the WAV format is wrong, or the package exceeds the documented flash budget.

All medical dialogue remains marked for course/release review in `prompt-script.json`.
