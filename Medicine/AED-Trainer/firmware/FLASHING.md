# V15 — ESP32-WROOM-32

V15 incluye:

- arranque guiado por acciones del alumno mediante **PADS / OK**;
- análisis automático sólo después de confirmar electrodos;
- triángulos de advertencia parpadeantes durante la espera de descarga;
- **efecto de descarga tomado exclusivamente del sonido aprobado del usuario**, sin sustituirlo por un efecto sintético;
- RCP de 2 minutos completos: el conteo inicia sólo después de terminar la instrucción de voz;
- **ritmo audible de RCP a 104/min** con sesión I2S persistente; el ESP32 registra `RCP_BEAT_OK` / `RCP_BEAT_FAIL` por Serial;
- `AED_BEGIN_CPR`: toma aprobada de Lucía para **“Inicie ERRE CE PE”**;
- `AED_CONTINUE_CPR`: **“Continúe”** de la voz original del DEA + **“ERRE CE PE”** recortado de la misma toma aprobada de Lucía;
- títulos de la franja amarilla del OLED centrados horizontalmente;
- movimiento/artefacto visible durante análisis y bloqueo del resultado hasta retirarlo;
- BLE activo al encender, anunciado como **AED Trainer**;
- Teacher Monitor opcional por Bluetooth LE;
- instalador de Windows con `esptool.exe` incluido.

## Windows

1. Descomprime todo `DEA-V15.zip`.
2. Conecta el ESP32.
3. Cierra Arduino Serial Monitor.
4. Ejecuta `INSTALAR-V15.bat`.
5. Escribe el puerto, por ejemplo `COM9`.
6. Escribe `S` para instalar.

## Bluetooth / Teacher Monitor

Al encender V15, el ESP32 anuncia automáticamente el servicio BLE con el nombre:

`AED Trainer`

No es necesario emparejarlo previamente desde Ajustes de Bluetooth.

1. En Android, abre el Teacher Monitor en Chrome/Chromium.
2. En iPhone/iPad, abre el Teacher Monitor en Bluefy.
3. Pulsa **CONECTAR DEA**.
4. Selecciona **AED Trainer**.
5. Cuando el estado muestre **BLE LISTO**, ya puedes cargar casos, forzar el próximo análisis, introducir fallas, pausar/reanudar y usar las pistas del compañero paramédico.

El entrenador continúa funcionando localmente aunque se desconecte Bluetooth.

## Flujo local

`START → respuesta → ayuda → respiración → descubrir pecho → electrodos → análisis`

Los pasos del alumno avanzan con **PADS / OK**. Si se recomienda descarga, el equipo espera el botón físico **SHOCK**.

Después de la instrucción de RCP, el cronómetro comienza en **2:00 completos** y el beep de 104/min acompaña el ciclo hasta 0:00.

Este dispositivo es un entrenador educativo; no analiza ECG real ni produce descarga terapéutica.
