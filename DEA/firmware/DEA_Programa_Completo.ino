/*
  DEA EDUCATIVO - ESP32-S3 N8R2 - INTEGRACION 2026-10-24
  Autónomo, sin necesidad de computadora después de instalar.
  SIMULADOR: ninguna conexión produce descarga eléctrica real.
  Alimentacion: usar un suministro regulado/apropiado para la placa y el amplificador.
  No conectar electrodos a una persona ni usar este equipo para atención real.

  TRES PULSADORES + INTERRUPTOR GENERAL DE ALIMENTACION:
  1) MENU / PISTA GPIO4 -> GND: recorrer opciones y repetir la indicacion.
  2) OK / INICIO GPIO5 -> GND: cambiar el valor seleccionado, iniciar,
     confirmar parches, consultar estado. Sostenido 2s: desconectar parches.
  3) SHOCK GPIO18 -> GND: exclusivamente descarga SIMULADA autorizada.
  COMBINACION: MENU + OK simultaneos durante 3 segundos reinician.
  El TFT muestra abajo la accion de los TRES botones en cada etapa.
  ON/OFF es un interruptor en el circuito de alimentacion, no un GPIO.
  Teacher Monitor BLE opcional; inicia adulto y ritmo descargable.
  LED SHOCK opcional GPIO21 (con resistor adecuado a LED y modulo).
  TFT ST7735 160x128 software SPI: RST8 DC9 CS10 MOSI11 SCLK12.
  MAX98357A: BCLK15 LRC16 DIN17, SD 3V3, GAIN GND, VIN alimentación compatible.
  AD8232 OPCIONAL: OUTPUT GPIO1, LO+ GPIO2, LO- GPIO14; desactivado por defecto.
  BLE VOLUMEN: dispositivo DEA-S3-EDU / servicio 8c5... / caracteristica 8c5...01
  Teacher Monitor envía ASCII del 0 al 100; arranca SIEMPRE al 100%.

  Arduino ESP32 core 2.x/3.x; librerías Adafruit GFX y Adafruit ST7735.
  WARNING: dispositivos SIMULADOS; no apto para personas ni emergencias reales.
*/
#include <Arduino.h>
#include <esp_arduino_version.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>
#include <SPI.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <math.h>
// 19 grabaciones integradas
#pragma once
#include <Arduino.h>
struct VozClip { const uint8_t* data; uint32_t count; };
#include "Voz_0.h"
#include "Voz_1.h"
#include "Voz_2.h"
#include "Voz_3.h"
#include "Voz_4.h"
#include "Voz_5.h"
#include "Voz_6.h"
#include "Voz_7.h"
#include "Voz_8.h"
#include "Voz_9.h"
#include "Voz_10.h"
#include "Voz_11.h"
#include "Voz_12.h"
#include "Voz_13.h"
#include "Voz_14.h"
#include "Voz_15.h"
#include "Voz_16.h"
#include "Voz_17.h"
#include "Voz_18.h"
const VozClip VOCES[] = {
  { VOZ_0, sizeof(VOZ_0) }, // inicio
  { VOZ_1, sizeof(VOZ_1) }, // arranque
  { VOZ_2, sizeof(VOZ_2) }, // parches
  { VOZ_3, sizeof(VOZ_3) }, // parches_error
  { VOZ_4, sizeof(VOZ_4) }, // analisis
  { VOZ_5, sizeof(VOZ_5) }, // despejar
  { VOZ_6, sizeof(VOZ_6) }, // descarga
  { VOZ_7, sizeof(VOZ_7) }, // aplicada
  { VOZ_8, sizeof(VOZ_8) }, // sin_descarga
  { VOZ_9, sizeof(VOZ_9) }, // rcp
  { VOZ_10, sizeof(VOZ_10) }, // reanalizar
  { VOZ_11, sizeof(VOZ_11) }, // pista
  { VOZ_12, sizeof(VOZ_12) }, // adulto
  { VOZ_13, sizeof(VOZ_13) }, // nino
  { VOZ_14, sizeof(VOZ_14) }, // lactante
  { VOZ_15, sizeof(VOZ_15) }, // reinicio
  { VOZ_16, sizeof(VOZ_16) }, // conectados
  { VOZ_17, sizeof(VOZ_17) }, // descargable
  { VOZ_18, sizeof(VOZ_18) }, // no_descargable
};
constexpr int CANT_VOCES = 19;


