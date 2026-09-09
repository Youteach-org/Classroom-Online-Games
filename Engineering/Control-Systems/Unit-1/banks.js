const V=Math.max(1,Math.min(4,Number(window.STUDY_VERSION||1)))-1;
const pick=a=>a[V];
const mc=(kind,scene,q,options,correct,why,hint,caption='')=>({type:'mcq',kind,scene,caption,q,options,correct,why,hint});
const op=(kind,scene,q,model,criteria,hint,caption='')=>({type:'open',kind,scene,caption,q,model,criteria,hint});
const Q=[];
const add=q=>Q.push(q);

// 1. Imagen -> tipo de señal
{
 const scenes=['signal_samples_sensor','signal_pulses_counter','signal_continuous_temp','signal_samples_encoder'];
 const qs=['La gráfica muestra mediciones separadas tomadas cada 2 s. ¿La señal mostrada es de tipo?','El registro de un contador de piezas aparece como pulsos separados. ¿La señal mostrada es de tipo?','La curva de temperatura está definida para todo instante. ¿La señal mostrada es de tipo?','El encoder entrega una secuencia de muestras en instantes definidos. ¿La señal mostrada es de tipo?'];
 const opts=[['Continua','Discreta','MIMO','Estacionaria'],['Discreta','Continua','Estática','Acoplada'],['Discreta','Continua','MISO','No estacionaria'],['Continua','Discreta','SISO','Estable']];
 const cs=[1,0,1,1];
 add(mc('Señales',pick(scenes),pick(qs),pick(opts),pick(cs),['No corresponde al modo en que está representado el tiempo.','Correcto: la representación coincide con ese tipo de señal.','Es otra clasificación.','Es otra propiedad del sistema.'],'Observa si la señal existe en todo instante o solo en muestras.','Interpretación de señal'));
}

// 2. Definición de variable manipulada
add(mc('Variable manipulada',null,pick(['En un control de temperatura, ¿cómo se llama la cantidad que el controlador modifica para afectar la variable controlada?','En un control de nivel, ¿cómo se llama la cantidad o condición que el controlador modifica para afectar la variable controlada?','En un control de velocidad, ¿cómo se llama la cantidad que el controlador modifica para afectar la variable controlada?','En un control de presión, ¿cómo se llama la cantidad que el controlador modifica para afectar la variable controlada?']),['Variable manipulada','Variable controlada','Set-point','Perturbación'],0,['Correcto: es la acción que modifica el controlador.','Es la magnitud que se desea regular.','Es el valor deseado.','Es una influencia externa.'],'Busca la variable sobre la que actúa directamente el controlador.'));

// 3. Ejemplo MISO argumentado
{
 const sc=['miso_greenhouse','miso_mixer','miso_vehicle','miso_irrigation'];
 const q=['Propón un ejemplo de un sistema MISO aplicado a un invernadero y argumenta por qué es MISO.','Da un ejemplo de un sistema MISO en un mezclador industrial y argumenta.','Da un ejemplo de un sistema MISO relacionado con un vehículo y argumenta.','Da un ejemplo de un sistema MISO aplicado a riego y argumenta.'];
 const m=['Temperatura, humedad y CO₂ pueden entrar al controlador y una sola señal puede gobernar un ventilador. Es MISO porque tiene múltiples entradas y una salida.','pH, temperatura y nivel pueden ser entradas y una sola señal puede gobernar una válvula dosificadora. Es MISO porque tiene múltiples entradas y una salida.','Velocidad, pendiente y posición del acelerador pueden ser entradas y una sola señal puede ordenar el par del motor. Es MISO porque tiene múltiples entradas y una salida.','Humedad del suelo, temperatura y radiación pueden ser entradas y una sola señal puede gobernar una electroválvula. Es MISO porque tiene múltiples entradas y una salida.'];
 add(op('MISO',pick(sc),pick(q),pick(m),['Más de una entrada.','Una sola salida.','Argumentar contando entradas y salida.'],'MISO = Multiple Input, Single Output.','Ejemplo MISO'));
}

