# 11 — Pendientes y definiciones abiertas
Ninguno bloquea guardar el expediente ni construir una POC acotada; sí condicionan elecciones definitivas.

| ID | Pregunta pendiente | Impacto |
|---|---|---|
| P-01 | ¿Marcar fin de sección muestra una línea/marca visual, o sólo marcador de navegación? | UX de lienzo. |
| P-02 | ¿El agrupamiento de sección es temporal de eventos, selección de región o ambos? Recomendación temporal con posibilidad de reordenar. | Semántica y modelos. |
| P-03 | ¿Cuántos alumnos simultáneos deben soportarse en clase real (1:1, 20, 40...)? | Infraestructura y carga. |
| P-04 | ¿Se necesita videollamada en vivo además de multimedia educativa sincronizada? | Arquitectura WebRTC. |
| P-05 | ¿Cómo se autoriza corrección docente: al asignar, por alumno, o siempre por política del curso? | Privacidad y UX. |
| P-06 | ¿Al publicar respuesta se ve autor, se anonimiza o se elige por vez? | Revisión grupal. |
| P-07 | ¿Publicar una respuesta muestra snapshot fijo o permite modo vivo temporalmente? | Seguridad de overlays. |
| P-08 | ¿Qué formatos/prioridades de materiales: PDF, MP4, MP3, YouTube, sitios específicos? | Integración de medios. |
| P-09 | ¿El alumno puede mover libremente la cámara, o sólo cuando profesor lo habilite? | UX y sincronización. |
| P-10 | ¿Edición de texto en tiempo real requiere CRDT o bastan bloqueos/versiones por objeto? | Complejidad/colisiones. |
| P-11 | ¿Qué nivel de guardado, exportación, recuperación histórica y borrado se necesita? | Almacenamiento y datos personales. |
| P-12 | ¿Qué hospedaje y dominio convienen, con límite de presupuesto? | Coste y despliegue. |
| P-13 | ¿La aplicación tendrá nombre distinto de “YouTeach Classroom”? | Identidad. |
| P-14 | ¿Qué niveles de permiso multimedia (play/pause/seek/rate/gestión) se darán a alumnos? | ACL por control/objeto. |
| P-15 | ¿Se compartirá públicamente en COG o como herramienta separada? | Integración y despliegue. |
| P-16 | ¿Qué datos de alumno se conservarán, con qué periodo de retención y consentimiento? | Privacidad. |
| P-17 | ¿Motor base cracker0dks/whiteboard, WBO o propio? Auditar licencia y mantenimiento. | Deuda técnica. |
| P-18 | ¿Debe poder abrir una web que prohíbe embed? Posibles alternativas sin prometer integración universal. | UX de navegador. |

## Siguiente sesión sugerida
Empezar por POC mínima de dos usuarios: S Pen ↔ desktop con objetos/ACL y medios grupo/individual; validar que profesor no comparta cambios de aplicaciones ni borradores. Después pasar a overlays + monitor. **No omitir la función prioritaria de multimedia sincronizada para hacer solamente una pizarra visual.**

## Protección y comercialización
- P-19: Crear y verificar `Youteach-org/YouTeach-Classroom` como **repositorio privado**; copiar allí el expediente; evaluar cerrar PR #66 y retirar rama pública una vez verificada migración. **No se ha hecho todavía**.
- P-20: Definir titular legal de derechos (empresa o persona física), y contratos/cesiones si hay colaboradores.
- P-21: Definir política comercial: licencias por docente, escuela o alumnos; quién puede invitar y revocar accesos.
- P-22: Definir nivel de privacidad de materiales y retención de trabajos de estudiantes.
- P-23: Revisar licencia de cada dependencia antes de integrarla en producto propietario.