#if ESP_ARDUINO_VERSION_MAJOR >= 3
#include "driver/i2s_std.h"
static i2s_chan_handle_t gTx = nullptr;
#else
#include "driver/i2s.h"
#endif

constexpr uint8_t TFT_RST=8, TFT_DC=9, TFT_CS=10, TFT_MOSI=11, TFT_SCLK=12;
constexpr uint8_t I2S_BCLK=15, I2S_LRC=16, I2S_DIN=17;
constexpr uint8_t BTN_MENU=4, BTN_OK=5, BTN_SHOCK=18;
constexpr uint8_t LED_SHOCK=21;
constexpr uint8_t AD_OUT=1, AD_LO_PLUS=2, AD_LO_MINUS=14;
constexpr bool USE_AD8232=false;  // cambiar a true sólo después de verificar el sensor
constexpr uint32_t CPR_DURATION_MS=120000;
constexpr uint32_t ANALYSIS_MS=6000;
constexpr uint32_t BEAT_INTERVAL_MS=545; // aproximadamente 110 compresiones por minuto

// Colores RGB565 (franja amarilla y zona azul de instrucciones)
constexpr uint16_t AMARILLO=0xFFE0, AZUL=0x001F, AZUL_OSCURO=0x0010,
  BLANCO=0xFFFF, NEGRO=0x0000, VERDE=0x07E0, ROJO=0xF800,
  GRIS=0x8410, CIAN=0x07FF, NARANJA=0xFD20;
Adafruit_ST7735 tft(TFT_CS,TFT_DC,TFT_MOSI,TFT_SCLK,TFT_RST);

// Audio pregrabado: 8k? NO: 16kHz, PCM mu-law 8bit decodificado a I2S 16bit estéreo.
constexpr uint32_t SAMPLE_RATE=16000;
volatile uint8_t gVolume=100; // 100% AL ARRANCAR, sin ninguna rampa
volatile int gCaseChange=-1; // A: adulto, N: niño, L: lactante; opcional por BLE
volatile int gRhythmChange=-1; // 1 descargable, 0 no descargable; opcional por BLE
volatile uint32_t gAudioGeneration=1;
volatile bool gVoicePlaying=false;
volatile bool gAudioReady=false;
QueueHandle_t gAudioQueue=nullptr;
struct AudioCmd { int16_t id; uint32_t generation; };
// IDs 0..18 voces, 250 metronomo, 251 descarga

static int16_t ulawDecode(uint8_t sample) {
  sample = ~sample;
  int sign = sample & 0x80;
  int exponent = (sample >> 4) & 7;
  int mantissa = sample & 0x0F;
  int s = ((mantissa << 3) + 0x84) << exponent;
  s -= 0x84;
  return (int16_t)(sign ? -s : s);
}

