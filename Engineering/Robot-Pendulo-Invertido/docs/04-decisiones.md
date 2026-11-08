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

## Protocolo de cambios futuros

1. Describir cambio solicitado en palabras del usuario.
2. Identificar requisito y documento afectado.
3. Presentar impacto en estabilidad, electrónica, energía, costo y seguridad, según aplique.
4. Documentar aprobación explícita antes de reemplazar una condición confirmada.
5. Añadir referencia a commit, circuito, prueba o incidencia.
