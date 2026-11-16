# 12 — Publicaciones individuales de compra: robot EVA
**Consulta:** 2026-11-15 · **Plataforma exclusiva:** Mercado Libre México.
**Propósito:** enlaces **a fichas concretas** (URL `/p/`, `/up/` o `/MLM-..._JM`), NUNCA enlaces `/listado/`. Las páginas de catálogo `/p/` pueden mostrar múltiples vendedores; las `/MLM-` son publicaciones de vendedores específicos. Disponibilidad y envío varían con fecha/código postal.
**REVISIÓN ELÉCTRICA:** leer [13 — Arquitectura de alimentación 3S](13-ARQUITECTURA-ALIMENTACION.md) antes de pagar. El amplificador TPA3110 recibe VBAT (~9.6–12.6 V), **no el buck de 5 V**. Las celdas 18650 aportadas todavía no tienen modelo, química ni corriente verificados: pendiente. La ESP32 DevKit se alimenta con 5 V regulados; el ADXL335 con 3.3 V limpio. El LDO 3.3 V se incorpora solo tras seleccionar módulo exacto. **No comprar LM2596 por duplicado para sensores**.
**ESTADO GENERAL:** enlaces identificados, no equivale a selección eléctrica o compra aprobada. Precio de búsqueda en MXN, revisarlo antes de pagar. No constan pedidos hechos.

## Tracción y mecánica
| Cantidad | Componente concreto | Precio visto MXN | URL individual | Observaciones |
|---|---|---:|---|---|
| 2 | Motorreductor GA25-370 12V 130RPM con encoder | 145 c/u | https://www.mercadolibre.com.mx/motor-cd-motorreductor-ga25-370-12v-130rpm-encoder/p/MLM2055722842 | **NO PAGAR aún** hasta validar torque, velocidad bajo carga, corriente de bloqueo, tipo de encoder y ajuste de ruedas. |
| 2 | BTS7960/IBT-2 puente H | 95.26 c/u | https://articulo.mercadolibre.com.mx/MLM-2890065155-modulo-puente-h-bts7960-43a-arduino-pic-_JM | Publicación individual, vendedor ELYRION; verificar entradas y disipación. |
| 2 | Rueda 95mm robot (candidata) | 200.10 c/u ref. | https://www.mercadolibre.com.mx/rueda-de-coche-chasis-robot-juguete-herramienta-para/p/MLM2028089773 | El eje/diámetro **NO verificados**; no comprar sin confirmar buje para GA25. |
| 1 rollo | PETG 1kg, 1.75mm | Desde 219 ref. | https://www.mercadolibre.com.mx/filamento-petg-175-mm-precision-dimensional-002mm-1kg-color-negro-auvyi/p/MLM50021367 | Confirmar diámetro adecuado a impresora. |

## Sensores y control analógico
| Cantidad | Componente concreto | Precio visto MXN | URL individual | Observaciones |
|---|---|---:|---|---|
| 1 kit | LM358P doble opamp, 10 piezas | 57 | https://www.mercadolibre.com.mx/10-piezas-de-lm358-lm358p-amplificador-operacional-doble/up/MLMU3072107977 | UNIT Electronics; DIP, comprobar versión antes de pagar. |
| 1 kit | LM393 doble comparador, 5 piezas | 69 | https://www.mercadolibre.com.mx/comparador-de-voltaje-doble-lm393-lm-393-diferencial-5-pzas/p/MLM2093032912 | Para protección y generación PWM analógica, requiere pull-up. |
| 2 | LM2907N convertidor frecuencia/voltaje, DIP8 | 46.99 c/u | https://www.mercadolibre.com.mx/lm2907-lm2907n-convertidor-de-frecuencia-a-voltaje/up/MLMU713821301 | Lazo de velocidad, sujeto a diseño de encoders/estabilidad. |
| 1 kit | Resistencias 600 piezas 1%, 1/4W | 79 | https://www.mercadolibre.com.mx/kit-de-resistencias-600-piezas-1-14w/up/MLMU924031925 | Componentes para filtros/sumadores. |
| 1 kit | Capacitores cerámicos 450 piezas | 179.99 | https://www.mercadolibre.com.mx/kit-de-capacitores-ceramicos-450-piezas-15-valores/up/MLMU562306198 | Confirmar surtido. |
| 1 pack | Protoboards 830 puntos, 5 piezas | 149.56 | https://www.mercadolibre.com.mx/5-piezas-protoboard-830-puntos-para-prototipado-arduino-pic/up/MLMU723001659 | **Solo señales de baja corriente**, nunca alimentación de motores. |
| 1 pack | Dupont 40 piezas 10 cm | 55 ref. | https://articulo.mercadolibre.com.mx/MLM-700911649-40pz-cable-dupont-10cm-elegir-macho-o-hembra-protoboard-_JM | Solo cables de señal. |