static bool i2sSetup() {
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  i2s_chan_config_t chan = I2S_CHANNEL_DEFAULT_CONFIG(I2S_NUM_0,I2S_ROLE_MASTER);
  if(i2s_new_channel(&chan,&gTx,nullptr)!=ESP_OK) return false;
  i2s_std_config_t conf = {
    .clk_cfg=I2S_STD_CLK_DEFAULT_CONFIG(SAMPLE_RATE),
    .slot_cfg=I2S_STD_PHILIPS_SLOT_DEFAULT_CONFIG(I2S_DATA_BIT_WIDTH_16BIT,I2S_SLOT_MODE_STEREO),
    .gpio_cfg={
      .mclk=I2S_GPIO_UNUSED,
      .bclk=(gpio_num_t)I2S_BCLK,
      .ws=(gpio_num_t)I2S_LRC,
      .dout=(gpio_num_t)I2S_DIN,
      .din=I2S_GPIO_UNUSED,
      .invert_flags={.mclk_inv=false,.bclk_inv=false,.ws_inv=false}
    }
  };
  if(i2s_channel_init_std_mode(gTx,&conf)!=ESP_OK)return false;
  return i2s_channel_enable(gTx)==ESP_OK;
#else
  i2s_config_t conf={
    .mode=(i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate=(int)SAMPLE_RATE,
    .bits_per_sample=I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format=I2S_CHANNEL_FMT_RIGHT_LEFT,
    .communication_format=I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags=ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count=8,
    .dma_buf_len=256,
    .use_apll=false,
    .tx_desc_auto_clear=true,
    .fixed_mclk=0
  };
  i2s_pin_config_t pins={
    .bck_io_num=I2S_BCLK,
    .ws_io_num=I2S_LRC,
    .data_out_num=I2S_DIN,
    .data_in_num=I2S_PIN_NO_CHANGE
  };
  if(i2s_driver_install(I2S_NUM_0,&conf,0,nullptr)!=ESP_OK)return false;
  return i2s_set_pin(I2S_NUM_0,&pins)==ESP_OK;
#endif
}

static void i2sSend(const int16_t* samples, size_t bytes) {
  if(!gAudioReady)return;
  size_t sent=0;
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  (void)i2s_channel_write(gTx,samples,bytes,&sent,portMAX_DELAY);
#else
  (void)i2s_write(I2S_NUM_0,samples,bytes,&sent,portMAX_DELAY);
#endif
}

void postAudio(int id, bool interrupt=false) {
  if(!gAudioQueue||!gAudioReady)return;
  if(interrupt){
    ++gAudioGeneration;
    xQueueReset(gAudioQueue);
  }
  AudioCmd cmd={(int16_t)id,gAudioGeneration};
  (void)xQueueSend(gAudioQueue,&cmd,0);
}

void doVoice(int id, uint32_t generation) {
  if(id<0 || id>=CANT_VOCES)return;
  gVoicePlaying=true;
  const VozClip &clip=VOCES[id];
  constexpr int N=256;
  int16_t stereo[N*2];
  for(uint32_t p=0;p<clip.count && generation==gAudioGeneration;p+=N) {
    uint16_t count=(clip.count-p > N)? N : (clip.count-p);
    uint8_t v=gVolume;
    for(uint16_t j=0;j<count;j++) {
      int32_t x=ulawDecode(pgm_read_byte(clip.data+p+j));
      x=(x*v)/100;
      stereo[2*j]=stereo[2*j+1]=(int16_t)x;
    }
    i2sSend(stereo,count*4);
  }
  gVoicePlaying=false;
}

void doBeep(int freq, int durationMs, uint32_t gen) {
  constexpr int N=256;
  int16_t stereo[N*2];
  int countTotal=(SAMPLE_RATE*durationMs)/1000;
  // techo suave en el principio/fin para reducir clics, NO rampa de volumen general
  for(int n=0;n<countTotal && gen==gAudioGeneration;n+=N){
    int count=min(N,countTotal-n);
    uint8_t vol=gVolume;
    for(int j=0;j<count;j++){
      int k=n+j;
      float edge=min(1.0f,min(k/120.0f,(countTotal-k-1)/120.0f));
      int16_t x=(int16_t)(17500*edge*sinf(2.0f*3.14159265f*freq*k/SAMPLE_RATE)*vol/100);
      stereo[j*2]=stereo[j*2+1]=x;
    }
    i2sSend(stereo,count*4);
  }
}

void audioLoopTask(void *) {
  static int16_t silencio[512]={0};
  AudioCmd cmd;
  for(;;){
    if(xQueueReceive(gAudioQueue,&cmd,pdMS_TO_TICKS(5))==pdTRUE) {
      if(cmd.id==250 && !gVoicePlaying) doBeep(1000,50,cmd.generation);
      else if(cmd.id==251) doBeep(750,420,cmd.generation);
      else doVoice(cmd.id,cmd.generation);
    } else {
      // Mantener I2S activo y muestras en cero: silencio real.
      i2sSend(silencio,sizeof(silencio));
    }
  }
}

// Teacher Monitor BLE: escritura ASCII "0".."100". Arranque siempre al 100%.
static const char* UUID_SERVICIO="8c5d0000-2d45-4d15-98cd-53a4d1150000";
static const char* UUID_VOLUMEN ="8c5d0001-2d45-4d15-98cd-53a4d1150000";
static const char* UUID_CASO ="8c5d0002-2d45-4d15-98cd-53a4d1150000";
static const char* UUID_RITMO ="8c5d0003-2d45-4d15-98cd-53a4d1150000";
BLECharacteristic *gVolumeChar=nullptr;
class CaseCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *c) override {
    String s=c->getValue();s.trim();s.toUpperCase();
    if(s=="A")gCaseChange=0;
    else if(s=="N")gCaseChange=1;
    else if(s=="L")gCaseChange=2;
  }
};
class RhythmCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *c) override {
    String s=c->getValue();s.trim();s.toUpperCase();
    if(s=="S")gRhythmChange=1;
    else if(s=="N")gRhythmChange=0;
  }
};
class VolumeCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *c) override {
    String s = c->getValue();
    s.trim();
    if(s.length()>3 || s.length()==0)return;
    for(size_t i=0;i<s.length();i++)if(s[i]<'0'||s[i]>'9')return;
    int n=s.toInt();
    if(n>=0 && n<=100){ gVolume=(uint8_t)n; Serial.printf("MONITOR: VOLUMEN=%d%%\n",n); }
  }
};
void initBLE() {
  BLEDevice::init("DEA-S3-EDU");
  BLEServer *server=BLEDevice::createServer();
  BLEService *service=server->createService(UUID_SERVICIO);
  gVolumeChar=service->createCharacteristic(UUID_VOLUMEN,
          BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE);
  gVolumeChar->setCallbacks(new VolumeCallbacks());
  gVolumeChar->setValue("100");
  auto caso=service->createCharacteristic(UUID_CASO,BLECharacteristic::PROPERTY_WRITE);
  caso->setCallbacks(new CaseCallbacks());
  auto ritmo=service->createCharacteristic(UUID_RITMO,BLECharacteristic::PROPERTY_WRITE);
  ritmo->setCallbacks(new RhythmCallbacks());
  service->start();
  BLEAdvertising *ads=BLEDevice::getAdvertising();
  ads->addServiceUUID(UUID_SERVICIO);
  BLEDevice::startAdvertising();
}

