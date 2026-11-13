# 03 — Lienzo infinito y secciones lógicas
## Objetivo
Un **lienzo continuo bidireccional**, con coordenadas del mundo independientes de zoom y resolución; sin hojas rígidas. El profesor marca «fin de sección» en cualquier momento y el sistema crea una unidad navegable/revisable agrupando elementos y cambios **desde el cierre anterior hasta esta marca**. La marca no transforma el contenido en captura ni lo vuelve ineditable.

## Entidades candidatas
- `CanvasSpace`: curso/clase, unidad lógica, sistema de coordenadas continuo.
- `CanvasObject`: id, tipo (`stroke|text|shape|image|pdf|audio|video|web|exercise`), transformación mundo (`x,y,w,h,rotation,z`), autor, visibilidad, versión, propiedades tipadas.
- `Stroke`: series de puntos `x,y` mundo o normalizados al objeto, color, ancho, presión opcional, id trazador; transmitir en lotes ordenados, confirmar al final.
- `Section`: id, índice/orden, `start_event_sequence`, `end_event_sequence`, titulo, fecha y `navigation_bounds`/ancla, listado lógico de objetos/acciones, estado abierta/cerrada.
- `Viewport`: `centerX, centerY, scale`, pose por cliente; sólo se sincroniza si `followTeacher=true`.
- `Visibility`: `public|teacher_private|student_private|review_publication` con ACL explícita.

## Semántica importante de límites
1. Marcar «fin» captura un límite **temporal/lógico** entre eventos/elementos, NO una línea de recorte en X/Y.
2. El objeto creado antes de la marca pertenece a la sección de origen; los elementos creados después, a la nueva sección.
3. Si más tarde se corrige un objeto antiguo, **sigue perteneciendo a su sección original**, con historial de revisiones nuevo; no se reasigna automáticamente.
4. Objetos que se solapen espacialmente pueden pertenecer a secciones diferentes. La navegación usa anclas y encuadres guardados, no exige separadores visibles.
5. En caso de arrastrar un objeto entre regiones, la pertenencia lógica se conserva a menos que el profesor elija moverlo de sección.
6. Los objetos de actividad base y overlays individuales conservan `section_id`/ `exercise_id` para consulta y evaluación.
7. La marca puede mostrar un indicador discreto **o solo aparecer en el índice docente**: aspecto visual pendiente de decisión del usuario.
8. Cerrar sección jamás elimina, aplana ni bloquea contenido por defecto.

## Navegación esperada
- Índice docente con miniaturas/títulos y «saltar a sección». Nada de cambiar de página física.
- Salto animado posiciona viewport en ancla y restaura encuadre, sin cambiar permisos/visibilidad.
- Alumno en `followTeacher` recibe cámara/área de interés publicada; en exploración libre elige encuadre propio autorizado.
- Acciones de búsqueda, zoom privado, borradores y monitor no alteran la cámara del estudiante.
- Selección de objetos por superficie táctil; pan/zoom multitáctil; dibujo con S Pen.

## Inserciones multimedia/web
- Video y audio como objetos espaciales interactivos con controles de reproducción/volumen.
- PDF por páginas **dentro del objeto PDF**, no equivale a páginas del lienzo; anotaciones en capa asociada al documento.
- Web embebida en iframe/sandbox o vista especializada cuando permitido; una web arbitraria puede impedir iframe y lectura/manipulación cruzada.
- No prometer escribir encima de cualquier web externa: superponer lienzo de anotación propio donde las reglas de seguridad lo permitan.

## Persistencia
Snapshots periódicos + log de eventos append-only/versionado por objetos/secciones; previsualización en tiempo real por WebSocket; recuperar desde snapshot y deltas. Política de compactación y deshacer por autor pendiente.