### Dos artículos analógicos sin publicación individual recuperada
- **ADXL335/GY-61**: búsqueda localiza $159–164, pero no recuperé URL individual fiable, por lo que **no inventar enlace**; pendiente de localizar.
- **ENC-03RC**: la tienda AG Electrónica lo anuncia en el catálogo de Mercado Libre por ~$182, pero NO se ha recuperado la URL concreta `/MLM-` o `/p/`. **Crítico** para cumplir equilibrio analógico independiente. No comprar un MPU6050 o ADXL345 en su lugar; son digitales y no cumplen la restricción sin rediseño de control en hardware analógico.

## Alimentación y carga de batería 3S, obligatoria
| Cantidad | Componente concreto | Precio visto MXN | URL individual | Observaciones |
|---|---|---:|---|---|
| 3 o 6 | **Celdas 18650 del usuario** | **$0 de compra nueva** | **No comprar** | Formato disponible, cantidad y características desconocidas: evaluar 3S1P o 3S2P. Paquete comercial descartado del carrito base. |
| **Condicional** | BMS 3S 40A con balanceo + fuente 12.6V/1A | Por confirmar | https://articulo.mercadolibre.com.mx/MLM-3316804507-bby-placa-bms-3s-40a-126v-con-equilibrio-y-fuente-126v-1a-_JM | **NO comprar junto con P03/P04 automáticamente.** La ficha atribuye rangos de carga inconsistentes; confirmar características reales y que la fuente sea cargador CC/CV Li-ion, no solo adaptador. Para pack con BMS, NO agregar otro BMS. |
| 1 | Cargador comercial Li-ion 3S 12.6V/1A | 229 | https://www.mercadolibre.com.mx/cargador-para-pilas-litio-de-3-celdas-126v1a-electronica/up/MLMU710470715 | Vendedor ELECTRONICADLD. Conectar solo si pack, BMS, polaridad, puerto y corriente son compatibles; BMS ≠ cargador. |
| 1 | Buck XL4015 ajustable para 5V, 5A anunciados | 76.56 ref. | https://www.mercadolibre.com.mx/xl4015-convertidor-dc-dc-buck-reductor-step-down/p/MLM47581545 | Medir 5.0V con multímetro antes de conectar electrónica; corriente real depende de calor. |
| 1 opcional, **no carrito base** | Buck LM2596 ajustable (alternativa no crítica, NO regulator 3.3 V limpio aprobado) | 79 | https://www.mercadolibre.com.mx/modulo-step-down-lm2596-ajuste-con-3-potenciometros/p/MLM2075703834 | No comprar automáticamente. Diseño base requiere LDO 3.3 V limpio desde buck 5 V, módulo exacto aún sin publicación individual validada. |
| 1 par | Conectores XT60 macho + hembra | 54.28 ref. | https://www.mercadolibre.com.mx/par-de-conector-para-bateria-xt60-enchufe-macho-y-hembra-lipo-dron-tecneu/p/MLM34967473 | Revisar polaridad conector compatible con pack. |

**Piezas de seguridad todavía sin URL individual verificable:** portafusibles/fusible DC, interruptor DC de corriente adecuada, botón de paro enclavable de contacto NC, cables de potencia, indicador de bajo voltaje. NO reemplazar enlaces faltantes por búsquedas ni improvisar capacidad DC. Para el primer armado pueden usarse piezas existentes del laboratorio solo si son adecuadas y verificadas.