struct Button {
  uint8_t pin;
  bool stable=HIGH, raw=HIGH;
  uint32_t rawSince=0, downSince=0;
  bool consumed=false, longDone=false;
};
Button botonShock={BTN_SHOCK};
Button botonMenu={BTN_MENU};
Button botonOK={BTN_OK};
constexpr uint32_t BTN_DEBOUNCE_MS=35;
constexpr uint32_t BTN_RESET_HOLD_MS=3000;
constexpr uint32_t BTN_PADS_HOLD_MS=2000;
uint32_t ambosDesde=0;
bool reinicioCombinado=false;
uint32_t estadoConsultadoHasta=0;
uint8_t menuOpcion=0; // 0 paciente, 1 ritmo, 2 iniciar

enum Estado {LISTO, ESPERA_PARCHES, ANALIZANDO, AVISO_DESCARGA, ESPERA_SHOCK,
             DESCARGA_APLICADA, SIN_DESCARGA, RCP};
Estado estado=LISTO;
uint32_t estadoDesde=0, rcpDesde=0, ultimoBeat=0, dibujadoEn=0;
uint8_t paciente=0; // adulto, niño, lactante
bool parches=false, ritmoDescargable=true, sonidoOK=false;
const char *pacienteTxt[]={"ADULTO","NINO","LACTANTE"};

