# 00 — Requisitos trazables y criterios de aceptación
**Origen:** conversación de definición del 2026-11-12. Clave: **C** confirmado por usuario; **T** criterio técnico propuesto, aún pendiente de validación. Las pruebas de aceptación describen objetivos, no resultados logrados.

| ID | Estado | Prioridad | Requisito | Criterio de aceptación |
|---|---|---|---|---|
| R-01 | C | Crítico | Lienzo bidireccional continuo e infinito | Profesor y alumno editan y observan trazos simultáneos en distintos tamaños de pantalla. |
| R-02 | C | Crítico | No obligar a pestañas ni páginas físicas | La edición transcurre en un lienzo único; navegación por secciones opcionales. |
| R-03 | C | Crítico | Marcar fin de sección agrupa trabajo desde marca anterior | Se conserva la pertenencia lógica de objetos; navegación recupera la sección editable. |
| R-04 | C | Crítico | Objetos insertables en el lienzo | Dibujos, imágenes, archivos y audio/video en posiciones y tamaños editables. |
| R-05 | C | Alto | Contenido web dentro del lienzo | Permitir inserción cuando el proveedor y navegador autoricen embebido. |
| R-06 | C | Crítico | Vista del docente con herramientas y búsqueda privadas | Alumno no observa cambios de app, búsquedas o controles privados. |
| R-07 | C | Crítico | **No compartir pantalla** como mecanismo de pizarra | Sólo se distribuyen objetos/eventos expresamente publicados. |
| R-08 | C | Crítico | Audio y video sincronizados entre participantes | Play/pause/seek operan para grupo y se corrige deriva tolerable. |
| R-09 | C | Crítico | Controles de medios delegables por permisos | Alumno autorizado controla medios; alumno no autorizado no puede alterar el grupo. |
| R-10 | C | Crítico | Reproducción individual | Cada alumno avanza/pausa/repite audio/video a su ritmo. |
| R-11 | C | Crítico | Audio y video simultáneos | Soportar varios medios independientes cuando dispositivo/proveedor lo permitan; aislar comandos por objeto. |
| R-12 | C | Crítico | Ejercicios compartidos con modo individual | Todos reciben base común y cada alumno crea respuesta distinta. |
| R-13 | C | Crítico | Respuestas de alumnos no visibles a compañeros por defecto | Otro alumno no puede acceder a overlays ajenos ni por URL/evento/API. |
| R-14 | C | Crítico | Teacher Monitor de respuestas individuales | Profesor ve avance de cada alumno, abre, amplía y revisa sin publicar. |
| R-15 | C | Crítico | Compartir respuesta seleccionada | Docente publica una respuesta o versión seleccionada para revisión grupal. |
| R-16 | C | Crítico | Corrección directamente en respuesta individual | Profesor puede hacer anotaciones/correcciones en versión particular bajo permiso acordado. |
| R-17 | C | Alto | Secciones individuales comparables y revisables | Profesor recupera trabajos por alumno y sección para revisar. |
| R-18 | C | Alto | Android y tablet como centro de clase | Funciona con tablet, escritura táctil y pluma, además de PC. |
| R-19 | C | Alto | Ligereza y coste bajo/gratuito | Primer piloto sin BBB ni servidor de video pesado; costos reales de infraestructura transparentes. |
| R-20 | C | Crítico | Guardar diseño completo en GitHub COG | Documentación versionada, rastreable y suficiente para cambio de cuenta. |
| R-21 | C | Crítico | No alterar app COG vigente por esta planeación | Archivos nuevos en rama independiente; no merge/despliegue de main. |
| R-22 | T | Alto | Recuperación tras desconexión | Reingreso restaura sección, objetos, permisos y respuestas ya confirmadas. |
| R-23 | T | Alto | Calidad mínima de dibujo | Muestreo/agrupación de coordenadas con presión si existe; sin saltos obvios. |
| R-24 | T | Alto | Sincronización robusta por objeto | Orden/versionado, permisos server-side, resolución básica de conflictos. |
| R-25 | T | Alto | Modo seguir profesor/exploración libre | Alumno puede seguir cámara publicada o navegar en modo autorizado. |
| R-26 | T | Alto | Congelar contenido visible al alumno | Profesor trabaja en privado sin cambiar la vista pública. |
| R-27 | T | Alto | Guardado de actividad/sección y exportación | Reabrir y exportar trabajo, con política de privacidad. |
| R-28 | T | Alto | Autenticación de profesor y estudiantes | Código de sesión/acceso y token de gestión no compartido. |
| R-29 | T | Alto | El estado publicado es explícito | Elementos privados nunca se publican por seleccionar o enfocar. |
| R-30 | T | Medio | Videollamada opcional independiente | Si se incorpora WebRTC, no acoplarlo a dibujos/medios y validar TURN. |
| R-31 | T | Alto | Accesibilidad y UI táctil | Objetivos táctiles, teclado, alto contraste, gestos no obligatorios. |
| R-32 | T | Crítico | Protección de conexiones y archivos | Autorización por sesión/alumno/objeto, validación de enlaces, no filtraciones. |

## No inventar compromisos
Sin número objetivo de alumnos, presupuesto, proveedor de hosting, nombre final, ritmo exacto de sincronización, grabación automática ni calificación automática aprobados. Las pruebas deben definir umbrales cuantitativos antes de declarar listo el MVP.

## Requisitos empresariales confirmados — 2026-11-12
| ID | Estado | Prioridad | Requisito | Criterio de aceptación |
|---|---|---|---|---|
| R-33 | C | Crítico | Plataforma como producto **privado de la empresa**; no cualquiera podrá utilizarlo. | Visitante no autorizado no puede crear/abrir clases ni usar el backend. |
| R-34 | C | Crítico | Proteger código y desarrollo en repositorio privado, aislado de COG público. | Repositorio propio GitHub `private=true` y acceso sólo a colaboradores elegidos. |
| R-35 | T | Crítico | Alta autorizada, roles, control de sesiones y licencias. | Revocación server-side probada; usuario no autorizado no puede obtener datos. |
| R-36 | T | Alto | Licencia propietaria y derechos de empresa correctamente documentados. | Titularidad definida, dependencias auditadas y contratos/licencias revisados. |

**Importante:** la presencia de estos requisitos en el expediente público NO significa que el repositorio o aplicación ya estén protegidos. Ver `15-PROTECCION-Y-LICENCIAMIENTO.md`.
