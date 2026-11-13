# 07 — Seguridad, privacidad, costos y límites
## Fronteras de confianza
- **El servidor autoriza**; ocultar un botón en la interfaz no es seguridad.
- El token de profesor/gestión debe ser diferente del código de invitación estudiantil. No poner token de administración en enlaces compartidos.
- Sesión, alumno, ejercicio, intento, objeto y recurso tienen ACL explícita. Mensajes Socket.IO se publican en canales/salas filtrados por identidad validada.
- Intentos individuales nunca se envían por broadcast general. El docente puede acceder por rol seguro.
- Los borradores docentes no llegan al canal público ni al payload de inicialización del estudiante.
- La revisión pública es un recurso derivado/snapshot redactado, no una simple URL directa al intento privado.

## Medidas mínimas propuestas
1. HTTPS/WSS, tokens de acceso temporales, hash de secretos y revocación.
2. Validación y límites de tamaño/frecuencia para eventos, trazos, enlaces y archivos.
3. Sanitizar HTML/texto enriquecido, respetar CSP; proteger contra XSS en notas y URLs.
4. Validar destino de URLs de medios; prevenir SSRF/proxy arbitrario. No permitir iframes arbitrarios privilegiados; sandbox y políticas de origen.
5. URLs privadas de archivos autenticadas/firmadas, ruta privada de respaldos, límites de descargas.
6. Proteger contra cross-tenant / cross-room: pruebas con usuario A intentando ids de B y alumno intentando APIs de monitor.
7. Bloqueo lógico de edición para actividades cerradas; registro de correcciones y publicaciones.
8. Auditoría mínima de cambios y permisos; evitar registrar contenido sensible de alumnos en logs de consola y terceros.
9. Políticas de expiración y borrado de sesiones/archivos; copia de respaldo cifrada si se conservan trabajos.
10. **No añadir datos reales de alumnos a este repositorio público.** Todos los ejemplos son ficticios.
11. Grabación de voz/video, telemetría e identificación de menores de edad no se activan sin un acuerdo específico y revisión de privacidad/consentimiento de acuerdo con normativa aplicable.
12. Nunca reproducir ni capturar aplicaciones externas sin permiso y sin limitación visible a participantes.

## Riesgos por dispositivo/proveedor
- Android puede suspender WebSockets o decodificadores en segundo plano; probar en tablet real.
- Audio automático normalmente requiere gesto del usuario; HTTPS suele ser requisito para PWA y APIs modernas.
- Sitios externos pueden impedir iframes por CSP/X-Frame-Options; proveedores limitan APIs y sincronización.
- Compartir medios por streaming desde una cuenta personal puede violar derechos/términos; integrar fuentes y acceso legalmente permitidos.
- Video simultáneo exige CPU/batería/ancho de banda local; establecer limites después de pruebas.

## Operación y costos
- Código Node.js/PWA puede desarrollarse con herramientas gratuitas; no afirmar que ancho de banda, dominio, TURN, grabaciones y almacenamiento serán gratuitos a escala.
- Un PC propio con túnel puede alojar piloto, pero debe permanecer encendido y conectado. Alternativa VPS/hosting con costes transparentes.
- No prometer que GitHub Pages/Vercel serverless mantienen un Socket.IO persistente sin arquitectura compatible. Evaluar hosting al implementar.

## Disparadores de revisión de seguridad
Cualquier incorporación de cuentas persistentes, archivos de alumnos, grabaciones, menores, nuevas APIs externas o integración con COG requiere un nuevo análisis documentado antes de producción.