void entrar(Estado nuevo) {
  estado=nuevo; estadoDesde=millis();
  switch(nuevo){
    case LISTO: postAudio(0,true);break;
    case ESPERA_PARCHES: postAudio(2,true);break;
    case ANALIZANDO: postAudio(4,true);break;
    case AVISO_DESCARGA: postAudio(5,true);break;
    case ESPERA_SHOCK: postAudio(6,false);break;
    case DESCARGA_APLICADA: postAudio(251,true);postAudio(7,false);break;
    case SIN_DESCARGA: postAudio(8,true);break;
    case RCP: rcpDesde=millis();ultimoBeat=0;postAudio(9,true);break;
  }
  dibujadoEn=0;
}
void reiniciar(){
  parches=false;
  menuOpcion=0;
  estadoConsultadoHasta=0;
  entrar(LISTO);  // Conserva el paciente y el ritmo elegidos.
}
void aplicarMonitor(){
  bool cambio=false;
  if(gCaseChange>=0){paciente=(uint8_t)gCaseChange;gCaseChange=-1;cambio=true;}
  if(gRhythmChange>=0){ritmoDescargable=(gRhythmChange!=0);gRhythmChange=-1;cambio=true;}
  if(cambio){reiniciar();Serial.printf("MONITOR: paciente=%u, ritmo=%d\n",(unsigned)paciente,(int)ritmoDescargable);}
}

void analizar(){if(parches)entrar(ANALIZANDO);else entrar(ESPERA_PARCHES);}

void pista(){
  switch(estado){
    case LISTO:postAudio(0,true);break;
    case ESPERA_PARCHES:postAudio(2,true);break;
    case ANALIZANDO:postAudio(4,true);break;
    case AVISO_DESCARGA:case ESPERA_SHOCK:postAudio(5,true);postAudio(6,false);break;
    case DESCARGA_APLICADA:case SIN_DESCARGA:postAudio(9,true);break;
    case RCP:postAudio(9,true);break;
  }
}

// Un boton = una accion contextual. Sin dobles clics ni funciones eliminadas.
void accionMenu(){
  if(estado==LISTO){
    menuOpcion=(menuOpcion+1)%3; // PACIENTE -> RITMO -> INICIAR
    dibujadoEn=0;
  }else{
    pista(); // Repetir instrucciones por voz sin cambiar el estado.
  }
}
void accionOK(){
  switch(estado){
    case LISTO:
      if(menuOpcion==0){
        paciente=(paciente+1)%3;
        postAudio((uint8_t)(12+paciente),true);
      }else if(menuOpcion==1){
        ritmoDescargable=!ritmoDescargable;
        postAudio(ritmoDescargable?17:18,true);
      }else{
        entrar(ESPERA_PARCHES);
      }
      dibujadoEn=0;
      break;
    case ESPERA_PARCHES:
      parches=true;
      analizar();
      break;
    case RCP:
      estadoConsultadoHasta=millis()+2200;
      dibujadoEn=0;
      break;
    default:
      // Analizando/descarga: OK no puede adelantar ni simular SHOCK.
      break;
  }
}
void desconectarParches(){
  if(estado!=LISTO && estado!=ESPERA_PARCHES && parches){
    parches=false;
    entrar(ESPERA_PARCHES);
    postAudio(3,true); // Parches desconectados: detiene analisis/RCP.
  }
}

