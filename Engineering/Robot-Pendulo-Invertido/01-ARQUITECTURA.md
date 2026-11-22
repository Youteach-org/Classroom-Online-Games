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

**Ramas eléctricas:** VBAT 3S -> motores y audio por ramas separadas; buck -> 5 V lógica; **fuente simétrica XY-±12V Tecneu +12/−12 V desde la línea regulada de 5 V para TL084CN DIP14**; LDO independiente desde 5 V -> 3.3 V analógicos para ADXL335 y ADC ESP32-S3. No conectar bipolar ±12 V al ADC. Ver [13-ARQUITECTURA-ALIMENTACION.md](13-ARQUITECTURA-ALIMENTACION.md).


## 2026-11-21 — Corrección TL084CN
El usuario especificó TL084CN como operacional del robot, no LM358/MCP6002. Convertidor elegido: **XY-±12V Tecneu con entrada 5 V regulados y salida bipolar ±12 V**, publicación individual https://www.mercadolibre.com.mx/4-modulos-fuente-de-alimentacion-convertidor-adc-dac-3-5v-a-12v-amp-voltaje-estable-tecneu/p/MLM49768019 . TL084CN DIP14 pin4 = +12 V, pin11 = -12 V. Las señales destinadas al ADC de ESP32-S3 requieren adaptación 0–3.3 V. Remitirse a [13-ARQUITECTURA-ALIMENTACION.md](13-ARQUITECTURA-ALIMENTACION.md) como fuente vigente.

## 2026-11-21 — Sustitución de fuente simétrica: módulo Tecneu XY-±12V disponible en Mercado Libre
**El usuario reportó que la publicación DD1718PA citada previamente NO está disponible. Por tanto, se RETIRA como enlace de compra vigente; no reenviarla.**

**Nuevo módulo concreto y con existencia indicada en la publicación:** [Tecneu XY-±12V: paquete de 4 módulos DC/DC 2.8–5.5V a ±12V, Mercado Libre México](https://www.mercadolibre.com.mx/4-modulos-fuente-de-alimentacion-convertidor-adc-dac-3-5v-a-12v-amp-voltaje-estable-tecneu/p/MLM49768019), **$129.98 MXN por paquete de cuatro** según ficha consultada (consulta 2026-11-21, inventario/entrega puede variar).
- Modelo publicado **XY-±12V**; entrada según texto técnico detallado **2.8–5.5 V DC** (la tabla de metadatos de Mercado Libre contiene errata «55V», **NO** usar 55V como límite real). Desde buck **5.0 V regulados**, NO conectar directo a paquete 3S (9.6–12.6 V).
- Salidas declaradas: **+12 V hasta 50 mA**, **−12 V hasta 30 mA** estables, con **GND común**; potencia total anunciada 1.2 W. Un TL084CN típico (~1.4 mA/canal) requiere ~5.6 mA en reposo para sus cuatro amplificadores, por lo que el rango de corriente es razonable para el circuito analógico de baja corriente y entradas de alta impedancia; verificar **corriente real de salida en la rama negativa**, temperatura y rizado bajo las cargas del compensador. Si se conectan otras cargas, reevaluar.
- **Sin protección de corto/sobrecarga/inversión integrada**, según características de la publicación: agregar protección en línea y desacoplo/filtro cerca de TL084CN; respetar pin4 = +12 V, pin11 = −12 V, masa analógica referenciada en GND.
- La señal bipolar del TL084CN **no se conecta directamente a ADC ESP32-S3**; interfaz/atenuación y protección de 0–3.3 V obligatoria si se mantiene esa arquitectura.
- El **bajo costo del paquete de cuatro** permite repuesto, pero **solo se instala una unidad por rama del controlador** salvo que el presupuesto de corriente o ruido exija múltiples ramas. No cargar o probar sin circuito verificado.
**Fuente de inventario y especificaciones:** ficha Mercado Libre https://www.mercadolibre.com.mx/4-modulos-fuente-de-alimentacion-convertidor-adc-dac-3-5v-a-12v-amp-voltaje-estable-tecneu/p/MLM49768019 . **Fuente del TL084CN:** https://www.ti.com/lit/ds/symlink/tl084.pdf .
