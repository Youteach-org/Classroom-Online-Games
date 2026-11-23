# 04 — Registro de decisiones y cambios de alcance

**Regla:** nunca reescribir una decisión histórica como si no hubiera existido. Registrar sustitución, fecha y motivo; conservar la línea base.

## Confirmado por el usuario — 2026-11-08

| ID | Decisión/requisito | Estado |
|---|---|---|
| D-001 | Robot de **dos ruedas** de tipo péndulo invertido | Confirmado |
| D-002 | Balanceo y su control **analógicos**, fuera de la ESP32 | Confirmado / no sustituible unilateralmente |
| D-003 | ESP32 administra el resto de subsistemas | Confirmado |
| D-004 | Detectar calor y **alejarse** de la fuente | Confirmado |
| D-005 | Detectar **silbido** como estímulo para seguimiento | Confirmado |
| D-006 | Preferencia por seguimiento mediante **señal Bluetooth del teléfono** | Preferencia; factibilidad pendiente |
| D-007 | Integrar **micrófono y bocinas** para comunicación | Confirmado |
| D-008 | Usar **pantalla como ojos** reactivos | Confirmado |
| D-009 | Incluir **modo combate simulado**, ojos de **azul a rojo** y expresión enojada | Confirmado; exclusivamente simulado |
| D-010 | Documentar el proyecto persistentemente en GitHub, dentro del repositorio **COG** | Confirmado |
| D-011 | **Objetivo visual definitivo:** carrocería tipo **EVA / EVE de WALL·E**; líneas blancas, suaves y continuas, rostro negro con ojos digitales azules; adaptación indispensable a dos ruedas de contacto con el suelo | **Confirmado directamente por el usuario el 2026-11-08** |

| D-012 | **Cabeza EVA fija, sin giro, inclinación ni servo de cuello**. La expresividad se obtiene con ojos animados, no con movimiento de cabeza. | **Confirmado directamente por el usuario el 2026-11-08** |

| D-013 | **Una sola pantalla rectangular** para los dos ojos; **carcasa ovalada de cabeza impresa en 3D oculta las esquinas** y forma la ventana de EVA. La cabeza será apenas mayor que el módulo seleccionado. | **Confirmado por el usuario el 2026-11-08**; tamaño y modelo de pantalla no confirmados |

## Propuestas de ingeniería — NO aprobadas todavía

| ID | Propuesta | Motivo | Estado |
|---|---|---|---|
| P-001 | Alojar proyecto en `Engineering/Robot-Pendulo-Invertido/` | Aislarlo de juegos y de otros proyectos de control | Organización documental adoptada |
| P-002 | Priorizar parada, balanceo y protección sobre seguimiento/animaciones | Prevenir maniobras inseguras | Propuesta |
| P-003 | Medir orientación térmica, no solo calor ambiente | Alejarse exige una dirección | Requisito técnico por validar |
| P-004 | Verificar seguimiento BLE mediante mediciones antes de fijar diseño | RSSI no indica rumbo | Propuesta |
| P-005 | Ejecutar pruebas mecánicas inicialmente con contención | Riesgo de caída y de motores | Propuesta |

## Registro de cambio

| Fecha | ID | Solicitud | Requisitos afectados | Resolución / autorización | Evidencia |
|---|---|---|---|---|---|
| 2026-11-08 | C-000 | Crear carpeta de proyecto y documentar objetivos iniciales | R-01 a R-10 | Solicitud directa del usuario | Primeros archivos del repositorio |
| 2026-11-08 | C-001 | «Va a ser una carcasa tipo el robot EVA de Wall-E. Esa es el objetivo visual» | R-11 (nuevo, estética) y selección de carcasa/pantalla | **Aprobación explícita del usuario**. Se prioriza estética EVA frente a opciones anteriores; no confirma pantalla única, tamaño final, mecanismos ni configuración de ruedas. | `docs/07-referencias-y-forma.md` |

| 2026-11-08 | C-002 | «Fija, no lo compliquemos más» (respuesta sobre movilidad de cabeza) | Diseño mecánico EVA, servomotor de cuello, disposición interior | **Cabeza fija obligatoria; se elimina el servo de cabeza de la lista vigente**; conservar referencia histórica de propuestas previas | `docs/07-referencias-y-forma.md`, `docs/08-componentes-candidatos.md` |

| 2026-11-08 | C-003 | «Va a ser una sola pantalla ... la cabeza impresa va a cubrir ... las esquinas para simular que la pantalla es ovalada» | R-07, R-11, diseño de rostro, BOM, CAD | **Se elimina opción de dos pantallas**; usar un solo panel rectangular detrás de marco impreso oval. El modelo/tamaño aún se evalúa. | `docs/11-pantalla-unica-y-secuencia-de-componentes.md` |

## 2026-11-22 — Cambio de arquitectura autorizado por el profesor y aceptado por el usuario

| ID | Decisión | Estado |
|---|---|---|
| D-014 | Adoptar el esquema proporcionado por el profesor: IMU digital MPU6050 (GY-521) → ESP32-S3 (lectura y estimación de inclinación) → DAC externo → PID analógico con TL084CN → conversor analógico a PWM → driver de dos motores | Confirmado por el usuario el 2026-11-22 |
| D-015 | Conservar ESP32-S3; al carecer de DAC integrado, evaluar el MCP4728 de 12 bits ya propuesto en la lista de materiales | Conservación confirmada; DAC por validar eléctricamente |
| D-016 | El control PID de equilibrio debe realizarse con amplificadores operacionales, no mediante un PID implementado en firmware | Confirmado conforme al esquema del profesor |

**Cambio C-004:** La restricción histórica D-002 (sensado y lazo completamente independientes de ESP32) se sustituye para este proyecto por la arquitectura aprobada D-014. Se conserva D-002 como antecedente, sin reescribirla. La ESP32 participa en la medición y estimación del ángulo; por tanto, el equilibrio completo **sí depende** de que funcione correctamente. El procesamiento PID permanece analógico. Si el ángulo digital queda congelado o se pierde I²C, el sistema necesita detección de fallos y deshabilitación segura de motores; esto sigue pendiente de implementación y prueba.

**Evidencia:** diagrama de bloques del profesor y captura comercial de MPU6050 GY-521 compartidos en conversación el 2026-11-22. El paquete de seis GY-521 visto en Mercado Libre es **candidato**, no compra confirmada.

## Protocolo de cambios futuros

1. Describir cambio solicitado en palabras del usuario.
2. Identificar requisito y documento afectado.
3. Presentar impacto en estabilidad, electrónica, energía, costo y seguridad, según aplique.
4. Documentar aprobación explícita antes de reemplazar una condición confirmada.
5. Añadir referencia a commit, circuito, prueba o incidencia.
