# 13 — Arquitectura eléctrica y presupuestos de potencia del robot EVA
**Fecha:** 2026-11-15 · **Estado:** arquitectura base propuesta, **no esquema terminado ni compra aprobada**.
**Control de cambios:** responde a la objeción de que las compras anteriores no tenían tensiones definidas. Un componente que usa 5 V no obliga a que todo el robot opere a 5 V.
**Invariante:** equilibrio analógico autónomo, independiente de la ESP32. Compras **solo Mercado Libre México**. Sin pantalla cara, sin MAX98357A, sin exploración térmica móvil.

## 1. Decisión arquitectónica provisional: una sola fuente primaria 3S
**Celdas formato 18650 disponibles del usuario.** El número de celdas, su modelo y química todavía se desconocen; evaluar 3S1P (3 celdas) o 3S2P (6 celdas), con BMS 3S compatible. **No comprar paquete de batería comercial como base.**
- Batería 3S Li-ion: **12.6 V completamente cargada**, **11.1 V nominal**; usar 9.6 V (≈3.2 V/celda) como **punto inicial conservador de aviso de baja batería**, pendiente de fijar con ficha de celdas y medición bajo carga. No es un umbral definitivo de apagado; BMS tendrá corte según su fabricante.
- El llamado “bus de 12 V” es **VBAT sin regular, de aproximadamente 9.6 a 12.6 V** durante el rango operativo de diseño, no 12.0 V constantes.
- No usar batería de 5 V para motores/TPA3110 ni un convertidor de 5→12 V de potencia improvisado.
- El cargador y BMS no se confunden: un **cargador CC/CV Li-ion 3S de 12.6 V** suministra la carga por el puerto y cableado del BMS/pack; el **BMS** protege y balancea las celdas, con capacidad de descarga adecuada. El cargador se conecta de forma prevista por la ficha del pack/BMS, no directamente a tres celdas sin protección.
- Operación durante carga: **prohibida en esta arquitectura base**; sin circuito power-path no asumir que puede alimentar motores y cargarse simultáneamente. Priorizar recarga con robot apagado.
- Las celdas 18650 sueltas requieren protección/balanceo apropiados en el pack; seleccionar BMS 3S compatible y verificar si las celdas llevan protección individual. Pack comercial 3S1P 2200mAh queda retirado de la compra base.

## 2. Diagrama eléctrico de alimentación a nivel de bloques
```text
                           RED CA
                             │
                   CARGADOR Li-ion 3S
                   CC/CV 12.6 V (1 A inicial)
                             │
                Puerto de carga del robot
                             │
          ┌──────────────────┴──────────────────┐
          │ BATERÍA 3S + BMS con balanceo real │
          │ VBAT ≈ 9.6–12.6 V en operación    │
          └──────────────────┬──────────────────┘
                             │
                   FUSIBLE PRINCIPAL DC
                             │
             INTERRUPTOR GENERAL DC
                             │
                       BUS VBAT
              ┌──────────────┼──────────────────┐
              │              │                  │
           RAMA A         RAMA B             RAMA C
           MOTOR          AUDIO              LÓGICA
              │              │                  │
       Filtro/bulk     Filtrado de         Convertidor
       + seguridad     alimentación        buck 5.0 V
              │              │                  │
       Puente H IZQ    Amplificador         ┌─────────┴─────────────┐
       Puente H DER    TPA3110D2            │                       │
              │       alimentación          ESP32 DevKit           5V filtrados
          Motores      desde VBAT           entrada 5V             analógico LM358,
          12V          (8–26 V chip)        (regula a 3.3 V)      referencia, compar.
                             │                                      │
                       2 bocinas                              LDO 3.3 V limpio
                    BTL, sin GND                                  │
                                                             ADXL335, otros
                                                             sensores 3.3 V
                                        GIROSCOPIO ENC-03RC:
                                        alimentar desde 5 V filtrados o
                                        riel permitido verificado por
                                        el módulo; nunca asumir rango
                                        sin identificar placa exacta.
```
- Todas las ramas comparten una referencia de masa **controlada en un punto de distribución**, con retornos de motor separados de retornos sensibles de sensores y audio. No separar masas arbitrariamente hasta impedir referencias de control.
- Capacitores de desacoplo **pegados a cada etapa**, capacitores de reserva y filtros de acuerdo con ficha y corrientes reales. Evitar pasar alimentación de motores por protoboard. Los cables de motor pueden trenzarse y alejarse de sensores y señal de audio.
- Interruptor y fusible principal dimensionados para corriente DC y sección real de cable. El **paro de emergencia de contacto NC** actúa sobre habilitación de ambos puentes H por hardware, independientemente de ESP32; no asumir que pequeño botón soporta corriente de batería.
- Contemplar bloqueo por sobretensión, baja batería y sensor/ángulo fuera de rango. La caída física del robot es posible cuando se quita potencia; arnés para pruebas.

