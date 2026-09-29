# DEA V10 — ESP32-WROOM-32

V10 incluye:

- arranque guiado por acciones del alumno: respuesta, solicitud de ayuda, respiración, exposición del pecho y colocación de electrodos;
- **PADS / OK** confirma cada paso del arranque; el DEA ya no avanza esos pasos por tiempo;
- análisis automático sólo después de confirmar la colocación de electrodos;
- triángulos de advertencia parpadeantes durante la espera de descarga;
- RCP de 2 minutos completos: la pantalla permanece en **2:00** mientras se reproduce la instrucción y el conteo comienza sólo cuando termina la voz;
- metrómetro de 110/min activo únicamente durante el ciclo real de RCP;
- al terminar los 2:00, el entrenador detiene el ciclo y pasa a nuevo análisis;
- los ciclos posteriores usan la indicación de continuar RCP;
- `AED_BEGIN_CPR` usa la toma aprobada de Lucía para pronunciar **“Inicie ERRE CE PE”**;
- ECG educativo simulado;
- Teacher Monitor opcional por BLE;
- instalador de Windows con `esptool.exe` incluido.

## Windows

1. Descomprime todo `DEA-V10.zip`.
2. Conecta el ESP32.
3. Cierra Arduino Serial Monitor.
4. Ejecuta `INSTALAR-V10.bat`.
5. Escribe el puerto, por ejemplo `COM9`.
6. Escribe `S` para instalar.

El instalador escribe:

| Offset | Archivo |
|---:|---|
| 0x1000 | bootloader.bin |
| 0x8000 | partitions.bin |
| 0x10000 | firmware.bin |
| 0x210000 | littlefs.bin |

## Flujo local

`START → respuesta → ayuda → respiración → descubrir pecho → electrodos → análisis`

Los pasos del alumno avanzan con **PADS / OK**. El análisis, la resolución del ritmo y el reanálisis son acciones internas del DEA. Si se recomienda descarga, el equipo espera el botón físico **SHOCK**.

Después de la indicación de RCP, el cronómetro inicia en **2:00 completos** sólo cuando termina el audio. Al llegar a **0:00**, el ciclo se detiene y comienza el nuevo análisis.

Este dispositivo es un entrenador educativo; no analiza ECG real ni produce descarga terapéutica.