// Actualiza un pulsador y devuelve true SOLO cuando se suelta.
bool leerPulsador(Button &b, uint32_t ahora){
  bool r=digitalRead(b.pin);
  if(r!=b.raw){b.raw=r;b.rawSince=ahora;}
  if(ahora-b.rawSince < BTN_DEBOUNCE_MS || r==b.stable)return false;
  b.stable=r;
  if(r==LOW){
    b.downSince=ahora;
    b.consumed=false;
    b.longDone=false;
    return false;
  }
  return true;
}

void leerBotonesFunciones(){
  const uint32_t ahora=millis();
  bool menuSoltado=leerPulsador(botonMenu,ahora);
  bool okSoltado=leerPulsador(botonOK,ahora);
  bool ambos=(botonMenu.stable==LOW && botonOK.stable==LOW);

  if(ambos){
    if(ambosDesde==0)ambosDesde=ahora;
    // Desde que se reconoce la combinacion se cancelan acciones individuales.
    botonMenu.consumed=true;
    botonOK.consumed=true;
    if(!reinicioCombinado && ahora-ambosDesde>=BTN_RESET_HOLD_MS){
      reinicioCombinado=true;
      reiniciar();
      postAudio(15,true); // Voz: reinicio.
    }
    dibujadoEn=0; // Permite ver la cuenta atras.
  }else{
    ambosDesde=0;
    if(botonMenu.stable==HIGH && botonOK.stable==HIGH)
      reinicioCombinado=false;
  }

  // Mantener OK 2 s (SIN presionar MENU) simula desconexion de parches.
  if(botonOK.stable==LOW && botonMenu.stable==HIGH &&
     !botonOK.consumed && !botonOK.longDone &&
     ahora-botonOK.downSince>=BTN_PADS_HOLD_MS){
    botonOK.longDone=true;
    botonOK.consumed=true;
    desconectarParches();
  }
  if(menuSoltado && !botonMenu.consumed)
    accionMenu();
  if(okSoltado && !botonOK.consumed)
    accionOK();
}

// SHOCK conserva su propia entrada y NUNCA participa en los menus.
void leerBotonShock(){
  uint32_t ahora=millis();
  bool r=digitalRead(botonShock.pin);
  if(r!=botonShock.raw){botonShock.raw=r;botonShock.rawSince=ahora;}
  if(ahora-botonShock.rawSince>=35 && r!=botonShock.stable){
    botonShock.stable=r;
    if(r==LOW && estado==ESPERA_SHOCK && parches) entrar(DESCARGA_APLICADA);
  }
}

void pantallaMarco(){
  tft.fillScreen(NEGRO);
  tft.fillRect(0,0,160,20,AMARILLO);
  tft.setTextColor(NEGRO);tft.setTextSize(1);
  tft.setCursor(5,6);tft.print("DEA SIMULADOR EDUCATIVO");
}
void linea(int x,int y,const char *s,uint16_t color=BLANCO,int tam=1) {
  tft.setTextColor(color);tft.setTextSize(tam);tft.setCursor(x,y);tft.print(s);
}
void trazoECG(uint8_t step){
  tft.drawLine(5,79,154,79,GRIS);
  for(int x=5;x<153;x++){
    int p=(x+step)%52;
    int dy=0;
    if(p==12)dy=-3;else if(p==13)dy=-14;else if(p==14)dy=10;
    else if(p==15)dy=0;else if(p==29||p==30)dy=-3;
    tft.drawLine(x,79-dy,x+1,79-dy,VERDE);
  }
  linea(105,62,"SIM",CIAN);
}
void parcheDibujo() {
  tft.drawRoundRect(105,35,46,44,8,BLANCO);
  tft.drawCircle(129,30,6,BLANCO);
  tft.fillRoundRect(110,44,11,14,2,parches?VERDE:ROJO);
  tft.fillRoundRect(134,55,11,14,2,parches?VERDE:ROJO);
}