## 3. Tabla de tensiones, límites y requisitos
| Carga | Voltaje recibido | Conversión/origen | Por qué |
|---|---|---|---|
| Motores de 12 V (si ese modelo es validado) | VBAT 9.6–12.6 V variable | Directo a puentes H de potencia | El valor **nominal** del motor no regula el pack; validar tolerancia a 12.6 V, caída a baja batería, torque y corriente de bloqueo. |
| Puentes H BTS7960 candidatos | VBAT para potencia, 5 V para lógica del módulo según placa | Dos ramas de suministro diferenciadas | El integrado opera en rango VBAT, módulo comercial requiere verificar VCC lógico y niveles PWM/EN; señales de equilibrio salen de electrónica analógica. |
| Amplificador TPA3110D2 candidato | VBAT 9.6–12.6 V variable | Directo a rama audio filtrada desde pack | El integrado TI admite **8 a 26 V**; no necesita generar 12 V desde 5 V. El módulo concreto debe aceptar ese rango. **15 W/canal** no garantizados a 3S. |
| ESP32 DevKit V1 | 5.0 V regulados en VIN/5V según placa | Buck VBAT→5 V | El módulo WROOM internamente 3.3 V (3.0–3.6 V). **Nunca conectarlo directamente al pack 3S**, ni a 5 V en pin 3V3. Verificar aislamiento USB/alimentación externa de la DevKit concreta. |
| Pantalla TFT 2.8 SPI | 3.3 V en lógica; alimentación depende de breakout | 3.3 V limpio / adaptador si placa lo admite | No alimentar I/O de TFT a 5 V salvo interfaz explícitamente compatible. |
| Micrófono INMP441 I2S | 3.3 V | Regulación 3.3 V estable | Entrada de voz/silbido; no conectarlo a 5 V. |
| ADXL335/GY-61 | Chip 1.8–3.6 V | LDO 3.3 V de bajo ruido | Señal de inclinación **analógica**; breakout puede tener regulador integrado, confirmar pines. |
| Giroscopio ENC-03RC-R | Sensor 2.7–5.25 V **según referencia Renesas** | 5 V filtrados propuestos | Cero nominal ≈1.35 V en el ejemplo de 5 V; sensibilidad ~0.67 mV/(°/s); calibrar con el **módulo** real. |
| LM358 / referencias analógicas | 5 V limpio | Línea buck con filtro | A 5 V, LM358 **no es rail-to-rail**; CM llega ≈3.5 V máx y salida alta tiene margen. Centrar señales y limitar amplitudes; calibrar para no saturar. |
| Sensores infrarrojos / ToF | 3.3 V o tensión del breakout específica | Regulación 3.3 V o 5 V compatible | Verificar riel de I2C, pull-ups y niveles de GPIO (ESP32 no tolera 5 V directo). |

