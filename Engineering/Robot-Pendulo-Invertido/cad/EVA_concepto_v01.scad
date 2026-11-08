// EVA - robot autobalanceado de dos ruedas. Estudio volumetrico v0.1
// Unidades mm. NO ES UN MODELO LISTO PARA IMPRIMIR.
// X: izquierda/derecha; Y negativo: frente; Z: altura desde suelo.
// Control de equilibrio: analogico e INDEPENDIENTE de la ESP32.
// Opciones: "exterior", "volumenes", "torso_frontal", "torso_trasero",
//           "cabeza_frontal", "cabeza_trasera".
vista = "exterior";
$fn = 56;
pared = 3.0;

module rodaja(z, ancho, fondo, e=4){
    translate([0,0,z]) scale([ancho, fondo, e]) sphere(1);
}
module cuerpo_externo(){
    hull(){
        rodaja(58,74,55);
        rodaja(88,86,68);
        rodaja(132,91,73);
        rodaja(183,82,65);
        rodaja(215,47,43);
    }
}
module carenado_eje(s){
    // Puente estetico. NO es un soporte mecanico de rodamiento.
    color([0.92,0.96,0.98]) hull(){
        translate([s*73,0,68]) scale([19,30,17]) sphere(1);
        translate([s*104,0,49]) scale([11,24,14]) sphere(1);
    }
}
module cuerpo_interno(){
    hull(){
        rodaja(61,71,52);
        rodaja(88,83,65);
        rodaja(132,88,70);
        rodaja(183,79,62);
        rodaja(212,44,40);
    }
}
module cabeza_externa(){
    translate([0,0,263]) scale([79,58,54]) sphere(1);
}
module cabeza_interna(){
    translate([0,0,263]) scale([76,55,51]) sphere(1);
}
module rueda(s){
    // Neumatico de prueba: diametro 96, ancho 18, eje Z=49
    color([0.14,0.16,0.19])
      translate([s*116,0,49]) rotate([0,90,0])
        difference(){
          cylinder(h=18,r=48,center=true);
          cylinder(h=20,r=29,center=true);
        }
    color([0.66,0.72,0.78])
      translate([s*116,0,49]) rotate([0,90,0])
        cylinder(h=13,r=30,center=true);
}
module brazo(s){
    // Carenado decorativo en esta revision; servos de brazos por decidir.
    color([0.93,0.95,0.96]) hull(){
      translate([s*85,4,177]) scale([13,23,19]) sphere(1);
      translate([s*89,7,133]) scale([9,19,12]) sphere(1);
    }
}
module visor(){
   // Forma indicativa: cubierta negra aun NO tiene abertura funcional.
   color([0.025,0.043,0.067])
   intersection(){
      translate([0,-1.8,263]) scale([79.4,59,54.6]) sphere(1);
      translate([0,-55,266]) cube([143,80,72],center=true);
   }
}
module ojos(){
    // Rasgos graficos, no pantallas fisicas definitivas.
    for(s=[-1,1]){
      color([0.05,0.62,0.98])
        translate([s*34,-58,269])
        rotate([90,0,s*12])
        scale([19,11,1.4]) sphere(1);
    }
}
module motor(s){
    // Pololu #4752: 37D x 68L; eje D6 x 16.
    color([0.67,0.72,0.76,0.8])
      translate([s*67,0,49]) rotate([0,90,0])
      cylinder(h=68,r=18.5,center=true);
    color([0.86,0.66,0.17,0.95])
      translate([s*109,0,49]) rotate([0,90,0])
      cylinder(h=16,r=3,center=true);
}
module paquete(pos,med,color_rgb){
    color([color_rgb[0],color_rgb[1],color_rgb[2],0.8])
      translate(pos) cube(med,center=true);
}
module internos(){
  for(s=[-1,1]) motor(s);
  paquete([0,0,110],[76,64,28],[0.93,0.64,0.12]);     // bateria 3S, reserva
  paquete([0,12,150],[86,64,21],[0.12,0.65,0.32]);    // MDD10A
  paquete([0,18,186],[80,58,15],[0.80,0.36,0.15]);    // PCB analogica
  paquete([0,19,245],[66,31,13],[0.16,0.52,0.93]);    // ESP32-S3
  for(s=[-1,1])
     paquete([s*34,-28,270],[41,7,39],[0.05,0.67,0.84]); // pantalla candidata
  paquete([0,-50,291],[20,9,18],[0.74,0.20,0.65]);    // sensor termico
}
module estructura(){
    color([0.94,0.97,0.98,0.92]) cuerpo_externo();
    color([0.97,0.99,1.0,0.92]) cabeza_externa();
    visor(); ojos();
    for(s=[-1,1]){
      carenado_eje(s); rueda(s); brazo(s);
    }
}
module casco(parte,frente){
    intersection(){
        difference(){
            if(parte=="torso") cuerpo_externo(); else cabeza_externa();
            if(parte=="torso") cuerpo_interno(); else cabeza_interna();
        }
        translate([0,frente?-200:200,165])
            cube([600,400,500],center=true);
    }
}
if(vista=="exterior") estructura();
else if(vista=="volumenes"){
    color([0.88,0.90,0.95,0.18]) cuerpo_externo();
    color([0.94,0.95,1,0.18]) cabeza_externa();
    for(s=[-1,1]) rueda(s);
    internos();
}
else if(vista=="torso_frontal") casco("torso",true);
else if(vista=="torso_trasero") casco("torso",false);
else if(vista=="cabeza_frontal") casco("cabeza",true);
else if(vista=="cabeza_trasera") casco("cabeza",false);
