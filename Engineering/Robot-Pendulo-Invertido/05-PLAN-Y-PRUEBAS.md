# 05 — Ruta de trabajo y matriz de validación
**Regla:** avanzar por entregables medibles; registrar resultados antes de pasar de etapa.

| Etapa | Entregable | Prueba para cerrar la etapa |
|---|---|---|
| E0. Especificaciones | Dimensiones objetivo, presupuesto, esquema de bloques, riesgos | Requisitos revisados y decisiones documentadas. |
| E1. Modelo mecánico | Geometría, masa, ruedas, motores candidatos y par necesario | Cálculo de par/inercia y compatibilidad con carga real. |
| E2. Sensores analógicos | Montaje, calibración y filtros para ángulo/tasa | Medición de cero, respuesta al inclinar y al mover, ruido y ejes. |
| E3. Regulador analógico | Simulación y circuito en banco con salida medida | Polaridad correcta, estabilidad local y saturación controlada. |
| E4. Potencia y seguridad | Dos puentes H y detención física | Dirección, corriente, caída de alimentación, interruptor y prueba sin carga. |
| E5. Balanceo soportado | Robot equilibrándose dentro de estructura de protección | Respuesta reproducible a perturbaciones sin ESP32. |
| E6. Balanceo libre | Equilibrio sin soporte bajo condiciones controladas | Tiempo de equilibrio, recuperación y repetibilidad medidos. |
| E7. Consignas ESP32 | Avance/retroceso/giro seguros | Movimiento con control analógico activo y neutro ante reinicio ESP32. |
| E8. Termodetección | Sensado direccional, evasión y anticolisión | Pruebas con fuente tibia segura en varias posiciones; sin choque. |
| E9. Silbido y BLE | Detección por patrón y seguimiento del usuario | Pruebas de falsos positivos, desconexión y seguimiento en entorno real. |
| E10. Audio y ojos | Micrófono, bocinas y animaciones integradas | Comunicación funcional, ojos azules/rojos y modos coherentes. |
| E11. Integración | Robot funcional con protección de fallas | Repetición de todas las pruebas anteriores y escenarios combinados. |

## Formato obligatorio de registro de ensayos
- Fecha / responsable / etapa.
- Objetivo de la prueba.
- Revisión de hardware y firmware; valores de componentes/sintonía.
- Configuración y condiciones (batería, masa, piso, temperatura).
- Evidencia (fotografía, gráfica, video o mediciones, ruta del archivo).
- Resultado esperado, resultado obtenido y **aprobado / falló / pendiente**.
- Causa del fallo, acción correctiva y próxima prueba.

## Precauciones iniciales
- Nunca comenzar con pruebas libres de potencia elevada.
- Usar soporte o arnés que impida caídas y golpes durante primeras sintonías.
- Probar giro correcto y realimentación negativa con ruedas suspendidas.
- Hacer pruebas de temperatura con fuentes seguras, sin llamas.
- Una nueva función nunca puede invalidar una prueba de equilibrio anterior.

## Replanificación operativa — 17 de noviembre de 2026
**Indicación del usuario:** no detener el avance en la batería Samsung 18650; queda como subsistema de integración posterior. Prioridad inmediata: **cerrar y construir equilibrio analógico**, incluyendo mecánica y selección final de motores.

### Ruta crítica de las próximas sesiones
| Fecha objetivo | Actividad principal | Entregable y criterio de salida |
|---|---|---|
| 17–18 noviembre | Congelar geometría de chasis EVA v0.1, masa estimada, centro de masa, ruedas y motorreductores. Verificar par, velocidad, eje y corriente real de candidatos. | CAD revisado y ficha motor/rueda compatibles; **no** seleccionar GA25 solo por precio. |
| 17–20 noviembre, en paralelo | Diseñar esquema del sensor ADXL335 + giroscopio analógico de pitch, acondicionamiento, filtro, compensador y PWM/dirección analógicos, referencias y prueba segura. | Esquemático de circuitería **realizable y verificable**; simulación Proteus de etapas con modelos válidos. Si un modelo no existe, usar fuente equivalente **solo para probar el regulador**, sin afirmar que simuló físicamente el sensor. |
| 19–22 noviembre | Construcción de chasis portante, montaje de motores, sensores y placa de control, primero en soporte mecánico. | Pruebas de polaridad de realimentación negativa, respuesta de ruedas y paro de emergencia; pruebas con fuente limitada antes de batería. |
| 22–25 noviembre | Sintonía, balanceo soportado y después balanceo libre controlado. | Estabilidad reproducible con ESP32 desconectada; registro de tiempo vertical, respuesta a perturbaciones y corriente. |
| 20–27 noviembre, en paralelo | ESP32, pantalla económica, micrófono y audio TPA3110 en banco, modo ojos azul/rojo, silbido, termómetro fijo frontal y distancias. | Subsistemas probados por separado. Seguimiento BLE completo requiere solución direccional validada, no confiar solo en RSSI. |
| 26–30 noviembre | Integración, consignas de avance/giro limitadas, seguimiento condicionado a pruebas, carcasa final y documentación. | Demo estable y resultados registrados; ninguna función superior compromete equilibrio. |

**Fecha:** el 23 de noviembre es un objetivo agresivo de primer prototipo; el margen hasta el 30 permite integración y corrección, sin garantizar pruebas aún no realizadas.

### Bloqueos críticos que se deben resolver antes de compra o fabricación
1. Seleccionar motor por par, corriente y compatibilidad con rueda; el modelo CAD v0.1 usa una envolvente distinta al motor GA25 candidato.
2. Conseguir y validar giroscopio **con salida analógica** y eje de pitch; sin él no se declara cumplido el requisito de equilibrio analógico.
3. Definir un circuito completo de señales y puente H con neutro seguro incluso ante reinicio ESP32.
4. Documentar masa, centro de masa y montaje provisional; no imprimir carcasa cerrada antes de confirmar dimensiones reales.
5. Las celdas Samsung 18650 **ya existen**; solo se definirá 3S1P o 3S2P y BMS al dimensionar corriente y confirmar modelo. No bloquear lo anterior por ello.

**Estado a esta fecha:** documentación conceptual y archivo EVA_concepto_v01.scad; no hay circuito ni firmware de balanceo declarado probado. Toda compra exclusivamente Mercado Libre México.
