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
- **Alimentación de operacionales, CORREGIDA por el usuario:** TL084CN cuádruple JFET DIP14, alimentación **+12 V/−12 V** por módulo XY-±12V Tecneu desde 5 V regulados. Pin4 positivo, pin11 negativo. Desacoplos adecuados y acondicionamiento de salida 0–3.3 V si se conecta al ADC ESP32-S3; no llevar ±12 V directamente a pines de la placa.
- **Convertidor elegido:** [XY-±12V Tecneu fuente simétrica ±12 V en Mercado Libre México](https://www.mercadolibre.com.mx/4-modulos-fuente-de-alimentacion-convertidor-adc-dac-3-5v-a-12v-amp-voltaje-estable-tecneu/p/MLM49768019). **No comprar** LM358 ni MCP6002 por recomendación anterior errónea. Ver detalles en 13-ARQUITECTURA-ALIMENTACION.md.

## 2026-11-21 — Sustitución de fuente simétrica: módulo Tecneu XY-±12V disponible en Mercado Libre
**El usuario reportó que la publicación DD1718PA citada previamente NO está disponible. Por tanto, se RETIRA como enlace de compra vigente; no reenviarla.**

**Nuevo módulo concreto y con existencia indicada en la publicación:** [Tecneu XY-±12V: paquete de 4 módulos DC/DC 2.8–5.5V a ±12V, Mercado Libre México](https://www.mercadolibre.com.mx/4-modulos-fuente-de-alimentacion-convertidor-adc-dac-3-5v-a-12v-amp-voltaje-estable-tecneu/p/MLM49768019), **$129.98 MXN por paquete de cuatro** según ficha consultada (consulta 2026-11-21, inventario/entrega puede variar).
- Modelo publicado **XY-±12V**; entrada según texto técnico detallado **2.8–5.5 V DC** (la tabla de metadatos de Mercado Libre contiene errata «55V», **NO** usar 55V como límite real). Desde buck **5.0 V regulados**, NO conectar directo a paquete 3S (9.6–12.6 V).
- Salidas declaradas: **+12 V hasta 50 mA**, **−12 V hasta 30 mA** estables, con **GND común**; potencia total anunciada 1.2 W. Un TL084CN típico (~1.4 mA/canal) requiere ~5.6 mA en reposo para sus cuatro amplificadores, por lo que el rango de corriente es razonable para el circuito analógico de baja corriente y entradas de alta impedancia; verificar **corriente real de salida en la rama negativa**, temperatura y rizado bajo las cargas del compensador. Si se conectan otras cargas, reevaluar.
- **Sin protección de corto/sobrecarga/inversión integrada**, según características de la publicación: agregar protección en línea y desacoplo/filtro cerca de TL084CN; respetar pin4 = +12 V, pin11 = −12 V, masa analógica referenciada en GND.
- La señal bipolar del TL084CN **no se conecta directamente a ADC ESP32-S3**; interfaz/atenuación y protección de 0–3.3 V obligatoria si se mantiene esa arquitectura.
- El **bajo costo del paquete de cuatro** permite repuesto, pero **solo se instala una unidad por rama del controlador** salvo que el presupuesto de corriente o ruido exija múltiples ramas. No cargar o probar sin circuito verificado.
**Fuente de inventario y especificaciones:** ficha Mercado Libre https://www.mercadolibre.com.mx/4-modulos-fuente-de-alimentacion-convertidor-adc-dac-3-5v-a-12v-amp-voltaje-estable-tecneu/p/MLM49768019 . **Fuente del TL084CN:** https://www.ti.com/lit/ds/symlink/tl084.pdf .
