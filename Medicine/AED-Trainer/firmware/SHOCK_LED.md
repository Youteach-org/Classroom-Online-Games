# Indicador luminoso del botón SHOCK — ESP32-S3

- **GPIO21:** salida dedicada al LED, nivel **ALTO = encendido** (3,3 V).
- **GPIO18:** entrada del pulsador SHOCK existente, sin modificación.
- Conexión para LED simple de 3,3 V: `GPIO21 → resistencia 330 Ω → ánodo (+) del LED → cátodo (−) → GND`.
- El LED debe permanecer apagado en el arranque y en todos los estados salvo `SHOCK_ADVISED` y `WAITING_SHOCK`.
- Al aceptar el botón SHOCK se apaga **antes** del sonido de descarga; también se apaga al salir de esos estados, al reiniciar y cuando se indica que no hay descarga.
- No alimentar con este GPIO un aro o módulo LED de 5/12 V, ni uno de corriente elevada. En esos casos se requiere etapa de transistor/MOSFET y alimentación acorde al módulo.

La salida es un indicador didáctico. El simulador no contiene circuito de descarga eléctrica real.