// Franja inferior fija y visible (160x33): funcion contextual de cada boton.
void pantallaAcciones(){
  const char *menuAcc="REPETIR";
  const char *okAcc="--";
  const char *shockAcc="--";
  if(estado==LISTO){
    menuAcc="CAMBIAR";
    okAcc=menuOpcion==2?"INICIAR":"EDITAR";
  }else if(estado==ESPERA_PARCHES){
    okAcc="CONFIRM";
  }else if(estado==RCP){
    okAcc="ESTADO";
  }else if(estado==ESPERA_SHOCK){
    shockAcc="PULSAR";
  }
  tft.fillRect(0,95,160,33,AZUL_OSCURO);
  tft.drawFastVLine(53,96,20,CIAN);
  tft.drawFastVLine(106,96,20,CIAN);
  linea(4,97,"MENU",AMARILLO);
  linea(61,97,"OK",VERDE);
  linea(110,97,"SHOCK",ROJO);
  linea(3,107,menuAcc,BLANCO);
  linea(56,107,okAcc,BLANCO);
  linea(109,107,shockAcc,BLANCO);
  linea(8,119,"MENU+OK 3s = REINICIAR",CIAN);
}
void pantallaActualizar(){
  uint32_t ahora=millis();
  if(dibujadoEn && (ahora-dibujadoEn)<180)return;
  dibujadoEn=ahora;
  pantallaMarco();
  linea(3,24,pacienteTxt[paciente],CIAN);
  char buf[64];
  snprintf(buf,sizeof(buf),"VOL %u%%",(unsigned)gVolume);
  linea(97,24,buf,VERDE);
  uint32_t s=(ahora-estadoDesde)/1000;
  switch(estado){
    case LISTO:
      linea(4,37,menuOpcion==0?"> PACIENTE": "  PACIENTE",menuOpcion==0?AMARILLO:BLANCO);
      linea(92,37,pacienteTxt[paciente],CIAN);
      linea(4,51,menuOpcion==1?"> RITMO": "  RITMO",menuOpcion==1?AMARILLO:BLANCO);
      linea(92,51,ritmoDescargable?"SHOCK":"NO SHOCK",VERDE);
      linea(4,68,menuOpcion==2?"> INICIAR DEA":"  INICIAR DEA",menuOpcion==2?AMARILLO:BLANCO);
      break;
    case ESPERA_PARCHES:
      linea(3,40,"CONECTAR",AMARILLO,2);
      linea(3,63,"PARCHES",AMARILLO);
      parcheDibujo();
      break;
    case ANALIZANDO:
      linea(3,41,"ANALIZANDO",AMARILLO,2);
      linea(3,61,"NO TOCAR",ROJO);
      trazoECG((uint8_t)(ahora/55));
      snprintf(buf,sizeof(buf),"%lu s",(unsigned long)(6-min((uint32_t)6,s)));
      linea(121,86,buf,AMARILLO);
      break;
    case AVISO_DESCARGA:
      linea(3,39,"DESCARGA",AMARILLO,2);
      linea(3,61,"RECOMENDADA",AMARILLO);
      linea(3,80,"DESPEJAR",ROJO);
      break;
    case ESPERA_SHOCK:
      linea(5,38,"PULSE SHOCK",AMARILLO,2);
      linea(5,65,"NO TOCAR PACIENTE",ROJO);
      break;
    case DESCARGA_APLICADA:
      linea(4,41,"DESCARGA",VERDE,2);
      linea(4,66,"SIMULADA",VERDE);
      break;
    case SIN_DESCARGA:
      linea(3,41,"NO DESCARGA",CIAN,2);
      linea(3,65,"RCP INDICADA",BLANCO);
      break;
    case RCP:
      linea(4,37,"RCP EN CURSO",VERDE,2);
      snprintf(buf,sizeof(buf),"%02lu:%02lu",(unsigned long)((CPR_DURATION_MS-min(CPR_DURATION_MS,ahora-rcpDesde))/60000),
        (unsigned long)(((CPR_DURATION_MS-min(CPR_DURATION_MS,ahora-rcpDesde))/1000)%60));
      linea(5,65,buf,AMARILLO,2);
      linea(87,65,"110/min",CIAN);
      if((int32_t)(estadoConsultadoHasta-ahora)>0)
        linea(7,83,"OK=TIEMPO RCP",BLANCO);
      break;
  }
  pantallaAcciones();

  // Durante pulsacion simultanea: cuenta atras visible y reinicio en 3s.
  if(ambosDesde && botonMenu.stable==LOW && botonOK.stable==LOW){
    uint32_t ms=ahora-ambosDesde;
    tft.fillRect(0,30,160,61,AZUL_OSCURO);
    linea(12,40,"REINICIAR",AMARILLO,2);
    snprintf(buf,sizeof(buf),"EN %lu...",(unsigned long)(3-min((uint32_t)3,ms/1000)));
    linea(42,70,buf,BLANCO,2);
  }
}

