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
