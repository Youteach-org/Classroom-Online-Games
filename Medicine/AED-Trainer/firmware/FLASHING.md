# DEA V11 — ESP32-WROOM-32

V11 incluye:

- arranque guiado por acciones del alumno mediante **PADS / OK**;
- análisis automático sólo después de confirmar electrodos;
- triángulos de advertencia parpadeantes durante la espera de descarga;
- **buzz de descarga simulada** al presionar SHOCK;
- RCP de 2 minutos completos: el conteo inicia sólo después de terminar la instrucción de voz;
- **pulso rítmico de entrenamiento a 110/min** durante todo el ciclo de RCP, con patrón tipo beat/disco original para marcar la cadencia;
- `AED_BEGIN_CPR`: toma aprobada de Lucía para **“Inicie ERRE CE PE”**;
- `AED_CONTINUE_CPR`: **“Continúe”** de la voz original del DEA + **“ERRE CE PE”** recortado de la misma toma aprobada de Lucía;
- BLE activo al encender, anunciado como **AED Trainer**;
- Teacher Monitor opcional por Bluetooth LE;
- instalador de Windows con `esptool.exe` incluido.

## Windows

1. Descomprime todo `DEA-V11.zip`.
2. Conecta el ESP32.
3. Cierra Arduino Serial Monitor.
4. Ejecuta `INSTALAR-V11.bat`.
5. Escribe el puerto, por ejemplo `COM9`.
6. Escribe `S` para instalar.

## Bluetooth / Teacher Monitor

Al encender V11, el ESP32 anuncia automáticamente el servicio BLE con el nombre:

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

Después de la instrucción de RCP, el cronómetro comienza en **2:00 completos** y el beat de 110/min acompaña el ciclo hasta 0:00.

Este dispositivo es un entrenador educativo; no analiza ECG real ni produce descarga terapéutica.
