# 09 — Integración crítica: sensores, analogía, energía y funcionalidad

**Fecha:** 2026-11-08. **Estado:** análisis preventivo de ingeniería, no esquema aprobado.

## 1. Equilibrio sin microcontrolador

La alternativa principal considerada es una **estimación analógica** de inclinación con acelerómetro ADXL335 (gravedad a baja frecuencia) y giroscopio de salida analógica ADXRS652 (velocidad de cabeceo a alta frecuencia); filtros de complemento, offsets y compensación con TLV9064 y/o redes RC. Esta topología requiere ensayos: la aceleración lineal distorsiona la medida de gravedad; el gyro deriva si se integra sin referencia.

La compensación de equilibrio puede generar una señal analógica de mando aproximadamente `u = Kp*(theta_ref-theta) - Kd*theta_dot + ...` (forma tentativa, no ganancias aprobadas); se debe examinar control de velocidad/posición de ruedas para evitar deriva, sin cerrar lazo digital en ESP32.

Para un driver Cytron MDD10A que recibe PWM, un generador **analógico** de oscilador/triángulo y comparadores puede transformar el mando analógico en PWM compatible. El MDD10A soporta locked-antiphase o sign-magnitude: verificar el cableado exacto del modo y condiciones de señal antes de ensamblar. La ESP32 no debe generar el PWM de equilibrio; sí puede aportar consignas limitadas por hardware.

Si se necesita velocidad de ruedas en el controlador analógico, estudiar conversión de encoder a señal analógica (p. ej. frecuencia a voltaje más detección de dirección), un tacogenerador o medición apropiada. El encoder digital por sí solo **no** implica control digital mientras la conversión/realimentación sea en hardware analógico.

## 2. Termografía, NO RGB para temperatura

Una cámara RGB (OV2640) mide color visible, no temperatura. El color rojo/azul o los cambios de color de una imagen corriente no dan temperatura numérica de manera fiable. Se propone un sensor térmico MLX90640 32x24 con datos calibrados y ubicación de zonas calientes. Su lectura depende del campo de visión, emisividad y condiciones; requiere calibración en escenario real. La ESP32 recibe sus 768 lecturas vía I²C y estima dirección a evitar. Una fuente caliente **no** habilita un movimiento ciego: comprobar distancia y espacio disponible.

La cámara RGB puede servir para seguimiento visual, reconocimiento de señales o diagnóstico, sin sustituir la térmica.

## 3. Seguimiento por silbido y Bluetooth

Un detector de silbidos inicia/cancela modo de seguimiento. La potencia Bluetooth recibida (RSSI) informa proximidad aproximada, con fuerte variación por obstáculos, cuerpo humano y orientación; no permite ubicar el ángulo del teléfono de forma fiable por sí sola.

La ESP32-S3 soporta BLE, **no Bluetooth Classic**, y por sí sola no permite telefonía estándar A2DP/HFP. Para seguimiento real se deberá estudiar además dirección por cámara/identificación visual o baliza dedicada, control de distancia y obstáculos. La app de teléfono y su funcionamiento de BLE en segundo plano requieren ensayos (SO/modelo aún por confirmar).

## 4. Audio bidireccional

Micrófono I²S y amplificador I²S con 2 altavoces pueden emitir audio y captar voz. **La arquitectura de conversación aún no se eligió**:
- sonidos/frases pregrabados, control local;
- intercomunicador Wi-Fi con teléfono, aplicación o servicio;
- conversación por IA mediante Wi-Fi/servidor, dependencia de red.
La adquisición y emisión simultánea también necesita tratar el eco acústico y filtrado mecánico por ruido motor.

## 5. Batería y cargador

Pack 3S Li-ion: 11.1 V nominal, 12.6 V carga completa. Dimensionar según potencia mecánica real, con celdas de descarga suficiente, BMS con balance/protección, fusible, corte por caída de voltaje y cargador CC/CV para **3S** de química exacta. **BMS y cargador NO son equivalentes**. Mejor primera iteración: pack comercial protegido y cargador certificado externo compatible; dejar carga integrada para diseño específico. No poner TP4056 (1S) como cargador de pack 3S. Diseñar convertidores separados de 5V para servos y lógica, y regulación analógica filtrada. Prever EMI por puentes H.

## 6. Carrocería y dinámica

Mantener los dos motores coaxiales, ruedas de tracción, chasis sólido y carcasas con tornillería accesible. Evaluar altura/momento de inercia, centro de gravedad y cambios de masa de cabeza/brazos. Servos de cuello y brazos alteran dinámica; validar equilibrio con servos quietos antes de movimientos rápidos. No son motores de tracción.

## 7. Estrategia de pruebas

1. Ensayar fuentes y protecciones, sin motores conectados.
2. Calibrar sensor de cabeceo analógico y signos.
3. Verificar PWM hardware y driver en banco con limitación de corriente.
4. Caracterizar motor+encoder, rueda, fricción y fuerza.
5. Simular sintonía analógica y liberar el robot solo con soporte/contención.
6. Comprobar reinicio ESP32 mientras analógico sigue habilitado en condición segura.
7. Integrar gradualmente distancia, thermal, voz, pantallas, BLE.
8. Pruebas de caída, batería baja, ruido, pérdida de enlace y obstáculos.

## Advertencias

- No confundir un modo de «combate simulado» con mecanismo físico de ataque.
- No elegir motor lento por creer que más relación de reductora garantiza mejor balance; también importa velocidad inversa y holgura.
- No afirmar rendimiento, estabilidad ni autonomía antes de pruebas reproducibles.