## ESP32, ojos, audio, calor y distancias
| Cantidad | Componente concreto | Precio visto MXN | URL individual | Observaciones |
|---|---|---:|---|---|
| 1 | ESP32 DevKit V1 30 pines clásica | 124.99 | https://www.mercadolibre.com.mx/esp32-wifi-bluetooth-devkit-v1-30-pines-usb-c/p/MLM2038887439 | JELELECTRONICA; integrada a pantalla económica. Verificar pines GPIO25/26 DAC. |
| 1 | TFT ILI9341 2.8” SPI; publicación **incluye 2 paneles** | 247.69 el lote | https://articulo.mercadolibre.com.mx/MLM-3290475385-2-paneles-tactiles-con-pantalla-lcd-ili9341-spi-de-28-pulga-_JM | **Importación desde China**, plazo de entrega podría no cumplir; requiere usar solo un panel y dejar otro de respaldo. No hay pantalla de 959 en compra. |
| 1 | Micrófono I2S INMP441 | 85.99 | https://www.mercadolibre.com.mx/inmp441-microfono-omnidireccional-i2s-esp32-compatible/up/MLMU3876061481 | JELELECTRONICA, 3.3V, no conectar a 5V. |
| 1 | Amplificador estéreo TPA3110 2×15W nominales | 90.81 | https://www.mercadolibre.com.mx/modulo-amplificador-de-audio-tpa3110-de-doble-canal-2x15w-pa/p/MLM2058081803 | NO es MAX98357A, este fue rechazado por el usuario en DEA. Potencia nominal no equivale a potencia real a batería 3S. |
| 2 | Altavoz 38 mm, 4Ω, 10W | 95.56 c/u | https://articulo.mercadolibre.com.mx/MLM-6246008464-altavoz-redondo-de-10-w-4-ohmios-y-38-mm-_JM | **Importación**; confirmar tamaño real/cavidad. |
| 1 | Sensor térmico fijo MLX90614 / GY906 | 189 | https://www.mercadolibre.com.mx/sensor-de-temperatura-infrarrojo-mlx90614-gy-906/p/MLM2038445273 | Un único sensor frontal fijo, sin exploración móvil ni multiplexor. |
| 1 pack | 2 sensores distancia VL53L0X GY530 | 98.99 ref. | https://www.mercadolibre.com.mx/2-pzs-vl53l0x-modulo-sensor-distancia-laser-gy530-morado/up/MLMU4639802596 | Frontal y trasero. Comprobar presencia de pin XSHUT para direcciones distintas. |

## Enlaces individuales aún pendientes; **no se inventan**
- Giroscopio ENC-03RC analógico (crítico); acelerómetro ADXL335 (crítico).
- Rueda con buje confirmadamente compatible, soporte exacto del GA25 y tornillos/inserts; la rueda listada arriba aún no se ha validado.
- NE555 DIP, potenciómetros multivuelta, electrolíticos >=25V, placa perforada soldable y cable de cobre adecuado.
- Paro físico NC, interruptor DC, fusible/portafusible, alarma 3S y puerto de carga compatible.
- Bocinas nacionales equivalentes de 4Ω/10W, si los altavoces internacionales no llegan a tiempo.

## Alertas de compra
1. **No comprar paquete de batería**: el usuario aporta celdas 18650. La corriente admitida por las celdas debe verificarse para arrancar los motores.
2. **Una sola batería, protección y cargador compatibles**: si pack tiene BMS completo, no agregar segundo BMS; el BMS NO produce carga CC/CV. No usar TP4056 (1S).
3. **No pagar antes de determinar torque/corriente motores** y comprobar giro correcto del controlador analógico.
4. **No comprar por ahora** una pantalla de ~$959, MAX98357A, TCA9548A, SG90 de exploración térmica o cámara térmica.
5. Las URL de este archivo son páginas concretas del producto en Mercado Libre México, pero **no se ha comprobado el carrito personalizado de la cuenta, costo de envío a domicilio ni disponibilidad al momento exacto de pagar**.


## Cambio 2026-11-15 — Baterías propias
Se cuenta con celdas 18650 proporcionadas por el usuario. Compra de batería comercial = **$0 / excluida**. No se ha definido cuántas tiene, qué química ni corriente admiten. 3S1P y 3S2P son configuraciones candidatas. BMS 3S, cargador CC/CV compatible, aislantes, fusible y conexiones de potencia **sí siguen en la lista**. Ver [13-ARQUITECTURA-ALIMENTACION.md](13-ARQUITECTURA-ALIMENTACION.md).
