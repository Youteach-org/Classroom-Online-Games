# 10 — EVA: distribución geométrica preliminar v0.1

**Fecha:** 2026-11-08  
**Estado:** estudio volumétrico y propuesta de ingeniería **no aprobada aún para fabricación**.  
**CAD editable:** [`../cad/EVA_concepto_v01.scad`](../cad/EVA_concepto_v01.scad).

## Objetivos invariables

- Referencia visual **EVA/EVE de WALL·E** (D-011): carcasa oval blanca, visor negro y ojos expresivos.
- **Cabeza fija, sin servomotor** (D-012); los ojos proporcionan expresividad.
- Robot de **dos ruedas reales** y estabilización **100% analógica**, independiente de la ESP32.
- La ESP32 mantiene sensores, seguimiento, audio, pantalla y modo combate **solo simulado**.
- No mostrar electrónica desnuda como estructura exterior.

## Sistema de coordenadas

- **X**: izquierda/derecha; **Y negativo**: frente; **Z**: vertical.
- Suelo de referencia: **Z = 0**; eje de ruedas: **Z = 49 mm**.
- Los modelos representan **envolventes aproximadas**, no chasis calculado ni planos acotados de mecanizado.
- Las superficies estilísticas y conectores son ilustrativos, no superficies de ajuste para impresión.

## Dimensiones de estudio (milímetros)

| Pieza/zona | Dimensiones v0.1 | Comentario |
|---|---:|---|
| Altura exterior total | **317** | centro de cabeza Z=263, semialtura 54 |
| Ancho extremo a extremo | **250** | extremos rueda X=±125 |
| Ancho máximo torso | **182** | semiancho 91 |
| Profundidad máxima torso | **148** | semifondo 74 |
| Cabeza fija (envolvente) | **158 × 116 × 108** (X/Y/Z) | centro Z=263 |
| Centro de ruedas | **X=±116, Z=49** | separación centros 232 |
| Diámetro ruedas | **96** | neumático de alto agarre; modelo a seleccionar |
| Espesor rueda | **18** | estimación geométrica; no fija rueda real |
| Grosor de casco | **3** | propuesta para PETG, comprobar resistencia |
| Altura del cuerpo | aproximadamente **55–219** | transición superior bajo cabeza |
| Grosor y apertura del visor | pendiente | deberá permitir mantenimiento y visibilidad |

> La forma no se ha liberado: la posición real del eje, la altura de masa, los acoples, las cargas y la velocidad deben verificarse antes de fabricar.

## Distribución interna: envolventes reservadas

**Cotas de ubicación = propuesta de empaquetado del modelo CAD, NO datos físicos garantizados del módulo.**

| Elemento | Posición nominal (X, Y, Z) mm | Envolvente X × Y × Z mm | Fuente/estado |
|---|---|---|---|
| Motor izquierdo 37D | (-67, 0, 49) | cilindro Ø37 × 68 axial X | Pololu #4752: 37D × 68L, eje D6 ×16, **candidato** |
| Motor derecho 37D | (+67, 0, 49) | cilindro Ø37 × 68 axial X | Igual |
| Rueda izquierda/derecha | (±116, 0, 49) | Ø96 ×18 en X | tamaño tentativo |
| Batería Li-ion 3S | (0, 0, 110) | 76 ×64 ×28 | **volumen reservado aproximado**; protección y cables no incluidos |
| Driver Cytron MDD10A | (0, +12, 150) | 86 ×64 ×21 | PCB real **84.5 ×62**; caja incluye holgura parcial |
| PCB de equilibrio **analógica** | (0, +18, 186) | 80 ×58 ×15 | tamaño de reserva, aún no diseñada |
| ESP32-S3 DevKitC | (0, +19, 245) | 66 ×31 ×13 | reservar conectores USB y cableado |
| Display izquierdo/derecho | (±34, -28, 270) | 41 ×7 ×39 cada uno | caso visual de **dos displays**, aún no seleccionados |
| Matriz térmica (MLX90640) | (0, -50, 291) | 20 ×9 ×18 | **volumen preliminar**, apertura real según breakout |

### Aclaraciones de ingeniería

