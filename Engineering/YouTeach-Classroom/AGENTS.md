# AGENTS.md — Instrucciones para cualquier ChatGPT/desarrollador nuevo
## Antes de empezar
1. Leer `README.md` + `00-REQUISITOS.md` + `10-DECISIONES.md` + `11-PENDIENTES.md` + `12-BITACORA.md`.
2. Este expediente es la **fuente documental persistente**: no depender de una cuenta o memoria conversacional; no reabrir decisiones explícitas sin motivo.
3. Distinguir **C confirmado por usuario**, **T propuesta técnica**, y **implementado/probado**. En este expediente sólo hay planeación.
4. Todo cambio importante: actualizar requisitos, decisiones, pendientes, bitácora y pruebas; fecha, razón, responsable y enlace al commit.
5. Verificar si existe código funcional en otra rama antes de prometer un despliegue, y evaluar test results en dispositivo real.
6. No editar apps existentes de COG, su `main`, deploy config, Teacher Monitor de COG ni la documentación del robot por este proyecto **sin instrucción explícita**. Nunca fusionar la rama documental automáticamente.
7. Evitar publicar datos personales reales de alumnos en este **repositorio público**. Usar datos ficticios.

## Objetivos innegociables del producto
- **Pizarra infinita bilateral** con secciones marcadas «fin de sección», sin páginas rígidas/pestañas.
- Insertar multimedia/audio/video/web embebible en el espacio.
- **La prioridad absoluta es multimedia síncrona o individual**, controles por permisos; no diseñar sólo una maqueta estática.
- **No compartir pantalla**, dos vistas: privado docente (búsquedas, controles, borradores) y público/alumno.
- Actividades individuales como overlays sobre material común.
- Teacher Monitor privado con mosaico/foco/zoom, corrección docente y publicación selectiva de respuestas.
- Experiencia S Pen/Android (Galaxy Tab S7 Plus), idealmente PWA ligera antes de nativa si pasa pruebas.
- Guardar continuidad en GitHub, para retomar desde cualquier cuenta.

## Primeras tareas posibles, sin prometer resultados
- POC dos dispositivos: sincronizar trazos y media grupo/individual en Node.js + Socket.IO con seguridad mínima.
- Evaluar `cracker0dks/whiteboard` vs otros sin violar licencias.
- Test real de permisos cruzados para overlays privados y publicación de snapshots.
- Prueba de stylus, cambio de aplicación y reingreso en Tab S7 Plus.
- Documentar decisiones técnicas después de medir; publicar código separado de COG vigente.

## Registro obligatorio al completar una tarea
Añadir a `12-BITACORA.md`: fecha, hipótesis, resultados, archivos, rama/commit, URL de pruebas, fallos, próximos pasos. No afirmar «funciona» sin evidencia. Si se crea demo, incluir instrucciones reproducibles para instalar y ejecutar en una cuenta nueva.