// 4. Imagen -> planta, proceso o sistema
{
 const sc=['plant_motorcycle','plant_lathe','plant_elevator','plant_pumpstation'];
 const q=['Observa la motocicleta como el objeto físico sobre el que podrían actuar entradas y producirse salidas. ¿Qué representa principalmente?','Observa el torno como el equipo físico donde se realiza el maquinado. ¿Qué representa principalmente?','Observa el elevador como el equipo físico que será controlado. ¿Qué representa principalmente?','Observa el conjunto físico de bomba, tubería y depósito sobre el que actuará el control. ¿Qué representa principalmente?'];
 const o=[['Planta','Proceso','Sistema de control','Señal'],['Proceso','Planta','Set-point','Perturbación'],['Sistema','Proceso','Planta','Variable'],['Planta','Proceso','Salida','Referencia']];
 const c=[0,1,2,0];
 add(mc('Planta / proceso / sistema',pick(sc),pick(q),pick(o),pick(c),['La respuesta debe corresponder a lo que se enfatiza en la imagen.','La respuesta debe corresponder a lo que se enfatiza en la imagen.','La respuesta debe corresponder a lo que se enfatiza en la imagen.','La respuesta debe corresponder a lo que se enfatiza en la imagen.'],'Distingue el objeto físico de una secuencia de cambios.','Clasificación por imagen'));
}

// 5. Sistema manual
add(mc('Sistema manual',null,pick(['Una prensa requiere que una persona accione directamente una palanca. ¿Qué tipo de sistema es?','Una compuerta requiere que una persona gire el volante para abrirla. ¿Qué tipo de sistema es?','En un torno convencional, el operador mueve directamente las manivelas. ¿Qué tipo de sistema es?','Una bomba solo se pone en marcha cuando una persona acciona el mando directamente. ¿Qué tipo de sistema es?']),['Automático','Manual','Continuo','MIMO'],1,['No: aquí la intervención humana es necesaria.','Correcto: requiere acción directa de una persona.','Es otra clasificación.','Es otra clasificación.'],'La clave es la intervención humana directa.'));

// 6. Lógica de lazo cerrado: qué debe estar presente
{
 const sc=['closedloop_tank','closedloop_motor','closedloop_oven','closedloop_pressure'];
 const q=['En el tanque mostrado, ¿qué debe estar presente para que el actuador corrija el nivel cuando se desvía?','En un control de velocidad, ¿qué necesita recibir el controlador para que el actuador pueda corregir la salida?','En el horno mostrado, ¿qué información necesita regresar al controlador para corregir la temperatura?','En el control de presión mostrado, ¿qué información debe regresar al controlador para poder corregir?'];
 const o=[['Una medición realimentada de la salida','Solo el set-point','Un temporizador','Otra planta'],['La velocidad medida','Solo la orden inicial','El nombre del motor','Un segundo actuador'],['La temperatura medida','Solo la potencia nominal','El tiempo total','Solo la temperatura ambiente'],['La presión medida','Solo la presión deseada','El diámetro de tubería','La marca de la válvula']];
 add(mc('Lazo cerrado',pick(sc),pick(q),pick(o),0,['Correcto: la salida medida permite detectar el error y corregir.','No permite conocer por sí sola la salida real.','No cierra el lazo de realimentación.','No es el dato necesario para corregir.'],'En lazo cerrado, la salida debe medirse y regresar al controlador.','Realimentación'));
}

// 7. Definición de sistema
add(mc('Sistema',null,'¿Qué concepto se define como una combinación de componentes que actúan juntos y realizan un objetivo determinado?',['Proceso','Sistema','Planta','Perturbación'],1,['Un proceso es una secuencia de cambios.','Correcto: es la definición de sistema.','La planta es el objeto físico.','Una perturbación es una influencia externa.'],'Busca el concepto que reúne componentes con un objetivo común.'));

