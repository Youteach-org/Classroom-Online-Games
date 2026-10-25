# DEA V15 — placa real, pinout de firmware corregido y soldadura

Fecha: 2026-10-25. Proyecto educativo, ESP32-S3 + TFT ST7735 + MAX98357A.

## Identificación recuperada de conversaciones anteriores

**Placa:** YD-ESP32-S3 morada, formato 44 pines (22 en P1 y 22 en P2), doble USB-C, módulo ESP32-S3-WROOM-1 **N8R2** (8 MB flash, 2 MB PSRAM).

Esta identificación y la referencia de imagen fueron dadas por el asistente el **14 y 19 de octubre de 2026**. Ya había sido mostrado un diagrama: no debe pedirse nuevamente al usuario una imagen de pinout sin consultar este documento.

Fuentes:
- Pinout de referencia de la conversación: https://www.espboards.dev/esp32/yd-esp32-s3/
- Fabricante VCC-GND Studio, listado oficial P1/P2: https://github.com/vcc-gnd/YD-ESP32-S3/blob/main/README.md
- [Imagen de la placa y pinout del fabricante](https://github.com/vcc-gnd/YD-ESP32-S3/blob/main/IMG/img11.jpg)

**Orientación:** con antena arriba y puertos USB-C abajo, P1 es la hilera izquierda y P2 la derecha. Si se gira 90 grados y los puertos quedan a la derecha, P1 queda abajo y P2 arriba. Para evitar confusiones, siempre mencionar P1/P2 y el **GPIO impreso**, además de izquierda/derecha.

## Distribución física oficial — 22 pines por hilera

P1, de arriba hacia abajo con USB-C abajo:

| Posición | Etiqueta GPIO/alimentación |
|---:|---|
| 1–3 | 3V3, 3V3, RST/EN |
| 4–11 | **4, 5, 6, 7, 15, 16, 17, 18** |
| 12–18 | **8, 3, 46, 9, 10, 11, 12** |
| 19–22 | **13, 14, 5V, GND** |

P2, de arriba hacia abajo con USB-C abajo:

| Posición | Etiqueta GPIO/alimentación |
|---:|---|
| 1–3 | GND, TX (GPIO43), RX (GPIO44) |
| 4–10 | **1, 2, 42, 41, 40, 39, 38** |
| 11–17 | **37, 36, 35, 0, 45, 48, 47** |
| 18–22 | **21, 20, 19, GND, GND** |

**Reservas para esta placa:** no usar GPIO35/36/37 en módulos que usan la interfaz octal interna; evitar GPIO0, GPIO45 y GPIO46 en diseño de nuevos botones/funciones (arranque/strapping, GPIO46 con limitaciones); reservar 19/20 para USB nativo, 43/44 para UART y 48 para LED RGB. GPIO39–42 también tienen función JTAG: al reasignarlos como GPIO periféricos no podrá utilizarse JTAG externo simultáneamente.

## Pinout comprobado en pantalla (EXE anterior) — no confundir con corrección pendiente

Este es el que **ya hace funcionar la pantalla física del usuario** y coincide con `firmware/aed-trainer/hardware-config.h` en la rama de restauración. **No cambiar la pantalla sin necesidad.**

| Módulo | Señal | GPIO activo | Hilera |
|---|---|---:|---|
| TFT ST7735 1.8”, 160×128 SPI | RST | **8** | P1 |
| TFT | DC/A0 | **9** | P1 |
| TFT | CS | **10** | P1 |
| TFT | DIN/MOSI/SDA SPI | **11** | P1 |
| TFT | CLK/SCL/SCK SPI | **12** | P1 |
| MAX98357A | BCLK | **15** | P1 |
| MAX98357A | LRC/WS | **16** | P1 |
| MAX98357A | DIN | **17** | P1 |
| Botón MENU | señal a GND | **4** | P1 |
| Botón OK/PADS | señal a GND | **5** | P1 |
| Botón SHOCK | señal a GND | **18** | P1 |

**Por qué se requiere revisión:** los once GPIO quedan todos en P1, incómodo para soldar en un gabinete. El hardware no obliga a que estén en la misma hilera: es una selección anterior de firmware.

Alimentación: todas las tierras deben ser comunes. Las notas históricas registran TFT VCC=5 V y BL=3V3, mientras una respuesta posterior sugería VCC=3V3; la pantalla *ya funciona* y no se comprobó aquí el VCC exacto. **Conservar la alimentación que está funcionando y verificar la serigrafía del módulo antes de soldar definitivamente; no presumir VCC.** Históricamente el MAX98357A se conectó VIN=5V, SD=3V3, GAIN=GND, GND común y SPK± a la bocina; su DIN GPIO17 se desconectó accidentalmente en una prueba y al reconectarlo el audio funcionó.

## Pinout corregido en GitHub — MAX a P2; EXE aún pendiente de validación visual

Decisión explícita: mantener los **cinco GPIO de pantalla** y los **tres botones** en P1, sin alterar cables. **Mover solo BCLK/LRC/DIN del MAX98357A** a P2. El `hardware-config.h` de esta rama ya usa GPIO42/41/40, mientras el EXE estable anterior todavía usa 15/16/17. La prueba de sonido en la placa física todavía no se ha realizado.

| Señal | GPIO actual | GPIO propuesto | Posición en hilera |
|---|---:|---:|---|
| TFT RST | 8 | **8** | P1-12 |
| TFT DC | 9 | **9** | P1-15 |
| TFT CS | 10 | **10** | P1-16 |
| TFT MOSI | 11 | **11** | P1-17 |
| TFT SCLK | 12 | **12** | P1-18 |
| MAX BCLK | 15 | **42** | P2-6 |
| MAX LRC | 16 | **41** | P2-7 |
| MAX DIN | 17 | **40** | P2-8 |
| Botón MENU | 4 | **4** | P1-4 |
| Botón OK | 5 | **5** | P1-5 |
| Botón SHOCK | 18 | **18** | P1-11 |

**Estado:** corrección realizada en código fuente, aún no desplegada al EXE estable. Se requieren tres cables de señal MAX BCLK→GPIO42 (P2-6), LRC/WS→GPIO41 (P2-7), DIN→GPIO40 (P2-8); alimentación MAX VIN=5V, SD=3V3, GAIN=GND y tierra común conservadas. **Revisar que SPK+ y SPK− se conecten a los terminales reales de la bocina.** Si se mueve el cable antes de grabar firmware con pinout P2, no habrá audio.

**Diagnóstico sin sonido:** el firmware anterior ejecuta tono de autoprueba al arrancar incluso cuando no logra montar LittleFS. `SPEAKER_SELF_TEST_OK` solo confirma escritura digital I2S, no demuestra sonido físicamente audible. Comprobar continuidad de DIN/WS/BCLK, alimentación MAX y conexiones de SPK±; los registros `AUDIO_FS_READY` y `AUDIO_MISSING` permiten distinguir archivos de cableado. No declarar el sonido corregido hasta oírlo en la placa.

## Reglas del proyecto

1. Antes de cada cambio, consultar este documento y el `hardware-config.h` efectivo de la misma versión.
2. Preservar la TFT ya funcional y el volumen inicial de audio de 100 %; **no considerar aprobados los 32 gráficos de la compilación previa**: requieren revisión de contenido/encuadre y calidad visible antes de publicación. Conservar las 65 pistas y música de RCP mientras se comprueba su funcionamiento.
3. Toda propuesta debe distinguir explícitamente pines **ACTIVOS** de pines **PROPUESTOS** y el costado físico P1/P2.
4. Registrar cambios en GitHub **antes de reemplazar el EXE estable**; verificar compilación, imagen LittleFS y vista previa de todas las pantallas. La publicación estable requiere paso manual separado para evitar desplegar imágenes rechazadas.
5. Evitar nuevas descargas de componentes en la computadora del usuario; empaquetar en GitHub Actions. Mantener EXE permanente con acceso directo.