1. La batería 3S es solo una **arquitectura de estudio**; dimensiones, capacidad, BMS, cargador y fusible deben definirse con pack real.
2. El **driver MDD10A** admite PWM y dirección de dos motores, pero el balanceo necesitará **PWM creado por circuitos analógicos**; la ESP32 no lo calculará.
3. El volumen `80 ×58 ×15` de la tarjeta analógica **no confirma que quepan** filtros, operacionales, compensación, comparadores, referencias y conectores: se verificará con PCB y esquema.
4. En el rostro, el dibujo actual representa **dos ojos**, no una decisión sobre dos pantallas. Se compararán: panel único rectangular detrás de visor negro frente a 2 módulos separados; ambos deben permitir ojos azul/rojo.
5. **Una tapa acrílica ordinaria bloquea gran parte del infrarrojo térmico de onda larga**: MLX90640 requiere **ventana abierta o material específicamente apto** para su rango espectral; una ventana decorativa RGB no sirve. El módulo también necesita estar aislado térmicamente de motores/placas.
6. La carcasa incluye carenados estilísticos entre ruedas y cuerpo; **no representan todavía soportes de rodamiento, ejes ni montajes imprimibles**, que se diseñarán con dimensiones de hubs.
7. Los brazos aparecen fijos como superficie de referencia. **El usuario confirmó fija la cabeza, no necesariamente los brazos**. Los servos de brazos siguen como candidatos, sujetos a evaluación.
8. Para probar el movimiento deben medirse masa, momento de inercia, holgura de motor y posición del centro de gravedad. No afirmar que el robot ya se equilibra.

## Integración de la cabeza fija

- Dos piezas conceptuales frontal/posterior, unión mecánica rígida al torso (tornillos e insertos aún no definidos).
- Pantalla(s) accesibles por detrás, una cubierta negra frontal con recorte o material óptico adecuado y soporte con ajuste.
- Visor y pantalla de la maqueta son formas *ilustrativas*: **el frente blanco aún no está recortado para una lente funcional**.
- Sensor térmico con ventana LWIR compatible o aperturas, micrófono con entrada acústica, sensores de distancia con despeje y antena ESP32 sin apantallamiento metálico.
- Sin cuello con servo, cremallera, giro ni articulación.

## Orden técnico de liberación del CAD

- [ ] Escoger pantalla única o doble por ficha mecánica; realizar plantilla de visor a escala real.
- [ ] Seleccionar rueda/hub compatible con eje de **6 mm** y revisar separación de eje, guardabarros y base.
- [ ] Dimensionar corriente, par, masa y centro de gravedad para validar motores #4752 y ruedas Ø96.
- [ ] Escoger pack 3S protegido + cargador, anotar dimensiones reales y holguras de cables.
- [ ] Dibujar soportes para motores 37D, unión de eje, anclajes de batería y placa de potencia.
- [ ] Diseñar PCB analógica, respetando aislamiento de ruido y espacio de ajustes.
- [ ] Añadir electrónica y audio reales: dos altavoces, micrófono, sensores de obstáculos, termografía y conexiones.
- [ ] Definir líneas de partición, tornillos, insertos, paredes, ventilación, corte de emergencia y tapa de servicio.
- [ ] Calcular volumen, masa y centro de gravedad mediante CAD y materiales reales.
- [ ] Solo entonces exportar archivos **STL finales** y probar encajes impresos.

## Fuentes de cotas comprobadas

- Motor Pololu #4752: https://www.pololu.com/product/4752/specs — Ø37 mm, cuerpo 68 mm, salida D6 ×16 mm.
- Driver Cytron MDD10A: https://www.cytron.io/p-10amp-5v-30v-dc-motor-driver-2-channels — 84.5 ×62 mm.
- Módulos redondos Waveshare GC9A01: https://www.waveshare.com/wiki/1.28inch_LCD_Module — módulo 40.4 ×37.5 mm (opción doble).
- Pantalla 3.5 Waveshare ST7796S: https://www.waveshare.com/wiki/3.5inch_Capacitive_Touch_LCD — módulo 61 ×92.44 mm (alternativa girada a horizontal; todavía no elegida).

## Estado

**Estudio geométrico concluido para revisión visual, no ingeniería mecánica ni funcional validada.** El modelo OpenSCAD contiene envolventes y casco estético paramétrico: no imprimir como producto final ni interpretar conexiones como verificadas.
