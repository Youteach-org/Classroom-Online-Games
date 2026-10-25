# DEA V15 / ESP32-S3 — instalador permanente

Este directorio contiene la interfaz de Windows que extrae únicamente archivos embebidos en el EXE. No realiza descargas al instalar, abrir ni grabar el firmware.

El firmware no se reconstruye aquí: el workflow `.github/workflows/dea-v15-s3-restore.yml` compila `Medicine/AED-Trainer/firmware/aed-trainer`, genera LittleFS con `display-assets.dat`, 65 WAV y `rcp-music.wav`, une la imagen flash y la incrusta en un EXE.

El EXE se copia a `%LOCALAPPDATA%\\DEA-Actualizador`, crea accesos directos en Inicio y Escritorio, permite elegir COM y solo flashea tras confirmación explícita. La prueba `--self-test` comprueba su payload sin conectarse al dispositivo.

**Importante:** es un simulador educativo. La compilación automatizada no sustituye la prueba física de TFT y MAX98357A.
