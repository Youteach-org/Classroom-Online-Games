# 07 — Bitácora cronológica del proyecto

## 2026-11-08 — Inicio y resguardo documental
**Solicitud:** construir robot de dos ruedas tipo péndulo invertido, con balanceo y control analógico; ESP32 para otras funciones (calor/alejamiento, silbido/seguimiento, teléfono Bluetooth preferido, micrófono/bocinas, pantalla de ojos y combate simulado azul→rojo).

**Acción:** identificación del repositorio GitHub COG y de la carpeta Engineering; definición inicial de estructura documental. Se comprobó que un push a main puede activar publicación automática de la web de COG, por lo que se reservó una rama para la especificación inicial.

**Hallazgos técnicos por verificar en prototipo:**
- RSSI BLE sirve como indicio de proximidad pero no proporciona directamente dirección.
- ADXL335 ofrece señales analógicas de aceleración.
- Existen giroscopios analógicos; los de referencia han de validarse por encapsulado, costo, eje y disponibilidad.
- ESP32 dispone de periféricos I2S en variantes compatibles, pero el diseño concreto aún no se fija.

**Estado real:** se inicia documentación. **No se ha diseñado ni construido un circuito, no hay código de firmware, no hay lista de compra ni pruebas físicas completadas.**

## Próximas entradas
Agregar cada jornada debajo con fecha, archivos editados, pruebas, resultados y decisiones que se desprendan. No borrar entradas previas: corregir mediante una entrada posterior que identifique el error.

## 2026-11-09 — Plazo y fuente de compras
**Nueva información del usuario:** entrega en aproximadamente dos semanas o un poco más (horizonte de 14–21 días desde el 9 de noviembre de 2026). **Restricción expresa:** todas las compras deberán hacerse exclusivamente en Mercado Libre México. Se inicia búsqueda de candidatos de giroscopio analógico ENC-03RC, acelerómetro ADXL335, motores con encoder y pantalla ESP32-S3 en la plataforma; ningún componente se declara comprado ni validado en banco. Priorizar plazo de entrega y verificación de compatibilidad antes de fijar geometría y circuito.
