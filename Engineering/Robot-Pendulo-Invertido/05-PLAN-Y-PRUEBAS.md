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
