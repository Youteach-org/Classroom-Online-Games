# 10 — Registro de decisiones (no confundir propuestas con aprobación)
## Confirmadas por el usuario — 2026-11-12
| ID | Decisión | Fundamento |
|---|---|---|
| D-001 | Revivir la idea de pizarra bilateral propia y preferirla a reutilizar BBB. | BBB se considera pesado para este uso. |
| D-002 | No utilizar pestañas/páginas rígidas de OpenBoard. | Usuario utilizó OpenBoard, pero rechazó ese flujo. |
| D-003 | Lienzo infinito con «fin de sección» que agrupa contenido desde cierre anterior. | Navegar por secciones sin romper continuidad. |
| D-004 | Incluir audio, video y páginas web insertados en el propio lienzo cuando sea viable. | Explicación y tareas dentro del espacio de trabajo. |
| D-005 | Diferenciar vista docente privada de la vista de alumnos; no screen sharing. | Profesor debe poder buscar material/cambiar de app sin mostrarlo. |
| D-006 | Función principal: multimedia simultánea, sincronizada y controlable por autorizados. | Reproducción compartida y permisos. |
| D-007 | Posibilidad de reproducción individual de audio/video. | Cada alumno repite y avanza a su ritmo. |
| D-008 | Asignar ejercicios individuales con versiones independientes de respuestas. | Todos escriben sobre su propia versión. |
| D-009 | Teacher Monitor privado con revisión en vivo y compartir respuesta elegida. | Supervisión y revisión grupal selectiva. |
| D-010 | Corrección docente directa sobre versiones individuales. | Usuario confirmó que le agrada esta capacidad. |
| D-011 | Priorizar experiencia con tablet Android / S Pen. | Dinamismo en clases desde tablet. |
| D-012 | Guardar toda planeación en GitHub COG para cambio futuro de cuenta. | Portabilidad del conocimiento y control documental. |

## Propuestas técnicas abiertas — NO aprobadas como elecciones definitivas
| ID | Propuesta | Validación exigida |
|---|---|---|
| P-001 | Node.js + Socket.IO para sincronía. | Prototipo real de latencia, reconexión, costes. |
| P-002 | PWA Android primero, app nativa si hace falta. | S Pen, multitarea, rendimiento multimedia. |
| P-003 | Motor basado en Canvas/SVG con objetos DOM para videos/iframes. | Evaluar con PDFs y medios reales. |
| P-004 | Probar cracker0dks/whiteboard como posible base, vs WBO, vs propio. | Auditoría técnica/licencia. |
| P-005 | SQLite inicial, objetos/file store privado. | Carga, backups y retención de datos. |
| P-006 | Media sync mediante reloj canónico y corrección de deriva. | Medir resultados reales y limitaciones APIs. |
| P-007 | Corrección docente bajo consentimiento del alumno. | Definir si requiere permiso explícito por alumno/actividad. |
| P-008 | Publicar instantánea anonimizada por defecto. | Confirmar preferencia docente sobre nombres/actualizaciones. |
| P-009 | Seguir al profesor, congelar vista y exploración libre. | Confirmar detalles de navegación. |
| P-010 | Servidor propio y posible túnel para piloto. | Seguridad y accesibilidad fuera de LAN. |

## Regla
Registrar cada cambio relevante: `ID · fecha · origen (usuario/propuesta/prueba) · alternativas · decisión aprobada · consecuencias · archivos afectados · pruebas requeridas`. **Ningún supuesto del asistente adquiere rango de requisito sólo por aparecer aquí.**

## 2026-11-12 — Protección comercial
| ID | Decisión | Fundamento |
|---|---|---|
| D-013 | **Confirmada:** YouTeach Classroom es un proyecto de empresa y no debe poder ser usado por cualquiera. | Solicitud expresa del usuario. |
| D-014 | **Propuesta operativa:** mover planificación y futuro código a repositorio **privado separado** de Youteach-org; no privatizar COG. | COG actual es público y su despliegue debe conservarse. Repositorio privado todavía **no creado**. |
| D-015 | **Propuesta técnica:** limitar acceso mediante autenticación, roles y licencias en backend; código original propietario. | Una URL escondida, PWA o repositorio privado no bloquean por sí solos el uso de un servicio publicado. |

Ver `15-PROTECCION-Y-LICENCIAMIENTO.md`.
