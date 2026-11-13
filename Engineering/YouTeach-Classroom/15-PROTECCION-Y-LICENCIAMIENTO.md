# 15 — Protección del producto, propiedad intelectual y control de acceso
**Fecha:** 2026-11-12 · **Estado:** requisito empresarial confirmado / implementación pendiente.
**IMPORTANTE:** Esta rama y el repositorio COG que la contiene son **PÚBLICOS**. Este documento **no** los convierte en privados. No colocar aquí secretos, propiedad técnica inédita ni código del nuevo producto.

## Objetivo del propietario
YouTeach Classroom será un **producto empresarial restringido**, no un juego público de COG. Su código y documentación de desarrollo deben quedar en un **repositorio PRIVADO dentro de la organización Youteach-org**; el producto en ejecución admitirá sólo a usuarios autorizados. No equiparar privacidad del repositorio con seguridad de una app web publicada.

## Restricciones / plan de migración
1. Crear en GitHub el repositorio **privado** `Youteach-org/YouTeach-Classroom` (nombre sujeto a disponibilidad/aprobación). Confirmar visualmente el icono/campo `private=true`.
2. Migrar a este repositorio nuevo los documentos actuales, revisar sus contenidos y conservar historial de decisiones. No asumir que mover o borrar elimina copias ya públicas.
3. Restringir acceso a propietarios y colaboradores autorizados; habilitar 2FA, menor privilegio, secretos de despliegue fuera del código y auditoría de acceso.
4. Mantener COG original público e intacto: **no** cambiar su visibilidad ni mezclar despliegues. No fusionar PR #66 a `main` por motivos de seguridad y separación de producto.
5. Sólo después de comprobar una copia íntegra en privado, valorar cerrar PR público y eliminar rama pública; tener en cuenta que forks, copias, rastros del PR y cachés pueden subsistir. No prometer confidencialidad retroactiva.
6. Toda evolución técnica, arquitectura concreta, credenciales o código fuente del nuevo producto debe redactarse/desarrollarse en el repositorio privado, no aquí.

## Propiedad intelectual y licencia
- Tratar el **código original de YouTeach Classroom** como software **propietario**, con reserva de derechos y licencias de uso por contrato; no añadir licencia MIT/Apache/AGPL al código propio sin aprobación.
- Una leyenda sugerida de trabajo, **sujeta a confirmar titular legal y año**, es: `Copyright © 2026 [TITULAR LEGAL] — Todos los derechos reservados. Uso, copia, redistribución y sublicencia no autorizados prohibidos, salvo permiso expreso.`
- Validar titularidad: empresa/persona física, autores, contratos de colaboradores, cesión de derechos patrimoniales cuando proceda y derechos de terceros.
- Auditar dependencias de código abierto y licencias, especialmente **AGPL**: no copiar código de otros proyectos sin revisar obligaciones. No confundir «código propietario» con prohibición de usar dependencias abiertas bajo sus condiciones.
- En México: considerar registro de programa de cómputo ante **INDAUTOR** y registro de marca/nombre comercial ante **IMPI** cuando el nombre del producto sea definitivo; consulta jurídica recomendada para titularidad y contratos. El registro no reemplaza controles técnicos.

## Control de acceso al producto (independiente de GitHub)
- App privada con registro por **invitación o alta autorizada**; no permitir registro anónimo libre.
- Identidades y roles `owner/admin`, `teacher`, `student`; permisos por organización/sesión; alumnos acceden sólo a clases invitadas.
- Unirse con código de clase NO concede derecho a administrar sala ni consultar trabajos de otro grupo.
- Control server-side para HTTP, Socket.IO, archivos, Teacher Monitor, overlays y comandos multimedia.
- Sesiones con expiración/revocación, recuperación de contraseña, cierre de sesión, bitácora de acceso y límite de dispositivos/sesiones si la política comercial lo exige.
- Desactivar acceso a usuarios/escuelas sin licencia; planes de uso opcionales, fecha de expiración y suspensión de cuenta por servidor. **No** usar una llave escondida en el JavaScript cliente como única protección.
- Evitar acceso a archivos con URLs públicas permanentes; enlaces firmados/limitados con autorización de servidor.
- No exponer claves, esquemas secretos ni datos personales en la PWA. Los clientes reciben código JavaScript y recursos necesarios para ejecutarse, por lo que confidencialidad absoluta del frontend es imposible; el control real está en backend, datos, credenciales y permisos.
- Copias de respaldo privadas/cifradas y procedimiento de recuperación ante pérdida de cuenta.

## Condiciones de aceptación futuras
- Un visitante sin autorización no puede crear una clase ni obtener material privado.
- Una cuenta de alumno no puede abrir Teacher Monitor, crear licencias, editar reglas ni leer respuestas privadas de otras cuentas.
- Una escuela no puede acceder a datos de otra escuela (si se implementa multiempresa).
- Un usuario dado de baja o licencia revocada pierde acceso desde servidor, incluso con sesión previa.
- Un tercero que copie HTML/JS del cliente **no puede** acceder al backend, datos, streams privados o clases sin autorización.
- Repository visibility: `private`, colaboradores revisados, despliegue sin credenciales en código y backups verificados.

## Pendientes empresariales
- Titular legal de los derechos: persona física/empresa y contratos.
- Venta a escuelas vs uso exclusivo por la empresa; modelo de licencias por docente/alumno/institución.
- Autenticación (invitaciones, alta por administrador, recuperación, MFA), número máximo de sesiones/dispositivos.
- Alcance de protección de marca y derechos INDAUTOR/IMPI.
- Qué información (si alguna) podrá quedar en el COG público, sin revelar implementación privada.

**Regla de continuidad:** un nuevo ChatGPT/desarrollador debe leer primero este archivo y confirmar que está trabajando en el repositorio privado antes de añadir código sensible. El expediente actual sólo aporta decisiones generales públicas.
