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

## D-012 · 2026-11-15 · Arquitectura eléctrica provisional para dimensionar compras
**Propuesta técnica, NO decisión confirmada por el usuario:** Una batería 3S con BMS adecuado, bus VBAT ≈9.6–12.6 V en operación provisional; rama de motores y TPA3110 alimentadas por VBAT; buck 5 V para ESP32-S3 y DD1718PA, con fuente bipolar ±12 V específica para TL084CN; LDO 3.3 V de bajo ruido para sensores. El chip TPA3110 admite 8–26 V y no recibe 5 V; verificar placa comprada. Carga 3S por cargador CC/CV 12.6 V y puerto de BMS, sin alimentación del robot durante carga. **Bloqueo de selección:** no aprobar pack ni BMS hasta conocer corriente real o garantizada de motores, pantalla y audio. Fuentes, cálculos, diagrama y pruebas en 13-ARQUITECTURA-ALIMENTACION.md.


## D-013 · 2026-11-15 · Baterías 18650 ya disponibles
**Confirmado por usuario:** posee celdas formato **18650** y desea incorporarlas al robot; es posible considerar conexión serie/paralelo. «18650» designa formato, NO la cantidad de unidades. **Decisión de compras:** no adquirir pack comercial 3S como base, pues se aportarán celdas existentes. **Propuesta técnica pendiente de validar:** 3S1P (3 celdas) o 3S2P (6 celdas) compatibles y adecuadamente emparejadas. Pendientes marca/modelo, química, capacidad, corriente, estado y número disponible. BMS, cargador CC/CV adecuado a química, aislantes, conectores, fusibles y reguladores siguen en alcance. Alojamiento de batería del modelo CAD requiere comprobación, sobre todo 3S2P. Ver 13-ARQUITECTURA-ALIMENTACION.md.

## D-014 · 2026-11-21 · Base mecánica elegida por el usuario
**Confirmación del usuario:** usar como base para montar el resto de EVA el artículo [Mercado Libre México MLM2122316110 / ítem MLM2178515446](https://www.mercadolibre.com.mx/p/MLM2122316110?pdp_filters=item_id%3AMLM2178515446&sid=cart). No reemplazarlo por el chasis conceptual anterior ni comprar otro sin necesidad. La ficha del link de carrito fue inaccesible al consultar: **dimensiones, ruedas, motores, perforaciones y peso por revisar**, sin inventar especificaciones. Se adaptará la estructura al soporte real; la prueba de péndulo invertido requiere solo dos ruedas motrices apoyadas.
**Diseño de alimentación:** **TL084CN** con **fuente simétrica ±12 V** mediante DD1718PA desde buck 5 V; salida analógica a ESP32-S3 debe acotarse a 0–3.3 V. Fuente única 3S Samsung con buck, masa analógica separada de retornos de motores. No comprar componentes incompatibles ni cambiar el requisito histórico analógico independiente a digital sin reconocer el cambio.


## D-015 · 2026-11-21 · Operacional TL084CN y fuente ±12 V
**Confirmación inequívoca del usuario:** el operacional utilizado es **TL084CN**; LM358/MCP6002 fueron cambios erróneos sugeridos por el asistente y quedan descartados del circuito. **Selección de suministro:** [DD1718PA entrada 3.3–11 V y salida ±12 V](https://www.mercadolibre.com.mx/convertidor-de-voltaje-dd1718pa-salida-positiva-negativa-12v/up/MLMU707870570) alimentado con buck regulado a 5V del pack Samsung 3S. TL084CN DIP14 pin4 VCC+ y pin11 VCC−. Debe verificarse rizado y carga mínima que indica fabricante del convertidor, con adaptación a 0–3.3 V antes de ADC. Datasheet TI https://www.ti.com/lit/ds/symlink/tl084.pdf . Se actualiza 13-ARQUITECTURA-ALIMENTACION.md.
