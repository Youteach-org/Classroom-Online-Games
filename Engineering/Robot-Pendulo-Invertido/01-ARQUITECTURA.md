# 01 — Arquitectura funcional
**Estado:** diseño conceptual; no es diagrama eléctrico definitivo.

## Capas y responsabilidades
**Capa A: lazo analógico autónomo de equilibrio**
- Sensores de inclinación y velocidad angular con **salidas analógicas**.
- Acondicionamiento, filtrado/fusión, referencias y regulador analógico (inicialmente PD/PID a estudiar).
- Distribución de par a dos motores, modulación y puentes H, con limitadores y habilitación de seguridad.
- No debe necesitar instrucciones periódicas, cálculos, I2C o SPI de la ESP32 para estabilizar el robot.

**Capa B: supervisor ESP32**
- Micrófono y análisis de silbido; audio bidireccional según alcance.
- Sensores térmicos y de obstáculos.
- Bluetooth/Wi-Fi y lógica de seguimiento.
- Máquina de estados, selección de expresiones y pantalla con ojos.
- Órdenes de avanzar, retroceder y girar entregadas al bloque analógico como consignas acotadas.
- Supervisión de estados, telemetría y retorno de las consignas a neutro cuando falle la comunicación.

## Flujo funcional
    Acelerómetro analógico + giroscopio analógico
                  ↓
       Fusión / filtros analógicos
                  ↓
       Comparación con consigna segura ← ESP32 (opcional; señal aislada y limitada)
                  ↓
         Controlador analógico
                  ↓
      Modulador y mando bidireccional
                  ↓
          Puentes H → 2 motores
                  ↑
    Protecciones eléctricas y parada física

    Sensores térmicos/obstáculos ─┐
    Micrófono/silbido ────────────┤
    BLE/teléfono ─────────────────┤→ ESP32 → consignas y ojos / bocinas
    Interfaz humana ──────────────┘

## Prioridad entre comportamientos (propuesta)
1. Parada de emergencia o protección eléctrica.
2. Control analógico de equilibrio siempre activo cuando el robot esté en marcha.
3. Prevención de caída o choque; prohibir movimiento peligroso.
4. Evasión de calor, cuando sea segura.
5. Seguimiento / aproximación después de silbido.
6. Navegación manual / reposo.
7. Expresiones y sonidos, que nunca interfieren con la estabilidad.

La prioridad debe probarse; no basta con definir estados de software.

## Punto técnico crítico
Una misma acción de motor participa en **equilibrio** y **desplazamiento**; no se pueden instalar dos mandos independientes peleando por el puente H. La ESP32 modifica una consigna de referencia limitada o componente de giro, mientras el lazo analógico decide en tiempo real el esfuerzo estabilizador. La suma y saturación deben diseñarse y probarse.

## 2026-11-15 — Distribución de potencia: separación de rieles
El diagrama eléctrico de alimentación completo está en [13-ARQUITECTURA-ALIMENTACION.md](13-ARQUITECTURA-ALIMENTACION.md). Fuente primaria 3S Li-ion **no elegida todavía** (VBAT variable, 12.6 V al máximo; 11.1 V nominal); motores mediante puente H y audio TPA3110 reciben VBAT por ramas filtradas/protegidas. El convertidor buck genera 5.0 V para la ESP32 DevKit y electrónica analógica filtrada; un LDO de 3.3 V desde 5 V alimenta sensores adecuados. La ESP32 NO recibe VBAT directamente. Ampliación y diseño de cables/fusibles condicionados por corriente del motor. Cargador Li-ion 12.6 V CC/CV y BMS de protección y balanceo compatibles. No admitir carga y operación simultánea sin power-path diseñado.

## Base Mercado Libre elegida por el usuario — 2026-11-21
**Elección confirmada para sustentar el resto del robot:** [producto de Mercado Libre México, catálogo MLM2122316110, artículo MLM2178515446](https://www.mercadolibre.com.mx/p/MLM2122316110?pdp_filters=item_id%3AMLM2178515446&sid=cart). El usuario la utilizará **como base mecánica/chasis portador**, no se presupone conservar otros elementos del kit si los tuviera. El enlace de carrito no pudo abrirse para revisar ficha en esta sesión: **NO ASIGNAR aún dimensiones, material, cantidad de ruedas, motores incluidos ni taladros**. Registrar como base seleccionada, pendiente de ficha/imagen/medidas exactas. El modelo EVA_concepto_v01.scad deberá adaptarse a la base, no construir otra desde cero por defecto.

**Requisitos invariables del péndulo invertido:** en condición de balanceo real debe apoyar sobre dos ruedas motrices en un eje transversal; si la base tiene rueda loca de apoyo, tercera rueda o cuatro ruedas en contacto con suelo, retirarlas o levantarlas para la prueba de autoequilibrio. Montar torso, sensores y masa sobre el eje; medir masa, altura del centro de gravedad, distancia entre ruedas, rigidez y torque antes de elegir/fijar los motorreductores. No conectar un motor de 3–6 V de un posible kit económico a 12.6 V de pack 3S sin especificación de tolerancia.

**Ramas eléctricas:** VBAT 3S -> motores y audio por ramas separadas; buck -> 5 V lógica; **fuente simétrica DD1718PA +12/−12 V desde la línea regulada de 5 V para TL084CN DIP14**; LDO independiente desde 5 V -> 3.3 V analógicos para ADXL335 y ADC ESP32-S3. No conectar bipolar ±12 V al ADC. Ver [13-ARQUITECTURA-ALIMENTACION.md](13-ARQUITECTURA-ALIMENTACION.md).


## 2026-11-21 — Corrección TL084CN
El usuario especificó TL084CN como operacional del robot, no LM358/MCP6002. Convertidor elegido: **DD1718PA con entrada 5 V regulados y salida bipolar ±12 V**, publicación individual https://www.mercadolibre.com.mx/convertidor-de-voltaje-dd1718pa-salida-positiva-negativa-12v/up/MLMU707870570 . TL084CN DIP14 pin4 = +12 V, pin11 = -12 V. Las señales destinadas al ADC de ESP32-S3 requieren adaptación 0–3.3 V. Remitirse a [13-ARQUITECTURA-ALIMENTACION.md](13-ARQUITECTURA-ALIMENTACION.md) como fuente vigente.
