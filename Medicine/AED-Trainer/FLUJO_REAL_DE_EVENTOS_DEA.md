# Flujo de eventos y audios del simulador DEA

Fuente: `firmware/aed-trainer/trainer-core.cpp`, `aed-trainer.ino`, `audio/prompt-script.json`.

## 1. Secuencia de inicio común a los ocho casos

| Momento | Evento/audio | Se activa cuando |
|---|---|---|
| 1 | **AED_STARTUP** — «Mantenga la calma. Siga estas instrucciones.» | Al pulsar iniciar |
| 2 | **AED_CHECK_RESPONSE** — «Compruebe si el paciente responde.» | Inmediatamente después del anterior |
| 3 | **PARAMEDIC_CONTEXT_T** | Contexto de la variante T1–T8, si se seleccionó alguna |
| 4 | **PARAMEDIC_CONTEXT_C** | Contexto clínico C1–C16, si se seleccionó alguno |
| 5 | **AED_CALL_HELP** — «Solicite ayuda médica de emergencia.» | Primera confirmación PADS/OK |
| 6 | **AED_CHECK_BREATHING** — «Compruebe la respiración.» | Segunda confirmación PADS/OK |
| 7 | **AED_EXPOSE_CHEST** — «Descubra el pecho del paciente.» | Tercera confirmación PADS/OK |
| 8 | **AED_ATTACH_PADS** — «Coloque los electrodos como se muestra.» | Cuarta confirmación PADS/OK |
| 9 | **AED_ANALYZING** — «No toque al paciente. Analizando ritmo cardíaco.» | Tras confirmar que se colocaron los electrodos |

Durante el análisis se espera un mínimo de 3 segundos sin movimiento ni fallo de electrodos.

## 2. Resultado de cada análisis: tres ramas

**A. Contacto deficiente:** `AED_CHECK_PADS` («Revise los electrodos»). Regresa a colocación; requiere corregir el contacto, confirmar PADS/OK y analizar de nuevo.

**B. Ritmo desfibrilable:** `AED_SHOCK_ADVISED` («Se recomienda una descarga. No toque al paciente»), seguido de `AED_PRESS_SHOCK` («Presione el botón de descarga»). En ese momento se muestra un triángulo amarillo de advertencia en la TFT; permanece visible mientras espera el botón físico. Al pulsarlo: `FX_SHOCK_ELECTRIC`, luego `AED_SHOCK_DELIVERED` («Descarga aplicada»), seguido por `AED_BEGIN_CPR` en el primer ciclo o `AED_CONTINUE_CPR` en ciclos posteriores.

**C. Ritmo no desfibrilable:** `AED_NO_SHOCK` («No se recomienda una descarga»), seguido directamente de `AED_BEGIN_CPR` en el primer ciclo o `AED_CONTINUE_CPR` en ciclos posteriores.

En ambas ramas B y C comienza música/metrónomo de RCP durante **120 segundos**, con animación y cuenta regresiva. Después: `AED_REASSESS` («Prepárese para un nuevo análisis») y, tras medio segundo, otro `AED_ANALYZING`.

## 3. Orden de resultados por caso

| Caso | Denominación en pantalla | Análisis sucesivos |
|---|---|---|
| A1 | Conversión con una descarga | Descarga → No descarga |
| A2 | Ritmo desfibrilable persistente | Descarga → Descarga → No descarga |
| A3 | Problema de contacto antes del análisis | Fallo electrodos → Descarga → No descarga |
| A4 | Refibrilación | Descarga → No descarga → Descarga → No descarga |
| A5 | Ritmo no desfibrilable | No descarga → No descarga |
| A6 | Dos descargas requeridas | Descarga → Descarga → No descarga |
| A7 | Paro recurrente complejo | Descarga → Descarga → No descarga → Descarga → No descarga |
| A8 | Contacto deficiente y ritmo persistente | Fallo electrodos → Descarga → Descarga → No descarga |

La secuencia puede alterarse para el siguiente análisis mediante comandos del monitor (forzar descarga, forzar no descarga o refibrilación). No se añade un audio distinto por cada nombre A1–A8: cada escenario escoge la secuencia de los audios comunes.

## 4. Audios opcionales del paramédico

Estos no se reproducen todos en cada ejercicio. El **contexto** se escucha al iniciar el caso si está seleccionada la variante; la **pista** correspondiente se reproduce cuando el docente solicita `HINT`.

| Variante | Contexto inicial | Pista cuando se solicita |
|---|---|---|
| T1 | Tórax mojado | Revisar adhesión y condiciones para colocar electrodos |
| T2 | Parche de medicamento | Revisar la piel antes de colocar electrodo |
| T3 | Dispositivo implantado | Observar posición del implante |
| T4 | Vello abundante | Revisar mal contacto del electrodo |
| T5 | Paciente pediátrico | Equipo y posición adecuados al tamaño |
| T6 | Persona tocando al paciente | Asegurar que nadie lo toque |
| T7 | Movimiento durante análisis | Evitar interferencias en el análisis |
| T8 | Riesgo eléctrico | Comprobar seguridad de escena |
| C1 | Embarazo | Considerar condición durante el algoritmo |
| C2 | Opioides sin signos de circulación | Prioridad en paro cardíaco |
| C3 | Opioides, respiración lenta, con pulso | Comprobar si realmente hay paro |
| C4 | Ahogamiento | Importancia de falta de oxígeno |
| C5 | Hipotermia | Signos de vida difíciles de valorar |
| C6 | Hipertermia | Buscar causa reversible |
| C7 | Electrocución | Eliminar peligro eléctrico |
| C8 | Anafilaxia | Relacionar alergia con causa reversible |
| C9 | Asma | Reconocer deterioro respiratorio |
| C10 | Intoxicación | Identificar sustancia y causa tratable |
| C11 | Tromboembolia pulmonar | Evaluar posible causa obstructiva |
| C12 | Asistencia ventricular (LVAD) | No depender de un solo signo circulatorio |
| C13 | Alteraciones de electrolitos | Considerar causa reversible |
| C14 | Obstrucción de vía aérea | Reconstruir atragantamiento previo |
| C15 | Retorno de signos de vida | Reevaluar antes de continuar |
| C16 | Nuevo paro tras recuperación | Valorar otra vez desde el comienzo |

Con T0 y C0 no hay contextos extras; si se solicita una pista sin variantes, se usa la pista genérica de reevaluación `PARAMEDIC_HINT_ROSC_SIGNS`.

## 5. Distribución de los archivos de audio

- 15 instrucciones habladas del DEA (incluidos RCP y reevaluación).
- 8 contextos T + 8 pistas T = 16 locuciones de paramédico.
- 16 contextos C + 16 pistas C = 32 locuciones de paramédico.
- 1 efecto de descarga `fx-shock-electric.wav`.
- **Total en `audio/assets`: 64 WAV.**
- La música de RCP está fuera de esa carpeta, como `firmware/rcp-music.wav`.

## 6. Audio de respuesta y respiración recuperado

El primer fragmento «de» de la grabación original de respiración (0,30 s, incluyendo la caída natural del sonido) se anexó al final del audio original de respuesta. El archivo de respiración comienza ahora a los 2,26 s del original, donde inicia la segunda instrucción completa. No se añadió voz generada, silencio artificial ni empalme de otro locutor. Las muestras de origen se conservaron bit a bit.
