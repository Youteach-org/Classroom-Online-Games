# DEA V15 — auditoría de pantallas, audio y flujo (2026-10-25)

**Estado: REVISIÓN — NO PUBLICAR.** Este archivo registra el comportamiento exacto del firmware restaurado y el objetivo aprobado. No afirma aprobación de las imágenes actuales ni que el sonido esté funcionando físicamente.

## Requisitos originales confirmados

- ESP32-S3 N8R2 con TFT ST7735 horizontal de **160×128 píxeles**; sin microSD.
- Toda ilustración debe usar el área útil 160×128, sin bandas negras involuntarias, superposiciones, texto ilegible ni recortes de anatomía.
- Ocho escenarios A1–A8, cada uno con una pantalla identificable propia.
- ECG **animado** durante el análisis; interrupción visible si hay movimiento o falla de contacto.
- RCP con animación entre manos arriba/compresión, **contador grande superpuesto** y música exacta de **120 segundos / aproximadamente 108 bpm**, sin rayado.
- Audio inicia a **100 %** en cada reinicio; Monitor del maestro puede regular volumen 0–100%.
- Configuración local simplificada autorizada el 25-oct: **encendido/inicio + SHOCK**. La reconstrucción todavía tiene MENU/OK/SHOCK: **incompatibilidad pendiente de corregir**.
- Los cinco GPIO TFT permanecen intactos (RST8, DC9, CS10, MOSI11, SCLK12). Solo mover I2S de MAX de 15/16/17 a **42/41/40** (P2); botones actualmente 4/5/18 hasta retirar MENU/OK de la lógica, sin necesidad de moverlos.

## Hallazgos verificables: por qué las imágenes se ven mal

- El archivo original `dea-v15-r2-display-assets.b64.txt` es un contenedor `DEAV15F2` con **32 pantallas 160×128**.
- Cada pantalla usa **paleta fija de 16 colores RGB565, índice de 4 bits por píxel** (10 272 bytes/escena). La reducción hace que manos, rostros, electrodos y letras pierdan detalle.
- Varias pantallas A1–A8 tienen **textos que sobresalen o se superponen**: no hay ajuste de anchura; no son aptas como finales.
- Existen 25 JPEG previos de 160×128; **tampoco hay evidencia de aprobación para sustituir las imágenes actuales por esos JPEG**. No elegir nuevas imágenes por cuenta propia.
- Los contactos visuales para auditoría se generaron sin redibujar los píxeles originales; no se promovieron al programa.

## Flujo de funcionamiento y contenido que DEBE caber en TFT

La pantalla completa es el lienzo real de 160×128. Mostrar **una sola escena clara** a la vez. Los rótulos deben tener ancho medido antes de dibujarse; dividir textos largos, no imprimir fuera del marco. Usar contenido visual autorizado a resolución suficiente y respetar proporciones, sin ampliar imágenes pequeñas hasta hacerlas irreconocibles.

| # | Estado | Contenido visible y audio asociado | Salida |
|---:|---|---|---|
| 0 | Encendido | Identidad del DEA y verificación de audio de bocina; 160×128, sin recuadros innecesarios | Inicio autónomo |
| 1 | Respuesta | Ilustración autorizada de comprobar respuesta, rótulo «RESPUESTA» | Voz «Compruebe si el paciente responde» |
| 2 | Ayuda | «PIDA AYUDA» y señalización visual | Voz de solicitar ayuda |
| 3 | Respiración | «RESPIRACIÓN», ilustración apropiada | Voz de revisar respiración |
| 4 | Pecho | «DESCUBRA PECHO», imagen clara sin corte de cuerpo | Voz para descubrir el pecho |
| 5 | Electrodos | Parches adulto/niño/lactante según el escenario; ubicación anatómica legible; sin texto sobre tórax | Verificación simulada de colocación |
| 6 | Contacto incorrecto | «REVISE PARCHES», contraste rojo y detalle de conexión | Volver a colocar parches |
| 7 | Analizando | «ANALIZANDO», trazado ECG dinámico realmente visible, marca «NO TOCAR» | Resolución de ritmo |
| 8a | Descarga indicada | «DESCARGA INDICADA», alerta/ECG distinguibles | Voz de advertencia |
| 9a | Despejar | «NO TOCAR», indicación evidente de alejarse | Esperar **SHOCK** físico |
| 10a | SHOCK | Efecto visual momentáneo «DESCARGA SIMULADA», sonido de efecto | Confirmación de descarga, sin alto voltaje |
| 8b | Sin descarga | «NO DESCARGA», ilustración distinta de 8a | Ir a RCP sin botón SHOCK |
| 11 | RCP | Imagen de compresión correcta, alternancia arriba/abajo; `02:00` grande encima de la imagen y `108/min` legible | Música / golpes rítmicos durante 120 s |
| 12 | Ventilaciones | Si corresponde a indicación docente, visual respiratorio específico | Voz correspondiente |
| 13 | Reevaluación | «REANALIZANDO», nuevo ECG sin conservar fotograma viejo | Volver a estado 7 |
| 14 | Suspensión/cierre | Fin de sesión mediante encendido o Teacher Monitor; estado reposo | Reinicio para próximo caso |