## 4. Arquitectura del control analógico y separación de funciones
```
ADXL335 y gyro analog. --> acondicionamiento --> fusión/compensador analógico
                                                  │ u_equilibrio
ESP32 superior --> PWM/filtrado + límites --> u_avance/u_giro (opcionales)
                                                  │
                                     SUMADORES + SATURACIÓN analógicos
                                                  │
                               dirección + PWM generados en hardware
                                                  │
                                    dos puentes H --> dos motores
```
- Antes de elegir valor de resistencia o ganancia: caracterizar sensibilidad real, peso, geometría, torque y dirección de sensores/motores. Control PD/PD+velocidad en evaluación, NO sintonizado.
- Iniciar y verificar lazo de equilibrio con **ESP32 desconectada**. Orden de avance/giro en estado neutro por pull-down/resistencia de protección; no usar software para recuperar la posición vertical.
- El PWM de potencia para ambos motores es producto de **circuitería analógica**, nunca del cálculo de equilibrio de ESP32.
- Para voz: DAC interno GPIO25/26 de la ESP32 clásica → filtrado y capacitor de acoplamiento → entrada de audio analógica del TPA3110. Salidas del amplificador en **puente BTL**, no conectar ninguno de los bornes negativos de parlante a tierra.
- En una placa comercial los conectores, filtro, polaridad, ganancia y rango real se verifican antes de energizar.

## 5. Dimensionamiento obligatorio ANTES de fabricar pack 18650 y comprar BMS, puentes H y fusibles
**Variables todavía NO medidas:**
- `I_M1_normal`, `I_M2_normal`: corriente durante balanceo, nominal.
- `I_M1_stall`, `I_M2_stall`: corriente máxima de arranque/bloqueo a tensión máxima de batería; motor exacto y hoja de datos.
- `P_AUDIO`: potencia de audio realmente deseada, con margen de volumen y distorsión.
- `I_5V`: consumo de ESP32 + TFT + periféricos de 5 V + acondicionamiento; considerar picos de Wi-Fi/BLE y retroiluminación.
- `eta_audio`, `eta_buck`: eficiencias en condiciones de carga y voltaje.
- `C_Ah`: capacidad **real y corriente de descarga garantizada** del pack.
- `I_BMS_cont`, `I_BMS_peak`: límites documentados reales y umbral de protección por sobrecorriente.

Corriente de batería en operación, estimación:
```text
I_BAT,normal ≈ I_M1,normal + I_M2,normal
             + P_AUDIO/(eta_audio × V_BAT)
             + (5 V × I_5V)/(eta_buck × V_BAT)
```
**Condición mínima de diseño:** `I_BMS_cont ≥ I_BAT,normal` con margen de disipación comprobado, y poder soportar corrientes transitorias reales de arranque de los dos motores sin cortar alimentación accidentalmente. No es correcto elegir BMS únicamente por la etiqueta «40 A». La corriente de bloqueo total y la caída de tensión dictarán protección específica, cable, fusibles y puentes H.

Potencia nominal de energía de pack: `E ≈ 11.1 V × C_Ah`; autonomía ideal `t ≈ E / P_promedio`, reducida por pérdidas, descarga admisible y dinámica. No se puede dar una autonomía real sin consumos.

**PENDIENTE ESENCIAL:** verificar que los motores GA25-370 seleccionados tengan datos cuantitativos confiables de torque, corriente nominal y de bloqueo; de lo contrario cambiar de motores **antes** de elegir batería y BMS.

## 6. Secuencia de pruebas y compuertas
1. **Sin batería:** cada etapa se prueba primero con fuente de laboratorio con límite de corriente. Comprobar polaridad, pines, desacoplos, voltajes de alimentación (5.0 y 3.3), masas y voltaje del amplificador en el rango de su placa.
2. **En banco, sin motores:** conectar alimentación analógica limpia; medir cero del ADXL335 y gyro, referencia de LM358, señales de filtro y comparador. Verificar no saturación en amplitud angular requerida.
3. **Motor individual suspendido:** puente H con PWM/dirección **analógicos**, sentido correcto, corriente en arranque/inversión, calor del puente y variaciones de tensión de batería.
4. **Misma fuente, audio activo:** medir `V_BAT`, 5 V y 3.3 V mientras operan motores y audio. Si hay caídas, reinicios ESP32 o variaciones de referencia, corregir distribución, filtros o capacidad de batería **antes** de liberar robot.
5. **Pack 3S verificado:** pruebas desconectado del cargador; confirmar protecciones, temperatura, alarma de batería baja, paro de emergencia. No asumir hot swap ni carga durante funcionamiento.
6. **Equilibrio soportado:** suspensión/arnés, eliminar consigna ESP32, cerrar lazo real, ajustar ganancias/compensación con evidencia de osciloscopio y ensayo seguro.
7. **Balanceo libre, avance y giro:** integración por etapas; audio, ojos y térmica nunca anulan equilibrio ni sus límites.

