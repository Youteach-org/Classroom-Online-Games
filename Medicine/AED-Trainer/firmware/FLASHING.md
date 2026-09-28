# DEA V9 — ESP32-WROOM-32

V9 incluye:

- RCP de 2 minutos antes de cada nuevo análisis de ritmo;
- pronunciación de RCP como "erre ce pe" usando la misma voz femenina latinoamericana aprobada;
- texto de la zona azul más grande, centrado y con palabras completas; solo reduce el tamaño en las líneas que realmente lo necesitan;
- encabezados de la franja amarilla conservados en su tamaño actual;
- ECG educativo simulado;
- audio optimizado para salón;
- Teacher Monitor opcional por BLE;
- instalador de Windows con `esptool.exe` incluido.

## Windows

1. Descomprime todo `DEA-V9.zip`.
2. Conecta el ESP32.
3. Cierra Arduino Serial Monitor.
4. Ejecuta `INSTALAR-V9.bat`.
5. Escribe el puerto, por ejemplo `COM9`.
6. Escribe `S` para instalar.

El instalador escribe:

| Offset | Archivo |
|---:|---|
| 0x1000 | bootloader.bin |
| 0x8000 | partitions.bin |
| 0x10000 | firmware.bin |
| 0x210000 | littlefs.bin |

## Flujo de RCP

Después de una descarga simulada, el DEA ordena reanudar RCP inmediatamente y mantiene el ciclo durante 2:00. Al terminar los dos minutos, pausa para un nuevo análisis de ritmo. El reanálisis no debe ocurrir antes de finalizar ese ciclo.

Este dispositivo es un entrenador educativo; no analiza ECG real ni produce descarga terapéutica.
