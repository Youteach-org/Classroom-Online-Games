# 13 — Contratos preliminares de eventos y persistencia
**BORRADOR TÉCNICO** para evitar interpretaciones incompatibles; versionar y someter a pruebas. No existe API implementada.

## Objetos de dominio
```typescript
type Visibility = "public"|"teacher_private"|"student_private"|"review_publication";
type MediaMode = "GROUP_SYNC"|"INDIVIDUAL"|"TEACHER_PREVIEW"|"DISABLED";
type BoardObject = { id:string; roomId:string; sectionId:string; type:string;
  x:number;y:number;width:number;height:number;z:number;rotation:number;
  visibility:Visibility;ownerId:string;revision:number;props:unknown };
type Section = { id:string;roomId:string;order:number;title:string;
  startSequence:number;endSequence:number|null;
  navAnchor:{x:number;y:number;scale:number};closedAt:string|null };
type Attempt = { id:string;roomId:string;exerciseId:string;studentId:string;
  baseRevision:number;status:"active"|"submitted"|"closed";revision:number };
type GroupMediaState = {mediaId:string;mode:"GROUP_SYNC";
  positionSeconds:number;playing:boolean;playbackRate:number;
  effectiveAtServerMs:number;revision:number };
```

## Intenciones enviadas por cliente (ejemplos)
```json
{
  "event": "stroke.append",
  "roomId": "r1",
  "objectId": "stroke-17",
  "seq": 3,
  "points": [{"x": 120.1, "y": 200.3, "pressure": 0.65}],
  "clientEventId": "uuid"
}
```
```json
{
  "event": "media.groupCommand",
  "roomId": "r1",
  "mediaId": "video-1",
  "command": "seek",
  "positionSeconds": 83.5,
  "expectedRevision": 9,
  "clientEventId": "uuid"
}
```
```json
{
  "event": "exercise.responseDelta",
  "roomId": "r1",
  "exerciseId": "ex-1",
  "attemptId": "attempt-A",
  "operations": [{"op":"addStroke","id":"s1","points":[[0.1,0.2],[0.2,0.3]]}],
  "expectedRevision": 5,
  "clientEventId": "uuid"
}
```
```json
{
  "event":"teacher.publishReview",
  "roomId":"r1",
  "attemptId":"attempt-A",
  "snapshotRevision":6,
  "anonymous":true,
  "target":"room"
}
```
```json
{"event":"section.close","roomId":"r1","sectionId":"section-1","expectedLastSequence":125}
```

## Reglas del servidor
- **No confiar** en `role`, `ownerId`, `studentId` o destino de sala enviados por cliente como autorización. Identidad derivada de token de sesión.
- `stroke.append` permitido si autor está autorizado a editar objeto/capa; guardar trazo completo al concluir; rechazar secuencias corruptas/repetidas.
- `exercise.responseDelta` se direcciona únicamente a **alumno dueño y monitores docentes autorizados**. No difundir a `room:public`.
- `teacher.publishReview`: sólo docente, validación snapshot y anonimización, objeto nuevo público inmutable por defecto; no cambiar ACL original.
- `media.groupCommand`: comprobar permisos granulares por `mediaId` y evitar comandos viejos con `expectedRevision`.
- `section.close`: operación idempotente/transaccional; guarda secuencia-límite y ancla sin rasterizar el contenido.
- Eventos con `clientEventId` idempotentes para reintentos; snapshot + delta para recuperación.
- Cambios del profesor en `teacher_private` jamás deben llegar a alumnos ni por datos iniciales, eventos, archivos o URLs.
- Escucha de estado privado de alumno autorizada sólo al propietario y profesor. Todo canal aislado también en HTTP.

## Salas lógicas sugeridas
`room:<id>:published`; `room:<id>:teacher`; `room:<id>:attempt:<attemptId>`; `room:<id>:media:<mediaId>`. El nombre de la sala es un detalle interno, **no** un derecho de suscripción sin validación.

## Persistencia sugerida
Tablas `rooms, memberships, board_objects, sections, exercises, attempts, response_objects, feedback_objects, published_reviews, media_states, permissions, event_log`. Claves `roomId` y `attemptId` indexadas. Definir migraciones y retención antes de uso real.
