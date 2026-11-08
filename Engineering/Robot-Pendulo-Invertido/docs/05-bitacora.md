# 05 — Bitácora técnica del proyecto

Esta bitácora es el **historial verificable**. Las ideas no son pruebas; las pruebas requieren medición y evidencia.

## 2026-11-08 — Apertura del proyecto

**Evento:** el usuario describe un robot de dos ruedas tipo péndulo invertido, control analógico del equilibrio y ESP32 para detección de calor, silbido/seguimiento, Bluetooth de teléfono, micrófono, bocinas y pantalla de ojos. Solicita modo combate enteramente simulado con ojos rojos y gesto enojado.

**Evento posterior:** solicita usar `@superpowers` y GitHub, crear carpeta en COG y conservar objetivos y documentación sin depender de memoria conversacional.

**Trabajo documental:** apertura de `Engineering/Robot-Pendulo-Invertido/`; creación de README, requisitos, arquitectura preliminar, fases, decisiones, bitácora y lista de riesgos.

**Estado de ingeniería:** no hay dimensiones, esquemas, componentes escogidos ni resultados de laboratorio aprobados.

**Siguiente hito:** acordar parámetros físicos, estrategia de sensado **analógico** de actitud y arquitectura de motores/driver; después contrastar alternativas y validar en simulación.

## 2026-11-08 — Investigación de forma y componentes

**Solicitud:** diseñar una carrocería impresa en 3D con acabado de personaje, no estructura abierta; buscar referencias, motores, batería, giroscopio y acelerómetro de salida analógica, opamps, control de potencia, cargador, pantallas de ojos, sensores térmicos, audio y servomotores.

**Investigación:** encontrados Weeble, JJRobots B-Robot EVO2 y Zippy; comparadas tres rutas estéticas. Se identificaron como **candidatos**, aún no comprados ni aprobados, ADXL335, ADXRS652, TLV9064, LM393, Pololu 37D #4752, Cytron MDD10A, ESP32-S3 N16R8, GC9A01 x2, MLX90640, VL53L1X, MCP4728, amplificador I²S y servos.

**Hallazgos críticos:** RGB no proporciona temperatura; MLX90640 sí entrega imagen térmica. ESP32-S3 solo BLE, no Bluetooth Classic audio. RSSI no basta para obtener rumbo. El lazo de equilibrio requiere señal y PWM analógicos, aunque el driver de potencia sea un módulo. Pack 3S requiere protección/balanceo y cargador CC/CV compatible, no un TP4056 de una celda.

**Evidencia:** `docs/07-referencias-y-forma.md`, `docs/08-componentes-candidatos.md`, `docs/09-integracion-y-validaciones.md`, cada uno incluye referencias de origen.

**Estado:** diseño **propuesto**, sin CAD, sin compras, sin ensayos.

**Siguiente hito:** selección estética del usuario, presupuesto y cálculo de masa/torque para determinar hardware definitivo.

## 2026-11-08 — Decisión de forma EVA confirmada

**Declaración del usuario:** «Va a ser una carcasa tipo el robot EVA de Wall-E. Esa es el objetivo visual».

**Decisión:** se adopta **EVA/EVE de WALL·E** como referencia visual obligatoria. Sustituye la fase de elegir entre referencias genéricas. Exterior de impresión 3D con silueta ovoide blanca, cabeza/visor negro, ojos azules expresivos, brazos estilizados y modo combate simulado con ojos rojos. R-11 creado; D-011 y C-001 registrados.

**Compatibilidad:** las dos ruedas reales siguen siendo esenciales y deben integrarse en la zona inferior; el robot no levita. No se cambia el balanceo analógico ni el papel de la ESP32. Tipo/número de pantallas, medidas y mecanismos aún por confirmar.

**Evidencia:** `docs/04-decisiones.md`, `docs/01-requisitos-y-alcance.md`, `docs/07-referencias-y-forma.md`.

