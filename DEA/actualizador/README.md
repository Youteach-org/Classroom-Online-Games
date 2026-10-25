# Actualizador permanente DEA para Windows

Este programa se instala una sola vez en **%LOCALAPPDATA%\DEA-Actualizador** y crea el acceso directo **DEA - Actualizar** en el menú Inicio.

Cuando se abre, consulta el firmware de la rama `medicine-aed` en `DEA/firmware/manifest.json`. Si la versión coincide con la última cargada, termina sin regrabar. Si hay versión nueva, descarga solo los archivos necesarios, verifica su SHA-256, prepara Arduino CLI y los componentes ESP32-S3/Adafruit en una carpeta de trabajo local, compila y solicita el puerto COM solo si se detectan varios. La carga por USB se realiza solo después de compilar con éxito. No tiene servicios ni procesos residentes.

* `main.go.zlib`: código fuente Go comprimido con zlib (puede obtenerse mediante `python -c "import zlib;open('main.go','wb').write(zlib.decompress(open('main.go.zlib','rb').read()))"`).
* `.github/workflows/dea-updater-release.yml`: compila en GitHub Actions un EXE real para Windows x64 y lo publica como activo de la versión **dea-updater-stable**.

**Descarga permanente del instalador:** https://github.com/Youteach-org/Classroom-Online-Games/releases/download/dea-updater-stable/DEA_Actualizador_Permanente.exe

No sustituye a un desfibrilador médico. Firmware pendiente de pruebas de compilación, pantalla y audio en placa real. Si la compilación falla, no se regraba la ESP32-S3.

**Nota:** la primera ejecución puede requerir descargas grandes de Arduino ESP32 y bibliotecas. Después se reutilizan archivos instalados. El compilador requiere conexión a Internet al preparar el entorno por primera vez.

Es una utilidad independiente para la ESP32-S3 y no interviene en el simulador web ni en `main`.
