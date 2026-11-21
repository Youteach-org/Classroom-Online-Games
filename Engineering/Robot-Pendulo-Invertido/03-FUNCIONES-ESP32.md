# 03 — Subsistemas ESP32 y comportamiento

## 3.1 Detección de calor
**Objetivo:** identificar una fuente térmica y alejarse.
- Distinguir temperatura ambiente de temperatura aparente de un objeto; un sensor térmico de un solo punto no indica necesariamente de qué lado proviene el calor.
- Evaluar sensor IR sin contacto con campo de visión, o sensores orientados a varios sectores. Opciones concretas a comparar más adelante (por ejemplo, sensor térmico matricial frente a varios sensores direccionales).
- Integrar detección de obstáculos para elegir una ruta segura; evitar cambios de movimiento bruscos que desestabilicen.
- Definir tras pruebas umbral, distancia operativa, sensibilidad, histéresis y tiempo de reacción.

## 3.2 Silbido y seguimiento
**Objetivo:** un silbido reconocible arma/desarma el modo seguimiento.
- Micrófono adecuado y algoritmo de detección tonal: duración, banda de frecuencias, ruido ambiente y patrón temporal; no basta reaccionar a cualquier sonido fuerte.
- Evitar que los altavoces del propio robot activen el detector.
- Bluetooth BLE de teléfono: la ESP32 puede observar RSSI de anuncios BLE, pero **RSSI no proporciona dirección**. El teléfono quizá necesite una app que anuncie un identificador BLE; el comportamiento de anuncios en segundo plano depende del sistema operativo.
- Alternativas si BLE no logra seguimiento robusto: BLE solo para presencia/proximidad + orientación visual/IR, baliza dedicada o tecnología de localización apropiada. La solución final requiere pruebas con el teléfono real.
- La distancia de seguridad y el manejo de pérdida de señal deben definirse antes de movimiento autónomo.

## 3.3 Voz y sonidos
- ESP32 con captura y salida de audio, potencialmente por I2S.
- Configuración candidata: micrófono digital I2S y DAC/amplificador I2S a bocina; la compatibilidad con el modelo de ESP32 y conflictos de pines se revisará después.
- «Comunicación» puede significar intercomunicador con teléfono, comandos locales o diálogo asistido. No prometer reconocimiento/conversación de voz completa en tiempo real sin determinar la arquitectura de procesamiento.
- Considerar eco acústico, prioridad del detector de silbidos, consumo y latencia.

## 3.4 Ojos animados
**Base:** azul en modo normal; expresiones de atención, escucha, búsqueda, sorpresa, alerta y reposo a diseñar.
**Combate simulado:** ojos rojos, cejas/expresión enojada, efectos de sonido opcionales. Sin mecanismos ofensivos ni maniobras inseguras.
Pantalla candidata: TFT/IPS con interfaz SPI; fijar resolución, consumo, librería y pines tras selección.

## 3.5 Máquina de estados (propuesta)
INICIO → AUTOCOMPROBACIÓN → REPOSO / EQUILIBRADO → ESCUCHA → SEGUIMIENTO → EVASIÓN / ALERTA → REPOSO.
MODO_COMBATE_SIMULADO modifica expresión/sonidos y **no anula protecciones**.
Cualquier fallo crítico → ESTADO_SEGURO (consignas a neutro; deshabilitación de potencia según protección).

## 3.6 Protocolos por definir
- ESP32 → analógico: dos consignas analógicas limitadas (avance e intención de giro) o interfaz equivalente validada; con estado neutro por hardware.
- Analógico → ESP32: sensores de estado, fallo, caída, sobrecorriente u otras señales, sin crear dependencias.
- Teléfono ↔ ESP32: BLE para identificación/proximidad y, si se desea, Wi-Fi/BLE para configuración y audio, según restricciones reales.

## 3.7 Actualización 2026-11-15 — opciones económicas y alcance térmico
**Restricciones expresas:** no pantalla integrada costosa (~$959), no amplificador MAX98357A porque el usuario ya lo probó con DEA y resultó insuficiente, no sensor térmico montado sobre servo ni exploración móvil no acordada. La configuración base térmica es un MLX90614 **fijo frontal**, con alejamiento seguro si la temperatura aparente frontal supera el umbral definido mediante prueba. No se coloca multiplexor TCA9548A con un solo sensor.
**Candidatos por verificar:** ESP32 clásica DevKit/WROOM-32 (DAC GPIO25/26 de 8 bits) y una sola TFT color SPI 2.8” para ambos ojos; TPA3110 con bocinas de impedancia/potencia adecuadas, alimentado dentro de su rango. No alimentar el circuito de equilibrio desde la ESP32. No afirmar que un sensor frontal cubre calor lateral/trasero o que BLE RSSI aporta rumbo.