Los estados 8a–10a y 8b son **ramas excluyentes** de una vuelta. RCP siempre conduce a nueva evaluación tras completar los 120 segundos. La evaluación y las acciones son **simuladas**: no hay descargas reales.

### Ocho secuencias clínicas aprobadas en el motor

`D` = descarga simulada indicada; `N` = sin descarga; `E` = error de contacto de parches. Entre decisiones sucesivas se completa una RCP de 120 s.

| Escenario | Secuencia | Distintivo requerido |
|---|---|---|
| A1 | D → N | Descarga y después RCP sin nueva descarga |
| A2 | D → D → N | Ritmo desfibrilable persistente |
| A3 | E → D → N | Corrección de contacto antes del análisis |
| A4 | D → N → D → N | Reaparición del ritmo desfibrilable |
| A5 | N → N | Nunca indica descarga |
| A6 | D → D → N | Dos descargas, con su RCP |
| A7 | D → D → N → D → N | Paro recurrente |
| A8 | E → D → D → N | Error de contacto y persistencia del ritmo |

Los modificadores `T0–T8` y clínicos `C0–C16` se pueden asignar en Teacher Monitor sin repetir la misma imagen genérica cuando el caso exige ilustración diferente.

## Diagnóstico de silencio en MAX98357A

- Se confirmó con `ffprobe` que el WAV de RCP recuperado dura **120.000 s**, es ADPCM IMA, mono, a **10 kHz**; el archivo **no está vacío**.
- `AudioPlayer::begin()` configura I2S (BCLK/WS/DIN), y `playStartupTone()` escribe dos tonos digitales incluso sin LittleFS. Por tanto, ausencia completa de sonido **no queda explicada** por la música.
- El firmware corregido en la rama fija **BCLK GPIO42 P2-6, WS GPIO41 P2-7, DIN GPIO40 P2-8**. Para que funcione físicamente, los cables deben estar en esos mismos GPIO luego de cargar el nuevo firmware.
- Conservar MAX **VIN 5V**, **SD 3V3**, **GAIN GND**, tierra común, y usar contactos **SPK+ y SPK−** reales (sin conexión a GND de altavoz).
- Los logs `AUDIO_FS_READY`, `SPEAKER_SELF_TEST_OK`, `AUDIO_MISSING`, `RCP_MUSIC_READY` ayudan a distinguir errores. `SPEAKER_SELF_TEST_OK` solo confirma transmisión digital de datos, **no prueba sonido audible**. Hace falta prueba física.
- El viejo EXE estable aún espera GPIO 15/16/17. No mover solo un lado (firmware o cables) sin el otro.

## Compilación, publicación y autorización

- Contrato de pines corregido en test y producción.
- GitHub Actions del commit `a2c9145`: test de hardware y lógica **GREEN**, compilación ESP32-S3 **GREEN**, paquete Windows **GREEN**, smoke test Windows **GREEN**, **publicación estable omitida deliberadamente**.
- Mantener una sola ruta permanente del actualizador; no instalar dependencias ni descargar versiones intermedias al ordenador.
- No reemplazar EXE estable hasta: gráficos correctos/visibles aprobados; flujo autónomo de dos controles implementado; prueba de audio físico con MAX en P2; paquete integrado construido y validado.
