# Handoff — Medicine / AED Educational Trainer

Date: 2026-09-24
Branch: `medicine-aed`

## User intent

Create a low-cost educational AED trainer for first-aid teaching using an ESP32 with spoken instructions, and create a Medicine branch/section inside Classroom Online Games with an interactive AED interface and a root access card. Do not put it on main until it is ready.

## Current implementation

Created on branch `medicine-aed`:
- `Medicine/index.html`
- `Medicine/AED-Trainer/index.html`
- `Medicine/AED-Trainer/README.md`
- Superpowers plan/decision/handoff docs

The web AED prototype implements:
- power on/reset
- two simulated pad connections
- instructor-selectable shockable/non-shockable scenario
- analysis state
- shock-advised path
- no-shock path
- simulated SHOCK button
- CPR state
- browser voice prompts
- event log
- explicit simulation-only warning

## Safety invariant

Never add high-voltage charging/discharge hardware or real-patient ECG interpretation to this project. This is a classroom trainer.

## Next implementation work

1. Update the root `index.html` on this branch with the Medicine card.
2. Bench hardware prototype: ESP32-S3 + MAX98357A + speaker + microSD.
3. Freeze exact purchased board/display models before final pinout.
4. Create firmware skeleton and state machine.
5. Record/review final Spanish prompt script.
6. Build Web Serial status bridge.
7. Test branch preview.
8. Merge only after user acceptance.

## Hardware recommendation

See `Medicine/AED-Trainer/README.md` for BOM, provisional GPIO mapping, prompt filenames and definition of done.