void estadoActualizar(){
  uint32_t ahora=millis();
  // Nunca avanzar o conectar parches sin la accion del alumno.
  if(estado==ANALIZANDO && ahora-estadoDesde>=ANALYSIS_MS){
    entrar(ritmoDescargable?AVISO_DESCARGA:SIN_DESCARGA);
  }else if(estado==AVISO_DESCARGA && ahora-estadoDesde>3000){
    entrar(ESPERA_SHOCK);
  }else if((estado==DESCARGA_APLICADA||estado==SIN_DESCARGA) && ahora-estadoDesde>2500){
    entrar(RCP);
  }else if(estado==RCP){
    if(ahora-rcpDesde>=CPR_DURATION_MS){analizar();}
    else if(ahora-ultimoBeat >= BEAT_INTERVAL_MS){
      ultimoBeat=ahora;
      if(!gVoicePlaying && gAudioQueue && uxQueueMessagesWaiting(gAudioQueue)==0)postAudio(250,false);
    }
  }
  digitalWrite(LED_SHOCK,(estado==ESPERA_SHOCK && (ahora/400)%2==0)?HIGH:LOW);
}

void setup(){
  Serial.begin(115200);
  pinMode(BTN_MENU,INPUT_PULLUP);
  pinMode(BTN_OK,INPUT_PULLUP);
  pinMode(BTN_SHOCK,INPUT_PULLUP);
  pinMode(LED_SHOCK,OUTPUT);digitalWrite(LED_SHOCK,LOW);
  if(USE_AD8232){pinMode(AD_LO_PLUS,INPUT);pinMode(AD_LO_MINUS,INPUT);pinMode(AD_OUT,INPUT);}
  // Mantener la inicialización que se había validado: BLACKTAB + rotación 1.
  tft.initR(INITR_BLACKTAB);
  tft.setRotation(1);
  pantallaMarco();
  linea(6,32,"INICIANDO DEA",AMARILLO,2);
  linea(7,64,"3 BOTONES + AUDIO",BLANCO);
  gVolume=100;
  gAudioQueue=xQueueCreate(8,sizeof(AudioCmd));
  gAudioReady=i2sSetup();
  if(gAudioReady){xTaskCreatePinnedToCore(audioLoopTask,"deaAudio",4096,nullptr,3,nullptr,0);}
  else{Serial.println("ERROR: I2S NO INICIO");}
  initBLE();
  estadoDesde=millis();
  entrar(LISTO);
  Serial.printf("DEA 3 BOTONES LISTO - AUDIO=%s, VOLUMEN=100%%\n",gAudioReady?"OK":"ERROR");
}

void loop(){
  aplicarMonitor();
  leerBotonesFunciones();
  leerBotonShock();
  estadoActualizar();
  pantallaActualizar();
  delay(8);
}