// 8. Tres elementos base de la lógica de control
{
 const sc=['logic_level','logic_temp','logic_speed','logic_pressure'];
 add(mc('Lógica básica de control',pick(sc),pick(['En la lógica básica de un control de nivel, ¿qué tres elementos se identifican?','En la lógica básica de un control de temperatura, ¿qué tres elementos se identifican?','En la lógica básica de un control de velocidad, ¿qué tres elementos se identifican?','En la lógica básica de un control de presión, ¿qué tres elementos se identifican?']),['Entrada, sistema y salida','Sensor, alarma y pantalla','Planta, perturbación y operador','Set-point, marca y potencia nominal'],0,['Correcto: entrada → sistema → salida resume la estructura base.','No describe la estructura base completa.','Mezcla elementos de otra clasificación.','Incluye datos que no forman la terna base.'],'Piensa en qué entra, qué transforma y qué sale.','Lógica básica'));
}

// 9. Variable manipulada vs salida
add(mc('Conceptos',null,'¿La variable manipulada es conocida también como la salida del sistema?',['Sí, siempre','No; es la variable que se modifica para afectar la salida','Solo en sistemas SISO','Solo en lazo abierto'],1,['Confunde acción con resultado.','Correcto: la manipulada actúa sobre el sistema; la salida es el resultado.','SISO no cambia esa distinción.','El tipo de lazo no vuelve equivalentes ambas variables.'],'No confundas la acción de control con el resultado.'));

// 10. Imagen -> sistema estático o dinámico
{
 const sc=['dynamic_tank_fill','static_scale','dynamic_thermal','dynamic_vehicle'];
 const q=['El nivel del tanque cambia mientras entra y sale líquido. ¿El sistema se comporta principalmente como?','La báscula ideal mostrada entrega una lectura que depende solo del peso aplicado en ese instante. ¿Cómo se clasifica principalmente?','La temperatura de una placa cambia gradualmente después de encender un calentador. ¿Cómo se clasifica principalmente?','La velocidad del vehículo depende de su estado previo y evoluciona con el tiempo. ¿Cómo se clasifica principalmente?'];
 const o=[['Estático','Dinámico','MISO','Desacoplado'],['Dinámico','Estático','MIMO','No estacionario'],['Estático','Dinámico','Desacoplado','SIMO'],['Estático','Dinámico','MISO','Estacionario necesariamente']];
 const c=[1,1,1,1];
 add(mc('Estático / dinámico',pick(sc),pick(q),pick(o),pick(c),['No coincide con la dependencia temporal mostrada.','Correcto: corresponde al comportamiento mostrado.','Es otra clasificación.','Es otra clasificación.'],'Pregunta si el estado previo o la evolución temporal importan.','Clasificación del sistema'));
}

// 11. Imagen -> clasificación por número de entradas y salidas
{
 const sc=['io_simo','io_miso','io_mimo','io_siso'];
 const q=['La figura muestra una entrada y cuatro salidas. ¿Cómo se clasifica el sistema?','La figura muestra tres entradas y una salida. ¿Cómo se clasifica el sistema?','La figura muestra varias entradas y varias salidas. ¿Cómo se clasifica el sistema?','La figura muestra una entrada y una salida. ¿Cómo se clasifica el sistema?'];
 const o=[['SISO','SIMO','MISO','MIMO'],['SIMO','MISO','MIMO','SISO'],['SISO','SIMO','MISO','MIMO'],['SISO','SIMO','MISO','MIMO']];
 const c=[1,1,3,0];
 add(mc('Entradas / salidas',pick(sc),pick(q),pick(o),pick(c),['Revisa el número de entradas y salidas.','Revisa el número de entradas y salidas.','Revisa el número de entradas y salidas.','Revisa el número de entradas y salidas.'],'Cuenta primero entradas y luego salidas.','Clasificación I/O'));
}

