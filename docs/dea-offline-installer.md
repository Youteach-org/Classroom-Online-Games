# DEA educativo — instalación sin descargas de dependencias en Windows

**Rama:** `medicine-aed` (no fusionada con `main`).

## Hardware
- ESP32-S3 N8R2, pantalla TFT ST7735, amplificador MAX98357A.
- Botones MENÚ GPIO4, OK GPIO5, SHOCK simulado GPIO18.
- Audio al 100 % por defecto al iniciar. Teacher Monitor BLE puede ajustarlo.

## Arquitectura vigente
1. `.github/workflows/dea-firmware-build.yml` compila `DEA/firmware/DEA_Programa_Completo.ino` con `Voz_0.h` a `Voz_18.h` en servidores GitHub.
2. Un segundo trabajo integra el `.merged.bin` resultante y la versión independiente oficial de esptool para Windows dentro de **un solo** `DEA_Actualizador_Permanente.exe`.
3. La prueba de Windows extrae esos recursos y ejecuta esptool sin descargar Arduino ni bibliotecas. Solo una prueba aprobada permite sustituir el archivo del Release.
4. En el PC del usuario, el EXE se instala en `%LOCALAPPDATA%\DEA-Actualizador` y crea el acceso directo `DEA - Actualizar` en Inicio.
5. La aplicación no usa red en tiempo de ejecución. El usuario confirma su puerto COM y la grabación; el programa carga el firmware ya compilado.

**Importante:** El software funciona sin descargas *durante la instalación y la grabación*. Las futuras versiones necesitan alguna transferencia de datos; la versión offline no se autoactualiza en secreto. Por ello, actualizar el firmware incorporado requiere instalar un EXE nuevo cuando el usuario lo autorice.

## Seguridad y estado de pruebas
- Solo simulador educativo; no produce descargas médicas.
- Firmware: compilación GitHub realizada correctamente con ESP32 core 3.2.1, 2.16 MB de programa.
- Pantalla física y audio en la placa **todavía pendientes de validación**.
- El archivo antiguo de `DEA/actualizador`, que descargaba Arduino en Windows, quedó retirado; no volver a publicarlo.
- No borrar archivos ajenos al DEA en Descargas.

## Referencias
- Firmware: `DEA/firmware/`
- Instalador offline: `DEA/offline/`
- Release estable: https://github.com/Youteach-org/Classroom-Online-Games/releases/tag/dea-updater-stable
- Flujo de compilación/pruebas: https://github.com/Youteach-org/Classroom-Online-Games/actions/workflows/dea-firmware-build.yml
