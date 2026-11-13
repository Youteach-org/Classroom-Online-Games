# 06 — Teacher Monitor integrado (privado)
**Inspiración explícita:** Teacher Monitor existente de COG/YouTeach (mosaico, vista enfocada, ampliar, supervisión). **No** copiar implementación ni modificar su código actual por esta documentación.

## Vistas
1. **Mosaico:** tarjetas de estudiantes conectados, actividad/section, progreso, último cambio, miniatura generada desde los objetos permitidos de su intento, estado online/offline.
2. **Enfocada:** una versión individual amplia, con barra lateral de otros alumnos y navegación siguiente/anterior.
3. **Inspección:** pan/zoom docente privado, trazos visibles, historial, comentarios; no cambia viewport de los estudiantes.
4. **Corrección:** herramientas docentes directamente sobre la versión del estudiante seleccionado; atribución clara y opción de deshacer.
5. **Publicación:** botón explícito «Compartir esta respuesta» (instantánea/vista de revisión) con opción de anonimizar, luego «Dejar de compartir».
6. **Vistas concurrentes:** se puede mostrar simultáneamente progreso de múltiples alumnos sin mezclarlos y abrir foco sin perder mosaico.

## Información permitida
- Sólo acciones **dentro de esta plataforma**: puntos dibujados, contenido enviado, estado de ejercicio, avance y reproducción individual si se acuerda mostrarla.
- No captura de escritorio, otras apps, cámara ajena, navegación externa ni mensajes de fuera del aula.
- Estado de «trabajando / terminó / sin iniciar / desconectado» debe derivarse de eventos reales; sin inferir actividad como verdad absoluta.

## Política de estados
- `privateFocusStudentId` y miniaturas son **sólo docentes**, nunca multicast al grupo.
- Unirse/reingresar como docente no bloquea el acceso; autenticar token de gestión y recuperar sesiones activas.
- Profesor puede atender varios grupos/sesiones, pero MVP puede limitar una sesión a la vez; definir en pendientes.
- Usar throttling, agregación y compresión para que 20 miniaturas **no** provoquen transmisión de video de pantalla; cantidad máxima a validar.
- Permisos se validan en servidor para lectura de cada intento y cada evento.

## Riesgos especiales
- Error de filtros que filtre datos de A a B: test de seguridad obligatorio.
- Publicar sin anonimizar: preferir previsualización del contenido exacto que saldrá y un nombre oculto por defecto como **propuesta**, no aprobación.
- La «respuesta en vivo» compartida debe ser un modo separado **sólo si** docente lo autoriza; default publicar snapshot.
- No utilizar Supabase Realtime por defecto: el objetivo es evitar tráfico excesivo; posible reevaluación técnica documentada.

## Casos de prueba
Docente ve tres tarjetas diferentes; selecciona B, enfoca y corrige, los otros siguen trabajando; alumno A no puede consultar URL ni eventos de B; se publica snapshot de C, todas las pantallas autorizadas ven ese snapshot y ninguna accede al intento editable privado de C.
