# Robot de dos ruedas con péndulo invertido

**Estado:** definición de requisitos y diseño preliminar.  
**Inicio de registro:** 2026-11-08.  
**Repositorio:** COG / `Engineering/Robot-Pendulo-Invertido/`.

## Objetivo general

Construir un robot de **dos ruedas** capaz de mantenerse en equilibrio mediante un **control PID analógico con TL084CN**, recibiendo el error de inclinación desde un **MPU6050 leído por ESP32-S3 y convertido a voltaje con un DAC externo**. La ESP32 también administra interacción, comportamiento, percepción y comunicación.

## Objetivos originales: no eliminar sin autorización

- **R-01 — Equilibrio:** mantenerse erguido como péndulo invertido de dos ruedas. Según cambio D-014 del 2026-11-22, la IMU MPU6050 se lee con ESP32-S3, un DAC presenta E(t) y el controlador PID se realiza con TL084CN; la anterior independencia total queda registrada históricamente, pero sustituida.
- **R-02 — Movimiento:** avanzar, retroceder y girar sin perder la estabilidad; la manera de combinar consignas de la ESP32 con el lazo analógico está por diseñar.
- **R-03 — Calor:** detectar una fuente de calor y alejarse de ella de forma controlada; se debe resolver la **dirección** de la fuente, no solo medir temperatura ambiente.
- **R-04 — Silbido:** identificar un silbido como señal para activar un comportamiento de seguimiento.
- **R-05 — Seguimiento de persona:** preferentemente seguir la señal Bluetooth del teléfono del usuario. El Bluetooth convencional/BLE por intensidad de señal no proporciona dirección fiable por sí solo; el método real se validará antes de prometer seguimiento.
- **R-06 — Comunicación:** disponer de micrófono y bocinas para comunicación/interacción con el robot.
- **R-07 — Ojos:** **una sola pantalla rectangular** para ambos ojos animados; marco oval impreso en 3D cubrirá sus esquinas para obtener la apariencia de EVA (D-013).
- **R-08 — Combate simulado:** modo **únicamente ficticio/teatral**, con ojos que pasan de azul a rojo y expresión enojada, sin armamento.
- **R-09 — Supervisión:** la ESP32 gestiona funciones R-02 a R-08 y adquiere/estima inclinación mediante MPU6050, pero **no implementa el PID de equilibrio en firmware**.
- **R-10 — Seguridad:** incorporar parada de emergencia, condiciones de fallo seguras y pruebas sujetas a contención física antes de funcionamiento libre.
- **R-11 — Apariencia confirmada:** carrocería tipo **EVA / EVE de *WALL·E***, impresa en 3D, formas blancas ovaladas, visor oscuro y ojos expresivos; mantener las dos ruedas de equilibrio sin apariencia de estante/esqueleto. **Cabeza fija, sin servomotor de cuello, confirmada por el usuario (D-012).**

## Documentación

1. [Requisitos y alcance](docs/01-requisitos-y-alcance.md)
2. [Arquitectura e interfaces](docs/02-arquitectura-e-interfaces.md)
3. [Plan por fases y pruebas](docs/03-plan-fases-y-pruebas.md)
4. [Registro de decisiones](docs/04-decisiones.md)
5. [Bitácora de avances](docs/05-bitacora.md)
6. [Riesgos y temas pendientes](docs/06-riesgos-y-pendientes.md)
7. [Referencias y diseño físico 3D](docs/07-referencias-y-forma.md)
8. [Lista de componentes candidatos](docs/08-componentes-candidatos.md)
9. [Integración, energía y validaciones](docs/09-integracion-y-validaciones.md)
10. [Distribución dimensional preliminar v0.1](docs/10-distribucion-fisica-v01.md)
11. [Maqueta CAD paramétrica OpenSCAD v0.1 (displays obsoletos)](cad/EVA_concepto_v01.scad)
12. [Pantalla única y orden de selección de componentes](docs/11-pantalla-unica-y-secuencia-de-componentes.md)

## Reglas del proyecto

1. Conforme al esquema del profesor (D-014), sí se permite MPU6050 digital conectado a ESP32-S3 para la medición; el **PID debe permanecer analógico** con TL084CN, no sustituirse por firmware PID.
2. Distinguir siempre **confirmado por el usuario**, **propuesta**, **por verificar** y **descartado**.
3. Registrar cada cambio de alcance o decisión en `docs/04-decisiones.md` y cada avance en `docs/05-bitacora.md`.
4. No declarar un subsistema terminado sin ensayos, resultados y criterios de aceptación.
5. No fijar motores, sensores, batería, valores de componentes, módulos de pantalla ni técnica de seguimiento hasta evaluar alternativas y recibir aprobación.
6. La documentación del proyecto es la referencia persistente; el contexto conversacional no sustituye los registros de GitHub.

## Estado actual

**Arquitectura de medición digital + PID analógico autorizada el 2026-11-22 (D-014); MPU6050 GY-521, ESP32-S3, DAC externo candidato MCP4728, TL084CN y PWM analógico. Maqueta 3D v0.1 aún no imprimible; no hay prototipo ni esquema eléctrico final verificado.**
