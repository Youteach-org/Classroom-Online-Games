# 01 — Requisitos, alcance y criterios de aceptación

**Versión:** 0.1 (línea base de objetivos) · **Fecha:** 2026-11-08  
**Estado:** requisitos funcionales del usuario registrados; ingeniería de detalle pendiente.

## Propósito

Construir un robot móvil de dos ruedas en configuración de péndulo invertido. Se distinguen dos ámbitos físicos: (a) estabilización analógica autónoma y (b) funciones de interacción y comportamiento administradas por ESP32.

## Requisitos funcionales

| ID | Requisito | Restricción esencial | Criterio demostrable pendiente de cuantificar |
|---|---|---|---|
| R-01 | Mantener equilibrio sobre dos ruedas | Lazo de estabilización analógico e independiente de ESP32 | Recuperar verticalidad ante perturbaciones de ensayo y sostener posición sin firmware de balanceo |
| R-02 | Avanzar, retroceder, girar | Los comandos no deben anular la estabilidad | Maniobrar y recuperar estabilidad de forma controlada |
| R-03 | Alejarse de fuente de calor | Debe detectar/estimar dirección, no solo temperatura ambiente | Detectar una fuente segura de prueba, escoger alejamiento y desplazarse sin colisión |
| R-04 | Reconocer silbido | Señal de activación del comportamiento; detección en ESP32 | Diferenciar silbido objetivo de ruido ordinario con pruebas repetibles |
| R-05 | Seguir al usuario | Preferir señal Bluetooth del teléfono, sujeto a factibilidad | Mantener proximidad durante prueba real con pérdidas de señal y obstáculos |
| R-06 | Comunicación con micrófono y bocinas | Administradas por ESP32 y periféricos compatibles | Capturar voz y emitir audio inteligible bajo ruido de motores |
| R-07 | Ojos reactivos en pantalla | Expresión visible en condiciones de operación | Cambiar expresiones ante eventos definidos |
| R-08 | Modo combate simulado | Solo animación y comportamiento teatral, sin arma | Ojos azules en modo normal, rojos y enojados al activar modo simulado; retorno seguro |
| R-09 | ESP32 como gestor de funciones | No cerrar ni calcular el lazo de equilibrio | Estabilización continúa aunque ESP32 se reinicie; el robot entra en condición segura ante pérdida de comandos |
| R-10 | Operación segura | Protección eléctrica, mecánica y control de fallos | Parada probada, límites de mando y pruebas iniciales con sujeción |

## Límites de alcance

**Incluido:** plataforma mecánica, actuadores, electrónica de equilibrio analógica, ESP32, detección térmica direccional, reconocimiento de silbido, seguimiento, comunicación de audio, pantalla de ojos y estados de comportamiento.

**No incluido:** armamento, agresión real, aplicación de fuerza contra personas u objetivos; tampoco se implementará un PID de balanceo digital como sustituto del lazo analógico.

**Aún NO decidido:** dimensiones, masa, centro de gravedad, motores/reductores, baterías y voltajes, sensores concretos, amplificadores operacionales, driver de motor, tamaño de pantalla, arquitectura de audio, protocolo Bluetooth y algoritmo para estimar dirección del teléfono.

## Trazabilidad de decisiones

- Una **petición del usuario** no equivale a una **solución técnica aprobada**.
- Cada selección de circuito/componente requiere justificación, compatibilidad eléctrica y prueba.
- Los umbrales numéricos de calidad se fijarán tras caracterizar masa, motores, sensores y alimentación.
- Cualquier cambio en el significado de R-01 a R-10 requiere registro en `04-decisiones.md`.

## Definición de listo

Un requisito se considera **verificado** solo cuando exista evidencia fechada (simulación, datos de laboratorio, fotografía, oscilograma o video), valores del ensayo y criterio de aceptación registrado.