// 12. Figura -> lazo abierto o cerrado
{
 const sc=['openloop_stove','openloop_toaster','closedloop_thermostat','openloop_washer_timer'];
 const q=['La estufa calienta según la posición elegida, sin medir automáticamente la temperatura del alimento. ¿Es un ejemplo de?','El tostador opera durante el tiempo seleccionado sin medir el tostado real del pan. ¿Es un ejemplo de?','El termostato mide temperatura y corrige el calentador según el error. ¿Es un ejemplo de?','La lavadora ejecuta un ciclo temporizado sin medir qué tan limpia quedó la ropa. Respecto a ese resultado, ¿es un ejemplo de?'];
 const o=[['Lazo cerrado','Lazo abierto','MIMO','Desacoplado'],['Lazo abierto','Lazo cerrado','Estable necesariamente','MISO'],['Lazo abierto','Lazo cerrado','Manual','SIMO'],['Lazo cerrado','Lazo abierto','MIMO','Estático']];
 const c=[1,0,1,1];
 add(mc('Lazo abierto / cerrado',pick(sc),pick(q),pick(o),pick(c),['Revisa si la salida real se usa para corregir.','Revisa si la salida real se usa para corregir.','Revisa si la salida real se usa para corregir.','Revisa si la salida real se usa para corregir.'],'¿Se mide el resultado real para corregirlo?','Tipo de lazo'));
}

// 13. Tiempo continuo
add(mc('Tiempo continuo',null,pick(['Si el modelo térmico de un horno está definido por una ecuación diferencial y el tiempo se considera infinitamente divisible, ¿de qué tipo de sistema se trata?','Si el movimiento de una masa-resorte se modela con ecuaciones diferenciales y tiempo infinitamente divisible, ¿de qué tipo de sistema se trata?','Si el nivel de un depósito se modela con una ecuación diferencial y tiempo infinitamente divisible, ¿de qué tipo de sistema se trata?','Si la velocidad de un motor se modela con una ecuación diferencial y tiempo infinitamente divisible, ¿de qué tipo de sistema se trata?']),['Tiempo discreto','Tiempo continuo','Estático','MIMO'],1,['No: una ecuación diferencial se asocia a tiempo continuo.','Correcto.','No se deduce que sea estático.','Entradas/salidas es otra clasificación.'],'Ecuación diferencial + tiempo infinitamente divisible.'));

// 14. Ejemplo desacoplado argumentado
{
 const sc=['decoupled_rooms','decoupled_motors','decoupled_tanks','decoupled_lamps'];
 const q=['Da un ejemplo de un sistema desacoplado usando dos habitaciones y argumenta.','Da un ejemplo de un sistema desacoplado usando dos motores y argumenta.','Da un ejemplo de un sistema desacoplado usando dos tanques y argumenta.','Da un ejemplo de un sistema desacoplado usando dos circuitos de iluminación y argumenta.'];
 const m=['Dos habitaciones con controles térmicos independientes, sin transferencia apreciable entre ellas.','Dos motores con fuentes y controles independientes, donde modificar uno no afecta al otro.','Dos tanques sin conexión entre sí, cada uno con su propia entrada y salida.','Dos lámparas en circuitos independientes, de modo que variar una no modifica la otra.'];
 add(op('Desacoplamiento',pick(sc),pick(q),pick(m)+' Es desacoplado porque un subsistema no altera la respuesta del otro.',['Dos subsistemas identificables.','Independencia entre sus efectos.','Argumento explícito de no interacción.'],'Desacoplado = un subsistema no afecta al otro.','Ejemplo desacoplado'));
}

// 15. Definición de proceso
add(mc('Proceso',null,'¿Qué concepto se define como una operación marcada por una serie de cambios graduales que suceden unos tras otros de forma progresiva?',['Planta','Proceso','Sistema','Variable manipulada'],1,['La planta es el objeto físico.','Correcto: esa es la definición de proceso.','Sistema es el conjunto de componentes.','Es una variable de control.'],'La palabra clave es secuencia de cambios.'));

