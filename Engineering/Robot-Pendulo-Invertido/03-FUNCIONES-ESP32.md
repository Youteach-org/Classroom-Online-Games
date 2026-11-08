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
