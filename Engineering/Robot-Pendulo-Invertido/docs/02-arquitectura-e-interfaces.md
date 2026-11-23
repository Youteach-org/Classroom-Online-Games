# 02 — Arquitectura funcional e interfaces

**Estado:** propuesta de partición funcional, **no** esquema eléctrico definitivo.

## Vista general

\`\`\`text
 [MPU6050 GY-521: aceleración + velocidad angular, I²C]
                          |
                          v
 [ESP32-S3: lectura, estimación del ángulo y error]
                          |
                          v
 [MCP4728 candidato: conversión digital→analógica]
                          |
                          v
 [Acondicionamiento de E(t), referencia y offset]
                          |
                          v
 [PID ANALÓGICO con TL084CN: P + I + D y suma]
                          |
                          v
 [U(t)→PWM analógico + decisión de sentido]
                          |
                          v
 [Driver puente H de dos motores, modelo por validar]
                          |
                 [Dos ruedas / robot]

 [Calor, proximidad, micrófono y BLE] → [ESP32-S3]
 [ESP32-S3] → [Pantalla y bocinas]
\`\`\`

El dibujo define **responsabilidades**, no afirma que el mezclador o acondicionamiento ya estén diseñados.

## A. Subsistema de equilibrio: adquisición digital y PID analógico (D-014)

- El profesor autorizó el 2026-11-22 que la ESP32-S3 lea el **MPU6050/GY-521** por I²C y estime el ángulo a partir de acelerómetro y giroscopio. Esta medición requiere software, pero el cálculo **PID** permanece en hardware analógico.
- El DAC externo **MCP4728** es candidato para obtener E(t), porque ESP32-S3 carece de DAC integrado. Se determinarán escala, referencia, offset, rango de voltaje, frecuencia de actualización y filtrado antes de cablear el TL084CN.
- El **TL084CN** alimentado con ±12 V implementará etapas P, I y D y sumador. Sus ganancias, antienrollamiento, filtrado derivativo, protección y polaridades requieren cálculo y ensayo.
- La tensión U(t) del PID se convertirá en PWM mediante circuito analógico; validar sentido de giro, tipo de driver y señales de habilitación según su ficha.
- Ante falla de I²C, reinicio de ESP32 o señal DAC congelada, se debe inhibir de manera segura la potencia de motores. **No existe independencia del microcontrolador** en esta arquitectura.
- Sensores analógicos ADXL335/ADXRS652 y TLV9064 quedan como propuesta anterior, no compra vigente de equilibrio.

## B. Movimiento y arbitraje

- El balanceo requiere capacidad de aplicar par a las dos ruedas; avanzar y retroceder pueden requerir modificar referencias del equilibrio dentro de límites.
- Los giros requieren mando diferencial compatible con estabilización.
- **Riesgo de integración crítico:** mezclar órdenes sin saturar ni priorizar puede desestabilizar el robot. El circuito de mezcla, prioridades y corte por falla queda pendiente de diseño.
- Una orden de seguimiento, calor o expresión nunca debe deshabilitar el lazo analógico.

## C. ESP32 e interacción

- Lectura de sensor(es) térmico(s) con capacidad de estimar la procedencia del calor.
- Análisis de entrada de micrófono para reconocer el patrón de silbido; el silbido puede **activar** seguimiento, pero no proporciona por sí mismo un rumbo continuo.
- Seguimiento Bluetooth: RSSI de BLE ofrece **proximidad aproximada**, **no ángulo** de llegada en un módulo ESP32 típico. Para orientarse podrían evaluarse barrido controlado + sensores adicionales, balizas o una alternativa multimodal, sin fijar todavía solución.
- Restricción posible del teléfono: comportamiento de BLE, publicidad y permisos de segundo plano dependen del sistema operativo y de la app. Validar con el teléfono real.
- La función de voz requiere determinar si habrá grabación/reproducción, órdenes por voz, conversación bidireccional o transmisión hacia teléfono/servicio. La ESP32 podría necesitar códecs, I2S, amplificación y gestión de eco según la opción elegida.
- La pantalla representa ojos con estados básicos: normal azul, atención, seguimiento, alerta térmica y combate simulado rojo/enojado. Su tecnología no está elegida.

## D. Prioridades provisionales de seguridad

1. Parada de emergencia y fallas críticas.
2. Protección del equilibrio analógico y límites de motores.
3. Evitación de obstáculos / alejamiento de peligro térmico cuando sea físicamente seguro.
4. Movimiento manual o seguimiento del usuario.
5. Animaciones, voz y modos teatrales.

**Esta prioridad es propuesta para revisión**, no una decisión del usuario. Una detección térmica no debe ordenar retroceso ciego hacia un obstáculo.

## E. Interfaces que necesitan especificación posterior

| Interfaz | Señales/energía por acordar | Prueba exigida |
|---|---|---|
| MPU6050 → ESP32-S3 → DAC → PID | I²C 3.3 V, estimación de ángulo, tasa de muestreo, centrado y escala E(t) | ángulo/error correctos y protección ante fallo |
| Control analógico → drivers | signo, rango, velocidad, saturación, habilitación | inversión de par sin sobrecorriente |
| ESP32 → DAC → control | actualización de E(t), nivel de referencia, watchdog/habilitación | apagar motores de forma segura si la ESP32 deja de actualizar |
| Alimentación lógica / potencia | tensiones, masas, filtrado y protección | perturbación de motores sin reinicios |
| Bluetooth → seguimiento | compatibilidad dispositivo, alcance, pérdida | pruebas reales de proximidad y orientación |
| Micrófono/audio/pantalla | buses, latencias, consumo, interferencia | funcionamiento concurrente |

## F. Restricciones de diseño

No comprar módulos ni dibujar conexiones pin a pin definitivas sin fijar antes tensiones, corriente de arranque de motores y tipo de sensor angular. Los GPIO ESP32 no pueden accionar motores directamente; los sensores y periféricos deben cumplir niveles eléctricos compatibles.
