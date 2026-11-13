# 05 — Ejercicios individuales, overlays y corrección docente
## Idea central
Un ejercicio escrito **sobre la pizarra** se puede «marcar como individual». El material de base permanece común y cada alumno crea su **propia capa de respuesta**. El profesor ve todas las capas en privado, puede corregir en una versión particular y compartir una respuesta elegida para discusión colectiva.

## Modelo candidato
- `ExerciseBase`: `exerciseId`, `sectionId`, contenido o referencias a objetos, `baseRevision`, consigna, multimedia asociada, visibilidad y reglas de edición.
- `StudentAttempt`: `attemptId`, `exerciseId`, `studentId`, estado, `baseRevision`, creación/actualización.
- `ResponseOverlay`: trazos/textos/formas/selecciones del alumno con `attemptId` y `authorId`; **no** copia completa del lienzo común.
- `TeacherFeedbackLayer`: trazos, comentarios, correcciones y anotaciones atribuibles al profesor para **un intento**.
- `PublishedReview`: referencia a versión/snapshot de intento o reproducción filtrada, creada por acción explícita docente. No confiere acceso al intento privado original ni sus futuras modificaciones.
- `ReviewEvent`: publicado, retirado, anónimo/con nombre, quién decidió, hora.

## Flujo de actividad
1. Profesor delimita objeto/región/ejercicio y selecciona «Individual».
2. Servidor crea asignación y asocia intentos a estudiantes autorizados.
3. Cada alumno dibuja y escribe en su overlay, no modifica `ExerciseBase`.
4. Teacher Monitor recibe eventos filtrados de progreso y cambios incrementales por alumno.
5. Profesor selecciona un alumno, abre la versión privada y anota sobre su capa de feedback; corrección docente y respuesta original distinguibles visualmente.
6. Si se habilita política de consentimiento, el alumno acepta intervención docente en su ejercicio; ver `11-PENDIENTES.md`.
7. Profesor comparte una versión: crea `PublishedReview` acotado, opcionalmente anónimo; **nunca** cambia ACL del intento completo.
8. Al terminar, docente puede cerrar/archivar; los estudiantes no pierden su versión guardada.

## Cambio de material base
Si el profesor corrige la consigna durante un ejercicio:
- no sobreescribir silenciosamente los intentos existentes;
- conservar `baseRevision` original y ofrecer migración/versionado;
- avisar que algunos alumnos están sobre versión anterior; decidir si actualizar nuevas versiones.

## Permisos
| Acción | Docente | Alumno dueño | Otros alumnos |
|---|---|---|---|
| Leer consigna publicada | Sí | Sí | Si asignado |
| Ver overlay privado del alumno A | Sí | Sólo A | **No** |
| Editar respuesta A | Bajo política docente | Sí, si abierta | **No** |
| Añadir feedback docente A | Sí | No | No |
| Publicar respuesta A | Sí | No | No |
| Ver revisión publicada A | Sí | Si autorizado | Si autorizado |
| Retirar revisión | Sí | No | No |

## Aceptación
Con tres alumnos, A y B editan al mismo tiempo sobre la misma consigna y no ven las respuestas del otro. El profesor abre A y escribe una corrección que sólo A y el profesor reciben; luego publica una instantánea de B para todos; nuevas ediciones de B no se filtran automáticamente a la instantánea. Los datos sobreviven refresco y reingreso.