## 7. Piezas que todavía NO pueden aprobarse como «carrito final»
- **Pack comercial descartado** del carrito: el usuario aporta celdas 18650 propias, pendientes de caracterización.
- BMS 3S «40A»: insuficiente etiqueta comercial para validar, falta hoja de datos del módulo y coordinación con cargador y pack.
- Motor GA25-370 12 V de publicación: faltan curvas/par e I_stall confiables.
- Amplificador comercial TPA3110: verificar **rango real de esa tarjeta**, filtrado de VBAT, ganancia y disipación; el **chip** permite 8–26 V, pero la placa debe corroborarse.
- Buck 5 V: verificar corriente **sostenida** y disipación, no cifra publicitaria de pico.
- No comprar fusibles, cables, tamaño batería, pantalla o bocinas al azar: deben ajustarse a corriente, geometría y fecha de entrega.

## Fuentes técnicas de arquitectura
- TI TPA3110D2, 8–26 V, potencia de salida condicionada por VCC/impedancia: https://www.ti.com/product/TPA3110D2
- Espressif WROOM-32E, 3.0–3.6 V de alimentación interna: https://documentation.espressif.com/esp32-wroom-32e_esp32-wroom-32ue_datasheet_en.html
- ADXL335, 1.8–3.6 V: https://www.analog.com/en/products/adxl335.html
- Renesas, circuito de ejemplo ENC-03RC-R (2.7–5.25 V): https://www.renesas.com/en/document/apn/smart-analog-ic-500-amplifier-selection-example-implementation-connection-non-inverting-amplifier
- TI, LM358 CM no rail-to-rail: https://www.ti.com/product/LM358
- Infineon, BTS7960B: https://www.infineon.com/assets/row/public/documents/10/45/bts7960b-pb-final.pdf

**Tareas siguientes:** conseguir los datos reales de motor, evaluar tabla de corriente/energía y escoger batería/driver/cargador por ingeniería y costo; después validar pines de alimentación del conjunto electrónico y documentar esquemático por riel. Ninguna pieza fue comprada ni probada durante esta revisión.

## Actualización 2026-11-15 — Baterías 18650 propiedad del usuario
**CONFIRMADO:** el usuario ya tiene celdas **18650**; no se presupuesta comprar las celdas ni un pack prearmado. «18650» es un formato físico (aprox. 18 mm diámetro × 65 mm longitud), **NO la cantidad de baterías disponibles** ni una garantía de composición química o corriente.

### Opciones de conexión que se estudiarán
- **3S1P:** 3 celdas compatibles en serie; si son Li-ion de 3.6/3.7 V nominales y carga máxima de 4.2 V/celda, paquete nominal de 10.8–11.1 V y **12.6 V máximo**. La capacidad en Ah corresponde a una celda.
- **3S2P:** 6 celdas compatibles agrupadas en tres bloques en serie, con dos celdas emparejadas en paralelo por bloque. Mismo voltaje nominal y máximo, doble capacidad teórica en Ah si las celdas son similares. La corriente admisible depende de cada celda, del montaje y del BMS.
- **Selección provisional:** evaluar 3S2P si existen seis celdas compatibles y la masa, volumen y motores lo justifican; 3S1P queda como alternativa menor, ninguna aprobada hasta prueba.

