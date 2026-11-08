# 03 — Fases de trabajo y plan de pruebas

**Estado:** secuencia propuesta, sin fechas de entrega ni componentes asignados.

## Fase 0 — Requisitos y parámetros físicos

- [ ] Confirmar presupuesto, dimensiones, masa aproximada, entorno de uso y autonomía.
- [ ] Definir boceto mecánico: ruedas, chasis, altura del centro de gravedad y ubicación de batería.
- [ ] Registrar características de motor/reductor: par, velocidad, corriente nominal y bloqueo.
- [ ] Seleccionar herramientas de simulación y de medición disponibles.
- **Salida:** parámetros de planta, lista de restricciones y matriz de opciones técnicas.

## Fase 1 — Estabilización analógica en simulación

- [ ] Modelar el péndulo invertido y motores con su signo y saturación.
- [ ] Seleccionar sensores **analógicos**; comprobar disponibilidad y rango.
- [ ] Estudiar filtrado/estimación analógica de inclinación y velocidad.
- [ ] Diseñar y justificar compensación analógica, límites y método de ajuste.
- [ ] Simular perturbaciones, arranque, saturación y caída de señal.
- **Salida:** esquemas de bloques, cálculos, simulación y criterios de ensayo aprobados.

## Fase 2 — Prototipo eléctrico y mecánico contenido

- [ ] Fabricar chasis y montar ruedas/motores.
- [ ] Validar fuente, fusibles/protecciones, etapa de potencia y botón de emergencia.
- [ ] Medir sensores y etapa analógica **sin** liberar el robot.
- [ ] Ensayar sobre soporte/sujeción con ruedas controladas.
- [ ] Intentar equilibrio libre solo tras superar los ensayos de contención.
- **Salida:** primer equilibrio funcional demostrado y mediciones reproducibles.

## Fase 3 — Control de desplazamiento

- [ ] Diseñar la interfaz de consignas ESP32 → sistema analógico.
- [ ] Probar avance/retroceso/giro y saturación.
- [ ] Ensayar pérdida de comandos y reinicio ESP32.
- **Salida:** maniobra estable sin intervención del firmware en el lazo de equilibrio.

## Fase 4 — Detección térmica y evasión

- [ ] Validar detección y orientación hacia una fuente térmica de prueba no peligrosa.
- [ ] Añadir comportamiento de alejamiento condicionado por obstáculos.
- [ ] Probar falsos positivos, distancias y escenarios con múltiples fuentes.
- **Salida:** alejamiento seguro, medible y repetible.

## Fase 5 — Silbido y seguimiento

- [ ] Crear detector de silbido y establecer sensibilidad/tasa de falsas activaciones.
- [ ] Confirmar posibilidades Bluetooth del teléfono real.
- [ ] Medir RSSI frente a distancia, oclusión, rotación y movimientos.
- [ ] Seleccionar y ensayar método de orientación/localización; considerar sensores auxiliares si BLE por sí solo no sirve.
- [ ] Integrar obstáculos, pérdida de señal y parada de seguimiento.
- **Salida:** seguimiento validado en recorrido de prueba y recuperación segura ante pérdidas.

## Fase 6 — Ojos, voz y modo combate simulado

- [ ] Elegir pantalla y diseñar expresiones: normal azul, alerta, seguimiento, térmica y rojo/enojado.
- [ ] Integrar micrófono y bocinas; verificar inteligibilidad con motores activos.
- [ ] Definir activación y salida del modo simulado sin alterar circuitos de estabilidad.
- **Salida:** interacción y animación reproducibles.

## Fase 7 — Integración y cierre de prototipo

- [ ] Ensayo concurrente de balanceo + desplazamiento + sensores + audio + pantalla.
- [ ] Ensayo de fallas: ruido eléctrico, batería baja, caída, pérdida BLE, reinicio ESP32, obstáculos.
- [ ] Registrar consumo, masa final, dimensiones, autonomía y limitaciones comprobadas.
- **Salida:** dossier final con planos, lista de materiales, firmware, resultados y pendientes.

## Formato obligatorio de cada ensayo

**Prueba ID:** · **Fecha:** · **Configuración física:** · **Versión de circuito/firmware:**  
**Hipótesis y criterio de aprobación:** · **Instrumentos:** · **Procedimiento:**  
**Datos medidos:** · **Evidencia (archivos/enlaces):** · **Resultado:** aprobado / fallido / inconcluso.  
**Observaciones y siguiente cambio:**.

No confundir tareas previstas con tareas ya realizadas. A fecha de creación, **ninguna fase de prototipado está validada**.
