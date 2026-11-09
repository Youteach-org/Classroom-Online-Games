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
| Energía | Batería protegida, regulación y distribución separada lógica/motores | Por dimensionar |
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
