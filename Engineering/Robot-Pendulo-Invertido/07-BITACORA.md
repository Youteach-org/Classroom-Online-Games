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

## 2026-11-09 — Lista completa ML verificada parcialmente
Se creó **11-COMPRAS-MERCADOLIBRE.md**, con cantidades, componentes por subsistema, enlaces directos a publicaciones y listados reales de Mercado Libre México, precios de referencia, riesgos de compatibilidad y suministro, y alternativas excluyentes. Se incluyó expresamente batería 3S, BMS condicional, cargador dedicado 12.6 V CC/CV, reguladores a 5 V y 3.3 V, fusible, interruptor, conectores y control de batería baja. La batería 3S1P de ejemplo no está aprobada para motores sin validar corriente de descarga; tampoco se aprueba sustituir cargador por BMS. Motor y pantalla siguen pendientes de validación; no hay compras ni pruebas físicas reportadas. Se mantiene rama documental aislada de main.

## 2026-11-15 — Corrección de BOM por usuario
**Observaciones del usuario:** precio de pantalla ESP32 integrada ~$959 inaceptable para proyecto escolar; MAX98357A ya usado en DEA y percibido como insuficiente en volumen; se incluyó indebidamente exploración térmica móvil y un multiplexor sin ser solicitados.
**Acción:** revisar catálogo de Mercado Libre México y sustituir candidatos por ESP32 WROOM DevKit V1 (~$129.99), pantalla TFT color SPI 2.8” (~$199.80), amplificador TPA3110 (~$80–$99), par de bocinas 4 Ω 10 W (~$148), sensor MLX90614 fijo frontal (~$189). Eliminar de la lista de compras actual pantalla 4.3”, MAX98357A, SG90 térmico, TCA9548A y cámara térmica alternativa. Se mantiene protección y carga Li-ion 3S, alimentaciones y equilibrio analógico. **Estado:** candidatos aún no comprados ni probados; precios de listados y sin confirmación individual de entrega.

## 2026-11-15 — Enlaces directos individuales
A solicitud del usuario, se creó **12-ENLACES-DIRECTOS-COMPRA.md**. Contiene exclusivamente enlaces individuales de producto (/p/, /up/, /MLM-) en Mercado Libre México para las piezas que se consiguieron localizar; distingue los componentes cuyo link individual NO se recuperó. Se advirtió especialmente que las fichas de motores y paquete 3S no prueban torque/corriente y que los paneles TFT económicos identificados tienen envío internacional con riesgo de plazo. Se conservaron todas las decisiones previas sobre control analógico, pantalla económica, audio TPA3110 y sensor térmico frontal fijo. Estado: publicaciones localizadas; ninguna compra efectuada.

## 2026-11-15 — Arquitectura eléctrica documentada
El usuario señaló que se habían recomendado amplificadores y placas sin definir tensiones de alimentación. Se verificó en TI que el TPA3110D2 funciona con 8–26 V: la batería Li-ion 3S propuesta puede alimentar la rama de audio directamente por bus VBAT variable, **sin elevador de 5 a 12 V**, en tanto la ESP32 necesita 5 V regulados a su placa y sensores/reguladores apropiados. Se incorporó [13-ARQUITECTURA-ALIMENTACION.md](13-ARQUITECTURA-ALIMENTACION.md) con diagrama, carga 3S, protección/BMS, 5 V, LDO 3.3 V, masa, protección, condiciones de compra, ecuaciones de presupuesto de corriente y secuencia de pruebas. Se marcaron batería/BMS/motores como NO aprobados hasta verificar corrientes y mecánica. Se actualizaron lista comercial, seguridad y arquitectura, sin tocar main ni publicar software.


## 2026-11-15 — Baterías 18650 propias
El usuario informó que ya tiene celdas formato 18650 y pueden usarse en serie o paralelo. Se integraron en [13-ARQUITECTURA-ALIMENTACION.md](13-ARQUITECTURA-ALIMENTACION.md) como material disponible, sin asumir cantidad. Se propusieron 3S1P/3S2P y se eliminó la batería comercial 3S de la compra base ($0 para celdas nuevas). Se conserva necesidad de BMS, cargador CC/CV adecuado, montaje seguro y reguladores. Verificar química, corriente, estado y cavidad CAD de 76×64×28 mm antes de fabricar. No se ha armado ni probado pack.

## 2026-11-17 — Prioridad inmediata: mecánica y control de equilibrio
El usuario indicó que la batería Samsung 18650 no es el foco actual y preguntó por la siguiente etapa planeada. Se actualizó **05-PLAN-Y-PRUEBAS.md** para priorizar en paralelo: dimensionamiento de motores y chasis EVA, esquemático/filtros/compensador analógicos, simulación de etapas y pruebas con soporte; ESP32/ojos/audio como rama paralela. El paquete 18650 queda pospuesto para selección eléctrica según corriente real y modelo de celda. No se reportan compras, montajes ni pruebas físicas completadas.

## 2026-11-19 — Evaluación de TPA3116D2 XH-M542 de Mercado Libre
El usuario mostró una publicación de UNIT Electronics de “Amplificador de Audio TPA3116D2 100W”, precio en captura $95.95 MXN, y preguntó su compatibilidad. Se cotejó con ficha UNIT Electronics, modelo XH-M542/AR1633, **mono 1 CH**, **12–26 V DC** para la placa y bocinas 4–8 Ω. **Resultado: no recomendado** como sustituto del módulo **estéreo** TPA3110 del diseño EVA; además con 3S 18650 la tensión cae por debajo del mínimo anunciado 12 V de la tarjeta. La potencia de “100W” no se considera realizable a batería 3S sin datos del circuito. Se mantiene el TPA3110 como candidato a verificar con dos bocinas; ninguna compra registrada.

## 2026-11-19 — Recomendación de amplificador para buen volumen
Al buscar una alternativa con mayor volumen que el MAX98357A del DEA y compatible con batería 3S Samsung, se cotejaron módulo estéreo **TPA3110D2 8–26 V** de Mercado Libre, primera opción, y **PAM8610 estéreo 7–15 V** como opción económica con publicación concreta. No se toma la cifra 2×15W como potencia real garantizada a 3S. Se documentó conectar salida de la ESP32 mediante DAC filtrado y condensadores de acoplamiento a entradas del amplificador, con salida BTL hacia dos bocinas, sin llevar negativos de bocina a tierra. Se exige revisar sensibilidad de bocinas, recinto y ruido de motores antes de declarar satisfactorio el volumen. Enlaces, documentación y estado sin compra registrados en 11-COMPRAS-MERCADOLIBRE.md y 13-ARQUITECTURA-ALIMENTACION.md.

## 2026-11-21 — Comparación de ESP32 con placa morada del DEA
El usuario solicitó comparar ESP32 clásico, C3 y «la murata» del DEA; contexto de proyecto identifica una placa **morada ESP32-S3 N8R2** usada con TFT ST7735 y MAX98357A. Se registraron diferencias de CPU, RAM, flash/PSRAM, BLE/Classic, I²S y DAC analógico. Consecuencia práctica: **S3 N8R2 tiene mayor margen para ojos y audio**, pero carece de DAC interno para alimentar el amplificador **TPA3110 de entrada analógica** y requeriría DAC externo; WROOM-32 tiene DAC GPIO25/26 integrado (8 bits) y puede evitar ese costo. C3 no es preferido para EVA. Ninguna variante digital sustituye al controlador de equilibrio analógico independiente. Modelo definitivo por elegir, **sin compra ni cambio de alcance**.
