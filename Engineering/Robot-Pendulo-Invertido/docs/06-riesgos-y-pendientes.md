# 06 — Riesgos, incógnitas y preguntas de ingeniería

## Riesgos relevantes

| ID | Riesgo | Consecuencia | Medida a evaluar |
|---|---|---|---|
| K-01 | Sensor angular inadecuado o deriva del estimador analógico | Caída/inestabilidad | Caracterización y filtrado analógico, verificación dinámica |
| K-02 | Motores sin par, velocidad o banda de control suficientes | No balancea | Cálculo y medición de planta antes de comprar |
| K-03 | Mezcla incorrecta entre equilibrio y movimiento | Saturación/caída | Límites y prioridad de señales en hardware |
| K-04 | Cortes, picos eléctricos o masas compartidas mal implementadas | Reinicio de ESP32 / ruido de control | Separación y protección de alimentación, layout adecuado |
| K-05 | RSSI BLE interpretado como rumbo | Sigue rumbo erróneo | Ensayos reales; agregar observación direccional si hace falta |
| K-06 | Teléfono no anuncia BLE de forma estable | Seguimiento intermitente | Verificación con modelo/SO/app real y alternativa prevista |
| K-07 | Sensor de temperatura sin información direccional | Evasión imposible | Sensor de calor con barrido/campo espacial y pruebas |
| K-08 | Alejamiento térmico sin información de obstáculos | Choque o caída | Integración de protección y evitación |
| K-09 | Motor y bocinas interfieren con detector de silbidos | Activaciones falsas | Filtrado, umbrales, ensayos con ruido real |
| K-10 | Audio, pantalla y comunicaciones saturan ESP32 | Latencia o reinicios | Dimensionar RAM/CPU/periféricos; control analógico independiente |
| K-11 | Accionamiento libre antes de ensayos controlados | Golpes y daño de componentes | Pruebas con sujeción, parada accesible y límites |
| K-12 | Decisiones tomadas sin documentar | Pérdida de objetivos | README estable + registro de decisiones + bitácora y commits |

## Información que falta para diseñar hardware

- [ ] ¿Tamaño/altura aproximados y masa objetivo del robot?
- [ ] ¿Presupuesto y piezas/instrumentos ya disponibles?
- [ ] ¿Tipo de superficie, pendientes y velocidad esperada?
- [ ] ¿Autonomía requerida y restricciones de batería?
- [ ] ¿Qué ESP32 o placa exacta se pretende usar?
- [ ] ¿Qué motores y drivers hay disponibles o se consideran?
- [ ] ¿Cómo se estimará **inclinación y velocidad angular analógicamente**?
- [ ] ¿Cómo se integrarán referencias de desplazamiento/giro con equilibrio?
- [ ] ¿Qué distancia/temperatura de calor se desea detectar y desde qué ángulos?
- [ ] ¿Qué teléfono/SO y restricciones de permisos/publicidad BLE se usarán?
- [ ] ¿Qué significa «comunicarme con él»: sonidos, comandos de voz, intercomunicador o conversación?
- [ ] ¿Qué dimensiones y resoluciones de pantalla son aceptables?
- [ ] ¿Se necesitarán sensores de distancia/obstáculos por seguridad?
- [ ] ¿Cuáles serán los límites de inclinación, corriente, velocidad y recuperación de caída?

## Condiciones para aceptar componentes

1. Identificar hoja de datos y compatibilidad eléctrica real.
2. Mostrar esquema de conexión y señales esperadas.
3. Comprobar presupuesto de energía y corriente máxima.
4. Confirmar que no degrada el control analógico de equilibrio.
5. Registrar decisión, revisión y evidencia de prueba.

**Nota:** no se asignan todavía modelos, valores de R/C, tensiones, PID/PD específicos ni presupuestos inventados.
