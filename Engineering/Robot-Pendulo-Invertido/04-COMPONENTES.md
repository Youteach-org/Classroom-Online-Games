# 04 — Inventario y selección de componentes
**No hay lista de compra definitiva.** Este registro diferencia funciones necesarias de modelos candidatos.

| Subsistema | Elementos requeridos | Estado |
|---|---|---|
| Estructura | Chasis rígido, dos ruedas coplanares, centro de masas medible, soporte de prueba | Por diseñar |
| Tracción | Dos motores reversibles con reducción, soporte, acoplamiento y dimensiones compatibles | Por dimensionar |
| Potencia de motores | Dos canales de puente H, capacidad de corriente de pico y protección | Por seleccionar |
| Equilibrio | Acelerómetro analógico y giroscopio analógico alineado a pitch | Validar disponibilidad y montaje |
| Electrónica analógica | Amplificadores/filtros/comparadores, referencias, oscilador/modulación, protecciones | Por diseñar |
| Procesador superior | Una ESP32 con BLE, I2S, SPI y GPIO suficientes | Modelo por seleccionar |
| Sensado térmico | Sensor(es) sin contacto con capacidad de discriminar dirección/sector | Por seleccionar |
| Anticolisión | Sensor(es) de distancia frontal/lateral apropiados | Por seleccionar |
| Audio | Micrófono, amplificador y una o más bocinas | Por seleccionar |
| Visual | Una pantalla para ojos y soporte mecánico | Por seleccionar |
| Energía | Celdas 18650 del usuario, pack 3S1P/3S2P por verificar, BMS, cargador adecuado, regulación y distribución separada | **Celdas disponibles; cantidad y especificaciones por comprobar** |
| Seguridad | Interruptor físico, fusibles/protecciones, sujeción para ensayo | Obligatorio |
| Telemetría/ajuste | Puntos de medición, instrumentos y controles de ajuste analógicos | Por diseñar |

## Criterios antes de comprar
1. Masa total objetivo y altura del centro de gravedad.
2. Diámetro de ruedas, distancia entre ruedas, velocidad buscada.
3. Momento de inercia aproximado y par disponible al eje.
4. Tensión/corriente nominal, arranque, bloqueo y pérdida en puentes H.
5. Capacidad de batería y picos de consumo (pantalla, audio, radio, motores).
6. Disponibilidad real en México, encapsulado soldable, piezas de repuesto y presupuesto.
7. Para el giroscopio: verificar eje físico, ancho de banda, nivel de cero, ruido, saturación y formato de salida.
8. Compatibilidad eléctrica de señales analógicas con niveles ESP32 3.3 V.

## Nota de sensor
ADXL335 tiene salidas analógicas. ADXRS652 es un posible giroscopio analógico, pero no está aprobado para compra y requiere comprobar montaje, precio y orientación. No diseñar el sistema alrededor de un componente obsoleto o difícil de conseguir sin conocer esas limitaciones.

## Presupuesto
Pendiente de definir en MXN, con margen para prototipos, fallas y repuestos.

## Restricción de abastecimiento aprobada — 2026-11-09
**Solo Mercado Libre México (mercadolibre.com.mx).** Cada línea de compra definitiva debe incluir publicación de Mercado Libre, precio vigente, entrega estimada para el destino real, disponibilidad, vendedor, especificaciones verificadas y alternativa dentro de la misma plataforma. Priorizar publicaciones con entrega nacional rápida ante el plazo de 14–21 días. No comprar motores ni sensores por coincidencia de nombre sin revisar características eléctricas y mecánicas. Los listados actuales son candidatos, no compras ni piezas aprobadas.


## Material disponible: celdas 18650 (2026-11-15)
El usuario cuenta con celdas tipo 18650 que pueden formar un paquete serie/paralelo tras verificar su compatibilidad y estado. No se infiere que posea dieciocho unidades. No comprar paquete comercial 3S de momento; la selección entre 3S1P y 3S2P depende de química, corriente, capacidad, masa, motores y CAD. Los módulos de carga, BMS y protección siguen pendientes. Ver [13-ARQUITECTURA-ALIMENTACION.md](13-ARQUITECTURA-ALIMENTACION.md).

## 2026-11-21 — Base mecánica y rieles analógicos
- **Base elegida para EVA por el usuario:** [MLM2122316110 / artículo MLM2178515446 en Mercado Libre](https://www.mercadolibre.com.mx/p/MLM2122316110?pdp_filters=item_id%3AMLM2178515446&sid=cart). Integrar módulos sobre esta base; características mecánicas exactas de la ficha aún inaccesibles, no declarar que equivale a 2WD/4WD ni qué motor contiene. El bastidor y carcasa 3D se ajustarán a la base; no comprar otro chasis por duplicado.
- **Alimentación de operacionales:** LM358 a **5 V analógicos filtrados** (si subsiste lazo analógico totalmente independiente), MCP6002 rail-to-rail a **3.3 V por LDO** si la prioridad es leer acelerómetro y giróscopo por ADC de ESP32-S3. Desacoplo 100 nF y referencia de mitad de riel; no se requiere ±12 V, ni llevar salida de 5 V directa al ADC.
- **Producto candidato:** [MCP6002 DIP-8 Mercado Libre México](https://www.mercadolibre.com.mx/mcp6002ep-amplificador-operacional-doble-186v-30ma-1mh/up/MLMU3909416955), ~$114. Se conserva LM358 previamente listado para el controlador analógico, no comprar ambos sin confirmar arquitectura. Ver detalles en 13-ARQUITECTURA-ALIMENTACION.md.
