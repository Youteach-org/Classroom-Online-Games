# 00 — Requisitos oficiales y criterios de aceptación
**Fuente de requisitos:** instrucciones del usuario del 2026-11-08. **Estado:** alcance inicial congelado; detalles por especificar.

| ID | Requisito | Prioridad | Condición para considerarlo logrado |
|---|---|---|---|
| R-01 | Plataforma de dos ruedas tipo péndulo invertido | Obligatorio | Prototipo físico que se balancee sobre dos ruedas motorizadas. |
| R-02 | Control de balanceo **analógico**, no ejecutado por ESP32 | Obligatorio e innegociable | El lazo de estabilización funciona aun reiniciando o desconectando la ESP32, dentro de condiciones seguras. |
| R-03 | Desplazamiento y giro conservando el equilibrio | Obligatorio | Avanza, retrocede y gira manteniendo estabilidad comprobada. |
| R-04 | ESP32 para funciones distintas del balanceo | Obligatorio | Las funciones superiores residen en ESP32; la ESP32 solo envía consignas limitadas de movimiento. |
| R-05 | Detección de calor y alejamiento | Obligatorio | Detecta fuente térmica y ejecuta evasión sin acercarse a ella ni chocar con obstáculos. |
| R-06 | Activación por silbido | Obligatorio | Detecta un patrón de silbido definido y activa seguimiento sin falsos positivos excesivos. |
| R-07 | Seguir al usuario, preferentemente mediante señal Bluetooth del teléfono | Obligatorio; método preferido no validado | Sigue al usuario y conserva separación segura; se valida el método de localización real. |
| R-08 | Micrófono y bocinas para comunicación | Obligatorio | Captura sonido y reproduce audio; modalidad de conversación pendiente de definir. |
| R-09 | Pantalla con ojos expresivos | Obligatorio | Ojos con expresiones vinculadas al estado del robot. |
| R-10 | Modo combate **simulado** | Obligatorio | Cambia ojos azules a rojos y adopta expresión enojada, sin armas reales. |
| R-11 | Documentación persistente, trazabilidad y control de objetivos en GitHub COG | Obligatorio | Cada cambio relevante tiene registro y pruebas asociadas. |

## Aclaraciones que no deben convertirse en supuestos
- No se ha fijado aún el modelo de ESP32, dimensiones, masa, diámetro de ruedas, fuente de energía, motores ni presupuesto.
- «Detectar calor» no especifica aún rango de temperaturas ni distancias.
- «Comunicarse» no especifica aún si voz bidireccional con teléfono, respuesta local o asistente de voz.
- «Seguir Bluetooth» es una preferencia de implementación, **no una capacidad garantizada** con un solo receptor RSSI.
- No hay fecha límite, piezas compradas para este proyecto ni circuitos validados.
- La asignación de las acciones del robot a botones/gestos aún no se ha definido.

## Política de cumplimiento
Todo cambio en un requisito obligatorio requiere petición y aprobación explícitas del usuario, actualización de este archivo, de decisiones y de bitácora. Una etapa posterior no reemplaza ni elimina objetivos de la lista.
