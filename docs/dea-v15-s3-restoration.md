# Restitución DEA V15 para ESP32-S3 — 25 octubre 2026

## Objetivo
Restaurar **V15 completa** como fuente única del firmware del simulador educativo y adaptarla a la placa morada ESP32-S3 N8R2; conservar las 32 ilustraciones, música de RCP, audio de voz y descarga aprobados, escenarios A1–A8 / T0–T8 / C0–C16 y Teacher Monitor BLE.

## Hallazgo
El instalador publicado como `DEA_Actualizador_Permanente.exe` empaquetó otra implementación (`DEA/firmware/DEA_Programa_Completo.ino`, rama `medicine-aed`) con 19 voces y pantallas simplificadas. Esa no era una continuación de V15.

## Contrato de hardware (ESP32-S3)
- TFT ST7735 160×128: RST8, DC9, CS10, MOSI11, SCLK12.
- MAX98357A I²S: BCLK15, LRC16, DIN17. GAIN a GND, SD a 3V3.
- Tres pulsadores a GND: MENU GPIO4, OK GPIO5, SHOCK GPIO18.
- MENU: elegir escenario cuando el DEA está listo; durante caso, repetir la última indicación.
- OK: iniciar caso cuando está listo; confirmar pasos/parches cuando está activo.
- MENU+OK durante 3 s: reiniciar caso, sin enviar acciones individuales involuntarias.
- SHOCK: únicamente cuando el escenario solicita descarga simulada.
- Encendido/apagado mediante interruptor físico de alimentación.

## Invariantes
- Sin Internet, firmware y Teacher Monitor local autónomos. Ninguna descarga durante instalación en Windows ni al iniciar dispositivo.
- Audio al 100% al reiniciar; Teacher Monitor puede ajustar 0–100% sin persistir reducción tras reinicio.
- No reemplazar audios aprobados por pitidos sintéticos; fallback sólo si falta recurso.
- Preservar 32 assets del archivo `display-assets.dat` y `rcp-music.wav` en LittleFS.
- Mantener el flujo de eventos clínicos, estado BLE, ayudas y restricciones de descarga, sin regresiones.
- Solo ESP32-S3 con tamaño real de flash 8 MB; no grabar el binario antiguo para WROOM.
- No publicar el instalador estable hasta obtener compilación, pruebas de lógica, inspección de contenido de LittleFS y smoke test de Windows. La salida física necesita validación posterior en la placa.

## Enfoque
Portar `Medicine/AED-Trainer/firmware/aed-trainer` desde `release/dea-v15` con cambios mínimos de hardware/control/volumen. Usar CI para construir firmware + LittleFS + imagen flash completa y distribuir en un único EXE offline. Mantener el archivo estable actual intacto hasta terminar validaciones, en rama aislada `fix/dea-v15-s3-restore-20261025`.
