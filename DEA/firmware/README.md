# DEA educativo ESP32-S3 — firmware de tres botones

Esta carpeta contiene el firmware del simulador físico DEA, en la rama de desarrollo `medicine-aed`. **No es un desfibrilador médico:** no genera descargas eléctricas reales y nunca debe utilizarse para diagnóstico, tratamiento ni atención de emergencias.

## Plataforma actual (octubre de 2026)
ESP32-S3 N8R2; ST7735 (RST 8, DC 9, CS 10, MOSI 11, CLK 12); amplificador I2S MAX98357A (BCLK 15, LRC 16, DIN 17); botones MENÚ GPIO4, OK GPIO5 y SHOCK GPIO18, cada uno a GND. MENÚ+OK mantenidos 3 s reinician. La TFT indica las funciones de los botones. Volumen inicial 100%; Teacher Monitor puede cambiarlo mediante BLE.

## Archivos
- `manifest.json`: versión y SHA-256 de cada archivo para el actualizador permanente.
- `DEA_Programa_Completo.ino`: programa principal.
- `Voz_0.h` a `Voz_18.h`: datos de audio integrados. Los 20 archivos del manifiesto deben estar juntos al compilar.

## Estado de validación
Fuente trasladada desde la versión de tres botones que se creó en ChatGPT. **No compilada ni probada en la placa física en este proceso.** En versiones anteriores la TFT dejó de mostrar imagen, por lo que se requiere prueba de pantalla y audio antes de darla por terminada.

La documentación histórica de septiembre en `docs/superpowers/decisions/2026-09-24-medicine-aed-trainer.md` menciona ESP32-WROOM32 y OLED; **el hardware de esta versión de octubre cambió a ESP32-S3 y TFT ST7735 por las decisiones posteriores del usuario**. No se altera el simulador web ni la rama `main`.
