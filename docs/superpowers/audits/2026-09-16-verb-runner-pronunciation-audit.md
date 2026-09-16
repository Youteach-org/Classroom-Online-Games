# Verb Runner pronunciation audit — 2026-09-16

**Status:** Active manual review  
**Manifest snapshot:** `7c060dfbe17813357135ac61943ece0c4bdb6feb`  
**Total manifest entries:** 431

Reference numbers below are the alphabetical positions in this manifest snapshot.

## User-reported problems

| Ref | Manifest key | Current asset | Reported problem | Status |
|---:|---|---|---|---|
| 15 | `at 11 tonight` | `at-11-tonight-7affdb84dc.wav` | File/audio error; does not play correctly or appears corrupt. | Pending replacement |
| 16 | `ate` | `ate-189b7ea01f.wav` | Sounds like “great” rather than “ate”. | Pending replacement |
| 17 | `be` | `be-986b1bc1eb.wav` | Sounds like literal spelling/name rather than English verb /biː/. | Pending replacement |
| 20 | `became` | `became-51a675c807.wav` | Sounds approximately “bequeim”; pronunciation is distorted/incorrect. | Pending replacement |
| 33 | `bitten` | `bitten-090ef54998.wav` | Sounds approximately “betten”. | Pending replacement |
| 61 | `change` | `change-7550b672e1.wav` | Sounds approximately “kchain”; initial/final pronunciation is incorrect. | Pending replacement |
| 62 | `changed` | `changed-37c6c57bed.wav` | Sounds approximately “kchaincht”; pronunciation is distorted/incorrect. | Pending replacement |
| 127 | `fought` | `fought-1b04bf3ef0.wav` | Previously reported as sounding like “fault” / otherwise incorrect. | Pending confirmation/replacement |

## Audit rule

Do not silently regenerate reported items with a legacy voice. When replaced, use the locked Verb Runner production voice **Nichalia** (`XfNU2rGpBa01ckF309OY`) and update the pronunciation manifest/policy tests accordingly.

When the numbered review HTML produces additional reports, append them here using the current manifest reference number plus the manifest key so later edits remain unambiguous.