// 16. Imágenes industriales -> planta, proceso o sistema
{
 const sc=['industrial_refinery','industrial_bottling','industrial_waterplant','industrial_factory'];
 const q=['Las instalaciones industriales ilustradas —equipos, recipientes, tuberías y estructuras— se consideran principalmente ejemplos de…','La línea física de embotellado mostrada, considerada como equipo donde ocurre la operación, es principalmente una…','Los tanques, bombas y tuberías de la instalación de tratamiento mostrada constituyen principalmente la…','La maquinaria y estructura física de la fábrica mostrada, sobre la que actúa el control, se considera…'];
 const o=[['Proceso','Planta','Señal','Set-point'],['Planta','Proceso','Perturbación','Salida'],['Proceso','Planta','Variable controlada','Referencia'],['Proceso','Sistema matemático','Planta','Señal']];
 const c=[1,0,1,2];
 add(mc('Planta / proceso / sistema',pick(sc),pick(q),pick(o),pick(c),['La imagen enfatiza equipo físico.','La imagen enfatiza equipo físico.','La imagen enfatiza equipo físico.','La imagen enfatiza equipo físico.'],'Instalaciones y equipos físicos → planta.','Instalación industrial'));
}

// 17. Definición de proceso nuevamente, como en la guía
add(mc('Proceso',null,'Una operación que avanza mediante cambios sucesivos y progresivos corresponde a un…',['Sistema','Proceso','Sensor','Set-point'],1,['Un sistema es el conjunto de componentes.','Correcto.','Sensor es un elemento de medición.','Set-point es una referencia.'],'Busca el concepto que describe una secuencia progresiva.'));

// 18. Imagen -> planta/proceso/sistema
{
 const sc=['plant_motorcycle','plant_drillpress','plant_drone','plant_conveyor'];
 const q=['La motocicleta mostrada, considerada como objeto físico que recibe entradas y produce respuestas, ilustra principalmente una…','El taladro de banco mostrado, considerado como equipo físico, ilustra principalmente una…','El dron mostrado, considerado como objeto físico sobre el que se aplica control, ilustra principalmente una…','La banda transportadora mostrada, considerada como equipo físico, ilustra principalmente una…'];
 const o=[['Planta','Proceso','Señal','Referencia'],['Proceso','Planta','Perturbación','Variable'],['Sistema de control completo','Proceso','Planta','Set-point'],['Planta','Proceso','Salida','Perturbación']];
 const c=[0,1,2,0];
 add(mc('Planta / proceso / sistema',pick(sc),pick(q),pick(o),pick(c),['Se pregunta por el objeto físico.','Se pregunta por el objeto físico.','Se pregunta por el objeto físico.','Se pregunta por el objeto físico.'],'Aquí se pregunta por el equipo físico.','Objeto físico'));
}

// 19. Tres ejemplos de lazo abierto argumentados
{
 const sc=['openloop_examples_kitchen','openloop_examples_home','openloop_examples_industry','openloop_examples_daily'];
 const q=['Da tres ejemplos de sistemas de lazo abierto y argumenta por qué lo son.','Da tres ejemplos de sistemas de lazo abierto del hogar y argumenta.','Da tres ejemplos de sistemas de lazo abierto en un contexto técnico y argumenta.','Da tres ejemplos cotidianos de lazo abierto y argumenta.'];
 const m=['Tostador temporizado, horno con temporizador y licuadora a velocidad fija: ejecutan una acción sin medir el resultado final para corregirlo.','Ventilador con selector manual, microondas por tiempo y lámpara con interruptor: no realimentan la salida para corregirla.','Banda con velocidad fija, bomba temporizada y motor con voltaje fijo: operan según una orden sin medir la salida para corregir.','Riego por temporizador, semáforo de tiempos fijos y secadora temporizada: actúan sin usar el resultado real como realimentación.'];
 add(op('Lazo abierto',pick(sc),pick(q),pick(m),['Tres ejemplos.','Ausencia de realimentación en cada uno.','Argumentación breve.'],'Lazo abierto = no usa la salida real para corregir.','Ejemplos de lazo abierto'));
}

