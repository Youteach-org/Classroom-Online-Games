# 08 — Lista de materiales: candidatos verificables, NO orden de compra

**Fecha:** 2026-11-08. **Estado:** preselección con fuentes. Todas las cantidades para un robot; ninguna compra autorizada. Los componentes están sujetos a compatibilidad, masa y presupuesto.

**Leyenda:** [C] candidato técnico documentado; [O] alternativa; [D] pendiente de dimensionamiento. **No están aprobados como diseño definitivo.**

| Subsistema | Cant. | Componente candidato | Uso y observaciones | Estado |
|---|---:|---|---|---|
| Control interactivo | 1 | ESP32-S3-DevKitC-1-N16R8 (16 MB flash, 8 MB PSRAM) | audio, BLE, pantallas, sensores; no balance | C |
| Equilibrio angular | 1 | ADXL335, acelerómetro de salida analógica, ±3 g | actitud/gravedad; puede confundirse con aceleración de traslación | C |
| Velocidad angular | 1 | ADXRS652 (±250°/s) en placa EVAL-ADXRS652Z | voltaje analógico de velocidad de giro, montar eje z transversal para pitch; caro y BGA no apto para soldado directo fácil | C |
| Acelerómetro premium opcional | 1 | ADXL358 | salida analógica bajo ruido, pero límites de rango/placa distintos; evaluar si mejora realmente | O |
| Opamps balance/filtrado | 2–3 IC | TLV9064 (4 amplificadores RRIO por CI, 1.8–5.5 V) | referencia, filtrado, compensación, mezclas; cantidad final por simulación | C |
| Comparación PWM | 1–2 IC | LM393B (comparador doble colector abierto) u otro comparador apropiado | generar PWM por circuito analógico con rampa/triángulo; se debe revisar velocidad de transición y carga | C |
| Referencia de voltaje y regulación analógica | D | referencia estable y LDO de bajo ruido 3.3 V y 5 V | diseñar para deriva y ratiometría del gyro | D |
| Resistencias/capacitores | D | resistores 1% o mejores donde convenga, capacitores C0G/film y ajustables | ajuste del controlador y compensación analógica | D |
| Velocidad rueda sin MCU | D | encoder Hall + conversor frecuencia→tensión/medición analógica direccional si el lazo lo exige | velocidad de rueda dentro de lazo analógico; diseño por determinar | D |
| Motores de tracción | 2 | Pololu 37D 12 V 30:1 330 rpm, encoder 64 CPR, referencia activa **#4752** | 5.5 A bloqueo teórico por motor, 6 mm D shaft; no usar antigua referencia #2823 descatalogada | C |
| Driver tracción | 1 | Cytron MDD10A, doble motor DC, 5–30 V, 10 A continuos por canal | admite PWM tipo locked-antiphase/sign-magnitude; control analógico requiere etapa de conversión a PWM y verificación de modos | C |
| Ruedas | 2 | 90–100 mm con neumáticos de goma o TPU + adaptador para eje D 6 mm | no imprimir llanta rígida sin tracción | C |
| Soportes | 2 | soportes motor compatibles 37D y transmisión | insertos y rigidez | D |
| Servos brazos | 2 | MG90S o equivalentes microservo metálicos | 5–6 V desde alimentación separada; carga efectiva a calcular | C |
| Servo cuello/cabeza | **0** | **NINGUNO** | **Descartado por decisión D-012 del usuario: cabeza rígida y fija; no comprar servo de cuello** | **Descartado** |
| Pantallas ojos | 2 | Waveshare 1.28” GC9A01 SPI 240×240 | dos ojos independientes, SPI compartido con CS separados; ~40 mm PCB | C |
| Alternativa rostro | 1 | pantalla IPS rectangular ST7789 o similar | dos ojos dibujados en un visor; menor complejidad | O |
| Termografía | 1 | MLX90640 32×24 vía I²C (55° o 110°) | 768 temperaturas por cuadro; detecta fuentes y ubicación aproximada; no sustituir con RGB para termometría | C |
| Alternativa térmica | 1 | AMG8833 8×8 | menor resolución, debe evaluarse rango y FOV | O |
| Visión visible | 0–1 | OV2640 con placa/versión ESP32-S3 compatible | visión/seguimiento visual opcional; **no mide temperaturas** por color RGB | O |
| Distancia | 2–3 | VL53L1X ToF (hasta ~4 m según condiciones) | frontal y laterales; I²C con dirección/XSHUT gestionados | C |
| Micrófono | 1 | INMP441 o micrófono digital I²S validado | silbido y voz; confirmar ruido y disponibilidad | C |
| Audio salida | 1 | placa amplificador I²S estéreo dual MAX98357A, o 2 mono | propuesto estéreo 2x~3W | C |
| Bocinas | 2 | altavoces 4Ω ~3W, medida física a decidir | rejilla y volumen acústico, resistencia al ruido del motor | C |
| DAC mandos ESP32 | 1 | MCP4728 I²C de cuatro canales DAC 12 bits | consignas limitadas; requiere hardware de valor neutro/timeout y protección | C |
| Batería | 1 pack | pack Li-ion **3S** nominal 11.1 V / 12.6 V lleno, de fabricante fiable | capacidad/descarga a dimensionar; no comprar celdas sueltas sin experiencia de montaje seguro | C |
| BMS/protección | 1 | BMS 3S con balance y protección con rating real acorde a corriente/celdas | **no** equivale a cargador CC/CV; verificar pack integrado | D |
| Cargador | 1 | cargador comercial CC/CV 12.6 V compatible con química y pack protegido, o circuito BQ24610 debidamente diseñado | no usar TP4056 1S ni TP5100 1S/2S para 3S | C/O |
| Convertidor lógico | 1 | buck 3S→5 V para ESP32/pantallas/audio | capacidad según presupuesto real | D |
| Servo power | 1 | buck dedicado 5–6 V para servos | evitar caídas de voltaje en lógica/analógico | D |
| Sensor supply | 1 | LDO / filtro 3.3 y 5 V de bajo ruido | alimentación del lazo analógico independiente de picos motores | D |
| Protección | D | fusible, interruptor principal, emergencia, protección de polaridad, supresión EMI, sensado de batería | driver MDD10A sin protección automática de polaridad inversa en Vmotor | D |
| Cableado | D | conectores polarizados, fusibles, cable según corriente, PCBs para analógico/energía, tornillería M3 | no basarse en protoboard suelta durante operación | D |
| Impresión 3D | D | PETG, TPU para banda, insertos roscados, tapas, separadores | dependerá del CAD y opción estética | D |

