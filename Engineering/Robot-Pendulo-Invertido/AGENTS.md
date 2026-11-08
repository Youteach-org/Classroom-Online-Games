# Guía de continuidad para colaboradores y asistentes
Lee antes de modificar cualquier archivo de este proyecto: README.md, 00-REQUISITOS.md, 06-DECISIONES.md, 07-BITACORA.md y 10-PENDIENTES.md.

## Invariantes
- Balanceo y regulación estabilizadora **analógicos**, autónomos de ESP32.
- La ESP32 gestiona calor/evasión, silbido, seguimiento preferentemente BLE de teléfono, voz/audio y ojos/mode combate simulado.
- Los objetivos no se eliminan ni sustituyen por comodidad; diferenciar petición confirmada de hipótesis.
- No usar una IMU digital procesada por ESP32 como único lazo de equilibrio.
- No afirmar que RSSI BLE permite hallar rumbo; validar localización.
- No fabricar resultados, medidas, compras, esquemas ni código probados.
- No tocar archivos fuera de esta carpeta sin orden expresa del usuario.

## Protocolo de trabajo
1. Leer documentos de estado y contexto.
2. Proponer cambio concreto; registrar si es provisional o confirmado por usuario.
3. Actualizar los documentos afectados en un mismo conjunto coherente.
4. Registrar fecha, evidencia, problemas, resultado y próximos pasos en bitácora.
5. Añadir pruebas y fuentes para afirmaciones importantes.
6. Mantener documentación en español y términos técnicos precisos.
7. Evitar que cambios documentales activen por accidente despliegues de aplicaciones en producción: trabajar en rama; fusionar solo tras revisar impactos.

**Fecha de creación:** 2026-11-08.
