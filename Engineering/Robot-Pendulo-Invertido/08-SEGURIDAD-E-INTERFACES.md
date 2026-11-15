# 08 — Interfaces, alimentación y seguridad
**Estado:** requisitos de diseño de seguridad, sujetos a verificación física.

## Frontera analógica / digital
- La ESP32 no debe controlar un pin «motor directo» que compita contra la señal de equilibrio.
- La interfaz prioritaria es una consigna de **avance** pequeña y una de **giro**, ambas acotadas por hardware. Si la ESP32 falla o reinicia, ambas vuelven a referencia neutra por diseño eléctrico.
- La electrónica analógica puede comunicar a ESP32 señales de listo/fallo/saturación para monitoreo, sin depender de su respuesta para conservar el lazo.
- Convertir señales analógicas con las tensiones adecuadas; la ESP32 no tolera 5 V directamente en GPIO. Definir aislamiento, filtros y referencias según esquema.
- Acordar tensión de alimentación, tierra de señal, potencia de motores y la ruta de retorno para evitar ruido de conmutación.

## Protecciones por diseñar y ensayar
1. Interruptor físico accesible que deshabilite potencia a motores.
2. Protección de batería, contra inversión de polaridad, sobrecorriente y cortocircuitos.
3. Límite analógico de consigna, esfuerzo/velocidad según capacidad de motores.
4. Detección de inclinación fuera del rango recuperable: transición a estado de fallo seguro. El robot se caerá si ya no puede sostenerse; usar soporte en pruebas.
5. Protección ante pérdida de comunicaciones, reinicio de ESP32, bloqueo de software o sensor defectuoso.
6. Supervisión térmica de motores y del controlador cuando se conozcan componentes.
7. Limitación de velocidad en el modo seguimiento y detección de obstáculos.
8. Ensayo sin personas ni animales próximos a las ruedas o al área de caída.

## Prioridad funcional
Parada física/protección eléctrica > estabilidad analógica y límites > prevención de choque/caída > evasión térmica > seguimiento > expresiones y sonido.

## Limitaciones
Las funciones autónomas superiores no pueden garantizar seguridad solo con programación. El diseño físico, el frenado/motor y los circuitos de habilitación deben revisarse en un esquema eléctrico antes de energizar el prototipo.

## 2026-11-15 — Protecciones de fuente 3S
Consultar [13-ARQUITECTURA-ALIMENTACION.md](13-ARQUITECTURA-ALIMENTACION.md): protección/carga 3S completas, BMS comprobado, cargador 12.6 V CC/CV, fusible DC e interruptor principal antes de distribución, paro NC para deshabilitar ambos puentes H sin ESP32, buck 5 V + LDO 3.3 V para sensores. Bus VBAT variable para motores y TPA3110 (admisible para el **integrado** según TI; falta verificar placa comercial); conectar alimentación y USB de DevKit simultáneamente solo si ficha de esa placa y aislamiento lo permiten. No hay diseño de power-path: recargar con robot apagado. Separar retorno de potencia de masas de sensado y usar filtrado adecuado para motores y audio.
