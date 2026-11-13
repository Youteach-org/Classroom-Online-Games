# YouTeach Classroom — expediente maestro
**Estado:** planeación inicial, sin aplicación implementada · **Versión documental:** 0.1 · **Fecha:** 2026-11-12
**Repositorio:** Youteach-org/Classroom-Online-Games · **Carpeta:** `Engineering/YouTeach-Classroom/`
**Nombre de trabajo:** “YouTeach Classroom”, provisional; **no** se ha aprobado un nombre comercial.

## Visión aprobada
Construir una plataforma **ligera, preferentemente gratuita para probar y utilizar en clases individuales o grupales**, que NO dependa de BigBlueButton ni de transmitir la pantalla. El núcleo es un **lienzo infinito bilateral** (profesor/alumnos), donde se insertan textos, trazos, PDF, imágenes, audio, video y, donde sea técnicamente permitido, páginas web embebidas. Las *secciones* se crean al marcar un «fin de sección» y sirven para navegación y revisión, **sin páginas físicas ni pestañas obligatorias**.

La función principal es la **reproducción de audio/video sincronizada o individual**, con control compartido **según permisos**. Un ejercicio puede asignarse en modo individual: cada estudiante modifica su **propia versión**; el profesor observa las versiones en un **Teacher Monitor privado** y publica una respuesta seleccionada cuando decida. También puede **corregir directamente** en la versión individual, respetando la política de consentimiento y permisos que se acuerde.

El docente puede buscar videos, cambiar de aplicación, editar material aún no publicado y controlar la sesión **sin transmitir sus acciones privadas** a estudiantes. El contenido se transmite por eventos y objetos autorizados, no por captura de pantalla.

**Dispositivo docente prioritario:** Samsung Galaxy Tab S7 Plus con S Pen (Android), además de navegador de escritorio Windows y otros equipos; propuesta inicial PWA y, si procede, posterior Android nativa.

## Principios no negociables
1. Una sola experiencia de lienzo continuo, no estructura rígida de pestañas/páginas.
2. Sin screen sharing para la pizarra; publicar exclusivamente objetos autorizados.
3. Dos vistas independientes: espacio privado docente y espacio compartido/individual del estudiante.
4. Audio/video sincronizado y bajo control autorizado, con modo independiente por participante.
5. Superposición de respuestas individuales sobre un material base común, sin filtrar respuestas ajenas.
6. Teacher Monitor privado (mosaico, foco, ampliación, correcciones, publicación selectiva).
7. Baja latencia; ahorro de transferencia: no transmitir cuadros de video ni fotogramas de la pizarra.
8. La documentación precede a implementación; las propuestas técnicas se validan con prototipos, no se anuncian como operativas.
9. **No alterar COG existente ni su rama `main` durante la documentación.** Mantener rama de docs independiente.
10. Persistencia y traspaso: expedientes legibles por una nueva persona o cuenta sin depender de memoria de ChatGPT.

## Índice / leer en este orden
- [00-REQUISITOS.md](00-REQUISITOS.md): objetivos y aceptación.
- [01-FLUJOS-Y-EXPERIENCIA.md](01-FLUJOS-Y-EXPERIENCIA.md): experiencia profesor/alumno.
- [02-ARQUITECTURA.md](02-ARQUITECTURA.md): componentes, costes, dependencias.
- [03-LIENZO-Y-SECCIONES.md](03-LIENZO-Y-SECCIONES.md): objetos, marcadores y navegación.
- [04-MULTIMEDIA-SINCRONIZADA.md](04-MULTIMEDIA-SINCRONIZADA.md): audio/video grupal e individual.
- [05-ACTIVIDADES-Y-CORRECCIONES.md](05-ACTIVIDADES-Y-CORRECCIONES.md): versiones individuales y corrección.
- [06-TEACHER-MONITOR.md](06-TEACHER-MONITOR.md): supervisión privada y exposición selectiva.
- [07-SEGURIDAD-Y-PRIVACIDAD.md](07-SEGURIDAD-Y-PRIVACIDAD.md): roles, aislamiento, guardado.
- [08-INTERFAZ-ANDROID.md](08-INTERFAZ-ANDROID.md): interacción S Pen, móvil, PWA.
- [09-PLAN-Y-PRUEBAS.md](09-PLAN-Y-PRUEBAS.md): fases, pruebas y salida.
- [10-DECISIONES.md](10-DECISIONES.md): confirmado vs provisional.
- [11-PENDIENTES.md](11-PENDIENTES.md): decisiones que faltan.
- [12-BITACORA.md](12-BITACORA.md): historial fechado.
- [13-EVENTOS-Y-CONTRATOS.md](13-EVENTOS-Y-CONTRATOS.md): protocolo preliminar.
- [14-REFERENCIAS.md](14-REFERENCIAS.md): candidatos y fuentes.
- [AGENTS.md](AGENTS.md): instrucciones para continuar sin esta conversación.

## Estado real al 2026-11-12
**Sólo documentación y diseño.** No hay demo desplegada ni servidor/pizarra/audio funcional verificados como parte de este expediente. La sincronización precisa de reproductores de terceros, el aislamiento de ediciones y el soporte de incrustación web se validarán por pruebas.

## Relación con COG
COG es el repositorio contenedor, no una autorización para modificar juegos existentes. Teacher Monitor es una **inspiración funcional** del monitor de COG: su implementación y datos no se deben reutilizar a ciegas ni modificar sin una tarea específica y permiso. No integrar ni fusionar en `main` automáticamente.
