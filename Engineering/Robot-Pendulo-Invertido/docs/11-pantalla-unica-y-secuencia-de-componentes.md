# 11 — Pantalla única con máscara oval EVA y secuencia para seleccionar componentes

**Fecha:** 2026-11-08 · **Estado:** decisiones de usuario fijadas, componentes candidatos bajo evaluación; NO comprar ni imprimir sin comprobar.

## Decisión visual ya confirmada (D-011, D-012, D-013)

- Carcasa impresa en 3D de apariencia EVA/EVE de *WALL·E*: cuerpo blanco, cabeza ovalada, visor oscuro.
- Cabeza **completamente fija**, sin servomotor.
- **Un único display RECTANGULAR** representa ambos ojos; una **máscara/marco frontal impreso** tapa físicamente las esquinas y muestra una ventana de contorno ovalado. El resto del rostro queda negro en software (fondo del dibujo) o detrás de visor oscuro.
- El módulo **se instala plano, sin doblar vidrio ni PCB**. La cabeza debe ser algo mayor que el módulo completo, incluyendo electrónica, cable FPC, tornillos y tolerancias.
- El modo normal muestra ojos azules, el combate **solo simulado** ojos rojos/enojados.
- Dos ruedas de péndulo invertido y estabilización **analógica** independiente de ESP32 no cambian.

## Dos pantallas a evaluar; NO elegidas todavía

| Aspecto | Waveshare 3.5\" Capacitive Touch LCD | Waveshare ESP32-S3-Touch-LCD-4.3 |
|---|---|---|
| Interfaz | SPI, controlador ST7796S | RGB, LCD integrado a placa ESP32-S3 |
| Resolución | 320×480, usar horizontal 480×320 | 800×480 horizontal |
| Panel IPS | Sí | Sí |
| Área activa | 73.44×48.96 mm horizontal | ~95.54×54.36 mm |
| Envolvente de módulo | 92.44×61.00 mm horizontal | ~106.1×67.8 mm versión touch |
| MCU | Requiere conectar a nuestra ESP32-S3 separada | La ESP32-S3 ya viene en placa |
| Ventaja | Menos pines de vídeo, más flexible para audio/sensores | Ojos de mayor tamaño y definición |
| Riesgo | Ojos pueden resultar pequeños en cabeza grande | GPIO disponibles para micrófono I²S, DAC, térmica, audio, ToF y mandos por comprobar; pantalla RGB consume bastantes recursos |
| Estado | Candidato | Candidato |

**Fuentes oficiales:**
- 3.5 Waveshare: https://www.waveshare.com/wiki/3.5inch_Capacitive_Touch_LCD (panel 320×480, LCD visible 48.96×73.44; módulo 61×92.44).
- 4.3 Waveshare: https://docs.waveshare.com/ESP32-S3-Touch-LCD-4.3 (800×480, contorno de módulo ~106.1×67.8, 16MB flash/8MB PSRAM).
- Dibujo mecánico 4.3: https://files.waveshare.com/wiki/ESP32-S3-Touch-LCD-4.3/ESP32-S3-Touch-LCD-4.3-Sch.pdf (área activa 95.54×54.36 mm).

**No confundir dimensiones de módulo completo, cristal y superficie iluminada.** Una máscara oval debe dejar visibles ambos ojos durante toda su animación. El ancho de abertura elegido debe ser menor que el ancho visible de la LCD y su altura menor que la activa; por ejemplo, **88×48 mm solo como estudio** para la 4.3, y **68×44 mm solo como estudio** para la 3.5, sujetos a comprobación. Estas no son cotas aprobadas de CAD.

## Ingeniería de cabeza

1. Escoger módulo exacto y obtener su plano mecánico, conectores, posición del área activa, tornillos y espesor real.
2. Dimensionar cabeza **alrededor del módulo** dejando holgura para soporte, espesor PETG, curvatura del rostro y servicio; no derivar tamaño solo de la diagonal nominal.
3. Construir cabeza 3D en dos mitades, al menos frontal/trasera; soporte rígido atornillable para pantalla y acceso al cable.
4. Modelar abertura oval y una máscara opaca que oculte bordes/esquinas; visor negro opcional que no atenúe demasiado la iluminación.
5. Colocar sensor térmico, ToF, micrófono, bocinas y antena en ventanas funcionales. Atención: el MLX90640 mide **infrarrojo de onda larga** y requiere apertura/material óptico compatible, no vidrio/acrílico normal.
6. Verificar acceso al USB, paso de cables, radios de doblado FPC, disipación y fijación cabeza-torso.
7. Verificar físicamente con plantilla impresa y monitor encendido antes de cerrar el diseño final.

## Qué componentes cerrar primero (orden de dependencias)

**Paso 1 — Pantalla + placa ESP32.** Elegir entre módulo SPI separado o módulo integrado ESP32-S3. Preparar tabla REAL de pines usados y disponibles para I²S micrófono/bocinas, BLE, MLX90640, sensores distancia, DAC de consignas, botonera y detección de batería. No comprar hasta asegurar coexistencia.

**Paso 2 — Motores y ruedas.** Calcular masa aproximada y par/aceleración/velocidad necesaria de robot autoequilibrado; verificar candidato Pololu 37D #4752 12V 30:1 y Cytron MDD10A con ruedas de goma ~96mm, incluyendo adaptadores eje y holguras de giro. Su elección fija ancho y ubicación de ejes.

**Paso 3 — Sensores y control analógico.** Definir disponibilidad y tarjeta del giroscopio analógico ADXRS652, acelerómetro ADXL335, TLV9064, comparadores/driver; simular/medir lazo con señales de referencia y PWM analógico. **No usar MPU6050 + ESP32 para balance**. Las dimensiones y cantidad de operacionales/PCB se congelarán tras esquema y pruebas.

**Paso 4 — Batería + BMS + cargador.** Elegir pack 3S comercial protegido compatible con corrientes de motor y espacio disponible, cargador específico 12.6V CC/CV y fusibles. BMS no es cargador. Cerrar envolvente, peso y centro de masa.

**Paso 5 — Sensores funcionales.** MLX90640 32×24 para detectar dirección de calor; no confundir cámara RGB con termografía. ToF para evitar obstáculos, micrófono, altavoces/amplificador y seguimiento BLE cuya direccionalidad requiere estrategia adicional.

**Paso 6 — Carcasa imprimible.** Con fichas mecánicas, masa y mapa de pines aprobados, pasar de `cad/EVA_concepto_v01.scad` a nueva versión de CAD manufacturable; diseñar y comprobar soportes, tapas, tornillos/inserts, material, rigidez, tolerancias y pruebas antes de producir STL finales. La maqueta v0.1 representa **dos displays de envolvente** como referencia histórica; queda obsoleta por D-013.

## Información mínima que necesitamos por cada pieza para crear el CAD final

| Dato | Pantalla | Motor | Batería | Placas |
|---|---|---|---|---|
| Dimensiones externas (XYZ) | Sí | Sí | Sí | Sí |
| Puntos de montaje | Sí | Sí | retención | Sí |
| Peso | Sí | Sí | Sí | Sí |
| Posición/orientación de conectores | Sí | Sí | Sí | Sí |
| Volumen de cableado/ventilación | Sí | Sí | Sí | Sí |
| Zona útil o eje | ÁREA ACTIVA LCD | eje, hub y rueda | - | interfaces/botones |

## Paso pendiente de decisión

Elegir la **pantalla concreta** considerando tamaño visual y conexiones. El tamaño global de EVA se afina después de esa selección, evitando construir una carcasa antes de conocer el módulo real.
