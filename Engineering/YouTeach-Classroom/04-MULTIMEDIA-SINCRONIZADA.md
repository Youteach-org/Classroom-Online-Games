# 04 — Multimedia simultánea y sincronizada (FUNCIÓN PRIORITARIA)
## Objetivo explícito del usuario
**Todos pueden escuchar/ver audio y video simultáneamente**, con control compartido cuando el profesor lo autorice. Cada objeto multimedia puede alternar entre reproducción grupal sincronizada y reproducción **individual** durante actividades. El profesor puede preparar material sin que su búsqueda/previsualización se publique.

## Modos por objeto
| Modo | Estado de reproducción | Controles | Visibilidad |
|---|---|---|---|
| `GROUP_SYNC` | `playing,mediaTime,serverTimestamp,rate,revision` mantenido por servidor | Docente y alumnos con `media:control_group` | Sólo participantes autorizados |
| `INDIVIDUAL` | `mediaTime`, pausa y velocidad **por usuario** | Usuario dueño de su reproducción, sujeto a permiso docente | Participación individual, sin alterar reproducción ajena |
| `TEACHER_PREVIEW` | Estado **sólo local del profesor** | Sólo profesor | El alumno no recibe objeto ni eventos |
| `DISABLED` | Pausado/bloqueado por política | Ninguno | Según ACL del objeto |

## Simultaneidad
- Puede haber varios audios y videos a la vez, con `mediaId` único y controles independientes; **no** asumir que todos los móviles soportan varios decodificadores simultáneos sin degradación.
- El volumen de reproducción/silencio por participante **es local**, para no bajar audio de otros.
- El control global funciona como permiso granular por `mediaId` y rol, revocable en tiempo real.
- Para un recurso grupal, un botón autorizado `play/pause/seek/rate` emite intención; el servidor **verifica permiso**, incrementa revisión y difunde estado con tiempo de servidor.
- Un alumno sin permiso de control grupal puede quizá variar su volumen local, pero no cambiar el punto global.

## Algoritmo propuesto para sincronía (a prototipar)
1. Medir diferencia de reloj y RTT cliente-servidor periódicamente con ping/echo.
2. Servidor asigna estado canónico `positionSeconds, playing, rate, effectiveAtServerMs, version`.
3. Cliente calcula `targetPosition` usando tiempo servidor compensado y ritmo, al iniciar o recibir nuevo comando.
4. Si deriva pequeña, ajustar `playbackRate` suavemente donde API lo permita; si grande, seek explícito. Definir umbrales con pruebas reales y límites de proveedor.
5. Ordenar eventos por revisión y rechazar órdenes obsoletas; los controles concurrentes requieren política (último comando válido o control lock).
6. Reingreso a grupo recibe estado actual, no reproduce desde cero; modo individual recupera progreso personal.
7. **No hay sincronía perfecta garantizada**: red, buffering, DRM, restricciones de autoplay, anuncios, cambios de calidad y proveedores externos generan desfase.

## Proveedores y derechos
- Medios propios: `HTMLMediaElement`, URLs permitidas/firmadas, reglas CORS según orígenes, transcodificación si hiciera falta.
- YouTube u otros proveedores: usar APIs oficiales de iframe/reproductor, respetar términos y límites; algunos videos restringen embebido, seek, autoplay o API de tiempo.
- No hacer proxy de streams protegidos ni evadir restricciones. Mostrar un fallback claro si el recurso no es incrustable.
- Navegadores móviles suelen exigir una interacción inicial para habilitar audio; mostrar «Unirse y habilitar sonido» con gesto del usuario.
- **La videollamada en vivo** es distinta a un clip insertado/sincronizado; posponer hasta cerrar la función principal.

## Casos de prueba obligatorios
- 2 usuarios: sincronizar play, pausa, seek, reingreso y cambio de líder; luego 4 o más usuarios.
- Alumno autorizado pausa/adelanta; alumno sin permiso intenta lo mismo y el servidor lo rechaza.
- A pasa a individual y B permanece sincronizado, sin contaminación de estados.
- Dos videos + un audio ejecutándose juntos, cada volumen/control aislados; medir CPU/batería en Tab S7 Plus.
- Profesor busca/previsualiza contenido sin emitir URL ni evento al grupo.
- El alumno pierde conexión, vuelve y recupera posición; evaluar saltos bajo mala red.
- YouTube sin permiso de embed/termina/ads produce fallback, no promesa de control universal.
