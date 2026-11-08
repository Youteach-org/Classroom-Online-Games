# 07 — Referencias estéticas y propuesta de carrocería 3D

**Fecha:** 2026-11-08 · **Estado:** **referencia estética EVA de WALL·E confirmada por el usuario**; CAD, disposición precisa y pantallas aún no aprobados.

## Segunda decisión confirmada — Cabeza fija

**La cabeza NO se moverá.** Sin servomotor de cuello, sin plataforma pan-tilt, sin mecanismos de giro/inclinación. Fijación rígida atornillada a la estructura, con paso protegido para alimentación y pantallas. Las expresiones serán exclusivamente gráficas mediante los ojos. Esta decisión sustituye cualquier propuesta previa de cabeza articulada que aparezca más abajo como referencia histórica. **No retirar sin petición del usuario.**

## Decisión estética confirmada por el usuario — 2026-11-08

**Referencia visual obligatoria:** EVA/EVE de la película *WALL·E*. Silueta de robot blanco, liso, redondeado/ovoide, cabeza oval independiente del cuerpo, visor facial negro, ojos luminosos azules, brazos laterales estilizados; en combate exclusivamente simulado ojos rojos y gesto enojado. La carrocería deberá imprimirse en 3D y tener aspecto cerrado/profesional, no de estante o chasis visible.

**Adaptación física imprescindible:** EVA en la película flota, pero nuestro robot es un péndulo invertido real de **dos ruedas apoyadas en el suelo**. Deben integrarse discretamente en la zona baja o laterales, con espacio libre, diámetro y adherencia suficientes; no esconder tanto las ruedas que pierdan contacto o funcionalidad. La altura real, forma de transición y anclajes se derivan del CAD, motores y centro de masa.

**Candidatos para ojos (ninguno aún aprobado):** (1) pantalla única detrás de visor negro con ambos ojos animados, o (2) dos displays detrás de un visor negro común; las pantallas redondas GC9A01 propuestas previamente ya **no** son una decisión estética por defecto. Debe compararse espacio interno, curvatura aparente, contraste, peso y conexiones. El visor puede ser cubierta negra semitransparente compatible con brillo/legibilidad y sistema de disipación.

**Propuesta de colocación:** sensores térmicos y de distancia en ventanas discretas que no tapen campo de visión; micrófono y bocinas detrás de aberturas acústicas; batería y electrónica de potencia en parte baja; control analógico aislado de perturbaciones. Brazos/servos no deben sacudir el equilibrio. Todo lo anterior es propuesta de ingeniería, no dimensiones cerradas.

Referencia del personaje: https://www.pixar.com/wall-e y https://movies.disney.com/wall-e. No se ha adquirido licencia ni se plantea reproducción comercial del personaje; la referencia se utiliza para definir el estilo de un prototipo.

## Intención de diseño

Robot de péndulo invertido de dos ruedas con apariencia de **personaje terminado**; carrocería cerrada impresa en 3D, sin aspecto de estante/esqueleto con ruedas expuestas. Debe conservar la expresividad de los ojos, tener capacidad de alojar todos los módulos, recibir golpes menores y permitir mantenimiento.

## Referencias públicas (NO copiar sus controles digitales)

1. **Weeble** — 2 ruedas, cuerpo 100% impreso, ojos expresivos, cejas, brazos y cabeza articulados. Gran referencia de personalidad; equilibrio digital LQR incompatible con el requisito analógico nuestro. https://github.com/BrandonKirbyson/Weeble
2. **JJRobots B-ROBOT EVO2** — piezas imprimibles y construcción de robot autoequilibrado. Útil como referencia mecánica; estética abierta a reinterpretar. https://github.com/jjrobots/B-ROBOT_EVO2
3. **Zippy** — cuerpo impreso, diseño y control de motores; útil para empaquetado y revisión de piezas. Equilibrio digital distinto del nuestro. https://github.com/elkayem/ZippyTheBalancingRobot
4. **Self-balancing Arduino robot (Build Some Stuff)** — ruedas, silueta y articulación de extremidades; control digital y BLDC fuera de la primera opción de integración analógica. https://www.hackster.io/news/build-your-own-arduino-powered-self-balancing-robot-9701119f0c20

## Propuestas históricas anteriores (NO son la referencia visual ni mecánica vigente)

Se conservan a continuación para trazabilidad, pero **el usuario ya eligió EVA**, por lo que no se debe reabrir la elección genérica entre A/B/C salvo nueva indicación explícita.

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

**Rutas anteriores superadas por la decisión EVA; se mantiene abierta solo la ingeniería de implementación de esa forma.**

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

## Decisiones todavía pendientes

Confirmados por usuario: **EVA como objetivo de forma**, carcasa impresa en 3D, **cabeza completamente fija sin servo**, dos ruedas, ojos azules y modo simulado rojo/enojado.

Por definir: tamaño final, método de hacer visor (una o dos pantallas detrás), movimiento de brazos si procede, ubicación de ruedas y tolerancias internas. **No volver a plantear movilidad de cabeza**. No preguntar nuevamente qué estética general desea.
