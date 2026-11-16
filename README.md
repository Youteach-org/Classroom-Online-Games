# Turn the Page by Armando Anota

Proyecto Android de lectura para tablet, aislado en la rama `turn-the-page` del repositorio Classroom-Online-Games. La rama principal de COG no se modifica.

## V5 - Doble pagina continua con folios

- El PDF abierto en horizontal utiliza la anchura completa de ambas paginas.
- Se suprime el sombreado del lomo, la pila y las franjas del borde interior que simulaban un espacio entre hojas.
- Se mantiene la banda inferior independiente del raster PDF para mostrar el numero de pagina en ambas hojas.
- Se conserva el zoom anclado a los dedos y el desplazamiento con un dedo.
- Siguen disponibles el indice editable y el selector de una o dos paginas.

APK: `apk/TurnThePage_V5_PaginasJuntas_ConFolio.apk`

SHA-256: `77efbd34dccfdbec39027fd3499f71dc5ce3232665d56ddd3273d61e354ee1e1`

Instalador de una sola aplicacion: `scripts/actualizar_turnthepage_v5_unica_app.ps1`

El instalador conserva el identificador Android `com.avstaim.listai.tablet.armando.v4`. Respalda los datos privados de las versiones previas, comprueba la APK mediante SHA-256, intenta actualizar la V4 en su lugar y, ante firmas incompatibles, respalda tambien su APK original antes de sustituirla. Una vez restaurados y comprobados los libros, abre la version nueva y desinstala los paquetes anteriores que se detecten.

Compilacion reproducible: `.github/workflows/build-turnthepage-v5.yml`. Fuente upstream Listai mas los parches alojados en `.github/patches/`. Incluye pruebas unitarias de geometria del lomo y de reserva inferior para numeracion.

La compilacion V5 termino satisfactoriamente en GitHub Actions el 16 de noviembre de 2026 (ejecucion 43816632445). El instalador paso la comprobacion de sintaxis en Windows (ejecucion 43817230098). Queda pendiente probar el gesto, el aspecto final y la migracion sobre la tablet fisica.