### Condiciones de seguridad y manufactura
1. Identificar química y modelo completo, capacidad real, descarga continua y pico, origen, uso previo, cantidad y estado físico. **Una celda 18650 puede tener química diferente**; si es LiFePO4 3.2 V nominal, **no corresponde cargador Li-ion de 12.6 V**. No asumir configuración final por el formato.
2. Medir cada celda y verificar capacidad, tensión, resistencia interna y aislamiento intacto. No mezclar celdas de diferente química, edad, modelo o capacidad ni conectar directamente en paralelo celdas con diferente voltaje.
3. Pack armado por persona competente con conexión por **soldadura por puntos**, tiras, aislantes y protección mecánica apropiados. Evitar soldar terminales de celda directamente con cautín y evitar portaceldas de resortes no especificados para corrientes de motor.
4. BMS 3S con protección, balanceo y corriente real acreditada; cargador CC/CV compatible con química: **12.6 V para Li-ion de 4.2 V/celda únicamente**. Los componentes para carga, fusible, paro DC, conectores y reguladores siguen por adquirir a través de Mercado Libre México.
5. El modelo EVA v0.1 tiene volumen previsto de batería aprox. **76 × 64 × 28 mm**. Un pack 3S2P puede sobrepasar ese espesor una vez agregados aislantes/BMS: **revisar CAD y centro de masa ANTES de imprimir carcasa**.
6. Mantener rama VBAT para motores y audio, y buck 5 V + regulación de 3.3 V, después de validar que las celdas y el controlador son compatibles con ese rango real.

### Cambio de presupuesto
**Celdas: DISPONIBLES, costo de compra nueva $0.** Pack comercial 3S1P de $249.99 excluido del carrito. BMS, cargador, cableado, aislantes, conexiones de potencia, fusible y paro físico siguen pendientes. No comprar BMS ni cargador antes de identificar química y capacidades de las 18650.

Referencias de diseño: https://www.batteryuniversity.com/article/bu-302-series-and-parallel-battery-configurations/ ; https://ehs.oregonstate.edu/sites/ehs.oregonstate.edu/files/pdf/si/lithium_battery_safety_and_handling_guide.pdf

## 2026-11-19 — Selección de audio estéreo para 3S
**Candidato prioritario:** amplificador **TPA3110D2 estéreo**, placa con ficha anunciada 8–26 V, entrada analógica L/R; opción secundaria **PAM8610 estéreo** 7–15 V. Ambos son alimentables por rama VBAT filtrada en un pack Samsung 18650 **3S Li-ion 4.2 V/celda** (rango operativo inicial ≈9.6–12.6 V), sujeto a química y corriente verificada. Ninguno se alimenta de la rama de 5 V. La pantalla/micrófono sí siguen en rama lógica regulada.

```
Celdas Samsung 18650 verificadas en pack 3S + BMS
          |-- fusible/interruptor -> bus VBAT
                                      |-- puentes H -> motores (rama potencia)
                                      |-- desacoplo/filtro -> TPA3110D2 estéreo
                                      |                      |-- bocina 4Ω L+/L-
                                      |                      \-- bocina 4Ω R+/R-
                                      \-- buck 5V -> ESP32 -> DAC25/26 -> filtro y acoplamiento -> L/R entrada TPA3110D2
```
- Las salidas de bocina son BTL: terminales L- y R- no equivalen a tierra, no cortocircuitarlos ni unirlos.
- Calibrar señal DAC ESP32 (8 bits), acoplar capacitor para eliminar sesgo DC y prevenir clipping. Si se requiere mayor fidelidad o voltaje, considerar DAC externo **solo tras ensayo**. El nivel acústico depende de sensibilidad de las bocinas, recinto y ganancia, no solo potencia anunciada.
- TI especifica funcionamiento del chip TPA3110D2 de 8–26 V y potencia de aproximadamente 10 W/canal a 13 V sobre 8Ω a THD 10%, no 15 W/canal con cualquier batería; la ficha PAM8610 7–15 V con cifras igualmente condicionadas.
- Probar alimentación y ruido con los motores activados antes de decidir blindaje, filtros y ubicación de bocinas.
**Compra primaria ML:** https://www.mercadolibre.com.mx/modulo-amplificador-de-audio-tpa3110-de-doble-canal-2x15w-pa/p/MLM2058081803 . **Alternativa económica:** https://www.mercadolibre.com.mx/modulo-amplificador-de-audio-2x15w-pam8610-clase-d-bocinas/up/MLMU723441610 .
