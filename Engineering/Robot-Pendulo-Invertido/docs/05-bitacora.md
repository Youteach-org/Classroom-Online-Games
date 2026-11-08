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
