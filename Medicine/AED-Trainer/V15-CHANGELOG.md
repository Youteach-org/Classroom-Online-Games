# V15

## Cambios de firmware

- Firmware BLE reportado como `0.15.0`.
- El arranque local sigue siendo independiente de la inicialización BLE para evitar que el equipo permanezca en **INICIANDO** si Bluetooth tarda o falla.
- Se conserva la protección que impide volver a cargar/iniciar un caso mientras ya hay uno activo.
- Movimiento/artefacto bloquea la resolución del análisis, muestra la advertencia correspondiente en OLED y al retirarlo reinicia el intervalo completo de análisis.

## Audio

- Se conserva la voz principal del DEA ya aprobada (`fWZozqyB99JyQDYA98eg`). No se sustituyó por otra voz.
- Se conserva la toma aprobada de Lucía para **“Inicie ERRE CE PE”** y el híbrido aprobado para **“Continúe … ERRE CE PE”**.
- Se agregaron dos prompts que faltaban en el arranque, generados con la misma voz principal aprobada:
  - `AED_CHECK_RESPONSE`: “Compruebe si el paciente responde.”
  - `AED_CHECK_BREATHING`: “Compruebe la respiración.”
- El metrónomo de RCP mantiene I2S abierto durante el ciclo en vez de reinicializar el periférico en cada pulso.
- Cadencia de RCP: **104/min**. El primer pulso ocurre después de terminar la instrucción de RCP y el ciclo dura 2:00 completos.
- Diagnóstico Serial del metrónomo: `RCP_METRONOME_READY`, `RCP_METRONOME_INIT_FAIL`, `RCP_BEAT_OK`, `RCP_BEAT_FAIL`, `RCP_METRONOME_STOP`.
- La descarga ya no usa el efecto sintético del pipeline ni el sample embebido anterior. `playShockBuzz()` reproduce `/audio/fx-shock-electric.wav`, derivado de los primeros 0.3 s del archivo proporcionado por el usuario.
- Diagnóstico Serial de descarga: `SHOCK_AUDIO_OK` / `SHOCK_AUDIO_FAIL`.

## OLED

- Todos los títulos/textos de la franja amarilla se centran horizontalmente mediante una única función de encabezado.
- Esto incluye estados normales, **DESCARGA** y `RCP 104/min`.
- La zona azul conserva las instrucciones y tamaños ya aprobados.

## Teacher Monitor / DAR PISTA

- Se corrigió la causa por la que **DAR PISTA** aparecía visible pero desactivado en casos base `T0/C0`.
- Las pistas específicas de twist/condición clínica siguen teniendo prioridad.
- Cuando el caso no tiene una pista específica, firmware V15 ofrece una pista general usando un prompt paramédico ya aprobado; no se introduce una voz nueva.
- La web calcula una capacidad mínima de una pista para un caso base, por lo que el botón permanece disponible mientras el caso está activo.

## Empaquetado

- Nombre de entrega: **V15** únicamente.
- Instalador Windows: `INSTALAR-V15.bat`.
- El paquete incluye bootloader, particiones, firmware, LittleFS y esptool.
- LittleFS contiene 65 archivos WAV.
- El pipeline conserva el WAV de descarga aprobado sin sustituirlo por un efecto sintético.

## Validación

La validación automatizada cubre compilación ESP32, construcción de LittleFS, contrato de audio, flujo de prompts, centrado de encabezados, movimiento, BLE y empaquetado. La validación física del volumen/sonido final requiere prueba en el entrenador real.
