# Audios RCP aprobados — no sustituir

El usuario escuchó y aprobó estas tomas el 26 de octubre de 2026:

- `13-lucia-inicie-rcp.mp3`: original íntegro de Lucía, «Inicie erre-ce-pe».
- `14-continue-rcp-lucia.mp3`: «Continúe» original, 0,070 s de pausa, y «erre-ce-pe» de Lucía. Es exactamente la muestra número 14 que se publicó para revisión y después fue aprobada.

`audio-sources.generated.json` señala ambos como `approvedSource`. El generador da prioridad a esos archivos locales, nunca a su URL histórica. No regenerar ni sustituir estas voces sin nueva aprobación.

Los dos `.wav` de `audio/assets/` usan WAV IMA-ADPCM mono, 10 kHz para LittleFS. La reproducción en el hardware sigue pasando por `AudioPlayer` y los IDs de indicación existentes (`AED_BEGIN_CPR` y `AED_CONTINUE_CPR`).
