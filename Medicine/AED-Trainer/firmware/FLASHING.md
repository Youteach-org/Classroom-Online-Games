# Instalación del DEA educativo — ESP32-WROOM-32

Este paquete corresponde al prototipo actual con **ESP32-WROOM-32 de 4 MB**.

Incluye el firmware completo y los 61 audios locales. El DEA funciona de forma autónoma; Teacher Monitor es opcional por Bluetooth.

## Conexiones actuales

### OLED SSD1306 bicolor 128x64

- VCC → 3V3
- GND → GND
- SDA → GPIO21
- SCL → GPIO22
- dirección I2C → 0x3C

### MAX98357A

- VIN → VIN/5V
- GND → GND
- DIN → GPIO25
- LRC/WS → GPIO26
- BCLK → GPIO27
- SD → 3V3
- GAIN → GND para 12 dB si se desea mayor volumen
- bocina únicamente entre SPK+ y SPK−

### Botones

Todos son pulsadores momentáneos entre GPIO y GND; el firmware usa INPUT_PULLUP.

- START → GPIO33
- MODE → GPIO14
- PADS/OK → GPIO13
- RESET → GPIO17
- SHOCK → GPIO32

## Instalación en Windows

1. Descomprime todo el ZIP en una carpeta.
2. Cierra Arduino Serial Monitor, VS Code y cualquier programa que esté usando el puerto del ESP32.
3. Ejecuta `flash-windows.bat`.
4. Escribe el puerto, por ejemplo `COM9`.
5. Confirma con `S`.

El instalador borra la flash y escribe automáticamente:

| Offset | Archivo |
|---:|---|
| 0x1000 | bootloader.bin |
| 0x8000 | partitions.bin |
| 0x10000 | firmware.bin |
| 0x210000 | littlefs.bin |

## Primer arranque esperado

Al encender:

1. Deben escucharse dos tonos de autoprueba.
2. La OLED muestra el DEA listo.
3. MODE selecciona A1–A8.
4. START inicia el caso.
5. El DEA se detiene en colocación de electrodos hasta pulsar PADS/OK.
6. Durante análisis se muestra un ECG educativo simulado.
7. Si procede descarga, aparecen triángulos de advertencia y el equipo espera SHOCK.
8. Durante RCP la OLED muestra el cronómetro 02:00 → 00:00 y el metrónomo funciona a 110/min.
9. Después de los dos minutos se realiza el siguiente análisis.

El ECG es exclusivamente una representación didáctica del escenario. No analiza un paciente real ni determina clínicamente una descarga.