## Fuentes y especificaciones

- ADXL335 1.8–3.6 V, salida analógica: https://www.analog.com/en/products/adxl335.html
- ADXRS652 5 V, ±250°/s, salida RATEOUT analógica: https://www.analog.com/en/products/adxrs652.html
- EVAL-ADXRS652Z, precio/stock variable: https://www.digikey.com/en/products/detail/analog-devices-inc/EVAL-ADXRS652Z/2342814
- TLV9064 RRIO 1.8–5.5 V: https://www.ti.com/product/TLV9064
- LM393 comparador: https://www.ti.com/product/LM393
- Pololu 37D helical #4752, 12 V, 330 rpm, 5.5 A bloqueo, 6mm eje: https://www.pololu.com/product/4752/specs
- Motor #2823 *obsoleto*, no comprar como referencia nueva: https://www.pololu.com/product/2823
- Cytron MDD10A, 10A/canal, 5–30 V, PWM hasta 20 kHz: https://www.cytron.io/c-motor-driver/c-dc-motor-driver/p-10amp-5v-30v-dc-motor-driver-2-channels
- Waveshare GC9A01 1.28”, SPI: https://www.waveshare.com/product/1.28inch-lcd-module.htm
- Melexis MLX90640 32x24: https://www.melexis.com/en/product/mlx90640/far-infrared-thermal-sensor-array
- SparkFun MLX90640 55°: https://www.sparkfun.com/ir-array-sensor-55-degree-fov-mlx90640.html
- ESP32-S3-N16R8: https://documentation.espressif.com/api/resource/path/docs/projects/esp-dev-kits/en/latest/esp32s3/esp32-s3-devkitc-1/user_guide_v1.1.html
- ESP32-S3 solamente Bluetooth LE (no Classic/A2DP/HFP): https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-guides/ble/overview.html
- MCP4728: https://learn.adafruit.com/adafruit-mcp4728-i2c-quad-dac/overview
- Amplificador I²S estéreo: https://www.adafruit.com/product/6513
- ToF VL53L1X: https://www.adafruit.com/product/3967
- BQ24610 cargador 1–6 celdas, no es BMS/balanceo independiente: https://www.ti.com/product/BQ24610

## Bloqueos antes de orden de compra

1. Validar masa, altura centro de gravedad y margen de par/velocidad de motores.
2. Obtener PCB real del giroscopio analógico y hoja de datos; verificar orientación del eje y rango antes de usarlo.
3. Simular y medir la generación de PWM **por el controlador analógico**, no por la ESP32.
4. Elegir 3S pack+protección+cargador emparejados con hoja de datos, carga nominal y protección de cortos.
5. Determinar distribución física y alimentación simultánea, incluidos ruido del motor y servos.
6. Diseñar la carrocería **tipo EVA con cabeza fija**; seleccionar tamaño y tipo de visor/ojos.
7. Decidir comportamiento Bluetooth real del teléfono y si el audio es conversación Wi-Fi, intercomunicador o frases locales.
8. Verificar precios, distribución y existencias en México en fecha de pedido.

**Aviso:** módulos de equilibrio baratos tipo MPU-6050 son digitales y no cumplen requisito R-01 si actúan como sensor principal del lazo.
