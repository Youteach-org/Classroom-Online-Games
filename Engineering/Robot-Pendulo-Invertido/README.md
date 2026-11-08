# Robot de dos ruedas con péndulo invertido

**Estado:** definición de requisitos y diseño preliminar.  
**Inicio de registro:** 2026-11-08.  
**Repositorio:** COG / `Engineering/Robot-Pendulo-Invertido/`.

## Objetivo general

Construir un robot de **dos ruedas** capaz de mantenerse en equilibrio mediante un **control de estabilización totalmente analógico**, con una **ESP32 independiente del lazo de balanceo** encargada de interacción, comportamiento, percepción, comunicación y modos de operación.

## Objetivos originales: no eliminar sin autorización

- **R-01 — Equilibrio:** mantenerse erguido como péndulo invertido de dos ruedas. La medición, compensación y actuación rápida del equilibrio se implementarán por electrónica analógica, sin depender de software ni de la ESP32.
- **R-02 — Movimiento:** avanzar, retroceder y girar sin perder la estabilidad; la manera de combinar consignas de la ESP32 con el lazo analógico está por diseñar.
- **R-03 — Calor:** detectar una fuente de calor y alejarse de ella de forma controlada; se debe resolver la **dirección** de la fuente, no solo medir temperatura ambiente.
- **R-04 — Silbido:** identificar un silbido como señal para activar un comportamiento de seguimiento.
- **R-05 — Seguimiento de persona:** preferentemente seguir la señal Bluetooth del teléfono del usuario. El Bluetooth convencional/BLE por intensidad de señal no proporciona dirección fiable por sí solo; el método real se validará antes de prometer seguimiento.
- **R-06 — Comunicación:** disponer de micrófono y bocinas para comunicación/interacción con el robot.
- **R-07 — Ojos:** pantalla con ojos animados y expresiones reactivas.
- **R-08 — Combate simulado:** modo **únicamente ficticio/teatral**, con ojos que pasan de azul a rojo y expresión enojada, sin armamento.
- **R-09 — Supervisión:** la ESP32 maneja las funciones R-02 a R-08 que correspondan, pero **no ejecuta el control de equilibrio**.
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
11. [Maqueta CAD paramétrica OpenSCAD v0.1](cad/EVA_concepto_v01.scad)

## Reglas del proyecto

1. No sustituir el equilibrio analógico por PID digital, firmware ESP32 o IMU digital conectada a la ESP32.
2. Distinguir siempre **confirmado por el usuario**, **propuesta**, **por verificar** y **descartado**.
3. Registrar cada cambio de alcance o decisión en `docs/04-decisiones.md` y cada avance en `docs/05-bitacora.md`.
4. No declarar un subsistema terminado sin ensayos, resultados y criterios de aceptación.
5. No fijar motores, sensores, batería, valores de componentes, módulos de pantalla ni técnica de seguimiento hasta evaluar alternativas y recibir aprobación.
6. La documentación del proyecto es la referencia persistente; el contexto conversacional no sustituye los registros de GitHub.

## Estado actual

**Maqueta 3D volumétrica v0.1 y estudio dimensional documentados. No es un diseño para imprimir todavía; no hay prototipo ni diseño electrónico final aprobado.**
