# 08 — Interfaz Android, S Pen y experiencia táctil
**Equipo docente principal:** Samsung Galaxy Tab S7 Plus con S Pen; usuario utiliza también PC Windows. **Ruta propuesta:** PWA instalable primero, aplicación Android nativa sólo si capacidades concretas lo exigen.

## Experiencia principal
- Pantalla completa dedicada al lienzo; **sin pestañas permanentes de páginas**.
- Barra de herramientas contextual y discreta, flotante/ocultable, **privada del profesor**, nunca parte del contenido publicado.
- Gesto rápido o control para «fin de sección», «insertar», «modo individual», «Teacher Monitor», «congelar presentación» y «publicar».
- Desplazamiento/zoom del lienzo mediante dos dedos; pluma dibuja; dedo puede navegar (preferencia propuesta y configurable).
- Mover/rotar/dimensionar objetos con asas sin confundir gestos con edición de trazos.
- Lista lateral emergente de secciones como marcadores y saltos, no cambio de hojas.
- El docente puede salir a otras aplicaciones sin que cambie la vista publicada: separar estado local/privado del estado público en servidor.

## Pluma y rendimiento
- Pointer Events (`pointerType=pen`) y presión/inclinación donde el navegador/dispositivo lo exponga; comportamiento específico del S Pen por verificar.
- Rechazo de palma: confiar en soporte del sistema cuando exista y añadir heurísticas sin ocultar falsamente problemas; probar con mano apoyada.
- Trazos predictivos/locales para baja latencia y envío por lotes; otros ven eventos remotos.
- Deshacer/rehacer por autor con reglas que no deshagan accidentalmente trabajo ajeno.
- Buena legibilidad en horizontal y vertical, interfaz usable en proyector débil y alumnos móviles.
- Notificaciones visibles del estado de conexión, pérdida de sesión, audio bloqueado, publicación activa.

## Audio/video Android
- Reproductor dentro del objeto del lienzo, controles con botones grandes y bloqueo según permisos.
- Volumen local siempre accesible; controles grupales separados y claramente identificados.
- Alternar grupos/individuo sin mezclar cursores de tiempo. Mostrar si el reproductor exige un toque para habilitar audio.
- Evitar prometer reproducción de varios videos sin limitación de memoria/decodificador; medir batería y temperatura de la tablet.

## PWA versus nativa
PWA cubre dibujo, sockets y multimedia compatible web. No puede garantizar anotación sobre **cualquier aplicación Android** ni captura arbitraria; las funcionalidades más invasivas requieren app nativa y permisos explícitos. El uso de otras apps **sin compartirlas** sí está contemplado desde la arquitectura de publicación.

## Pruebas manuales mínimas
S Pen al apoyar palma; pan/zoom durante reproducción; dos participantes con diferente relación de aspecto; cambiar a otra app y regresar; background/foreground Android; permiso de autoplay; interrupciones por llamadas y Wi-Fi; reingreso a sesión.