// 20. Gráfica -> tipo de sistema
{
 const sc=['graph_heating_curve','graph_tank_level','graph_motor_speed','graph_thermal_response'];
 const q=['Según la gráfica de temperatura que cambia por etapas durante calentamiento, ¿qué tipo de sistema se evidencia por su comportamiento temporal?','Según la gráfica de nivel que evoluciona con el tiempo después de abrir una válvula, ¿qué tipo de sistema se observa?','La velocidad del motor cambia gradualmente hasta alcanzar un nuevo valor. ¿Qué tipo de sistema muestra la gráfica?','La temperatura responde gradualmente después de un cambio de potencia. ¿Qué tipo de sistema ilustra la gráfica?'];
 const o=[['Estático','Dinámico','MISO','Desacoplado'],['Dinámico','Estático','SIMO','Estacionario necesariamente'],['Estático','Dinámico','Desacoplado','MIMO'],['Dinámico','Estático','SISO necesariamente','Manual']];
 const c=[1,0,1,0];
 add(mc('Interpretación de gráfica',pick(sc),pick(q),pick(o),pick(c),['La gráfica muestra evolución temporal.','La gráfica muestra evolución temporal.','La gráfica muestra evolución temporal.','La gráfica muestra evolución temporal.'],'Si la salida evoluciona con el tiempo, piensa en sistema dinámico.','Gráfica temporal'));
}

// 21. Ejemplo estable y estacionario argumentado
{
 const sc=['stable_stationary_tank','stable_stationary_motor','stable_stationary_temp','stable_stationary_pressure'];
 const q=['Da un ejemplo de un sistema estable y estacionario y argumenta.','Da un ejemplo de un sistema estable y estacionario usando un motor y argumenta.','Da un ejemplo de un sistema estable y estacionario usando un recinto térmico y argumenta.','Da un ejemplo de un sistema estable y estacionario usando una línea de presión y argumenta.'];
 const m=['Un tanque operando alrededor de un nivel fijo con parámetros constantes: ante perturbaciones acotadas vuelve a una zona acotada y sus características no cambian con el tiempo.','Un motor con parámetros constantes que, ante una entrada acotada, alcanza una velocidad acotada y mantiene el mismo comportamiento en el tiempo.','Un recinto térmico con parámetros constantes y termostato: las respuestas permanecen acotadas y las propiedades del sistema no cambian con el tiempo.','Una línea de presión con parámetros constantes cuya respuesta permanece acotada para entradas acotadas y mantiene el mismo comportamiento en el tiempo.'];
 add(op('Estabilidad y estacionariedad',pick(sc),pick(q),pick(m),['Explica por qué la respuesta es estable.','Explica por qué el comportamiento es estacionario.','Incluye un ejemplo concreto.'],'Estable: respuesta acotada. Estacionario: propiedades no cambian con el tiempo.','Sistema estable y estacionario'));
}

// 22. Imagen -> planta/proceso/sistema
{
 const sc=['plant_scooter','plant_3dprinter','plant_robotarm','plant_pump'];
 const q=['El scooter eléctrico mostrado, considerado como objeto físico que puede ser controlado, ilustra principalmente una…','La impresora 3D mostrada, como equipo físico donde ocurre la fabricación, ilustra principalmente una…','El brazo robot mostrado, considerado como equipo físico sobre el que actúa el controlador, es principalmente una…','La bomba centrífuga mostrada, como objeto físico, ilustra principalmente una…'];
 const o=[['Proceso','Planta','Sistema de control completo','Perturbación'],['Planta','Proceso','Set-point','Señal'],['Proceso','Planta','Perturbación','Referencia'],['Planta','Proceso','Sistema matemático','Salida']];
 const c=[1,0,1,0];
 add(mc('Planta / proceso / sistema',pick(sc),pick(q),pick(o),pick(c),['Objeto físico sobre el que se actúa = planta.','Objeto físico sobre el que se actúa = planta.','Objeto físico sobre el que se actúa = planta.','Objeto físico sobre el que se actúa = planta.'],'Fíjate en que se muestra el equipo físico.','Clasificación por imagen'));
}

