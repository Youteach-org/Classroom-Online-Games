# 01 — Flujos y experiencia de usuario
## Modelo mental: un cuaderno infinito, no diapositivas
Docente y alumnos ven un área común como si compartieran mesa. Encima hay objetos: escritura, formas, video, audio, PDF, imagen, ejercicio o web incrustable. La barra docente se oculta/expande sin cambiar el contenido publicado. **No hay pestañas de pizarra**. Se usan marcadores «fin de sección», con salto a cualquier bloque registrado y revisión posterior.

## Escenario A — explicación grupal con medios
1. Docente entra con token administrativo y elige sección actual.
2. Inserta un video y un audio en posiciones del lienzo; puede usar uno o varios reproductores simultáneos.
3. Previsualiza materiales **en espacio privado**. Verifica enlaces antes de publicarlos.
4. Publica objeto(s) y el grupo los ve; los alumnos obtienen controles permitidos (solo mirar / play-pause / seek / volumen local).
5. Docente pulsa reproducir: cada dispositivo reproduce el recurso local, sobre una línea de tiempo compartida. Un alumno autorizado puede pausar o regresar y el grupo recibe el cambio.
6. Docente marca «fin de sección» y sigue escribiendo; la sección anterior permanece editable/recuperable.

## Escenario B — ejercicio individual sobre material común
1. Docente crea un ejercicio como región/objeto dentro del lienzo (por ejemplo, PDF con preguntas, texto, imagen, video/audio asociado).
2. Define `mode=individual`: se congela/referencia el **material base** del ejercicio y se instancia un espacio privado de respuesta por alumno.
3. Cada alumno ve **la misma consigna**, dibuja y escribe **sobre su propia versión**; la base original no se modifica.
4. Cada alumno reproduce audio/video a su ritmo si el objeto multimedia está en modo individual.
5. Docente abre Teacher Monitor: mosaico, estado, progreso, foco individual, respuesta viva.
6. Docente solicita/efectúa una corrección visible para el alumno elegido según la política de consentimiento que se defina; añade anotación atribuida al profesor.
7. Docente selecciona una versión y pulsa «Compartir con clase»: el sistema publica una **instantánea o vista de revisión separada**, sin hacer pública automáticamente la versión editable privada.
8. El grupo comenta; docente retira el ejemplo o comparte otro; cada trabajo original continúa privado.
9. Docente marca límite de sección, archiva versiones y puede volver a revisar.

## Escenario C — privacidad de preparación
- Mientras estudiantes trabajan, el profesor cambia a cualquier otra aplicación Android/Windows, busca multimedia o prepara nuevos objetos en un espacio privado.
- **No se captura ni retransmite el escritorio.** La vista estudiantil mantiene su última escena publicada, aun si el profesor minimiza o cambia de app.
- El docente puede congelar seguimiento de cámara, ocultar sus controles y editar borradores; únicamente un acto expreso de publicación cambia la escena compartida.
- Los estudiantes continúan avanzando individualmente y el monitor recibe únicamente eventos pertinentes del trabajo dentro de la app.
- Riesgo a probar: Android puede suspender conexiones en segundo plano; nunca asegurar persistencia perfecta sin pruebas en el dispositivo.

## Escenario D — acceso/reingreso
- Docente conserva su acceso a la sesión (no bloquear reingreso luego de salir).
- Al reingresar restaura autorizaciones, última sección publicada, monitor y borradores.
- Un estudiante reconectado recibe instantánea de su trabajo y luego eventos incrementales.
- Definir claramente qué ocurre con trabajos no enviados y sesiones expiradas.

## Reglas UI
- No proyectar consola administrativa a estudiantes, ni nombres de archivos privados, historial de búsqueda o pestañas abiertas.
- El vínculo de material incrustado no equivale a permiso de divulgar borradores.
- En modo individual, abrir al alumno A no altera el contenido del alumno B ni la presentación del grupo.
- El docente puede revisar en privado antes de mostrar; publicar requiere acción explícita y reversible.
- Secciones son marcadores lógicos de navegación y revisión, no rectángulos fijos que recorten el lienzo.
