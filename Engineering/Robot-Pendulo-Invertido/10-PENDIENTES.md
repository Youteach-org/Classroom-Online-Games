# 10 — Preguntas, dependencias y próximos acuerdos
**No son bloqueos para conservar el proyecto; sí son necesarios antes de elegir hardware.**

| ID | Por definir | Motivo |
|---|---|---|
| P-01 | Presupuesto objetivo y tope en MXN | Determina tecnología analógica disponible, chasis y sensores. |
| P-02 | Tamaño/altura/masa aproximados del robot | Para estabilidad, inercia, motores y batería. |
| P-03 | Ruedas: diámetro y separación | Para dinámica, par y giros. |
| P-04 | Velocidad deseada y carga adicional | Dimensionamiento del accionamiento. |
| P-05 | Piezas ya disponibles y posibilidad de soldar SMD/BGA | Evitar selección de sensor no construible. |
| P-06 | Teléfono concreto (Android/iPhone) y si es aceptable instalar una app o portar baliza | Para estudiar transmisión BLE/seguimiento real. |
| P-07 | ¿El seguimiento exige reconocer dirección sin contacto visual? | RSSI no basta para orientación instantánea. |
| P-08 | Tipo de voz: intercomunicador / órdenes / conversación con asistente | Cambia conectividad y procesamiento. |
| P-09 | Número, dimensión y posición de pantalla(s) de ojos | Diseño frontal y consumo. |
| P-10 | Umbral y alcance térmico; ambiente previsto | Selección de sensor de calor y evasión. |
| P-11 | Autonomía requerida, batería y superficie de operación | Energía y desempeño. |
| P-12 | ¿Debe conservar su lugar o basta con equilibrarse y moverse? | Posible lazo de velocidad/posición adicional. |

## Orden sugerido para la siguiente sesión
Definir P-01 a P-05 → bosquejar geometría y dinámica → elegir tecnología sensorial analógica → diseño de las etapas y pruebas en banco → luego integrar ESP32. En paralelo, se puede prototipar audio y ojos sin alterar el lazo de equilibrio.

## Nueva condición de suministro (2026-11-09)
- Todos los componentes comprados deben proceder de publicaciones de Mercado Libre México (mercadolibre.com.mx).
- Antes de cerrar una compra: verificar compatibilidad, stock, destino, costo total y **fecha de entrega** para que llegue dentro del calendario de 14–21 días.
- P-01 a P-05 siguen abiertos. Los enlaces comerciales no sustituyen las pruebas de par, corriente, dimensiones y respuesta de los sensores.