## 2026-11-21 — Comparación ESP32 clásico/C3/S3 del DEA
**Consulta del usuario:** diferencias entre ESP32 genérico, ESP32-C3 y la placa morada utilizada previamente en el proyecto DEA. El hardware documentado del DEA es **ESP32-S3 N8R2, placa morada**, junto con TFT ST7735 y MAX98357A I²S. No confundir el nombre de color «morada» con el fabricante Murata sin identificación adicional.
- **ESP32 clásico (WROOM-32 de dos núcleos):** 240 MHz, 520 KB RAM, BLE y Bluetooth Classic, **dos DAC internos de 8 bits en GPIO25/26**, I²S. Sencillo para usar salida analógica al TPA3110; calidad limitada por DAC de 8 bits, filtrado e interferencia.
- **ESP32-C3:** un núcleo RISC-V hasta 160 MHz, BLE 5 y Wi-Fi, **sin Bluetooth Classic ni DAC analógico**, con I²S, menos GPIO/recursos que S3. No es opción prioritaria para pantalla+audio+BLE+sensors de EVA.
- **ESP32-S3 N8R2:** dos núcleos LX7 hasta 240 MHz, **8 MB de flash y 2 MB de PSRAM** del módulo N8R2, BLE 5 y Wi-Fi, I²S, USB nativo; **sin DAC analógico integrado ni Bluetooth Classic**. Apropiada para ojos/audio/procesado de silbidos. **Para conectar TPA3110 de entrada analógica se necesita DAC I²S externo**, por ejemplo PCM5102A, o una salida PWM filtrada con calidad inferior y verificación. No conectar I²S digital directamente a entrada analógica de TPA3110.
- El equilibrio de EVA **sigue siendo analógico independiente**; escoger ESP32-S3 nunca significa cambiar ese requisito.
- La dirección de una baliza BLE no se obtiene con RSSI por sí sola, con ningún modelo de ESP32.
**Decisión de modelo para EVA:** todavía **pendiente** según hardware disponible, coste y pinout. Usar S3 N8R2 si ya hay una placa libre y DAC de audio externo aceptable; usar WROOM-32 si se quiere minimizar coste y conservar DAC integrado. No recomendar C3 para esta combinación.
Fuentes: https://docs.espressif.com/projects/esp-idf/en/v5.0/esp32/hw-reference/chip-series-comparison.html ; https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/peripherals/dac.html ; https://docs.espressif.com/projects/esp-idf/en/v5.1/esp32s3/hw-reference/esp32s3/user-guide-devkitc-1.html .

## 2026-11-21 — Capacidad real necesaria y nueva secuencia ADC → PWM planteada por el usuario
**Pregunta nueva del usuario:** la ESP32 recibiría señal analógica del sensor de equilibrio, calcularía la corrección y produciría PWM para los motores, además de sensores, BLE, ojos y audio. **Esto es un planteamiento de arquitectura actualizado que entra en tensión con el requisito original R-02 (equilibrio completamente analógico independiente); no debe alterarse R-02 sin confirmar que se sustituye.**

### Conclusión de dimensionamiento
- La carga numérica de leer ADC, ejecutar PD/PID y actualizar mandos de dos motores es **pequeña** para ESP32 original de dos núcleos a 240 MHz y también para ESP32-S3 dual-core a 240 MHz. No se afirma porcentaje de CPU sin perfilar firmware.
- Prototipar lazo de control determinista **200–500 Hz**, que equivale a períodos de **5–2 ms**; aumentar tras medir latencia/estabilidad, no asumir tasa definitiva. PWM de potencia **15–20 kHz** como intervalo candidato para ruido acústico, generado autónomamente por periférico **MCPWM/LEDC**, no con interrupciones de software a cada pulso.
- Para el S3, usar **ADC1** calibrado, preferir muestras temporizadas, filtro de ruido de motor y referencia de sensor; ADC continuo ofrece DMA, evita acoplar tiempo de lectura al bucle principal. PWM de motor mediante MCPWM con protección de fallo, y valores límite. Habilitación de puentes H y paro de emergencia independientes del software.
- **Prioridad software si se acepta control digital:** tarea de control muy alta prioridad con tiempo acotado, estado de control en RAM interna; periférico MCPWM hardware. Tareas pantalla/sonido/BLE prioridad menor, buffers en PSRAM cuando disponible; medir jitter y peores tiempos mientras Wi-Fi/BLE/audio están activos.
- **Imagen TFT 320×240 RGB565:** framebuffer completo ~153,600 B (150 KiB), doble ~300 KiB, más librerías, BLE y audio. Se pueden usar bandas/buffers parciales para ahorrar RAM. Audio mono 16-bit a 16 kHz consume **32 kB/s** de buffer bruto; reconocimiento de voz complejo local o streaming puede requerir recursos externos. ESP32-S3 N8R2 con **8 MB flash / 2 MB PSRAM** aporta margen útil para interfaz/sonidos; CPU no es el cuello de botella del equilibrio.
- **ESP32 clásica WROOM-32:** capacidad suficiente para una versión económica con ojos dibujados, tonos/grabaciones cortas, silbido, BLE, termómetro, sensor de distancia y control digital; trae DAC de 8 bits para salida analógica al TPA3110. La S3 **no incluye DAC analógico**: para amplificador TPA3110 usar DAC I²S externo (por ejemplo PCM5102A) o alternativa de menor fidelidad probada.
- **Selección provisional:** ESP32 WROOM-32 original suficiente para MVP; **S3 N8R2 preferible cuando ya está disponible o queremos más margen para pantalla, búfer de audio y BLE**, nunca por necesidad de hacer un PID.
- **Diferencia del control:** (a) Señal analógica de acelerómetro/giroscopio → ADC → PID de la ESP32 → PWM → puente H **es control digital** (depende de la ESP32); (b) señal de sensor → filtro/compensador analógicos → modulador analógico → puente H, con ESP32 solo para consignas, es el diseño original **analógico independiente**. Nunca afirmar que ambos equivalen ni modificar el requisito original sin acuerdo.
- **Sensores:** una sola lectura de inclinación sin velocidad angular confiable y sin filtrado dinámico no es un lazo de equilibrio suficiente; validar acelerómetro/giroscopio, polaridad y calibración.
Fuentes Espressif: https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/api-reference/peripherals/adc/adc_continuous.html ; https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/api-reference/peripherals/mcpwm.html ; https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s3/esp32-s3-devkitc-1/user_guide_v1.1.html ; https://docs.espressif.com/projects/esp-idf/en/v5.0/esp32/hw-reference/chip-series-comparison.html
