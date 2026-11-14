# Phrasal Verb Millionaire — COG

Juego de concurso para **Connectivity Level 5, Unit 10 (Global Ties), Block 3**, diseñado para que el profesor lo controle desde una computadora conectada al proyector.

## Uso sin internet (Windows)

1. Descargar `index.html` (o utilizar el paquete ZIP local de la conversación).
2. Abrir el archivo con doble clic en Chrome o Edge.
3. Conectar la computadora al proyector.
4. Pulsar **SCREEN** o la tecla `F` para pantalla completa.
5. Seleccionar de **2 a 6 equipos**, con temporizador opcional, y comenzar.

**No utiliza CDN, frameworks, solicitudes de red, Supabase, servidor, Wi-Fi ni cuentas.** Los alumnos no necesitan dispositivos. La versión del repositorio se puede utilizar conectada a internet mediante el sitio que publique el repositorio, o descargada y abierta directamente como archivo local.

## Mecánica

- 15 niveles, cada uno con dos preguntas alternativas seleccionadas al iniciar la partida.
- Cuatro respuestas A/B/C/D, botón **FINAL ANSWER**, revelado con suspenso y explicación.
- Puntos ficticios por respuesta correcta, turnos rotativos y marcador por equipos.
- Comodines: **50:50**, **Ask the Audience** (encuesta **simulada**, no votos reales) y **Phone a Friend** (pista simulada).
- Temporizador opcional de 30 segundos; su finalización no bloquea al profesor.
- Audio breve generado en el navegador, sin archivos de sonido externos.

## Teclas rápidas

| Tecla | Acción |
|---|---|
| 1–4 | Elegir A, B, C, D |
| Enter | Confirmar / revelar / siguiente |
| N | Siguiente pregunta |
| 5 | 50:50 |
| H | Pista de amigo |
| F | Pantalla completa |
| M | Encender/apagar efectos |

## Contenido didáctico

Preguntas originales basadas en el vocabulario y los conceptos gramaticales de `Connectivity 5`, unidad 10, páginas 102 y 104–105: significados de phrasal verbs, separabilidad y posición de pronombres. No se han copiado literalmente las preguntas de los exámenes. La interfaz y los reactivos están en inglés.

## Arquitectura y decisiones

- Archivo único `index.html`: HTML, CSS, JavaScript y banco de preguntas sin dependencias.
- Diseño Y2K con proporción visual **4:3** para proyectores de aula.
- Los datos no salen del equipo ni se sincronizan con terceros.
- **La partida no se guarda** al cerrar o recargar el navegador.
- El repositorio puede ser público; no se requiere ningún secreto de API.

**Estado:** versión local funcional, lista para uso desde el navegador del profesor.
