# 09 — Desarrollo incremental, pruebas y criterios de salida
**Estado actual:** no iniciado técnicamente. Este es un plan, sin fechas comprometidas.

## Fase 0: conservación y prueba de factibilidad
- Expediente GitHub completo, sin tocar main. Auditoría comparativa de código `cracker0dks/whiteboard`, WBO y Canvas propio: mantenibilidad, licencias, pluma, capas y videos DOM.
- Experimentos de 2 navegadores en Windows y Tab S7 Plus para latencia, pluma, audio, iframes.
- **Salida:** seleccionar motor con evidencia y documentar decisión.

## Fase 1: lienzo bilateral + privacidad
- Crear sala docente/alumno con permisos reales y reconexión; objetos vectoriales y trazos en coordenadas mundo.
- Separar servidor/canales de `shared` y `teacher-private`; probar que cambiar de app no se ve.
- Marcador «fin de sección», índice de saltos, guardado/reapertura.
- **Salida:** 2 participantes escriben; secciones navegables; borradores docentes nunca filtrados a alumno.

## Fase 2: multimedia PRIORITARIA
- Objeto de audio/video inserto en lienzo y controles de grupo con permisos.
- Medir y corregir desfase, persistir estado y restaurar reingreso.
- Modo independiente por usuario y múltiples medios simultáneos.
- Probar fuentes propias y embebido de al menos un proveedor permitido; casos de fallo.
- **Salida:** juego grupal autorizado + reproducción individual sin interferencia, medidos en tablet.

## Fase 3: ejercicios individuales + monitor
- Instanciar overlays privados por alumno sobre consigna común.
- Monitor mosaico/foco/zoom y streaming de eventos de **intentos** (no pantalla).
- Corrección docente, consentimiento/ACL y snapshot para compartir y retirar.
- **Salida:** tres alumnos trabajan sin filtraciones; docente corrige A y publica B mientras C sigue.

## Fase 4: experiencia didáctica integrada
- Inserciones PDF/imagen/web permitida, anotaciones por capas, UX táctil.
- Gestión de materiales privados, búsqueda docente, controles ocultos y resúmenes de sección.
- Exportación/revisión de sesiones y limpieza/retención.
- **Salida:** clase real de prueba de principio a fin con autorización y fallback.

## Fase 5: despliegue y endurecimiento
- Hosting con HTTPS/WSS, autenticación, backups, límites, logs seguros, pruebas de carga.
- Pruebas de regresión COG antes de considerar integración; rama de despliegue separada y PR revisado.
- **Salida:** reproducible mediante instrucciones de despliegue, sin cambios sorpresivos a COG.

## Matriz de pruebas base
| Prueba | Actores | Resultado requerido |
|---|---|---|
| T01 | Docente + A | Trazos bidireccionales con mismas posiciones a distinto tamaño/zoom. |
| T02 | Docente + A | Cierre de sección conserva objetos editables y permite salto al marcador. |
| T03 | Docente + A | Abrir buscador/otra app del docente no revela controles ni búsqueda. |
| T04 | Docente + A + B | Grupo: control autorizado de play/pause/seek afecta a todos. |
| T05 | Docente + A + B | Control no autorizado rechazado por servidor, sin efecto en grupo. |
| T06 | Docente + A + B | Individual: A pausa su video sin pausar el de B. |
| T07 | Docente + A + B | Dos medios en paralelo y volúmenes locales aislados. |
| T08 | Docente + A + B | A y B editan versiones distintas del mismo ejercicio sin ver el otro. |
| T09 | Docente + A + B | Monitor privado muestra progreso; alumno A no puede consultar B. |
| T10 | Docente + A + B | Profesor corrige A sin modificar B ni la vista común. |
| T11 | Docente + A + B | Profesor publica snapshot de A; se puede retirar; edición privada posterior no se filtra. |
| T12 | Docente + A | Reconexión restaura objetos, secciones, permisos y media según modo. |
| T13 | S7 Plus | Dibujo S Pen + palma, pan/zoom, pantalla táctil y consumo aceptable. |
| T14 | Varios clientes | Simular buffering, retraso, salto de reloj, rechazo de autoplay, medios no embebibles. |
| T15 | Varias identidades | Pruebas negativas de tokens/ACL para privado docente e intentos individuales. |
| T16 | Docente | Salir/reingresar mantiene control de sala, sin bloqueo por sesión previa. |

## Definición de hecho (DoD)
Cada fase requiere código ejecutado, reproducción de pasos, pruebas y evidencia; una maqueta o un archivo HTML visual **no** satisface requisitos de conexión real. Registrar resultados reales con fecha, versión, dispositivo y URL de despliegue solo cuando exista. No declarar soporte de video sincronizado por ver una sola pantalla.
