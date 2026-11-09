# 11 — Lista de compra EVA · Mercado Libre México
**Fecha:** 2026-11-09 · **Estado:** investigado / candidatos, NO comprado ni completamente validado.
**Restricción aprobada:** el 100% de las compras debe efectuarse por Mercado Libre México (mercadolibre.com.mx). No comprar en ningún otro comercio.
**Plazo objetivo:** 14–21 días desde 2026-11-09. El envío depende del código postal de entrega; una ficha indexada NO confirma existencias ni entrega a tiempo.
**Prioridad:** lo necesario para equilibrio analógico funcional; mecánica y ESP32 en paralelo.
**IMPORTANTE:** enlaces rotulados «publicación» apuntan a producto; enlaces «listado» abren resultados reales de Mercado Libre para seleccionar vendedor. Precio de referencia capturado en búsqueda, puede variar. «Pendiente» indica falta de certificación técnica, de stock o de compatibilidad.

## A. Tracción y estructura
| ID | Cantidad | Componente | Enlace Mercado Libre México | Precio visto, MXN | Estado / prueba obligatoria |
|---|---:|---|---|---:|---|
| M01 | 2 | Motorreductor GA25-370 de 12 V, 130 rpm, **con encoder** | [Publicación](https://www.mercadolibre.com.mx/motor-cd-motorreductor-ga25-370-12v-130rpm-encoder/p/MLM2055722842) | $145 c/u | **Candidato**. Verificar par real, corriente de bloqueo, tipo y voltaje del encoder, eje, peso y **ambos motores del mismo modelo**; no comprar sin confirmar estas especificaciones. |
| M02 | 2 | Rueda de 95 mm, buje de 4 mm | [Publicación](https://www.mercadolibre.com.mx/rueda-de-coche-chasis-robot-juguete-herramienta-para/p/MLM2028089773) | $200.10 c/u | Candidato; verificar ajuste en eje tipo D y agarre, no solo diámetro. El archivo EVA v0.1 dibujaba ruedas de 96 mm. |
| M03 | 2 | Soporte de motorreductor de 25 mm | [Listado](https://listado.mercadolibre.com.mx/soporte-para-motorreductor) | $77.04 ref./pieza | Buscar soporte compatible con diámetro, longitud, tornillería y cara frontal del GA25. |
| M04 | Según fabricación | PETG/PLA, tornillos M3, separadores, inserts, arnés mecánico de pruebas | [Listado de placas y materiales mecánicos](https://listado.mercadolibre.com.mx/soporte-para-motorreductor) | Pendiente | No hay SKU confirmado; diseñar antes chasis portante y carcasa, con CAD y mediciones; la carcasa no debe sostener por sí sola las cargas dinámicas. |

## B. Equilibrio analógico, sin ESP32 en el lazo
| ID | Cantidad | Componente | Enlace Mercado Libre México | Precio visto, MXN | Estado / prueba obligatoria |
|---|---:|---|---|---:|---|
| A01 | 1 (+1 respaldo deseable) | Acelerómetro **analógico** GY-61 / ADXL335 | [Listado](https://listado.mercadolibre.com.mx/acelerometro-adxl335) | Desde $159–164.26 | Analógico X/Y/Z; confirmar escala, tensión y pines. |
| A02 | 1 (+1 respaldo deseable) | Giroscopio analógico **ENC-03RC**, un eje | [Listado real con vendedor AG Electrónica](https://listado.mercadolibre.com.mx/electronica-audio-video/componentes-electronicos/sensores-inductivos/_Tienda_all_BRAND_38446472) | $182 | **CRÍTICO**. El resultado aparece en Mercado Libre, pero falta URL de publicación individual verificable y confirmar entrega. Exigir salida analógica, eje correcto para pitch, calibración de reposo y frecuencia útil. |
| A03 | 1 paquete | Amplificadores operacionales LM358 DIP-8 | [Listado](https://listado.mercadolibre.com.mx/amplificador-lm358) | Desde $49.99/10 | Para referencia, filtros, sumadores, compensación. Verificar limitaciones de salida y rango común a la tensión elegida. |
| A04 | 1 paquete | Comparadores LM393 DIP-8 | [Publicación](https://www.mercadolibre.com.mx/comparador-de-voltaje-doble-lm393-lm-393-diferencial-5-pzas/p/MLM2093032912) | $69 / 5 | Control PWM y señales de protección; requiere resistencias pull-up. |
| A05 | 1 paquete | NE555 DIP-8 | [Listado](https://listado.mercadolibre.com.mx/ne555-temporizador) | Desde $60–65/paquete | Candidato de oscilación; PWM y direccionalidad son circuitería **analógica**. |
| A06 | 2 | LM2907N convertidor frecuencia a tensión para señales de encoder | [Publicación](https://www.mercadolibre.com.mx/lm2907-lm2907n-convertidor-de-frecuencia-a-voltaje/up/MLMU713821301) | $46.99 c/u | Para lazo analógico opcional de velocidad / antideriva; comprobar topología y señal limpia de encoder. |
| A07 | 1 kit | Resistencias 1/4 W 1%, kit 600 piezas | [Publicación](https://www.mercadolibre.com.mx/kit-de-resistencias-600-piezas-1-14w/up/MLMU924031925) | $79 | Ganancias y filtros según simulación y pruebas. |
| A08 | 1 kit | Capacitores cerámicos surtidos | [Publicación](https://www.mercadolibre.com.mx/kit-de-capacitores-ceramicos-450-piezas-15-valores/up/MLMU562306198) | $179.99 | 50 V; verificar valores incluidos. |
| A09 | 1 kit | Capacitores electrolíticos 10–470 µF, tensión ≥25 V en rama de 12 V | [Listado](https://listado.mercadolibre.com.mx/kit-capacitores) | Por elegir | Filtrado/bulk según esquema; no dimensionar únicamente con el kit genérico. |
| A10 | 4–8 | Potenciómetros/trimmers multivuelta 10 kΩ y valores según compensador | [Listado](https://listado.mercadolibre.com.mx/potenciometro-multivueltas-10k) | Por elegir | Ajuste fino de cero y ganancias, asegurar bloqueo posterior. |
| A11 | 2–3 | Protoboard de 830 puntos para pruebas de baja corriente | [Publicación, paquete 5](https://www.mercadolibre.com.mx/5-piezas-protoboard-830-puntos-para-prototipado-arduino-pic/up/MLMU723001659) | $149.56/5 | **No** pasar corriente de motor por protoboard. |
| A12 | 2–4 | Placa fenólica perforada soldable | [Listado](https://listado.mercadolibre.com.mx/placas-fen%C3%B3licas-perforadas) | Desde $68.80/4 | Migrar el circuito de equilibrio a soldadura antes de ensayos libres. |
| A13 | Según esquemático | Conectores, cable de señal, headers, zócalos DIP y desacoplo local | [Listado de componentes pasivos](https://listado.mercadolibre.com.mx/electronica-audio-video/componentes-electronicos/pasivos/_Tienda_all_BRAND_18495859?filter=BRAND) | Por elegir | Diseño y valores exactos pendientes. |

## C. Puentes H, batería, carga y distribución: **no omitir**
| ID | Cantidad | Componente | Enlace Mercado Libre México | Precio visto, MXN | Estado / prueba obligatoria |
|---|---:|---|---|---:|---|
| P01 | 1 paquete (2 piezas) | **2 × BTS7960/IBT-2**, puente H reversible, uno por motor | [Listado de 2 BTS7960](https://listado.mercadolibre.com.mx/m%C3%B3dulo-puente-h-bts7960-43a) | Desde $207/2 | Candidato. «43 A» es reclamo comercial **no** corriente continua asegurada; verificar corriente real, polaridad, entradas RPWM/LPWM, refrigeración y volumen. TB6612FNG (1.2 A/canal) no se selecciona para motores con bloqueo mayor. |
| P02 | 1 | Pack 3S de iones de litio, 11.1 V nominal, 12.6 V cargado, con BMS **integrado**, candidatos 3S1P 2200 mAh | [Publicación](https://www.mercadolibre.com.mx/2200mah-111v-3s1p-baterias-18650/p/MLM47643895) | $249.99 | **NO APROBADA PARA MOTORES TODAVÍA**: descripción menciona BMS integrado, pero falta corriente sostenida y de pico, grosor del cable y polaridad. Elegir pack con descarga compatible con corriente de bloqueo y consumo total; si no, cambiar de pack. |
| P03 | **Condicional: 1 si pack no tiene BMS** | Placa BMS **3S** con protección, **balanceo confirmado** y corriente adecuada | [Listado](https://listado.mercadolibre.com.mx/modulo-bms-3s) | $58–85 ref. | **No añadir automáticamente un segundo BMS a un pack ya protegido.** Exigir explícitamente balanceo, protección contra sobrecarga, sobredescarga, sobrecorriente y cortocircuito y conexionado del fabricante. Evitar soldar directamente celdas 18650 sueltas. |
| P04 | 1 | **Cargador para Li-ion 3S, 12.6 V, 1 A, CC/CV** | [Publicación](https://www.mercadolibre.com.mx/cargador-para-pilas-litio-de-3-celdas-126v1a-electronica/up/MLMU710470715) | $229 | Comprobar que sea realmente cargador Li-ion CC/CV (no fuente 12 V corriente libre); conector y polaridad de pack. **BMS NO es cargador**. |
| P05 | 1–2 | DC-DC **XL4015** reductor ajustable de tensión de batería a **5 V** | [Publicación](https://www.mercadolibre.com.mx/xl4015-convertidor-dc-dc-buck-reductor-step-down/p/MLM47581545) | $76.56 c/u | Ajustar a 5.0 V con multímetro antes de conectar ESP32/pantalla, micrófonos o servos. Corriente real y disipación a validar. |
| P06 | 1 | DC-DC **LM2596** reductor ajustable a 3.3 V para sensores o regulador 3.3 V de bajo ruido desde 5 V | [Publicación](https://www.mercadolibre.com.mx/modulo-step-down-lm2596-ajuste-con-3-potenciometros/p/MLM2075703834) | $79 | Analógico necesita filtrado/referencia limpia; regulador de 3.3 V **no debe** recibir tensión no medida. |
| P07 | 1 | Interruptor de alimentación accesible | [Listado de conectores / eléctrica](https://listado.mercadolibre.com.mx/conector-xt-60) | Por elegir | Interruptor adecuado a corriente DC del sistema y posición accesible. No es sustituto de deshabilitación segura de puente H. |
| P08 | 1 | Portafusibles y fusible para rama de batería/motores | [Listado](https://listado.mercadolibre.com.mx/bms-12v) | Por elegir | **Pendiente de enlace específico**: elegir fusible DC según sección de cable, corriente medida y capacidad del pack; colocarlo cerca de batería. Este listado es una búsqueda provisional, no publicación del fusible. |
| P09 | 1–2 pares | XT60 o conectores de potencia polarizados | [Publicación](https://www.mercadolibre.com.mx/par-de-conector-para-bateria-xt60-enchufe-macho-y-hembra-lipo-dron-tecneu/p/MLM34967473) | $54.28/par | Confirmar que los conectores y cableado soporten la corriente y coincidan con el pack. |
| P10 | Según diseño | Cable de potencia 16–18 AWG, terminales, distribución de tierra y condensadores bulk | [Listado XT60 y cables](https://listado.mercadolibre.com.mx/conector-xt-60) | Por elegir | Longitud/sección y conectores sin decidir; separar retorno de motor de tierra de señal. |
| P11 | 1 | Indicador/alarma de bajo voltaje **3S** y límite de descarga | [Listado BMS 3S](https://listado.mercadolibre.com.mx/bms-3s) | Por elegir | No descargar celdas por debajo del límite del fabricante; definir desconexión de motor/seguridad. |
| P12 | 1 | Puerto de carga mecánico **compatible con el pack/cargador** | [Listado XT60 y conectores](https://listado.mercadolibre.com.mx/conector-xt-60) | Por elegir | No fijar conector DC 5.5mm hasta identificar pin positivo y corriente del pack escogido. |

### Interconexión de alimentación obligatoria
```
CARGADOR Li-ion 3S 12.6 V CC/CV -> Puerto de carga diseñado según pack/BMS
PACK Li-ion 3S con protección y balanceo adecuados
  -> Fusible DC cerca de batería -> Interruptor DC / desconexión de motor
     -> Rama potencia -> 2 × Puente H -> Motores izq./der.
     -> Buck regulado 5 V -> ESP32, pantalla*, amplificador de audio, servos
     -> Regulación / filtrado 3.3 V + referencia limpia -> analógico y sensores compatibles
```
*La alimentación de la pantalla/ESP32 dependerá de su variante exacta y ficha técnica; no conectar 5 V a una entrada exclusivamente de 3.3 V.
*Si el pack ya trae BMS, **P03 es una referencia condicional y no se instala por duplicado**. Confirmar si el BMS integrado efectivamente balancea; un BMS solo de protección no necesariamente lo hace.
*Para una batería de litio 3S nunca usar cargador TP4056 (1S), adaptador genérico 12 V ni 12.6 V sin control de carga. No cargar un pack al que le falten protecciones verificadas; no dejar cargando sin vigilancia.
*El BMS y cargador deben tener tasas de carga y descarga compatibles con el pack real y las cargas de arranque. Nunca usar protoboard para esta distribución.
*Las tensiones y protecciones son partes obligatorias del diseño incluso si se prueba primero en banco.

## D. ESP32, ojos, audio, calor, seguimiento y anticolisión
| ID | Cantidad | Componente | Enlace Mercado Libre México | Precio visto, MXN | Estado / prueba obligatoria |
|---|---:|---|---|---:|---|
| D01 | 1 | **Pantalla 4.3” con ESP32-S3 integrada**, 800×480 (candidata) | [Publicación](https://www.mercadolibre.com.mx/esp32-s3-43inch-capacitive-touch-display-development-board/p/MLM2043327177) | Desde $959.01 | **CANDIDATA con riesgo de importación**. Confirmar realmente disponible, fecha para destino, dimensiones, puertos libres, audio I2S y tensión de alimentación antes de pagar. |
| D02 | **Alternativa a D01, NO sumar ambas sin motivo** | ESP32-S3 DevKitC N16R8 + pantalla SPI menor (3.5” ILI9488) | [ESP32 listado](https://listado.mercadolibre.com.mx/esp32-s3-devkitc-1-n16r8) · [Pantalla publicación](https://www.mercadolibre.com.mx/35--tft-lcd-ili9488-480x320-rgb-tactil-xpt2046-sd-esp32/up/MLMU565688757) | ESP32 desde $189–205; LCD por elegir | Contingencia si D01 tarda o limita pines. Cambiar visor exige revalidar diseño 3D. La pantalla publicada muestra ficha contradictoria: verificar **foto/driver/resolución** antes de comprar. |
| D03 | 1 | Micrófono digital INMP441 I2S, 3.3 V | [Publicación](https://www.mercadolibre.com.mx/modulo-microfono-omnidireccional-mh-et-i2s-inmp4-para-esp32/p/MLM2079054086) | $90 | Si pantalla elegida incluye micrófono/audio, evaluar redundancia. |
| D04 | 1–2 | Amplificador de audio I2S MAX98357A 3 W | [Publicación pack 2](https://www.mercadolibre.com.mx/2-pzs-modulo-de-amplificador-audio-i2s-clase-d-con-max98357a/up/MLMU4117794883) | $98.80/2 | Verificar alimentación, impedancia y pines I2S disponibles. Dos bocinas -> dos canales amplificados si se desea estéreo/dual mono. |
| D05 | 2 | Bocinas 40 mm, 4 Ω, 3 W | [Publicación pack 2](https://www.mercadolibre.com.mx/2-altavoces-speaker-bocina-parlante-40mm-4-ohms-3w-arduino/up/MLMU3713214823) | $134.10/2 | Ubicación y cavidad acústica pendientes. |
| D06 | 1, o 2 si se decide vista bilateral | Termómetro IR **MLX90614 / GY-906** | [Publicación](https://www.mercadolibre.com.mx/sensor-de-temperatura-infrarrojo-mlx90614-gy-906/p/MLM2038445273) | Desde $189 c/u | No confundir temperatura de objeto con dirección. Un único sensor fijo detecta frente; para evasión direccional, usar segundo sensor/multiplexor o escaneo con servo. |
| D07 | Condicional 1 | Multiplexor I2C TCA9548A si se usan ≥2 sensores I2C con la misma dirección | [Listado](https://listado.mercadolibre.com.mx/tca9548a) | Desde $49.50 | Verificar niveles lógicos y pull-ups de los buses. |
| D08 | 2 | Sensor de distancia VL53L0X frontal/trasero (anticolisión) | [Listado](https://listado.mercadolibre.com.mx/vl53l0x) | Desde $65.99–99/pack | Verificar cono útil y que no exista colisión al retroceder; dos sensores I2C requieren XSHUT o multiplexor. |
| D09 | Condicional 1 | Microservo SG90 180° para orientar sensor térmico si se escoge **un solo MLX90614** | [Publicación pack 2](https://www.mercadolibre.com.mx/tecneu-2-servomotor-micro-sg90-16kg-servo-motor-arduino-pic-180/p/MLM48081653) | $99/2 | Alternativa a 2 sensores térmicos. El servo NO es parte del equilibrio; limitar aceleración al moverlo. |
| D10 | Alternativa costosa a D06-D09 | Cámara térmica AMG8833 8×8 | [Listado](https://listado.mercadolibre.com.mx/amg8833) | Desde $552.66, principalmente internacional | NO comprar conjuntamente sin comparar fecha de entrega; localización térmica más directa pero mucho más cara. |
| D11 | Software / quizá hardware adicional | Baliza BLE del teléfono y algoritmo de seguimiento | [ESP32 listado](https://listado.mercadolibre.com.mx/esp32-s3-devkitc-1-n16r8) | No fijado | **RSSI BLE por sí solo NO indica rumbo**. Probar con teléfono real; no dar por implementado seguimiento direccional hasta demostrarlo. |
| D12 | Software | Ojos, animaciones, modo combate simulado, silbido y voz | Usa D01-D05 | — | Programación por etapas y prueba I2S/BLE; no depender del balance analógico. |

## E. Registro del pedido y validaciones pendientes antes de autorizar compra
- **PENDIENTE 1 (crítico):** masa total prevista, distribución de centro de gravedad, par mínimo, aceleración y corriente de bloqueo de motores para validar M01, P01 y P02.
- **PENDIENTE 2 (crítico):** confirmar enlace individual y fecha de entrega del ENC-03RC en Mercado Libre; verificar eje de medición y salida analógica.
- **PENDIENTE 3 (crítico):** escoger pack 3S **capaz de corriente de motor**, con protección/balanceo real, o hacer rediseño seguro de pack; confirmar cargador 12.6 V CC/CV, polaridad y conectores. La publicación 3S1P de referencia **no está autorizada aún**.
- **PENDIENTE 4:** seleccionar D01 o D02 según pantalla física, conectividad GPIO y entrega; no comprar ambas automáticamente.
- **PENDIENTE 5:** definir D06-D09 (escaneo térmico vs dos sensores) y D08 anti-colisión.
- **PENDIENTE 6:** obtener enlace y seleccionar interruptor DC, portafusible/fusible, conductores y tornillería específicos, no sustituibles con búsquedas generales.
- **PENDIENTE 7:** verificar código postal real y fechas estimadas en **Mercado Libre México**, no confiar en mensajes de entrega personalizados de índices.
- **PENDIENTE 8:** presupuesto máximo MXN; registrar cada ítem como NO_COMPRADO / COMPRADO / RECIBIDO / PROBADO con evidencia.
- **PENDIENTE 9:** probar analogía de estimación de ángulo, signo de realimentación, PWM, dirección, neutralización sin ESP32 y transición de fallo antes de retirar estructura de seguridad.
- **PENDIENTE 10:** el 4.3 integrado puede usar la mayor parte de sus GPIO; pinout final y compatibilidad de doble I2S, PWM/consignas y sensores depende de referencia exacta.

## Notas de estado
Esta es una **lista trazable de abastecimiento** y arquitectura, no un esquemático comprobado ni una autorización de compra. Un listado con un enlace de búsqueda no es un producto seleccionado. No se afirma que todos los componentes estén en stock hoy o que lleguen antes de una fecha sin código postal. Todos los enlaces de compra son de **Mercado Libre México**.
