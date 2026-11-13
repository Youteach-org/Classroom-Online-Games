# 12 — Bitácora fechada
## 2026-11-12 — Definición funcional
- Se recordó experiencia antigua con **BigBlueButton**, cuya pizarra bilateral no satisfacía necesidades; existió prototipo propio de sincronización de coordenadas posiblemente en Node.js, pero el proyecto original **no está identificado ni recuperado**.
- Se consideraron `cracker0dks/whiteboard` y WBO como candidatos de investigación, **sin** elegir base definitiva.
- Usuario identificó programa histórico de Windows como **OpenBoard**; su modelo de pestañas no agrada.
- Se definió **lienzo infinito**, inserción de material en él, límite lógico «fin de sección», navegación sin páginas físicas.
- Se exigió separación entre la vista privada del docente y la publicación a estudiantes **sin compartir pantalla**.
- Se elevaron al centro del proyecto **audio/video simultáneos con sincronización de grupo, permisos para controlar y opción de reproducción individual**.
- Se definieron ejercicios individuales como versiones/capas de respuesta aisladas; supervisión tipo Teacher Monitor, publicación selectiva y corrección docente.
- Se confirmó que el docente quiere usar **tablet Android con S Pen** para las clases y que acepta el enfoque general.
- Se solicitó conservar **toda la planeación en GitHub COG** para poder cambiar de cuenta de ChatGPT en el futuro.
- Se creó expediente documental en **rama separada** sin modificaciones de `main` ni de los módulos actuales. **No** se ha implementado ni probado código de esta nueva plataforma.

## Plantilla para siguientes entradas
### AAAA-MM-DD — Título
- Contexto y solicitud.
- Decisiones expresas del usuario.
- Cambios de documentos/código (rutas, commit, PR).
- Pruebas ejecutadas **con evidencia**.
- Problemas y pendientes.
- Próximas acciones.

**Advertencia:** registrar solamente hechos comprobados. No afirmar que el proyecto está desplegado si sólo existen documentos.

## 2026-11-12 — Protección empresarial solicitada
- Usuario destacó que YouTeach Classroom será **para su empresa** y debe protegerse para que no cualquiera lo utilice.
- Se identificó un riesgo actual: repositorio COG y rama `docs/youteach-classroom-planning` son **públicos**; PR #66 también es público.
- Se añadió documentación de propiedad intelectual, autenticación/licenciamiento y plan de migración hacia repositorio privado separado, sin modificar `main`.
- **Pendiente:** crear repositorio privado, trasladar documentos, revisar acceso, y posteriormente valorar cierre/retirada de referencias públicas. No se han eliminado rastros públicos ya existentes.