**Próximo hito:** definir opciones de integración geométrica manteniendo la estética EVA y dimensionar interior por módulos.

## 2026-11-08 — Cabeza fija confirmada

**Respuesta del usuario:** «Fija, no lo compliquemos más» a la pregunta sobre giro/movimiento de cabeza.

**Decisión D-012:** cabeza completamente rígida/fija, sin servomotor de cuello ni movimiento pan-tilt. Las expresiones faciales se implementarán en los ojos digitales. Las propuestas históricas de cabeza articulada quedan descartadas, sin alterar la estética EVA ni el control de equilibrio analógico.

**Actualización:** registro de decisión, diseño físico, lista de componentes, README y bitácora.

## 2026-11-08 — Primer estudio geométrico de EVA (v0.1)

**Solicitud del usuario:** «Ok vas», autorización para continuar con las dimensiones y la distribución interna tras fijar la cabeza rígida.

**Resultado documental y CAD:** altura preliminar 317 mm; ancho total 250 mm; cabeza 158 × 116 × 108 mm; torso ancho máx. 182 mm; dos ruedas Ø96, centros X=±116 y Z=49. Maqueta en `cad/EVA_concepto_v01.scad`. Distribución de motores 37D, pack 3S tentativo, driver MDD10A, PCB analógica y ESP32/pantallas. Las envolventes quedan detalladas en `docs/10-distribucion-fisica-v01.md`.

**Fuentes de dimensiones reales comprobadas:** Pololu 37D Ø37 ×68 y Cytron MDD10A 84.5 ×62; el resto de cotas mecánicas son propuestas sujetas a ficha de módulo y pruebas.

**Comprobación realizada:** OpenSCAD generó una visualización de exterior; se corrigió unión visual cuerpo-ruedas con carenados. No se ha verificado dinámica, estabilidad, uniones, ajuste de piezas ni comportamiento de chasis real.

**Decisiones:** NO se fijan todavía dimensiones finales, pack exacto, pantalla única/doble ni servos de brazos. Cabeza fija (D-012) y equilibrio analógico (D-002) se mantienen intactos.

**Siguiente prueba:** maquetar pantalla/visor con dimensiones de ficha, montar rueda/hub sobre representación del 37D, estimar masa y centro de gravedad y diseñar soportes reales.

## 2026-11-08 — Confirmada pantalla rectangular única y marco oval

**Declaración del usuario:** una sola pantalla rectangular para los dos ojos, con la carcasa de la cabeza impresa en 3D cubriendo las esquinas hasta simular una superficie visible ovalada; cabeza ligeramente mayor al módulo.

**Decisión D-013:** descartadas las dos pantallas redondas previas. El marco y la abertura deben diseñarse con dimensiones REALES del panel, respetando área activa, PCB, cable y montaje. El tipo de pantalla aún no se fija.

**Investigación inicial:** Waveshare 3.5\" IPS ST7796S SPI, 92.44×61 mm de módulo, activa 73.44×48.96 mm; y Waveshare 4.3\" ESP32-S3 integrado IPS RGB 800×480, 106.1×67.8 mm en variante táctil, activo ~95.54×54.36 mm. Antes de escoger panel integrado revisar disponibilidad de GPIO/I²S y alimentación para todos los otros sensores.

**Siguiente paso:** evaluación/dimensionamiento de componentes reales antes de liberar CAD imprimible. Ver `docs/11-pantalla-unica-y-secuencia-de-componentes.md`.

## Plantilla de nueva entrada

### AAAA-MM-DD — Hito

- **Objetivo:**
- **Configuración / revisión:**
- **Trabajo realizado:**
- **Mediciones / evidencia:**
- **Problemas:**
- **Decisiones registradas:**
- **Pendientes:**
- **Próxima prueba:**

Cada avance debe enlazar cuando corresponda su registro de decisión, esquema, archivo fuente, oscilograma o ensayo.
