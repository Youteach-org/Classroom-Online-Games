# 02 — Arquitectura funcional e interfaces

**Estado:** propuesta de partición funcional, **no** esquema eléctrico definitivo.

## Vista general

```text
   [Sensores de inclinación/velocidad ANGULARES ANALÓGICOS]
                          |
                          v
          [Acondicionamiento y filtrado analógico]
                          |
                          v
            [Controlador de equilibrio ANALÓGICO]
                          |
                  [mezcla/prioridad de mandos] <---- [Consignas limitadas de ESP32]
                          |
             [Etapa de potencia de 2 motores]
                          |
                   [Dos ruedas / robot]
                          |
            [Dinámica mecánica / realimentación]

 [Calor/dirección] -------+
 [Micrófono/silbido] -----+
 [Bluetooth/teléfono] ----+--> [ESP32: estados, supervisión, interacción]
 [Obstáculos/seguridad] --+          |         |
                             [Pantalla de ojos] [Salida de audio]
```

El dibujo define **responsabilidades**, no afirma que el mezclador o acondicionamiento ya estén diseñados.

## A. Subsistema analógico de equilibrio

- Medir inclinación y dinámica angular mediante señales **analógicas** aptas para el rango de movimiento del robot.
- Filtrar/combinar señales para evitar deriva, ruido e inestabilidad. Una señal acelerométrica por sí sola puede deformarse con la aceleración de traslación; integrar una velocidad angular sin referencia deriva. La estrategia de estimación es **por diseñar**.
- Formar error respecto a referencia de posición/inclinación, compensar dinámica con un controlador **analógico** (topología y compensación por determinar) y accionar ambos motores mediante potencia adecuada.
- Disponer de control de saturación, condición segura de salida y pruebas sin dependencia de software.
- La ESP32 **no** suministra la medición principal, cálculo ni la realimentación necesarios para sostener el equilibrio.

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
| Sensores analógicos → control | rango, ruido, referencia, ancho de banda | mediciones en reposo y movimiento |
| Control analógico → drivers | signo, rango, velocidad, saturación, habilitación | inversión de par sin sobrecorriente |
| ESP32 → control/movimiento | consigna limitada y estado de autorización | desconexión ESP32 sin pérdida peligrosa de control |
| Alimentación lógica / potencia | tensiones, masas, filtrado y protección | perturbación de motores sin reinicios |
| Bluetooth → seguimiento | compatibilidad dispositivo, alcance, pérdida | pruebas reales de proximidad y orientación |
| Micrófono/audio/pantalla | buses, latencias, consumo, interferencia | funcionamiento concurrente |

## F. Restricciones de diseño

No comprar módulos ni dibujar conexiones pin a pin definitivas sin fijar antes tensiones, corriente de arranque de motores y tipo de sensor angular. Los GPIO ESP32 no pueden accionar motores directamente; los sensores y periféricos deben cumplir niveles eléctricos compatibles.