// 23. Gráfica -> estabilidad
{
 const sc=['graph_stable_oscillation','graph_unstable_growth','graph_stable_settle','graph_bounded_response'];
 const q=['La salida oscila alrededor de la referencia y las oscilaciones disminuyen. ¿Qué propiedad muestra la gráfica?','La salida se aleja cada vez más de la referencia y su amplitud crece. ¿Qué propiedad muestra la gráfica?','La salida presenta sobreimpulso y luego converge a un valor acotado. ¿Qué propiedad se observa?','La respuesta permanece acotada ante una entrada acotada y termina asentándose. ¿Qué propiedad se observa?'];
 const o=[['Inestabilidad','Estabilidad','Desacoplamiento','MISO'],['Estabilidad','Inestabilidad','Estacionariedad','SIMO'],['Estabilidad','No estacionariedad','MIMO','Aditividad'],['Inestabilidad','Estabilidad','Acoplamiento','Linealidad necesariamente']];
 const c=[1,1,0,1];
 add(mc('Estabilidad',pick(sc),pick(q),pick(o),pick(c),['Observa si la salida permanece acotada o diverge.','Observa si la salida permanece acotada o diverge.','Observa si la salida permanece acotada o diverge.','Observa si la salida permanece acotada o diverge.'],'Salida acotada o salida que diverge.','Interpretación de estabilidad'));
}

// 24. Imagen-secuencia -> proceso
{
 const sc=['process_observe_decide_act','process_bottling_steps','process_wash_cycle','process_3dprint_steps'];
 const q=['La secuencia ilustrada de observar → decidir → actuar representa principalmente un…','La secuencia llenar → tapar → etiquetar → empacar representa principalmente un…','La secuencia llenar → lavar → enjuagar → centrifugar ilustra principalmente un…','La secuencia preparar → depositar material → formar capas → terminar pieza ilustra principalmente un…'];
 const o=[['Planta','Proceso','Señal','Set-point'],['Sistema','Proceso','Planta','Perturbación'],['Proceso','Planta','Sensor','Referencia'],['Planta','Proceso','Variable manipulada','MISO']];
 const c=[1,1,0,1];
 add(mc('Planta / proceso / sistema',pick(sc),pick(q),pick(o),pick(c),['La imagen enfatiza una secuencia de cambios.','La imagen enfatiza una secuencia de cambios.','La imagen enfatiza una secuencia de cambios.','La imagen enfatiza una secuencia de cambios.'],'Una secuencia ordenada de cambios es un proceso.','Secuencia de proceso'));
}

// 25. Definición de sistema de control
add(mc('Sistema de control',null,'¿Qué concepto está definido como un conjunto de componentes que pueden regular su propia conducta o la de otro sistema para lograr un funcionamiento predeterminado?',['Sistema de control','Proceso','Planta','Señal discreta'],0,['Correcto: es la definición de sistema de control.','Un proceso es una secuencia de cambios.','La planta es el objeto físico.','Es un tipo de señal.'],'La palabra clave es regular para lograr un funcionamiento predeterminado.'));

// 26. Sistemas físicos
add(mc('Sistemas físicos',null,'¿Cómo se llaman los sistemas que se componen de elementos materiales y energéticos que interactúan entre sí para cumplir una función específica?',['Sistemas físicos','Sistemas discretos','Procesos','Sistemas estacionarios'],0,['Correcto.','La discreción se refiere al tiempo o señal.','Proceso describe una secuencia.','Estacionario describe otra propiedad.'],'Piensa en elementos materiales y energéticos reales.'));

