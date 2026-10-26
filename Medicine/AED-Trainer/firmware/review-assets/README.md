# DEA V15 — propuestas visuales en revisión

**Propuestas visuales para la rama de prueba; aún no forman parte de la versión estable.**
La nueva compilación de prueba usa fotografías de esta carpeta en lugar de los
JPG antiguos incluidos como base64 en `display-source.json`.

Se conservan por separado para que las decisiones y archivos no dependan del
historial de ChatGPT. Todas estas fotografías propuestas son originales,
independientes, de **1402 × 1122 píxeles** (5:4 aproximadamente), sin texto ni
dibujos de palitos, para evaluación previa a la reducción definitiva a la TFT
física ST7735 de 160 × 128 píxeles.

| Archivo | Pantalla candidata | Estado de revisión |
| --- | --- | --- |
| `00_inicio.jpg` | Presentación del DEA de entrenamiento | Pendiente de aprobación |
| `01_respuesta.jpg` | Comprobar respuesta (intento anterior) | **Rechazado:** una mano estaba demasiado cerca del rostro |
| `01_respuesta_corregida_propuesta.jpg` | Comprobar respuesta con ambas manos sobre los hombros | Pendiente de aprobación |
| `02_llamar_emergencias.jpg` | Pedir ayuda | Pendiente de aprobación |
| `03_comprobar_respiracion.jpg` | Comprobar respiración | Pendiente de aprobación |
| `04_exponer_pecho.jpg` | Exponer pecho del maniquí | Pendiente de aprobación |
| `05_colocar_electrodos_revisar.jpg` | Colocar parches adulto (intento anterior) | **Rechazado:** segundo electrodo demasiado bajo/anterior |
| `05_electrodos_vista_anterior_propuesta.jpg` | Colocar parches adulto (nueva vista frontal orientada) | Pendiente de aprobación: superior en pecho derecho del maniquí; lateral en costillas izquierdas bajo axila |
| `05_parches_nino_nuevo.jpg` | Parches en maniquí pediátrico, electrodos blancos sin dibujos | Propuesta nueva de revisión |
| `06_parches_lactante_nuevo.jpg` | Maniquí lactante con electrodo posterior entre escápulas, anterior fuera de cámara | Propuesta nueva de revisión |
| `06_compresiones_rcp.jpg` | Iniciar compresiones | Pendiente de aprobación |
| `07_todos_despejados_revisar.jpg` | Apartarse para análisis/descarga (intento anterior) | **Rechazado:** segundo electrodo demasiado bajo/anterior |
| `07_todos_despejados_corregida_propuesta.jpg` | Apartarse para análisis/descarga; mujer sin tocar maniquí ni cables | Pendiente de aprobación: conserva electrodo superior a la derecha del paciente y lateral bajo axila izquierda |
| `08_pulsar_descarga.jpg` | Pulsar el botón de descarga en DEA de entrenamiento | Pendiente de aprobación |
| `09_ventilaciones.jpg` | Ventilación en maniquí con mascarilla de bolsillo | Pendiente de aprobación |
| `10_error_conexion.jpg` | Error: conector del cable de los parches separado del equipo | Pendiente de aprobación |
| `11_ahogamiento.jpg` | Caso especial: maniquí de entrenamiento fuera del agua | Pendiente de aprobación |

Los dos archivos con `_revisar` permanecen para trazabilidad, pero están
**rechazados y no deben convertirse a imágenes de firmware**. La nueva foto
de los parches conserva vista superior orientada para evidenciar el lugar
anatómico de cada electrodo. El empaquetador
`tools/build_display_jpeg_pack.py` ahora enlaza fotografías con las 32
posiciones de pantalla de la rama de prueba; algunos estados similares
reutilizan la misma fotografía. Cada fuente se reduce mediante LANCZOS al
formato físico 160 × 128, a color. Sigue pendiente la aprobación visual
individual y la prueba en la TFT física. El cambio **no modifica audios**.

La colocación estándar de electrodos en el adulto se revisa conforme a la
American Red Cross: uno en el pecho superior derecho, bajo clavícula; el
otro en el costado izquierdo, línea medioaxilar, bajo la axila.

No publicar ni actualizar el EXE estable con estas fotografías hasta
aprobarlas visualmente y verificarlas en la pantalla física.
