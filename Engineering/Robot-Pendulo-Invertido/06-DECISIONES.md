# 06 — Registro de decisiones y cambios
**Estado:** documento rector. Cada decisión nueva requiere fecha, responsable, alternativas y consecuencia.

| ID | Fecha | Decisión | Tipo | Razón / validación |
|---|---|---|---|---|
| D-001 | 2026-11-08 | Robot de péndulo invertido con dos ruedas. | **Confirmada por el usuario** | Alcance original. |
| D-002 | 2026-11-08 | Balanceo con electrónica **analógica** independiente de ESP32. | **Confirmada y no negociable** | Requisito expreso. |
| D-003 | 2026-11-08 | ESP32 administra sensores, seguimiento, audio y ojos. | **Confirmada** | Requisito expreso. |
| D-004 | 2026-11-08 | Alejamiento al detectar calor. | **Confirmada** | Requisito expreso. |
| D-005 | 2026-11-08 | Silbido activa seguimiento, preferentemente por Bluetooth del teléfono. | **Confirmado como objetivo; tecnología pendiente** | BLE RSSI no da orientación por sí solo. |
| D-006 | 2026-11-08 | Micrófono, bocinas y pantalla expresiva. | **Confirmada** | Requisito expreso. |
| D-007 | 2026-11-08 | Combate solo simulado, azul→rojo, ojos enojados. | **Confirmada** | Requisito expreso. |
| D-008 | 2026-11-08 | Documentación dentro de GitHub COG / Engineering. | **Confirmada** | Requisito expreso. |
| D-009 | 2026-11-08 | Guardar primera versión en rama documental sin modificar la web principal. | **Decisión operativa provisional** | Un push a main activa el despliegue de COG. |

## Pendiente de decidir, NO aprobado
- ESP32 exacta y esquema de audio.
- Tipo de motores/ruedas/chasis, masa y batería.
- Sensor de velocidad angular analógico concreto.
- Regulador y parámetros definitivos; captura de velocidad/posición.
- Arquitectura de seguimiento y compatibilidad de teléfono real.
- Tipo de comunicación de voz.
- Modelo y dimensiones de pantalla.
- Presupuesto, tamaño físico y objetivos cuantitativos.

## Plantilla de cambio
**D-XXX · Fecha · Solicitud · Opciones consideradas · Decisión expresa del usuario · Archivos afectados · Pruebas a repetir.**

**Prohibido:** tratar una recomendación del asistente como si el usuario hubiera aprobado un cambio de objetivo.

## D-010 · 2026-11-09 · Compra exclusiva en Mercado Libre México
**Decisión confirmada por el usuario:** Todos los componentes, materiales y accesorios que se compren para EVA deben adquirirse a través de Mercado Libre México (mercadolibre.com.mx). No proponer enlaces de compra de otros comercios. Antes de aprobar la selección, confirmar ficha técnica, stock, origen/tiempo de envío, compatibilidad y precio de una publicación de Mercado Libre. No confundir un componente candidato con uno validado. **Motivo:** restricción expresa de abastecimiento del proyecto y plazo estimado de 14–21 días.

## D-011 · 2026-11-15 · Costo de visualización, audio y alcance térmico
**Confirmado por el usuario:** rechazada pantalla de ~$959 por costo escolar; rechazada reutilización de MAX98357A por volumen insuficiente observado anteriormente con DEA; nunca se aprobó exploración térmica móvil. Suprimir servo de orientación de calor. No incluir multiplexor I2C en configuración con un único sensor térmico.
**Candidatos propuestos, NO aprobados aún por el usuario:** TFT color 2.8” ~$200 con ESP32-WROOM-32 ~$130, amplificador de entrada analógica TPA3110 ~$80–$100, dos bocinas 4 Ω 10 W ~$148/par, un solo sensor MLX90614 fijo frontal. GPIO DAC interno en ESP32 clásica para audio económico sujeto a prueba. Las especificaciones físicas, sonoras y fechas de envío siguen por verificar.
**Invariantes:** control de equilibrio analógico, funciones ESP32 y sistema de carga, BMS y alimentación completos; compras sólo en Mercado Libre México.
