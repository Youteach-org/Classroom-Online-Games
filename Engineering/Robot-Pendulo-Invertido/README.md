# Robot de dos ruedas con péndulo invertido
**Estado:** definición y diseño preliminar · **Versión:** 0.1 · **Inicio:** 2026-11-08

## Propósito
Diseñar y construir un robot móvil de dos ruedas, capaz de mantenerse de pie mediante control electrónico **analógico** independiente, con una **ESP32** para comportamientos, sensores, comunicaciones, audio y expresiones.

## Reglas del proyecto
- El equilibrio **no depende de la ESP32**, de su programa ni de un sensor exclusivamente digital.
- Las ruedas permiten movimiento adelante/atrás y giros mientras se conserva el equilibrio.
- La ESP32 ejecuta evitación de fuentes de calor, activación por silbido, seguimiento del usuario (preferencia: teléfono por Bluetooth), voz/audio y ojos animados.
- El «modo combate» es únicamente **simulado**, visual y sonoro; no incluye mecanismos ofensivos.
- No comprar ni fijar como definitivos motores, batería, giroscopio, controlador o pantalla sin validar primero los requisitos.
- Conservar decisiones y resultados; una propuesta técnica no equivale a una decisión aprobada.

## Índice del expediente
1. [00 — Requisitos y criterios de aceptación](00-REQUISITOS.md)
2. [01 — Arquitectura y prioridades](01-ARQUITECTURA.md)
3. [02 — Sistema analógico de balanceo](02-BALANCEO-ANALOGICO.md)
4. [03 — Funciones de ESP32](03-FUNCIONES-ESP32.md)
5. [04 — Componentes y presupuesto](04-COMPONENTES.md)
6. [05 — Etapas de desarrollo y pruebas](05-PLAN-Y-PRUEBAS.md)
7. [06 — Decisiones y control de cambios](06-DECISIONES.md)
8. [07 — Bitácora](07-BITACORA.md)
9. [08 — Riesgos e interfaces eléctricas](08-SEGURIDAD-E-INTERFACES.md)
10. [09 — Fuentes técnicas](09-FUENTES.md)
11. [10 — Pendientes de definición](10-PENDIENTES.md)
12. [11 — Lista de compras Mercado Libre México](11-COMPRAS-MERCADOLIBRE.md)

## Cómo continuar el proyecto
Al reiniciar una sesión, revisar primero este README, los requisitos, las decisiones, los pendientes y la bitácora. Anotar toda decisión nueva con fecha y justificación. Evitar editar otras carpetas de COG. El repositorio aloja la documentación: no implica que los circuitos estén probados o que exista firmware operativo.

**Ubicación:** Youteach-org/Classroom-Online-Games / Engineering / Robot-Pendulo-Invertido.