// 27. Figura -> variable controlada
{
 const sc=['control_tank_level','control_oven_temp','control_motor_speed','control_pressure_line'];
 const q=['En la figura del tanque con sensores de nivel y válvula de descarga, ¿qué variable se está controlando?','En el horno con sensor y controlador, ¿qué variable se está controlando?','En el motor con sensor de rpm, ¿qué variable se está controlando?','En la línea con transmisor y válvula de control, ¿qué variable se está controlando?'];
 const o=[['Caudal de salida','Nivel del tanque','Voltaje del panel','Tiempo de operación'],['Potencia aplicada','Temperatura del horno','Voltaje de alimentación','Tiempo de encendido'],['Velocidad del motor','Voltaje de armadura','Corriente nominal','Posición de válvula'],['Apertura de válvula','Presión de la línea','Caudal nominal','Tiempo de muestreo']];
 const c=[1,1,0,1];
 add(mc('Variable controlada',pick(sc),pick(q),pick(o),pick(c),['Busca la magnitud que se desea mantener.','Busca la magnitud que se desea mantener.','Busca la magnitud que se desea mantener.','Busca la magnitud que se desea mantener.'],'¿Qué magnitud es el objetivo del control?','Variable controlada'));
}

// 28. Imagen -> lazo abierto/cerrado
{
 const sc=['loop_faucet_sensor','loop_thermostat_feedback','loop_tank_feedback','loop_toaster_timer'];
 const q=['El grifo activa el agua al detectar una mano, pero no mide el resultado final para corregirlo. Respecto a ese resultado, ¿qué tipo de lazo representa?','El termostato mide continuamente la temperatura y corrige el calentador. ¿Qué tipo de lazo representa?','El sensor de nivel mide la salida y el controlador abre o cierra la válvula para corregirla. ¿Qué tipo de lazo representa?','El tostador actúa por tiempo y no mide el nivel real de tostado para corregirlo. ¿Qué tipo de lazo representa?'];
 const o=[['Lazo cerrado','Lazo abierto','MIMO','Estático'],['Lazo abierto','Lazo cerrado','Manual','Desacoplado'],['Lazo cerrado','Lazo abierto','SIMO','Estático'],['Lazo cerrado','Lazo abierto','MISO','Estacionario']];
 const c=[1,1,0,1];
 add(mc('Lazo abierto / cerrado',pick(sc),pick(q),pick(o),pick(c),['Revisa si la salida real regresa al controlador.','Revisa si la salida real regresa al controlador.','Revisa si la salida real regresa al controlador.','Revisa si la salida real regresa al controlador.'],'¿La salida real se mide y se usa para corregir?','Tipo de lazo'));
}

// 29. Expresión matemática -> propiedad
{
 const sc=['math_additivity','math_homogeneity','math_superposition','math_additivity2'];
 const q=['Si un sistema cumple T[x₁(t)+x₂(t)] = T[x₁(t)] + T[x₂(t)], ¿qué propiedad representa?','Si un sistema cumple T[a·x(t)] = a·T[x(t)], ¿qué propiedad representa?','Si un sistema cumple simultáneamente aditividad y homogeneidad, ¿qué principio se satisface?','La relación (x₁+x₂) → (y₁+y₂) ¿qué propiedad expresa directamente?'];
 const o=[['Aditividad','Estabilidad','Estacionariedad','Desacoplamiento'],['Aditividad','Proporcionalidad u homogeneidad','MISO','Estabilidad'],['Superposición','Estacionariedad','Acoplamiento','Lazo cerrado'],['Aditividad','Inestabilidad','MIMO','Tiempo continuo']];
 const c=[0,1,0,0];
 add(mc('Linealidad',pick(sc),pick(q),pick(o),pick(c),['Revisa qué relación matemática expresa la fórmula.','Revisa qué relación matemática expresa la fórmula.','Revisa qué relación matemática expresa la fórmula.','Revisa qué relación matemática expresa la fórmula.'],'Observa si suma respuestas, escala una entrada o combina ambas propiedades.','Propiedad matemática'));
}

if(Q.length!==29) throw new Error('Cada versión debe contener exactamente 29 preguntas');
window.QUESTION_BANK=Q;
