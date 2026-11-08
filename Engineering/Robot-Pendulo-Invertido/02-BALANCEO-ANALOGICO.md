# 02 — Balanceo analógico del péndulo invertido
**Estado:** hipótesis de control que deben verificarse mediante modelado y ensayos, sin números inventados.

## Variable de control
- θ: inclinación longitudinal del cuerpo respecto a la vertical.
- θ̇: velocidad angular longitudinal.
- v: velocidad longitudinal (posible lazo complementario analógico de velocidad/posición).
- u: mando de par/voltaje efectivo a los motores.
- θref: consigna de inclinación próxima a cero (movimiento), limitada.
- ugiro: corrección diferencial de guiñada.

## Lazo base candidato
Cerca de la posición vertical, un regulador analógico de estado o PD puede usar una combinación de error angular y velocidad angular:

    eθ = θref − θ
    ubase = Kθ · eθ − Kω · θ̇

Los signos finales dependerán de la orientación física de sensores y polaridad de motores. La verificación de realimentación negativa es **obligatoria** antes de energizar las ruedas libremente.

En términos de ruedas (signos convencionales por validar):
    uizquierda = saturar(ubase − ugiro)
    uderecha   = saturar(ubase + ugiro)

La consigna de desplazamiento no será una sustitución del control analógico. Para conservar posición o reducir deriva puede requerirse un lazo adicional de velocidad/posición y medición asociada; determinarlo después de identificar el modelo.

## Sensores analógicos: candidatos, no compras aprobadas
- **ADXL335:** acelerómetro de tres ejes con salidas analógicas, útil para inclinación cuasiestática. Las aceleraciones de traslación lo contaminan: no basta usarlo sin acondicionamiento.
- **ADXRS652:** giroscopio con salida de tensión para velocidad angular (es un sensor de guiñada según su eje físico); para medir cabeceo tendría que orientarse mecánicamente el eje sensible de forma adecuada. Revisar costo y montaje BGA.
- **LPR530AL:** giroscopio analógico antiguo con ejes de pitch/roll, pero obsoleto; **no** comprar como recomendación principal.

Un IMU tipo MPU6050 con I2C y cálculo de ángulo en la ESP32 **no cumple** R-02 como fuente del balanceo.

## Acondicionamiento y etapas pendientes
1. Alimentaciones y referencia de tensión de bajo ruido.
2. Calibración de cero de acelerómetro y giroscopio.
3. Filtro analógico complementario: inclinación lenta + tasa angular rápida, sin acumular deriva de integración indefinida.
4. Amplificadores, filtros y compensador (selección y sintonización experimental).
5. Limitación de consignas y protección frente a saturación.
6. Conversión del mando bipolar en dirección y magnitud; PWM por circuitería analógica si se adopta esa arquitectura.
7. Dos controladores de motor reversibles, suficientemente rápidos y capaces de soportar corriente de arranque y bloqueo.
8. Pruebas con soporte que evite caídas antes de ensayos libres.

## Restricciones
- No se considera «control analógico» un programa que solo recibe valores por ADC y calcula el PD en la ESP32.
- No adjudicar valores Kp/Kd/Ki, frecuencia PWM ni resistencias hasta tener modelo, motores, sensores, tensiones y mediciones.
- Un control solo de ángulo no garantiza mantener una posición fija; esa capacidad requiere prueba independiente.
- Los diagramas funcionales actuales no sustituyen esquemáticos, simulaciones y pruebas.
