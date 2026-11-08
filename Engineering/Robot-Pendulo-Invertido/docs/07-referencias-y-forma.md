# 07 — Referencias estéticas y propuesta de carrocería 3D

**Fecha:** 2026-11-08 · **Estado:** alternativas de diseño para revisión; **no** hay forma aprobada ni CAD realizado.

## Intención de diseño

Robot de péndulo invertido de dos ruedas con apariencia de **personaje terminado**; carrocería cerrada impresa en 3D, sin aspecto de estante/esqueleto con ruedas expuestas. Debe conservar la expresividad de los ojos, tener capacidad de alojar todos los módulos, recibir golpes menores y permitir mantenimiento.

## Referencias públicas (NO copiar sus controles digitales)

1. **Weeble** — 2 ruedas, cuerpo 100% impreso, ojos expresivos, cejas, brazos y cabeza articulados. Gran referencia de personalidad; equilibrio digital LQR incompatible con el requisito analógico nuestro. https://github.com/BrandonKirbyson/Weeble
2. **JJRobots B-ROBOT EVO2** — piezas imprimibles y construcción de robot autoequilibrado. Útil como referencia mecánica; estética abierta a reinterpretar. https://github.com/jjrobots/B-ROBOT_EVO2
3. **Zippy** — cuerpo impreso, diseño y control de motores; útil para empaquetado y revisión de piezas. Equilibrio digital distinto del nuestro. https://github.com/elkayem/ZippyTheBalancingRobot
4. **Self-balancing Arduino robot (Build Some Stuff)** — ruedas, silueta y articulación de extremidades; control digital y BLDC fuera de la primera opción de integración analógica. https://www.hackster.io/news/build-your-own-arduino-powered-self-balancing-robot-9701119f0c20

## Tres rutas visuales

### A — Carcasa redondeada con rostro de dos ojos (preferencia de diseño **propuesta**)
- Torso/huevo compacto, cabeza parcialmente integrada, dos LCD circulares GC9A01 de 1.28”, frente lisa, dos ruedas a los lados.
- Dos brazos pequeños con servos; cabeza fija inicialmente, posible servo de giro/inclinación tras comprobar estabilidad.
- Superficies limpias, sin cable visible; sensores térmicos y de distancia en ventanas separadas; bocinas detrás de rejillas.
- **Beneficio:** encaja en la personalidad, protección y objetivos.
- **Costo:** mayor trabajo CAD y control de masas.

### B — Cabeza articulada sobre chasis cerrado
- Cabeza independiente sobre cuello con un servo; ojos dobles.
- **Beneficio:** mayor expresividad.
- **Riesgo:** movimiento de masa alta y perturbaciones sobre el equilibrio.

### C — Cuerpo monolítico con pantalla rectangular para ambos ojos
- Un único display detrás de visor, menos cables y componentes.
- **Beneficio:** más simple, menor peso/consumo.
- **Costo:** apariencia diferente a los ojos circulares individuales.

**No se elige ruta definitiva sin revisión del usuario.**

## Dimensiones de estudio — NO definitivas

- Altura de estudio: 250–300 mm.
- Anchura total: 200–250 mm.
- Ruedas: 90–100 mm de diámetro, goma/TPU o neumático de buena adherencia.
- Dos módulos redondos GC9A01 1.28”: pantalla visible ~32.4 mm, PCB hasta ~40 mm de ancho según modelo.
- Espacios obligatorios: motores y reductores, batería extraíble o accesible, BMS/cargador, drivers, circuito analógico (aislado de potencia), ESP32-S3, dos pantallas, cámara térmica, sensores de obstáculos, micrófono, audio, conectores, ventilación, interruptor y parada.
- Impresión propuesta: PETG carcasa y chasis; inserts metálicos M3; mantenimiento por tapa posterior; neumático de goma/TPU. PETG no exime evaluar temperaturas de motores/cargador.
- Proteger rueda/ejes y sensor angular ante vibración; el eje de gyro se montará en orientación correspondiente al cabeceo.
- No diseñar soportes definitivos antes de confirmar dimensiones de compras y centro de gravedad.

## Criterios de aceptación de forma

- Exterior visualmente cerrado y con ojos/expresiones integrados.
- Todas las piezas de mantenimiento accesibles sin destruir la carrocería.
- No obstruir campo de visión de sensores térmicos/cámara ni sensor de obstáculos.
- No cubrir rejillas de micrófono y altavoces.
- Masa/centro de gravedad verificados en CAD y en prototipo; perturbaciones por servos evaluadas.
- Carcasas y neumáticos no sirven de tercer punto de apoyo durante equilibrio.

## Pregunta de revisión estética pendiente

¿Preferir cuerpo redondeado con dos ojos separados, cabeza articulada, o rostro único tipo visor? Colores y tamaño final por aprobar.
