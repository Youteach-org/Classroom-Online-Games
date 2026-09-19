import * as THREE from 'three'; // renderer
import { COASTAL_SCENE } from './coastal-scene-config.mjs?v=coastal-production-20260915-1';
import { buildCoastalWorld } from './coastal-world.mjs?v=coastal-production-20260915-1';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const ROBOT_URLS=[
  'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r180/examples/models/gltf/RobotExpressive/RobotExpressive.glb'
];
const PEDESTRIAN_URL='https://cdn.jsdelivr.net/gh/psqd12137-sudo/dream-channel@3d1f3c91810ac6b73146971d7d6297b12c8f3244/godot/assets/quaternius/animated_characters/Casual_Female.gltf';
let pedestrianTemplate=null;
let pedestrianAnimations=[];

const pedestrianLooks=[
  {shirt:0xd94a48,pants:0x26354c,belt:0xf1c45b,hair:0x4a2a20,shoes:0xf2eee8,skin:0xd99b79,height:1.00,width:1.00,walkSpeed:1.00},
  {shirt:0x2f9fa4,pants:0x1f2940,belt:0xe8d6b0,hair:0x241a18,shoes:0xe7edf2,skin:0xc98668,height:.95,width:.96,walkSpeed:1.07},
  {shirt:0xe0a62f,pants:0x6d3548,belt:0x5a3828,hair:0x7a3f2b,shoes:0x35363b,skin:0xe0a17e,height:1.06,width:1.03,walkSpeed:.96},
  {shirt:0x8b67cf,pants:0x30343d,belt:0xe7c7a4,hair:0xd2a46d,shoes:0xf4f2ed,skin:0xe2ad8c,height:1.02,width:.94,walkSpeed:1.03},
  {shirt:0x4b83c4,pants:0xd9d0bd,belt:0x3e5368,hair:0x3a2822,shoes:0x2c3035,skin:0xb9785e,height:.92,width:1.05,walkSpeed:1.10},
  {shirt:0x4f9b5f,pants:0x365a78,belt:0xd9b26b,hair:0x9a4d35,shoes:0xefe9de,skin:0xf0bc98,height:1.08,width:.98,walkSpeed:.93}
];
const IS_MOBILE=matchMedia('(pointer:coarse)').matches||innerWidth<=700;
const ANSWER_SPAWN_Z=IS_MOBILE?-50:-70;
const OBSTACLE_SPAWN_Z=IS_MOBILE?-58:-74;

const variants=[
  {name:'RED',accent:0xe43c3c,secondary:0x821b2a,dark:0x171922,light:0xf0f2f6},
  {name:'BLUE',accent:0x2475d1,secondary:0x123c73,dark:0x151922,light:0xddeeff},
  {name:'GREEN',accent:0x29a65a,secondary:0x145f37,dark:0x141b18,light:0xe2f5e8},
  {name:'PINK',accent:0xef4c78,secondary:0x8d2345,dark:0x1d151a,light:0xffe1ea},
  {name:'WHITE / BLACK',accent:0xe8ebf2,secondary:0x8d94a3,dark:0x111319,light:0xffffff},
  {name:'PURPLE',accent:0x9a4de0,secondary:0x57258d,dark:0x18131e,light:0xf0e2ff}
];

const canvas=document.querySelector('#game');
const distanceEl=document.querySelector('#distance');
const speedEl=document.querySelector('#speed');
const modelStatus=document.querySelector('#modelStatus');
const flash=document.querySelector('#flash');
const picker=document.querySelector('#picker');
const startButton=document.querySelector('#startButton');
const startButtonLabel=document.querySelector('#startButtonLabel');
const runnerChip=document.querySelector('#runnerChip');
const runnerName=document.querySelector('#runnerName');
const runnerDot=document.querySelector('#runnerDot');
const pauseButton=document.querySelector('#pauseButton');
const resumeButton=document.querySelector('#resumeButton');
const pauseOverlay=document.querySelector('#pauseOverlay');
const resultOverlay=document.querySelector('#resultOverlay');
const runAgainButton=document.querySelector('#runAgainButton');
const challengeNumber=document.querySelector('#challengeNumber');
const streakValue=document.querySelector('#streakValue');
const progressValue=document.querySelector('#progressValue');
const momentumValue=document.querySelector('#momentumValue');
const momentumFill=document.querySelector('#momentumFill');
const raceTime=document.querySelector('#raceTime');
const gameNotice=document.querySelector('#gameNotice');
const resultTime=document.querySelector('#resultTime');
const resultAccuracy=document.querySelector('#resultAccuracy');
const resultCorrect=document.querySelector('#resultCorrect');
const resultStreak=document.querySelector('#resultStreak');
const resultObstacles=document.querySelector('#resultObstacles');
const resultMomentum=document.querySelector('#resultMomentum');
const levelTitle=document.querySelector('#levelTitle');
const principalParts=document.querySelector('#principalParts');
const sentenceChallenge=document.querySelector('#sentenceChallenge');
const sentenceText=document.querySelector('#sentenceText');
const sentenceCue=document.querySelector('#sentenceCue');
const sentenceCueLabel=document.querySelector('#sentenceCueLabel');
const taskInstruction=document.querySelector('#taskInstruction');
const resultKicker=document.querySelector('#resultKicker');
const nextLevelButton=document.querySelector('#nextLevelButton');
const pauseRaceTitle=document.querySelector('#pauseRaceTitle');
const speedControl=document.querySelector('#speedControl');
const speedValue=document.querySelector('#speedValue');
const speedDescription=document.querySelector('#speedDescription');
const startingSpeedControl=document.querySelector('#startingSpeedControl');
const startingSpeedValue=document.querySelector('#startingSpeedValue');
const startingSpeedDescription=document.querySelector('#startingSpeedDescription');
const changeRunnerButton=document.querySelector('#changeRunnerButton');
const controlsButton=document.querySelector('#controlsButton');
const errorReportButton=document.querySelector('#errorReportButton');
const errorReportCount=document.querySelector('#errorReportCount');
const errorReportPanel=document.querySelector('#errorReportPanel');
const errorReportSummary=document.querySelector('#errorReportSummary');
const errorReportList=document.querySelector('#errorReportList');
const pauseRunnerPanel=document.querySelector('#pauseRunnerPanel');
const controlsPanel=document.querySelector('#controlsPanel');
const restartRaceButton=document.querySelector('#restartRaceButton');
const quitRaceButton=document.querySelector('#quitRaceButton');
const pauseConfirm=document.querySelector('#pauseConfirm');
const pauseConfirmTitle=document.querySelector('#pauseConfirmTitle');
const pauseConfirmText=document.querySelector('#pauseConfirmText');
const cancelPauseAction=document.querySelector('#cancelPauseAction');
const confirmPauseAction=document.querySelector('#confirmPauseAction');
const backToMenuButton=document.querySelector('#backToMenuButton');
const soundControl=document.querySelector('#soundControl');
const soundValue=document.querySelector('#soundValue');
const soundToggle=document.querySelector('#soundToggle');
const musicControl=document.querySelector('#musicControl');
const musicValue=document.querySelector('#musicValue');
const musicToggle=document.querySelector('#musicToggle');
const pauseReadingCard=document.querySelector('#pauseReadingCard');
const pauseReadingMode=document.querySelector('#pauseReadingMode');
const pauseSentenceText=document.querySelector('#pauseSentenceText');
const pauseHintText=document.querySelector('#pauseHintText');

const TOTAL_CHALLENGES=20;
const difficultyPresets={
  easy:{name:'easy',speed:.90,answerSpacing:.82,distractors:2,preview:false,penalty:0},
  medium:{name:'medium',speed:1.00,answerSpacing:.82,distractors:3,preview:false,penalty:1},
  hard:{name:'hard',speed:1.15,answerSpacing:.82,distractors:4,preview:false,penalty:2}
};
const sentenceRunTuning={
  easy:{speedScale:.58,answerSpacing:1.35,initialDelay:2.8,initialSpeed:17,maxSpeed:22},
  medium:{speedScale:.66,answerSpacing:1.18,initialDelay:2.45,initialSpeed:17,maxSpeed:24},
  hard:{speedScale:.76,answerSpacing:1.05,initialDelay:2.15,initialSpeed:18,maxSpeed:26}
};
const timeClueRunTuning={
  easy:{speedScale:.54,answerSpacing:.60,initialDelay:2.55,initialSpeed:16,maxSpeed:21},
  medium:{speedScale:.62,answerSpacing:.56,initialDelay:2.35,initialSpeed:17,maxSpeed:23},
  hard:{speedScale:.70,answerSpacing:.52,initialDelay:2.20,initialSpeed:17,maxSpeed:25}
};
const perfectRaceTuning={
  easy:{speedScale:.54,answerSpacing:.68,initialDelay:2.65,initialSpeed:16,maxSpeed:21},
  medium:{speedScale:.62,answerSpacing:.62,initialDelay:2.45,initialSpeed:17,maxSpeed:23},
  hard:{speedScale:.70,answerSpacing:.58,initialDelay:2.30,initialSpeed:17,maxSpeed:25}
};
const finalRaceTuning={
  easy:{speedScale:.56,answerSpacing:.68,initialDelay:2.70,initialSpeed:16,maxSpeed:22},
  medium:{speedScale:.64,answerSpacing:.62,initialDelay:2.48,initialSpeed:17,maxSpeed:24},
  hard:{speedScale:.72,answerSpacing:.58,initialDelay:2.30,initialSpeed:17,maxSpeed:26}
};
let difficulty=difficultyPresets.medium;
let totalChallenges=TOTAL_CHALLENGES;
let playerSpeedMultiplier=1;

function speedDescriptionFor(percent){
  if(percent<=75)return 'Beginner pace · extra time to read';
  if(percent<=90)return 'Controlled · slow speed';
  if(percent<=105)return 'Normal race speed';
  if(percent<=125)return 'Fast';
  if(percent<=145)return 'Very fast';
  return 'Turbo · maximum speed';
}

function setPlayerSpeedPercent(value){
  const percent=Math.max(60,Math.min(165,Math.round(Number(value)||100)));
  playerSpeedMultiplier=percent/100;
  const description=speedDescriptionFor(percent);
  if(speedControl)speedControl.value=String(percent);
  if(speedValue)speedValue.textContent=percent+'%';
  if(speedDescription)speedDescription.textContent=description;
  if(startingSpeedControl)startingSpeedControl.value=String(percent);
  if(startingSpeedValue)startingSpeedValue.textContent=percent+'%';
  if(startingSpeedDescription)startingSpeedDescription.textContent=description+' · Momentum increases speed during the run';
}

let audioCtx=null;
let sfxEnabled=true;
let musicEnabled=true;
let sfxVolume=.70;
let musicVolume=.12;
let musicTimer=null;
let musicStep=0;
let musicBus=null;

function ensureAudio(){
  if(!audioCtx){
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextClass)return null;
    audioCtx=new AudioContextClass();
  }
  if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
  return audioCtx;
}

function synthTone(freq,duration=.10,volume=.05,type='sine',delay=0){
  const ctx=ensureAudio();
  if(!ctx||volume<=0)return;
  const osc=ctx.createOscillator();
  const gain=ctx.createGain();
  const now=ctx.currentTime+delay;
  osc.type=type;
  osc.frequency.setValueAtTime(freq,now);
  gain.gain.setValueAtTime(.0001,now);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0001,volume),now+.012);
  gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now+duration+.03);
}

function playSfx(name){
  if(!sfxEnabled||sfxVolume<=0)return;
  const v=.12*sfxVolume;
  if(name==='click')synthTone(520,.055,v*.45,'square');
  else if(name==='select'){synthTone(660,.045,v*.30,'sine');synthTone(880,.055,v*.26,'sine',.035);}
  else if(name==='jump'){synthTone(360,.08,v*.6,'sine');synthTone(620,.10,v*.55,'sine',.055);}
  else if(name==='correct'){
    synthTone(659,.07,v*.50,'triangle');
    synthTone(784,.08,v*.56,'triangle',.055);
    synthTone(988,.10,v*.64,'triangle',.11);
    synthTone(1319,.16,v*.70,'sine',.18);
    synthTone(1568,.12,v*.34,'sine',.24);
  }
  else if(name==='wrong'){synthTone(190,.18,v*.8,'sawtooth');synthTone(145,.20,v*.55,'square',.07);}
  else if(name==='pause')synthTone(310,.08,v*.45,'triangle');
  else if(name==='resume'){synthTone(420,.07,v*.45,'triangle');synthTone(560,.08,v*.5,'triangle',.06);}
  else if(name==='victory'){[523,659,784,1047].forEach((f,i)=>synthTone(f,.18,v*.65,'triangle',i*.09));}
}

const PLATFORM_BEAT=.18;
const PLATFORM_STEPS=64;

// Original upbeat platformer-style loop. It does not copy a game melody.
const platformMelody=[
  76,null,79,81,79,null,76,74,
  72,null,76,79,76,null,74,72,
  69,null,72,76,74,null,72,69,
  71,null,74,79,77,74,71,null,
  76,79,83,null,81,79,76,null,
  69,72,76,null,74,72,69,null,
  74,77,81,79,77,null,74,72,
  71,74,79,null,77,74,72,null
];

const platformRoots=[48,45,41,43,52,45,50,43];
const platformChordTones=[
  [0,4,7],   // C
  [0,3,7],   // A minor
  [0,4,7],   // F
  [0,4,7],   // G
  [0,3,7],   // E minor
  [0,3,7],   // A minor
  [0,3,7],   // D minor
  [0,4,7]    // G
];

function midiFreq(note){
  return 440*Math.pow(2,(note-69)/12);
}

function ensureMusicBus(){
  const ctx=ensureAudio();
  if(!ctx)return null;
  if(!musicBus){
    musicBus=ctx.createGain();
    musicBus.gain.setValueAtTime(Math.max(.0001,musicVolume),ctx.currentTime);
    musicBus.connect(ctx.destination);
  }
  return musicBus;
}

function scheduleMusicTone(note,start,duration,level=.06,type='square'){
  const ctx=ensureAudio();
  const bus=ensureMusicBus();
  if(!ctx||!bus||note==null)return;

  const osc=ctx.createOscillator();
  const gain=ctx.createGain();
  const filter=ctx.createBiquadFilter();

  osc.type=type;
  osc.frequency.setValueAtTime(midiFreq(note),start);

  filter.type='lowpass';
  filter.frequency.setValueAtTime(type==='square'?2600:1800,start);
  filter.Q.setValueAtTime(.55,start);

  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(level,start+.012);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0001,level*.42),start+Math.max(.035,duration*.42));
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration);

  osc.connect(filter).connect(gain).connect(bus);
  osc.start(start);
  osc.stop(start+duration+.03);
}

function schedulePlatformBar(barIndex){
  const ctx=ensureAudio();
  if(!ctx||!musicEnabled||musicVolume<=0||!gameStarted||gamePaused)return;

  const now=ctx.currentTime+.035;
  const firstStep=(barIndex*8)%PLATFORM_STEPS;
  const root=platformRoots[barIndex%platformRoots.length];
  const chord=platformChordTones[barIndex%platformChordTones.length];

  for(let local=0;local<8;local++){
    const step=(firstStep+local)%PLATFORM_STEPS;
    const t=now+local*PLATFORM_BEAT;
    const melody=platformMelody[step];

    // Bright lead with rests so it stays playful rather than constant.
    if(melody!=null){
      scheduleMusicTone(melody,t,PLATFORM_BEAT*.72,.040,'square');
    }

    // Light arpeggio on the offbeats.
    if(local%2===1){
      const arpNote=root+12+chord[(local>>1)%chord.length];
      scheduleMusicTone(arpNote,t,PLATFORM_BEAT*.52,.018,'triangle');
    }

    // Bouncy bass on beats 1 and 3.
    if(local===0||local===4){
      scheduleMusicTone(root,t,PLATFORM_BEAT*1.45,.032,'triangle');
      scheduleMusicTone(root+12,t+.075,PLATFORM_BEAT*.34,.012,'sine');
    }

    // Tiny rhythmic click, deliberately sparse.
    if(local===2||local===6){
      scheduleMusicTone(84,t,PLATFORM_BEAT*.16,.006,'square');
    }
  }
}

function musicTick(){
  if(!musicEnabled||musicVolume<=0||!gameStarted||gamePaused)return;
  schedulePlatformBar(musicStep);
  musicStep=(musicStep+1)%8;
}

function startMusic(){
  if(!musicEnabled||musicVolume<=0||!gameStarted||gamePaused)return;
  ensureMusicBus();
  if(musicBus&&audioCtx){
    musicBus.gain.cancelScheduledValues(audioCtx.currentTime);
    musicBus.gain.setTargetAtTime(musicVolume,audioCtx.currentTime,.05);
  }
  if(musicTimer)return;
  musicTick();
  musicTimer=setInterval(musicTick,Math.round(PLATFORM_BEAT*8*1000)-45);
}

function stopMusic(){
  if(musicTimer)clearInterval(musicTimer);
  musicTimer=null;
  if(musicBus&&audioCtx){
    const bus=musicBus;
    musicBus=null;
    bus.gain.cancelScheduledValues(audioCtx.currentTime);
    bus.gain.setTargetAtTime(.0001,audioCtx.currentTime,.025);
    setTimeout(()=>{try{bus.disconnect();}catch{}},150);
  }
}

function saveAudioSettings(){
  try{
    localStorage.setItem('verbRunnerV2Audio',JSON.stringify({
      sfxEnabled,musicEnabled,sfxVolume,musicVolume
    }));
  }catch{}
}

function updateAudioUI(){
  const sfxPercent=Math.round(sfxVolume*100);
  const musicPercent=Math.round(musicVolume*100);
  if(soundControl)soundControl.value=String(sfxPercent);
  if(musicControl){
    musicControl.value=String(musicPercent);
    musicControl.disabled=false;
  }
  if(soundValue)soundValue.textContent=sfxPercent+'%';
  if(musicValue)musicValue.textContent=musicEnabled?musicPercent+'%':'OFF';
  if(soundToggle){
    soundToggle.textContent=sfxEnabled?'ON':'OFF';
    soundToggle.classList.toggle('active',sfxEnabled);
    soundToggle.setAttribute('aria-pressed',String(sfxEnabled));
  }
  if(musicToggle){
    musicToggle.textContent=musicEnabled?'ON':'OFF';
    musicToggle.classList.toggle('active',musicEnabled);
    musicToggle.setAttribute('aria-pressed',String(musicEnabled));
    musicToggle.disabled=false;
  }
}

function loadAudioSettings(){
  try{
    const saved=JSON.parse(localStorage.getItem('verbRunnerV2Audio')||'null');
    if(saved){
      sfxEnabled=saved.sfxEnabled!==false;
      musicEnabled=saved.musicEnabled!==false;
      sfxVolume=Math.max(0,Math.min(1,Number(saved.sfxVolume)??.70));
      const storedMusic=Number(saved.musicVolume);
      musicVolume=Number.isFinite(storedMusic)&&storedMusic>0
        ?Math.max(.05,Math.min(.35,storedMusic))
         :.12;
    }
  }catch{}
  updateAudioUI();
}
loadAudioSettings();
let gameSettings={
  preview:false,
  answerSpacing:.82,
  distractors:3,
  obstacleFrequency:45,
  momentumCorrect:8,
  penalty:1,
  initialSpeed:12,
  maxSpeed:31,
  speedScale:1
};

const sessionParams=new URLSearchParams(location.search);
const sessionCode=(sessionParams.get('session')||'').toUpperCase();
const launchToken=String(sessionParams.get('launch')||'').trim();
const sessionStudentName=String(
  sessionParams.get('studentName')||
  sessionParams.get('nickname')||
  sessionParams.get('name')||
  ''
).trim().slice(0,60);
const YOUTEACH_IDENTITY_KEY='verbRunnerYouTeachIdentity';
let sessionApi=null;
let sessionData=null;
let sessionRunFinished=false;
let sessionLoadPromise=Promise.resolve(null);
let youTeachIdentity=null;
let youTeachAssignmentContext=null;
let assignmentContextLocked=false;

function localRunnerId(){
  try{
    const stored=localStorage.getItem('verbRunnerV2RunnerId');
    if(stored)return stored;
    const id='R-'+Math.random().toString(36).slice(2,6).toUpperCase();
    localStorage.setItem('verbRunnerV2RunnerId',id);
    return id;
  }catch{
    return 'R-'+Math.random().toString(36).slice(2,6).toUpperCase();
  }
}

function readStoredYouTeachIdentity(){
  try{
    const raw=localStorage.getItem(YOUTEACH_IDENTITY_KEY);
    if(!raw)return null;
    const identity=JSON.parse(raw);
    return identity?.studentKey?identity:null;
  }catch{return null;}
}

function storeYouTeachIdentity(identity){
  try{
    if(!identity?.studentKey)return;
    const stored={
      studentKey:identity.studentKey,
      nickname:identity.nickname||'',
      fullName:identity.fullName||'',
      groupName:identity.groupName||'',
      studentNumber:identity.studentNumber||'',
      identitySource:'youteach'
    };
    localStorage.setItem(YOUTEACH_IDENTITY_KEY,JSON.stringify(stored));
  }catch{}
}

function cleanLaunchTokenFromUrl(){
  if(!launchToken)return;
  const clean=new URL(location.href);
  clean.searchParams.delete('launch');
  history.replaceState(null,'',clean.pathname+clean.search+clean.hash);
}

youTeachIdentity=readStoredYouTeachIdentity();
let runnerSessionId=localRunnerId();
if(youTeachIdentity?.studentKey){
  runnerSessionId='YT-'+String(youTeachIdentity.studentKey).replace(/[.#$\[\]\/]/g,'_').slice(0,96);
}

function monitorIdentityData(){
  return {
    studentName:youTeachIdentity?.nickname||sessionStudentName||runnerSessionId,
    studentKey:youTeachIdentity?.studentKey||'',
    nickname:youTeachIdentity?.nickname||'',
    fullName:youTeachIdentity?.fullName||'',
    groupName:youTeachIdentity?.groupName||'',
    studentNumber:youTeachIdentity?.studentNumber||'',
    identitySource:youTeachIdentity?'youteach':'local'
  };
}

function assignmentLevelForMode(modeId){
  const levels={
    verb:1,
    sentence:2,
    'time-clues':3,
    'perfect-race':4,
    'final-race':5
  };
  return levels[String(modeId||'')]||0;
}

function applyYouTeachAssignmentContext(context={}){
  if(context?.purpose!=='assignment-practice')return false;
  if(context?.gameId&&context.gameId!=='verb-runner')return false;

  const level=assignmentLevelForMode(context.modeId);
  const preset=difficultyPresets[String(context.difficultyId||'')];
  if(!level||!preset)return false;

  youTeachAssignmentContext={...context};
  assignmentContextLocked=true;
  currentLevel=level;
  totalChallenges=currentLevel===5?30:TOTAL_CHALLENGES;
  applyDifficultyDefaults(preset);

  document.querySelectorAll('[data-race]').forEach(btn=>{
    const selected=Number(btn.dataset.level)===currentLevel;
    btn.classList.toggle('active',selected);
    btn.disabled=true;
    btn.setAttribute('aria-pressed',selected?'true':'false');
  });
  document.querySelectorAll('[data-difficulty]').forEach(btn=>{
    const selected=btn.dataset.difficulty===preset.name;
    btn.classList.toggle('active',selected);
    btn.disabled=true;
  });
  if(nextLevelButton)nextLevelButton.hidden=true;
  return true;
}

function sessionUpdate(patch={}){
  if(!sessionApi||!sessionData)return Promise.resolve();
  if(sessionCode)return sessionApi.updateRunner(sessionCode,runnerSessionId,patch);
  return sessionApi.updateFreeRunner(runnerSessionId,patch);
}
function sessionConnect(data={}){
  if(!sessionApi||!sessionData)return Promise.resolve();
  const payload={...monitorIdentityData(),...data};
  if(sessionCode)return sessionApi.connectRunner(sessionCode,runnerSessionId,payload);
  return sessionApi.connectFreeRunner(runnerSessionId,payload);
}
function sessionFinish(data={}){
  if(!sessionApi||!sessionData)return Promise.resolve();
  const payload={...monitorIdentityData(),...data};
  if(sessionCode)return sessionApi.finishRunner(sessionCode,runnerSessionId,payload);
  return sessionApi.finishFreeRunner(runnerSessionId,payload);
}

const renderer=new THREE.WebGLRenderer({canvas,antialias:!IS_MOBILE,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(IS_MOBILE?Math.min(devicePixelRatio||1,1.1):Math.min(devicePixelRatio||1,2));
renderer.shadowMap.enabled=!IS_MOBILE;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.18;

const scene=new THREE.Scene();
scene.background=new THREE.Color(COASTAL_SCENE.skyColor);
renderer.setClearColor(COASTAL_SCENE.skyColor,1);
scene.fog=new THREE.FogExp2(0xd8edf0,IS_MOBILE?0.0053:0.0048);

const cameraConfig=IS_MOBILE?COASTAL_SCENE.camera.mobile:COASTAL_SCENE.camera.desktop;
const camera=new THREE.PerspectiveCamera(cameraConfig.fov,1,.1,cameraConfig.far);
camera.position.fromArray(cameraConfig.position);
camera.lookAt(...cameraConfig.lookAt);

scene.add(new THREE.HemisphereLight(0xeaf8ff,0x8c9b79,2.35));

const sun=new THREE.DirectionalLight(0xfff3cf,4.2);
sun.position.set(-10,16,10);
sun.castShadow=true;
sun.shadow.mapSize.set(IS_MOBILE?1024:2048,IS_MOBILE?1024:2048);
sun.shadow.camera.left=-16;
sun.shadow.camera.right=16;
sun.shadow.camera.top=18;
sun.shadow.camera.bottom=-8;
scene.add(sun);

const daylightFill=new THREE.DirectionalLight(0xc9e6ff,1.15);
daylightFill.position.set(8,6,-10);
scene.add(daylightFill);

const world=new THREE.Group();
scene.add(world);

const environmentMovers=[];
const farMovers=[];

function addMover(object,{speedFactor=1,span=COASTAL_SCENE.loop.nearSpan,startZ=null}={}){
  const initialZ=startZ??object.position.z;
  environmentMovers.push({object,speedFactor,span,initialZ});
}

function addFarMover(object,{speedFactor=.28,span=COASTAL_SCENE.loop.farSpan,startZ=null}={}){
  const initialZ=startZ??object.position.z;
  farMovers.push({object,speedFactor,span,initialZ});
}

const coastalWorld=buildCoastalWorld({
  scene,
  world,
  isMobile:IS_MOBILE,
  registerMover:addMover,
  registerFarMover:addFarMover
});
const laneMarkers=coastalWorld.laneMarkers;

const runnerRoot=new THREE.Group();
runnerRoot.position.set(0,0,2);
scene.add(runnerRoot);

const shadow=new THREE.Mesh(
  new THREE.CircleGeometry(.72,32),
  new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.34,depthWrite:false})
);
shadow.rotation.x=-Math.PI/2;
shadow.position.y=.025;
runnerRoot.add(shadow);

let model=null;
let baseScale=null;
let mixer=null;
let actions={};
let activeAction=null;
let selectedVariant=0;
let gameStarted=false;
let runnerReady=false;
let runnerLoadFailed=false;
let gamePaused=false;
let victoryMode=false;
let victoryArmBlend=0;
let victoryArmRig={left:null,right:null};
let runState=null;
let currentLevel=1;
let challenges=[];
let challengeIndex=0;
let verbDeck=[];
let sentenceDeck=[];
let timeClueDeck=[];
let perfectRaceDeck=[];
let finalRaceDeck=[];
let runElapsed=0;
let noticeTimer=0;
let pendingAnswers=[];
let answerSpawnClock=0;
let currentChallenge=null;
let retryQueued=false;
let answerResolutionActive=false;
let mistakeLog=[];
let lastCorrectAnswerIndex=-1;
let recentCorrectPositions=[];
let blankUsage=[0,0,0];
const lastBlankByVerb=new Map();

function updateStartButtonState(){
  if(!startButton)return;
  if(runnerLoadFailed){
    startButton.disabled=true;
    startButton.classList.remove('loading');
    startButton.classList.add('load-error');
    startButton.setAttribute('aria-busy','false');
    if(startButtonLabel)startButtonLabel.textContent='RUNNER FAILED TO LOAD';
    return;
  }

  if(!runnerReady){
    startButton.disabled=true;
    startButton.classList.add('loading');
    startButton.classList.remove('load-error');
    startButton.setAttribute('aria-busy','true');
    if(startButtonLabel)startButtonLabel.textContent='LOADING RUNNER…';
    return;
  }

  startButton.disabled=false;
  startButton.classList.remove('loading','load-error');
  startButton.setAttribute('aria-busy','false');
  if(startButtonLabel)startButtonLabel.textContent='START '+raceLabel();
}

function isPrincipalPartsChallenge(challenge=currentChallenge){
  return currentLevel===1||(currentLevel===5&&challenge?.finalCategory==='principal-parts');
}

function isTextRace(){
  return currentLevel>=2&&currentLevel<=5&&!isPrincipalPartsChallenge();
}

function raceMode(){
  if(currentLevel===5)return 'final-race';
  if(currentLevel===4)return 'perfect-race';
  if(currentLevel===3)return 'time-clues';
  if(currentLevel===2)return 'sentence-run';
  return 'verb-hunt';
}

function raceLabel(){
  if(currentLevel===5)return 'FINAL RACE';
  if(currentLevel===4)return 'PERFECT RUNNING';
  if(currentLevel===3)return 'TIME CLUES';
  if(currentLevel===2)return 'SENTENCE RUNNER';
  return 'VERB RUNNER';
}

function setDifficultyCopy(){
  let copy;
  if(currentLevel===5){
    copy={
      easy:'3 options · concept clue shown · no advance loss',
      medium:'3 options · mixed grammar · −1',
      hard:'3 options · subtle mixed contexts · −2'
    };
  }else if(currentLevel===4){
    copy={
      easy:'3 options · focus shown · no advance loss',
      medium:'3 options · choose Simple vs Continuous · −1',
      hard:'3 options · subtle Perfect contrasts · −2'
    };
  }else if(currentLevel===3){
    copy={
      easy:'3 options · grammar shown · no advance loss',
      medium:'3 options · recognize the grammar · −1',
      hard:'3 options · advanced time clues · −2'
    };
  }else{
    copy={
      easy:'2 distractors · basic tenses · no advance loss',
      medium:'3 plausible distractors · intermediate tenses · −1',
      hard:'4 close distractors · advanced tenses · −2'
    };
  }
  document.querySelectorAll('[data-difficulty]').forEach(btn=>{
    const small=btn.querySelector('small');
    if(small)small.textContent=copy[btn.dataset.difficulty]||'';
  });
}

function setLevelUI(){
  const textMode=isTextRace();
  const timeMode=currentLevel===3;
  const perfectMode=currentLevel===4;
  const finalMode=currentLevel===5;

  if(levelTitle){
    levelTitle.textContent=finalMode
      ?'FINAL RACE · EVERYTHING COUNTS'
      :perfectMode
        ?'PERFECT RUNNING · RESULT VS PROCESS'
        :timeMode
          ?'TIME CLUES · MATCH THE MOMENT'
          :currentLevel===2
            ?'SENTENCE RUNNER · ALL TENSES'
            :'VERB RUNNER · VERB HUNT';
  }

  if(principalParts)principalParts.hidden=textMode;
  if(sentenceChallenge)sentenceChallenge.hidden=!textMode;
  if(sentenceCueLabel)sentenceCueLabel.textContent=(perfectMode||finalMode)?'FOCUS':(timeMode?'GRAMMAR':'VERB');
  const cueBadge=sentenceCue?.closest('small');
  if(cueBadge)cueBadge.hidden=!textMode||difficulty.name!=='easy';

  if(taskInstruction){
    if(finalMode){
      taskInstruction.textContent=difficulty.name==='easy'
        ?'Use the concept clue, then solve the mixed challenge'
        :difficulty.name==='hard'
          ?'Everything counts · read the whole context before choosing'
          :'Choose the option that makes the whole context work';
    }else if(perfectMode){
      taskInstruction.textContent=difficulty.name==='easy'
        ?'Use the focus hint and choose the Perfect form that matches the meaning'
        :difficulty.name==='hard'
          ?'Decide: completed result or ongoing duration/process · tap the sentence to pause'
          :'Choose Perfect Simple or Perfect Continuous from the context';
    }else if(timeMode){
      taskInstruction.textContent=difficulty.name==='easy'
        ?'Use the grammar hint and collect the time clue that fits'
        :difficulty.name==='hard'
          ?'Match the grammar to the best time clue · tap the sentence to pause'
          :'Recognize the grammar and choose the compatible time expression';
    }else if(currentLevel===2){
      taskInstruction.textContent=difficulty.name==='easy'
        ?'Use the verb hint and choose the form that completes the sentence'
        :difficulty.name==='hard'
          ?'Choose the best form · tap the sentence to pause and read'
          :'Choose the verb and form that best complete the sentence';
    }else{
      taskInstruction.textContent='Collect the correct verb form';
    }
  }

  if(resultKicker)resultKicker.textContent=raceLabel()+' COMPLETE';
  if(nextLevelButton){
    nextLevelButton.hidden=assignmentContextLocked||currentLevel>=5;
    nextLevelButton.textContent=currentLevel===1
      ?'TRY NEXT RACE · SENTENCE RUNNER'
      :currentLevel===2
        ?'TRY NEXT RACE · TIME CLUES'
        :currentLevel===3
          ?'TRY NEXT RACE · PERFECT RUNNING'
          :'TRY NEXT RACE · FINAL RACE';
  }

  updateStartButtonState();
  setDifficultyCopy();
  document.querySelectorAll('[data-race]').forEach(btn=>{
    btn.classList.toggle('active',Number(btn.dataset.level)===currentLevel);
    btn.setAttribute('aria-pressed',Number(btn.dataset.level)===currentLevel?'true':'false');
  });
}

function applySentenceRunTuning(){
  if(!isTextRace())return;
  const source=currentLevel===5
    ?finalRaceTuning
    :currentLevel===4
      ?perfectRaceTuning
      :currentLevel===3
      ?timeClueRunTuning
      :sentenceRunTuning;
  const tuning=source[difficulty.name]||source.medium;
  gameSettings={
    ...gameSettings,
    speedScale:tuning.speedScale,
    answerSpacing:tuning.answerSpacing,
    initialSpeed:tuning.initialSpeed,
    maxSpeed:tuning.maxSpeed
  };
}

function sentenceInitialDelay(fallback=.55){
  if(!isTextRace())return fallback;
  const source=currentLevel===5
    ?finalRaceTuning
    :currentLevel===4
      ?perfectRaceTuning
      :currentLevel===3
      ?timeClueRunTuning
      :sentenceRunTuning;
  return (source[difficulty.name]||source.medium).initialDelay;
}

setLevelUI();

function applyDifficultyDefaults(preset){
  difficulty=preset;
  gameSettings={
    ...gameSettings,
    preview:preset.preview,
    answerSpacing:preset.answerSpacing,
    distractors:preset.distractors,
    speedScale:preset.speed,
    penalty:preset.penalty
  };
  applySentenceRunTuning();
  setLevelUI();
}

function selectRace(level){
  if(gameStarted||assignmentContextLocked)return;
  currentLevel=Math.max(1,Math.min(5,Number(level)||1));
  totalChallenges=currentLevel===5?30:TOTAL_CHALLENGES;

  if(sessionCode&&sessionData){
    applySessionSettings(sessionData.settings||{});
    applySentenceRunTuning();
    setLevelUI();
  }else{
    gameSettings={
      ...gameSettings,
      initialSpeed:12,
      maxSpeed:31,
      speedScale:difficulty.speed,
      answerSpacing:difficulty.answerSpacing
    };
    applyDifficultyDefaults(difficulty);
  }

  modelStatus.textContent=runnerReady
    ?raceLabel()+' selected · choose runner and difficulty'
    :raceLabel()+' selected · loading runner…';
  updateStartButtonState();
}

function applySessionSettings(settings={}){
  const preset=difficultyPresets[settings.difficulty]||difficultyPresets.medium;
  difficulty=preset;
  totalChallenges=Math.max(5,Math.min(40,Number(settings.challengeCount)||totalChallenges));
  gameSettings={
    preview:settings.preview??preset.preview,
    answerSpacing:Number(settings.answerSpacing)||preset.answerSpacing,
    distractors:Math.max(1,Math.min(6,Number(settings.distractors)||preset.distractors)),
    obstacleFrequency:Math.max(0,Math.min(100,Number(settings.obstacleFrequency)??45)),
    momentumCorrect:Math.max(0,Number(settings.momentumCorrect)??8),
    penalty:preset.penalty,
    initialSpeed:Math.max(8,Number(settings.initialSpeed)||12),
    maxSpeed:Math.max(20,Number(settings.maxSpeed)||31),
    speedScale:Number(settings.speedScale)||preset.speed
  };
  document.querySelectorAll('[data-difficulty]').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.difficulty===preset.name);
    btn.disabled=true;
  });
  if(challengeNumber)challengeNumber.textContent='1 / '+totalChallenges;
  progressValue.textContent='0 / '+totalChallenges;
}

sessionLoadPromise=import('./session-sync.js?v=youteach-credentials-20260915-1')
  .then(async api=>{
    sessionApi=api;

    if(launchToken){
      const resolved=await sessionApi.resolveYouTeachLaunchToken(launchToken);
      if(!resolved)throw new Error('Invalid or expired YouTeach credential');
      youTeachIdentity=resolved;
      storeYouTeachIdentity(resolved);
      runnerSessionId='YT-'+String(resolved.studentKey).replace(/[.#$\[\]\/]/g,'_').slice(0,96);
      if(resolved.assignmentContext){
        applyYouTeachAssignmentContext(resolved.assignmentContext);
      }
      cleanLaunchTokenFromUrl();
    }

    const presenceData={
      level:currentLevel,
      mode:raceMode(),
      total:totalChallenges,
      runner:selectedVariant,
      difficulty:difficulty.name,
      ...monitorIdentityData()
    };

    if(sessionCode){
      modelStatus.textContent='Loading classroom session '+sessionCode+'…';
      const data=await sessionApi.loadSession(sessionCode);
      if(!data||data.status!=='active')throw new Error('Session not active');
      sessionData=data;
      applySessionSettings(data.settings||{});
      await sessionApi.registerRunnerPresence(sessionCode,runnerSessionId,presenceData);
      modelStatus.textContent='Session '+sessionCode+' ready · '+(youTeachIdentity?.nickname||'connected');
      return data;
    }

    sessionData={
      status:youTeachAssignmentContext?'assignment-practice':'free',
      identitySource:youTeachIdentity?'youteach':'local',
      assignmentContext:youTeachAssignmentContext||null
    };
    await sessionApi.registerFreeRunnerPresence(runnerSessionId,{
      ...presenceData,
      assignmentId:youTeachAssignmentContext?.assignmentId||'',
      taskCode:youTeachAssignmentContext?.taskCode||'',
      launchPurpose:youTeachAssignmentContext?.purpose||''
    });
    modelStatus.textContent=youTeachAssignmentContext
      ?(youTeachIdentity?.nickname||'Student')+' · '+(youTeachAssignmentContext.taskCode||'COG assignment')+' · practice'
      :(youTeachIdentity?.nickname||sessionStudentName||runnerSessionId)+' · Free mode';
    return sessionData;
  })
  .catch(err=>{
    console.error('Verb Runner monitor presence failed',err);
    sessionApi=null;
    sessionData=null;
    modelStatus.textContent=launchToken
      ?'YouTeach credential expired · reopen Verb Runner from YouTeach'
      :(sessionCode?'Session unavailable · local mode':modelStatus.textContent);
    return null;
  });



function formatTime(ms){
  const total=Math.max(0,Math.round(ms));
  const minutes=Math.floor(total/60000);
  const seconds=Math.floor((total%60000)/1000);
  const millis=total%1000;
  return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(millis).padStart(3,'0')}`;
}

function showNotice(text,kind='info'){
  gameNotice.textContent=text;
  gameNotice.className='game-notice show '+kind;
  noticeTimer=.9;
}

function updateHud(){
  if(!runState)return;
  streakValue.textContent=String(runState.streak);
  progressValue.textContent=`${runState.completed} / ${totalChallenges}`;
  momentumValue.textContent=`${runState.momentum}%`;
  momentumFill.style.width=`${runState.momentum}%`;
  if(sessionData){
    sessionUpdate({
      progress:runState.completed,
      total:totalChallenges,
      momentum:runState.momentum,
      streak:runState.streak,
      correct:runState.correct,
      grammarErrors:runState.grammarErrors,
      obstacleHits:runState.obstacleHits
    }).catch(()=>{});
  }
}

function appendSentencePrompt(raw,timeExpressions=[]){
  if(!sentenceText)return;
  sentenceText.replaceChildren();
  const text=String(raw||'___');
  const expressions=[...new Set((timeExpressions||[]).filter(Boolean))];
  const lower=text.toLowerCase();
  let cursor=0;

  while(cursor<text.length){
    let bestIndex=text.indexOf('___',cursor);
    let bestToken='___';
    let isBlank=bestIndex>=0;

    for(const expression of expressions){
      const index=lower.indexOf(String(expression).toLowerCase(),cursor);
      if(index>=0&&(bestIndex<0||index<bestIndex)){
        bestIndex=index;
        bestToken=expression;
        isBlank=false;
      }
    }

    if(bestIndex<0){
      sentenceText.append(document.createTextNode(text.slice(cursor)));
      break;
    }

    if(bestIndex>cursor){
      sentenceText.append(document.createTextNode(text.slice(cursor,bestIndex)));
    }

    if(isBlank){
      const blank=document.createElement('span');
      blank.className='sentence-blank';
      blank.textContent='___';
      sentenceText.append(blank);
      cursor=bestIndex+3;
    }else{
      const mark=document.createElement('mark');
      mark.className='time-expression';
      mark.textContent=text.slice(bestIndex,bestIndex+bestToken.length);
      sentenceText.append(mark);
      cursor=bestIndex+bestToken.length;
    }
  }
}

function fitSentencePrompt(){
  if(!sentenceText||!sentenceChallenge||!isTextRace()||sentenceChallenge.hidden)return;

  sentenceText.style.whiteSpace='nowrap';
  sentenceText.style.fontSize='';
  sentenceText.style.lineHeight='1.04';
  sentenceText.style.overflow='visible';
  sentenceText.style.textOverflow='clip';

  const maxSize=IS_MOBILE?30:42;
  const oneLineMin=IS_MOBILE?17:19;
  let size=maxSize;
  sentenceText.style.fontSize=size+'px';

  while(size>oneLineMin&&sentenceText.scrollWidth>sentenceText.clientWidth){
    size-=1;
    sentenceText.style.fontSize=size+'px';
  }

  const needsWrap=currentLevel===4||sentenceText.scrollWidth>sentenceText.clientWidth;
  if(needsWrap){
    sentenceText.style.whiteSpace='normal';
    sentenceText.style.lineHeight='1.12';
    size=Math.min(size,currentLevel===4?(IS_MOBILE?22:30):(IS_MOBILE?24:32));
    sentenceText.style.fontSize=size+'px';
  }
}

function fitPrincipalPartText(){
  document.querySelectorAll('[data-slot] b').forEach(label=>{
    const part=label.closest('.part');
    if(!part)return;
    label.style.fontSize='';
    label.style.whiteSpace='nowrap';
    label.style.lineHeight='';
    if(part.classList.contains('blank'))return;

    const available=Math.max(42,part.clientWidth-12);
    let size=parseFloat(getComputedStyle(label).fontSize)||36;
    const minimum=window.innerWidth<=640?11:13;
    while(label.scrollWidth>available&&size>minimum){
      size-=1;
      label.style.fontSize=size+'px';
    }
    if(label.scrollWidth>available){
      label.style.whiteSpace='normal';
      label.style.lineHeight='.95';
    }
  });
}

function renderChallenge(){
  ensureChallengeAvailable();
  currentChallenge=challenges[challengeIndex];
  if(!currentChallenge)return;
  if(challengeNumber)challengeNumber.textContent='';

  if(isTextRace()){
    if(principalParts)principalParts.hidden=true;
    if(sentenceChallenge)sentenceChallenge.hidden=false;
    if(taskInstruction&&currentLevel===5){
      taskInstruction.textContent=difficulty.name==='easy'
        ?'Use the concept clue, then solve the mixed challenge'
        :difficulty.name==='hard'
          ?'Everything counts · read the whole context before choosing'
          :'Choose the option that makes the whole context work';
    }
    appendSentencePrompt(
      currentChallenge.text,
      currentLevel===2?currentChallenge.timeExpressions:[]
    );
    if(sentenceCue){
      sentenceCue.textContent=String(
        currentLevel===5
          ?currentChallenge.focus
          :currentLevel===4
            ?currentChallenge.focus
            :currentLevel===3
            ?currentChallenge.grammarLabel
            :(currentChallenge.cue||currentChallenge.base||'')
      ).toUpperCase();
    }
    if(sentenceCueLabel)sentenceCueLabel.textContent=(currentLevel===4||currentLevel===5)?'FOCUS':(currentLevel===3?'GRAMMAR':'VERB');
    const cueBadge=sentenceCue?.closest('small');
    if(cueBadge)cueBadge.hidden=difficulty.name!=='easy';
    requestAnimationFrame(fitSentencePrompt);
    if(sessionData){
      const easyHint=difficulty.name==='easy'
        ?' ['+String(currentLevel===5?currentChallenge.focus:(currentLevel===4?currentChallenge.focus:(currentLevel===3?currentChallenge.grammarLabel:(currentChallenge.cue||'')))).toUpperCase()+']'
        :'';
      sessionUpdate({
        level:currentLevel,
        challenge:challengeIndex+1,
        challengeLabel:String(currentChallenge.text||'')+easyHint
      }).catch(()=>{});
    }
    return;
  }

  if(principalParts)principalParts.hidden=false;
  if(sentenceChallenge)sentenceChallenge.hidden=true;
  if(taskInstruction)taskInstruction.textContent='Collect the correct verb form';
  document.querySelectorAll('[data-slot]').forEach((el,index)=>{
    const value=currentChallenge.slots[index];
    el.classList.remove('feedback-correct','feedback-wrong','long-form','very-long-form');
    const display=value?String(value).toUpperCase():'?';
    el.querySelector('b').textContent=display;
    el.classList.toggle('blank',value===null);
    if(value&&display.length>=11)el.classList.add('very-long-form');
    else if(value&&display.length>=8)el.classList.add('long-form');
  });
  requestAnimationFrame(fitPrincipalPartText);
  if(sessionData){
    const known=currentChallenge.slots.map(v=>v?String(v).toUpperCase():'?').join(' · ');
    sessionUpdate({
      challenge:challengeIndex+1,
      challengeLabel:known
    }).catch(()=>{});
  }
}

function chooseBalancedBlankIndex(base){
  const previous=lastBlankByVerb.get(base);
  const minimum=Math.min(...blankUsage);
  let candidates=[0,1,2].filter(i=>blankUsage[i]<=minimum+1&&i!==previous);
  if(!candidates.length)candidates=[0,1,2].filter(i=>i!==previous);
  if(!candidates.length)candidates=[0,1,2];

  candidates.sort((a,b)=>blankUsage[a]-blankUsage[b]);
  const bestUsage=blankUsage[candidates[0]];
  const best=candidates.filter(i=>blankUsage[i]===bestUsage);
  const picked=best[Math.floor(Math.random()*best.length)];

  blankUsage[picked]+=1;
  lastBlankByVerb.set(base,picked);
  return picked;
}

function makeChallengeFromVerb(verb){
  const blankIndex=chooseBalancedBlankIndex(verb.forms[0]);
  let firstRandom=true;
  const controlledRandom=()=>{
    if(firstRandom){
      firstRandom=false;
      return (blankIndex+.35)/3;
    }
    return Math.random();
  };

  return window.VerbRunnerChallenge.createChallenge(verb,{
    random:controlledRandom,
    difficulty:difficulty.name,
    distractorCount:gameSettings.distractors
  });
}

function refillVerbDeck(){
  verbDeck=window.VerbRunnerChallenge.shuffled([...(window.VerbRunnerBank?.VERBS||[])]);
}

function makeSentenceChallenge(template){
  return window.VerbRunnerSentenceBank.createChallenge(template,{
    difficulty:difficulty.name,
    distractorCount:gameSettings.distractors
  });
}

function refillSentenceDeck(){
  sentenceDeck=window.VerbRunnerSentenceBank.shuffled([...(window.VerbRunnerSentenceBank?.SENTENCES||[])]);
}

function makeTimeClueChallenge(template){
  return window.VerbRunnerTimeCluesBank.createChallenge(template,{
    difficulty:difficulty.name,
    distractorCount:2
  });
}

function refillTimeClueDeck(){
  timeClueDeck=window.VerbRunnerTimeCluesBank.shuffled(
    (window.VerbRunnerTimeCluesBank?.ITEMS||[]).filter(item=>item.tier===difficulty.name)
  );
}

function makePerfectRaceChallenge(template){
  return window.VerbRunnerPerfectRaceBank.createChallenge(template,{
    difficulty:difficulty.name,
    distractorCount:2
  });
}

function refillPerfectRaceDeck(){
  perfectRaceDeck=window.VerbRunnerPerfectRaceBank.shuffled(
    (window.VerbRunnerPerfectRaceBank?.ITEMS||[]).filter(item=>item.tier===difficulty.name)
  );
}

function makeFinalPrincipalChallenge(verb){
  // Reuse Verb Runner's original challenge generator and balanced blank logic.
  // Final Race changes only the verb/question, not the exercise format.
  const baseChallenge=makeChallengeFromVerb(verb);
  return {
    ...baseChallenge,
    level:5,
    mode:'final-race',
    focus:'PRINCIPAL PARTS',
    finalCategory:'principal-parts',
    correctAnswers:[baseChallenge.correctAnswer],
    distractors:[...(baseChallenge.distractors||[])].slice(0,2)
  };
}

function makeFinalSentenceChallenge(template){
  const challenge=window.VerbRunnerSentenceBank.createChallenge(template,{
    difficulty:difficulty.name,
    distractorCount:2
  });
  return {...challenge,level:5,mode:'final-race',focus:'CONTEXT + VERB FORM',finalCategory:'tense-context'};
}

function makeFinalTimeClueChallenge(template){
  const challenge=window.VerbRunnerTimeCluesBank.createChallenge(template,{
    difficulty:difficulty.name,
    distractorCount:2
  });
  return {...challenge,level:5,mode:'final-race',focus:'TIME RELATIONSHIP',finalCategory:'time-clue'};
}

function makeFinalPerfectChallenge(template){
  const challenge=window.VerbRunnerPerfectRaceBank.createChallenge(template,{
    difficulty:difficulty.name,
    distractorCount:2
  });
  return {...challenge,level:5,mode:'final-race',finalCategory:'perfect'};
}

function buildFinalRaceChallenges(){
  const randomPick=(values,count)=>window.VerbRunnerFinalRaceBank.shuffled([...values]).slice(0,count);
  const combo=window.VerbRunnerFinalRaceBank.buildComboRound(18,{difficulty:difficulty.name});
  const verbs=randomPick(window.VerbRunnerBank?.VERBS||[],3).map(makeFinalPrincipalChallenge);
  const sentences=randomPick(window.VerbRunnerSentenceBank?.SENTENCES||[],3).map(makeFinalSentenceChallenge);
  const timeClues=randomPick(
    (window.VerbRunnerTimeCluesBank?.ITEMS||[]).filter(item=>item.tier===difficulty.name),3
  ).map(makeFinalTimeClueChallenge);
  const perfect=randomPick(
    (window.VerbRunnerPerfectRaceBank?.ITEMS||[]).filter(item=>item.tier===difficulty.name),3
  ).map(makeFinalPerfectChallenge);
  return window.VerbRunnerFinalRaceBank.shuffled([
    ...combo,...verbs,...sentences,...timeClues,...perfect
  ]);
}

function makeFinalRaceExtraChallenge(){
  const combo=window.VerbRunnerFinalRaceBank.buildComboRound(1,{difficulty:difficulty.name})[0];
  return combo||null;
}

function ensureChallengeAvailable(){
  while(challengeIndex>=challenges.length){
    if(currentLevel===5){
      const nextFinal=makeFinalRaceExtraChallenge();
      if(!nextFinal)break;
      challenges.push(nextFinal);
      continue;
    }
    if(currentLevel===4){
      if(!perfectRaceDeck.length)refillPerfectRaceDeck();
      const nextPerfect=perfectRaceDeck.shift();
      if(!nextPerfect)break;
      challenges.push(makePerfectRaceChallenge(nextPerfect));
      continue;
    }
    if(currentLevel===3){
      if(!timeClueDeck.length)refillTimeClueDeck();
      const nextTimeClue=timeClueDeck.shift();
      if(!nextTimeClue)break;
      challenges.push(makeTimeClueChallenge(nextTimeClue));
      continue;
    }
    if(currentLevel===2){
      if(!sentenceDeck.length)refillSentenceDeck();
      const nextSentence=sentenceDeck.shift();
      if(!nextSentence)break;
      challenges.push(makeSentenceChallenge(nextSentence));
      continue;
    }
    if(!verbDeck.length)refillVerbDeck();
    const nextVerb=verbDeck.shift();
    if(!nextVerb)break;
    challenges.push(makeChallengeFromVerb(nextVerb));
  }
}

function buildChallenges(){
  challenges=[];
  challengeIndex=0;

  if(currentLevel===5){
    applySentenceRunTuning();
    challenges=buildFinalRaceChallenges();
    finalRaceDeck=[];
    return;
  }

  if(currentLevel===4){
    applySentenceRunTuning();
    challenges=window.VerbRunnerPerfectRaceBank.buildRound(totalChallenges,{
      difficulty:difficulty.name,
      distractorCount:2
    });
    perfectRaceDeck=[];
    return;
  }

  if(currentLevel===3){
    applySentenceRunTuning();
    challenges=window.VerbRunnerTimeCluesBank.buildRound(totalChallenges,{
      difficulty:difficulty.name,
      distractorCount:2
    });
    timeClueDeck=[];
    return;
  }

  if(currentLevel===2){
    applySentenceRunTuning();
    challenges=window.VerbRunnerSentenceBank.buildRound(totalChallenges,{
      difficulty:difficulty.name,
      distractorCount:gameSettings.distractors
    });
    sentenceDeck=[];
    return;
  }

  refillVerbDeck();
  while(challenges.length<totalChallenges&&verbDeck.length){
    challenges.push(makeChallengeFromVerb(verbDeck.shift()));
  }
}

function roundedRectPath(ctx,x,y,w,h,r){
  const radius=Math.min(r,w*.5,h*.5);
  ctx.beginPath();
  ctx.moveTo(x+radius,y);
  ctx.arcTo(x+w,y,x+w,y+h,radius);
  ctx.arcTo(x+w,y+h,x,y+h,radius);
  ctx.arcTo(x,y+h,x,y,radius);
  ctx.arcTo(x,y,x+w,y,radius);
  ctx.closePath();
}

function makeAnswerTexture(word){
  const timeClue=isTextRace()&&currentLevel>=3&&currentLevel<=5;
  const c=document.createElement('canvas');
  c.width=timeClue?1280:1024;
  c.height=timeClue?480:360;
  const ctx=c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);

  ctx.save();
  ctx.shadowColor='rgba(40,220,255,.95)';
  ctx.shadowBlur=timeClue?38:30;
  roundedRectPath(ctx,34,34,c.width-68,c.height-68,timeClue?58:48);
  ctx.fillStyle='#0a315f';
  ctx.fill();
  ctx.restore();

  roundedRectPath(ctx,34,34,c.width-68,c.height-68,timeClue?58:48);
  const grad=ctx.createLinearGradient(0,36,0,c.height-36);
  grad.addColorStop(0,'#185b98');
  grad.addColorStop(.42,'#0c4278');
  grad.addColorStop(1,'#082a55');
  ctx.fillStyle=grad;
  ctx.fill();

  ctx.lineWidth=timeClue?20:18;
  ctx.strokeStyle='#45ddff';
  ctx.stroke();

  roundedRectPath(ctx,54,54,c.width-108,c.height-108,timeClue?42:35);
  ctx.lineWidth=5;
  ctx.strokeStyle='rgba(218,249,255,.92)';
  ctx.stroke();

  const text=String(word).toUpperCase();
  const words=text.split(/\s+/).filter(Boolean);

  function balancedLines(lineCount){
    if(lineCount<=1||words.length<=1)return [text];
    let best=null;
    if(lineCount===2){
      for(let a=1;a<words.length;a++){
        const lines=[words.slice(0,a).join(' '),words.slice(a).join(' ')];
        const lengths=lines.map(x=>x.length);
        const score=Math.max(...lengths)+(Math.max(...lengths)-Math.min(...lengths))*.45;
        if(!best||score<best.score)best={lines,score};
      }
    }else{
      for(let a=1;a<words.length-1;a++){
        for(let b=a+1;b<words.length;b++){
          const lines=[
            words.slice(0,a).join(' '),
            words.slice(a,b).join(' '),
            words.slice(b).join(' ')
          ];
          const lengths=lines.map(x=>x.length);
          const score=Math.max(...lengths)+(Math.max(...lengths)-Math.min(...lengths))*.38;
          if(!best||score<best.score)best={lines,score};
        }
      }
    }
    return best?.lines||[text];
  }

  const desiredLines=timeClue
    ?(text.length>35&&words.length>=3?3:(text.length>18?2:1))
    :(text.length>21?2:1);
  const lines=balancedLines(desiredLines);

  let fontSize=timeClue
    ?(lines.length===3?70:(lines.length===2?86:116))
    :(lines.length>1?82:112);
  const minFont=timeClue?44:34;
  const maxWidth=c.width-(timeClue?180:145);
  ctx.font='900 '+fontSize+'px Arial';
  while(fontSize>minFont&&Math.max(...lines.map(line=>ctx.measureText(line).width))>maxWidth){
    fontSize-=4;
    ctx.font='900 '+fontSize+'px Arial';
  }

  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.shadowColor='rgba(0,25,52,.95)';
  ctx.shadowBlur=timeClue?12:15;
  ctx.lineWidth=timeClue?11:9;
  ctx.strokeStyle='rgba(0,28,58,.95)';
  ctx.fillStyle='#ffffff';
  const lineHeight=fontSize*(timeClue?.90:.94);
  lines.forEach((line,index)=>{
    const y=c.height/2+5+(index-(lines.length-1)/2)*lineHeight;
    ctx.strokeText(line,c.width/2,y);
    ctx.fillText(line,c.width/2,y);
  });

  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.minFilter=THREE.LinearFilter;
  return tex;
}

const answers=[];
let lastCorrectLane=-1;

function clearAnswerLaneAtSpawn(laneIndex,spawnZ){
  if(!Number.isInteger(laneIndex))return;
  for(let i=obstacles.length-1;i>=0;i--){
    const obstacle=obstacles[i];
    if(!obstacle?.mesh)continue;
    const closeZ=Math.abs(obstacle.mesh.position.z-spawnZ)<18;
    const closeLane=obstacle.kind==='pedestrian'
      ?Math.abs(obstacle.mesh.position.x-lanes[laneIndex])<1.8
      :obstacle.laneIndex===laneIndex;
    if(!closeZ||!closeLane)continue;
    obstacle.mixer?.stopAllAction?.();
    scene.remove(obstacle.mesh);
    obstacles.splice(i,1);
  }
}

function spawnAnswer(item,forcedLane=null,forceSpawn=false,lockLane=false){
  if(!gameStarted||gamePaused||victoryMode)return false;

  const spawnZ=isPrincipalPartsChallenge()?ANSWER_SPAWN_Z:(currentLevel===3?(IS_MOBILE?-62:-84):((currentLevel===4||currentLevel===5)?(IS_MOBILE?-58:-80):ANSWER_SPAWN_Z));
  if(lockLane&&Number.isInteger(forcedLane)){
    clearAnswerLaneAtSpawn(forcedLane,spawnZ);
  }

  const pedestrianTooClose=obstacles.some(o=>
    o?.kind==='pedestrian' &&
    o?.mesh &&
    Math.abs(o.mesh.position.z-spawnZ)<18
  );
  if(pedestrianTooClose&&!forceSpawn&&!lockLane)return false;

  let heightMode=Math.random()<.5?'low':'high';
  const nearSpawn=obstacles.filter(o=>o?.mesh);
  const blockedByObstacle=new Set(
    nearSpawn
      .filter(o=>{
        const dz=Math.abs(o.mesh.position.z-spawnZ);
        if(heightMode==='high'&&o.type==='slide')return dz<28;
        return dz<12;
      })
      .map(o=>o.laneIndex)
  );

  let availableLanes=(forceSpawn||lockLane)
    ?[0,1,2]
    :[0,1,2].filter(i=>!blockedByObstacle.has(i));

  if(!availableLanes.length&&heightMode==='high'){
    heightMode='low';
    const lowBlocked=new Set(
      nearSpawn.filter(o=>Math.abs(o.mesh.position.z-spawnZ)<12).map(o=>o.laneIndex)
    );
    availableLanes=(forceSpawn||lockLane)
      ?[0,1,2]
      :[0,1,2].filter(i=>!lowBlocked.has(i));
  }

  if(!availableLanes.length)return false;

  // Do not repeat the correct-answer lane when another lane is available,
  // but never let that preference stop the answer chain.
  if(item.correct&&lastCorrectLane>=0&&!lockLane){
    const correctAlternates=availableLanes.filter(i=>i!==lastCorrectLane);
    if(correctAlternates.length)availableLanes=correctAlternates;
  }

  // Exactly three choices means one answer per lane. In that mode the assigned
  // lane is authoritative; otherwise it remains a safe-layout preference.
  const useForced=Number.isInteger(forcedLane)&&(lockLane||availableLanes.includes(forcedLane));
  let laneIndex=useForced
    ?forcedLane
    :availableLanes[Math.floor(Math.random()*availableLanes.length)];

  if(!useForced&&answers.length&&answers.at(-1)?.laneIndex===laneIndex&&availableLanes.length>1){
    const alternates=availableLanes.filter(i=>i!==laneIndex);
    laneIndex=alternates[Math.floor(Math.random()*alternates.length)];
  }

  if(item.correct)lastCorrectLane=laneIndex;

  const group=new THREE.Group();
  const wideTextAnswer=isTextRace()&&currentLevel>=3&&currentLevel<=5;
  const cardW=wideTextAnswer?(IS_MOBILE?4.20:3.65):(IS_MOBILE?3.70:3.05);
  const cardH=wideTextAnswer?(IS_MOBILE?1.58:1.38):(IS_MOBILE?1.34:1.10);
  const glow=new THREE.Mesh(
    new THREE.PlaneGeometry(cardW+0.28,cardH+0.18),
    new THREE.MeshBasicMaterial({color:0x45ddff,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false,fog:false,toneMapped:false})
  );
  glow.scale.set(1.08,1.12,1);
  group.add(glow);

  const panel=new THREE.Mesh(
    new THREE.PlaneGeometry(cardW,cardH),
    new THREE.MeshBasicMaterial({map:makeAnswerTexture(item.value),transparent:true,side:THREE.DoubleSide,fog:false,toneMapped:false,depthWrite:false})
  );
  panel.position.z=.02;
  group.add(panel);

  const answerY=heightMode==='low'?1.15:(IS_MOBILE?2.78:3.15);
  group.position.set(lanes[laneIndex],answerY,spawnZ);
  scene.add(group);
  answers.push({mesh:group,laneIndex,item,resolved:false,heightMode});
  return true;
}

function clearAnswers(){
  for(const answer of answers){
    scene.remove(answer.mesh);
    answer.mesh.traverse?.(o=>{
      if(o.material?.map)o.material.map.dispose?.();
      o.material?.dispose?.();
      o.geometry?.dispose?.();
    });
  }
  answers.length=0;
  pendingAnswers=[];
  answerSpawnClock=0;
}

function launchChallengeChain(initialDelay=.42){
  clearAnswers();
  retryQueued=false;
  if(!currentChallenge)return;

  initialDelay=sentenceInitialDelay(initialDelay);
  const sequence=currentLevel===5
    ?window.VerbRunnerFinalRaceBank.buildAnswerSequence(currentChallenge)
    :currentLevel===4
      ?window.VerbRunnerPerfectRaceBank.buildAnswerSequence(currentChallenge,{
          distractorCount:2
        })
    :currentLevel===3
      ?window.VerbRunnerTimeCluesBank.buildAnswerSequence(currentChallenge,{
          distractorCount:2
        })
      :currentLevel===2
      ?window.VerbRunnerSentenceBank.buildAnswerSequence(currentChallenge,{
          distractorCount:gameSettings.distractors
        })
      :window.VerbRunnerChallenge.buildAnswerSequence(currentChallenge,{
          distractorCount:gameSettings.distractors
        });

  let correctIndex=sequence.findIndex(item=>item.correct);
  if(correctIndex<0){
    const fallback=currentChallenge.correctAnswer??currentChallenge.correctAnswers?.[0];
    if(fallback!=null){
      sequence.push({value:fallback,correct:true});
      correctIndex=sequence.length-1;
    }
  }
  if(!sequence.length||correctIndex<0){
    console.error('Answer sequence has no correct option',currentChallenge);
    setTimeout(()=>{
      if(gameStarted&&!gamePaused&&!victoryMode){
        renderChallenge();
        launchChallengeChain(.35);
      }
    },350);
    return;
  }
  const lastIndex=sequence.length-1;
  const recentLastCount=recentCorrectPositions.filter(i=>i===lastIndex).length;

  if(correctIndex===lastIndex&&(lastCorrectAnswerIndex===lastIndex||recentLastCount>=1)){
    const candidates=sequence
      .map((item,index)=>({item,index}))
      .filter(x=>!x.item.correct&&x.index!==lastIndex);
    if(candidates.length){
      const swapWith=candidates[Math.floor(Math.random()*candidates.length)].index;
      [sequence[correctIndex],sequence[swapWith]]=[sequence[swapWith],sequence[correctIndex]];
      correctIndex=swapWith;
    }
  }

  window.VerbRunnerPronunciation?.preloadPronunciation(sequence[correctIndex].value,currentChallenge);

  lastCorrectAnswerIndex=correctIndex;
  recentCorrectPositions.push(correctIndex);
  if(recentCorrectPositions.length>4)recentCorrectPositions.shift();

  const lockOnePerLane=sequence.length===3;
  let choiceLanes=null;

  if(lockOnePerLane){
    const correctSequenceIndex=sequence.findIndex(item=>item.correct);
    const correctLaneChoices=[0,1,2].filter(lane=>lane!==lastCorrectLane);
    const correctLane=correctLaneChoices[Math.floor(Math.random()*correctLaneChoices.length)];
    const otherLanes=[0,1,2].filter(lane=>lane!==correctLane).sort(()=>Math.random()-.5);

    choiceLanes=new Array(3);
    choiceLanes[correctSequenceIndex]=correctLane;

    let otherIndex=0;
    for(let index=0;index<sequence.length;index++){
      if(index===correctSequenceIndex)continue;
      choiceLanes[index]=otherLanes[otherIndex++];
    }
  }

  pendingAnswers=sequence.map((item,index)=>({
    item,
    forcedLane:choiceLanes?.[index]??null,
    lockLane:lockOnePerLane,
    at:initialDelay+index*gameSettings.answerSpacing,
    blockedFor:0
  }));
  answerSpawnClock=0;

  if(gameSettings.preview){
    showNotice('LOOK FOR: '+String(currentChallenge.correctAnswer).toUpperCase(),'info');
  }
}

function updateAnswerSpawns(dt){
  if(answerResolutionActive||!pendingAnswers.length)return;
  answerSpawnClock+=dt;
  while(pendingAnswers.length&&answerSpawnClock>=pendingAnswers[0].at){
    const next=pendingAnswers[0];

    if(spawnAnswer(next.item,next.forcedLane,false,next.lockLane)){
      pendingAnswers.shift();
      continue;
    }

    next.blockedFor=(next.blockedFor||0)+dt;

    // Answers are more important than scenery. If the spawn corridor has
    // remained blocked for a short moment, force a safe recovery spawn so
    // the player can never run forever waiting for the next choice.
    if(next.blockedFor>=1.25&&spawnAnswer(next.item,next.forcedLane,true,next.lockLane)){
      pendingAnswers.shift();
      continue;
    }

    answerSpawnClock=Math.min(answerSpawnClock,next.at);
    break;
  }
}

function applyRunEvent(type){
  if(!runState)return;
  const next={...runState};
  if(type==='correct'){
    next.completed=Math.min(totalChallenges,next.completed+1);
    next.correct+=1;
    next.streak+=1;
    next.bestStreak=Math.max(next.bestStreak,next.streak);
    next.momentum=Math.min(100,next.momentum+gameSettings.momentumCorrect);
  }else if(type==='grammar-error'){
    next.grammarErrors+=1;
    next.streak=0;
    next.completed=Math.max(0,next.completed-gameSettings.penalty);
  }else if(type==='obstacle-hit'){
    next.obstacleHits+=1;
    next.completed=Math.max(0,next.completed-gameSettings.penalty);
  }
  runState=next;
  updateHud();
}

function disposeAnswer(answer){
  if(!answer)return;
  scene.remove(answer.mesh);
  answer.mesh?.traverse?.(o=>{
    if(o.material?.map)o.material.map.dispose?.();
    o.material?.dispose?.();
    o.geometry?.dispose?.();
  });
  const idx=answers.indexOf(answer);
  if(idx>=0)answers.splice(idx,1);
}

function answerScreenPoint(answer){
  const p=new THREE.Vector3();
  answer.mesh.getWorldPosition(p);
  p.project(camera);
  const rect=canvas.getBoundingClientRect();
  return {
    x:rect.left+(p.x*.5+.5)*rect.width,
    y:rect.top+(-p.y*.5+.5)*rect.height
  };
}

function waitMs(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

async function animateAnswerToBlank(answer,correct,startOverride=null){
  const sentenceMode=isTextRace();
  const blankPart=sentenceMode
    ?document.querySelector('.sentence-blank')
    :document.querySelector('.part.blank');
  const blankText=sentenceMode?blankPart:blankPart?.querySelector('b');
  if(!blankPart||!blankText)return;

  const start=startOverride||answerScreenPoint(answer);
  const targetRect=blankText.getBoundingClientRect();
  const target={
    x:targetRect.left+targetRect.width/2,
    y:targetRect.top+targetRect.height/2
  };

  const flyer=document.createElement('div');
  flyer.className='answer-flight';
  if(isTextRace()&&currentLevel>=3&&currentLevel<=5)flyer.classList.add('time-clue-flight');
  flyer.textContent=String(answer.item.value).toUpperCase();
  flyer.style.left=start.x+'px';
  flyer.style.top=start.y+'px';
  document.body.appendChild(flyer);

  const finalBg=correct?'#178b4c':'#b8243e';
  const finalBorder=correct?'#66f0a0':'#ff7185';

  // Verb Runner learning-focus animation:
  // correct form moves to the center, grows, stays readable, then flies into the blank.
  if(correct&&!sentenceMode){
    const center={
      x:window.innerWidth/2,
      y:Math.max(150,window.innerHeight*.42)
    };

    const shade=document.createElement('div');
    shade.className='answer-focus-backdrop';
    document.body.appendChild(shade);
    requestAnimationFrame(()=>shade.classList.add('show'));

    flyer.classList.add('learning-focus');

    if(flyer.animate){
      const toCenter=flyer.animate([
        {
          left:start.x+'px',
          top:start.y+'px',
          transform:'translate(-50%,-50%) scale(.88)',
          background:'#123b56',
          borderColor:'#ffffff',
          opacity:1
        },
        {
          left:center.x+'px',
          top:center.y+'px',
          transform:'translate(-50%,-50%) scale(1.72)',
          background:'#159447',
          borderColor:'#98ffc0',
          boxShadow:'0 18px 45px rgba(0,0,0,.34),0 0 42px rgba(75,255,137,.68)',
          opacity:1
        }
      ],{duration:330,easing:'cubic-bezier(.18,.86,.24,1)',fill:'forwards'});
      await toCenter.finished.catch(()=>{});
    }else{
      flyer.style.left=center.x+'px';
      flyer.style.top=center.y+'px';
      flyer.style.transform='translate(-50%,-50%) scale(1.72)';
      flyer.style.background='#159447';
      flyer.style.borderColor='#98ffc0';
      await waitMs(330);
    }

    playSfx('correct');

    // Hold the verb long enough for the student to actually read and register it.
    await waitMs(720);

    if(flyer.animate){
      const toBlank=flyer.animate([
        {
          left:center.x+'px',
          top:center.y+'px',
          transform:'translate(-50%,-50%) scale(1.72)',
          background:'#159447',
          borderColor:'#98ffc0',
          boxShadow:'0 18px 45px rgba(0,0,0,.34),0 0 42px rgba(75,255,137,.68)',
          opacity:1
        },
        {
          offset:.82,
          left:target.x+'px',
          top:(target.y+4)+'px',
          transform:'translate(-50%,-50%) scale(1.10)',
          background:'#178b4c',
          borderColor:'#66f0a0',
          opacity:1
        },
        {
          left:target.x+'px',
          top:target.y+'px',
          transform:'translate(-50%,-50%) scale(1)',
          background:'#178b4c',
          borderColor:'#66f0a0',
          opacity:1
        }
      ],{duration:500,easing:'cubic-bezier(.22,.72,.18,1)',fill:'forwards'});
      await toBlank.finished.catch(()=>{});
    }else{
      flyer.style.left=target.x+'px';
      flyer.style.top=target.y+'px';
      flyer.style.transform='translate(-50%,-50%) scale(1)';
      await waitMs(500);
    }

    shade.classList.remove('show');
    setTimeout(()=>shade.remove(),180);
  }else{
    const keyframes=[
      {
        left:start.x+'px',
        top:start.y+'px',
        transform:'translate(-50%,-50%) scale(.9)',
        background:'#123b56',
        borderColor:'#ffffff',
        opacity:1
      },
      {
        offset:.72,
        left:target.x+'px',
        top:(target.y+5)+'px',
        transform:'translate(-50%,-50%) scale(1.18)',
        background:finalBg,
        borderColor:finalBorder,
        opacity:1
      },
      {
        left:target.x+'px',
        top:target.y+'px',
        transform:'translate(-50%,-50%) scale(1)',
        background:finalBg,
        borderColor:finalBorder,
        opacity:1
      }
    ];

    if(flyer.animate){
      const anim=flyer.animate(keyframes,{duration:560,easing:'cubic-bezier(.2,.8,.22,1)',fill:'forwards'});
      await anim.finished.catch(()=>{});
    }else{
      flyer.style.left=target.x+'px';
      flyer.style.top=target.y+'px';
      flyer.style.background=finalBg;
      await waitMs(560);
    }
  }

  blankPart.classList.remove('blank');
  blankPart.classList.add(correct?'feedback-correct':'feedback-wrong');
  blankText.textContent=String(answer.item.value).toUpperCase();
  flyer.remove();

  await waitMs(correct?330:420);

  if(!correct){
    blankPart.classList.remove('feedback-wrong');
    if(!sentenceMode)blankPart.classList.add('blank');
    blankText.textContent=sentenceMode?'___':'?';
  }
}

function escapeReportHtml(value){
  return String(value??'').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));
}

function reportQuestionText(challenge=currentChallenge){
  if(!challenge)return 'Unknown challenge';
  if(challenge.text)return String(challenge.text).replace(/___/g,'_____');
  if(Array.isArray(challenge.slots)){
    return challenge.slots
      .map(value=>value==null?'_____':String(value).toUpperCase())
      .join(' · ');
  }
  return String(challenge.base||challenge.cue||'Verb challenge').toUpperCase();
}

function reportCorrectAnswer(challenge=currentChallenge){
  const answers=challenge?.correctAnswers?.length
    ?challenge.correctAnswers
    :[challenge?.correctAnswer].filter(Boolean);
  return answers.map(value=>String(value)).join(' / ')||'—';
}

function updateErrorReport(){
  const count=mistakeLog.length;
  if(errorReportCount)errorReportCount.textContent=String(count);
  if(errorReportSummary)errorReportSummary.textContent=count+' '+(count===1?'ERROR':'ERRORS');
  if(!errorReportList)return;

  if(!count){
    errorReportList.innerHTML='<div class="error-report-empty">No mistakes yet.</div>';
    return;
  }

  errorReportList.innerHTML=mistakeLog.slice().reverse().map((entry,index)=>{
    const number=count-index;
    return `
      <article class="error-report-item">
        <div class="error-report-meta">
          <span>#${number} · ${escapeReportHtml(entry.race)}</span>
          <span>WRONG CHOICE</span>
        </div>
        <div class="error-report-question">${escapeReportHtml(entry.question)}</div>
        <div class="error-report-answer-grid">
          <div class="error-report-wrong">
            <span>YOU CHOSE</span>
            <b>${escapeReportHtml(entry.chosen)}</b>
          </div>
          <div class="error-report-correct">
            <span>CORRECT</span>
            <b>${escapeReportHtml(entry.correct)}</b>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function recordMistake({type='wrong',chosen=''}={}){
  mistakeLog.push({
    type,
    race:raceLabel(),
    question:reportQuestionText(currentChallenge),
    chosen:String(chosen||''),
    correct:reportCorrectAnswer(currentChallenge)
  });
  updateErrorReport();
}

async function collectAnswer(answer){
  if(answer.resolved||answerResolutionActive)return;
  answer.resolved=true;
  answerResolutionActive=true;
  const item=answer.item;
  playSfx('select');
  if(sessionData){
    sessionUpdate({
      lastPrompt:reportQuestionText(currentChallenge),
      latestChoice:String(item.value||''),
      correctAnswer:reportCorrectAnswer(currentChallenge),
      latestResult:item.correct?'correct':'incorrect',
      lastAction:item.correct?'Selected correct answer':'Selected wrong answer',
      attempt:(Number(runState?.correct)||0)+(Number(runState?.grammarErrors)||0)+1,
      lastEventAt:Date.now()
    }).catch(()=>{});
  }

  if(item.correct){
    if(currentLevel!==1)playSfx('correct');
    window.VerbRunnerPronunciation?.playCorrectPronunciation(item.value,{
      enabled:sfxEnabled,
      volume:sfxVolume,
      context:currentChallenge
    });
    const startPoint=answerScreenPoint(answer);
    const selectedCopy={mesh:answer.mesh,item:answer.item};
    clearAnswers();
    await animateAnswerToBlank(selectedCopy,true,startPoint);
    applyRunEvent('correct');
    showNotice('CORRECT!','correct');
    challengeIndex++;

    if(runState.completed>=totalChallenges){
      answerResolutionActive=false;
      beginVictorySprint();
      return;
    }

    ensureChallengeAvailable();
    renderChallenge();
    launchChallengeChain(.55);
    answerResolutionActive=false;
  }else{
    recordMistake({type:'wrong',chosen:item.value});
    const startPoint=answerScreenPoint(answer);
    const selectedCopy={mesh:answer.mesh,item:answer.item};
    disposeAnswer(answer);
    await animateAnswerToBlank(selectedCopy,false,startPoint);
    applyRunEvent('grammar-error');
    playSfx('wrong');
    showNotice(String(item.value).toUpperCase()+' — WRONG · −'+gameSettings.penalty+' ADVANCE','wrong');
    answerResolutionActive=false;
  }
}

function missedCorrectAnswer(){
  if(victoryMode)return;
  if(sessionData){
    sessionUpdate({
      lastPrompt:reportQuestionText(currentChallenge),
      latestChoice:'',
      correctAnswer:reportCorrectAnswer(currentChallenge),
      latestResult:'missed',
      lastAction:'Correct answer missed',
      attempt:(Number(runState?.correct)||0)+(Number(runState?.grammarErrors)||0)+1,
      lastEventAt:Date.now()
    }).catch(()=>{});
  }
  clearAnswers();

  if(challengeIndex>=challenges.length-1){
    if(currentLevel===5){
      const nextFinal=makeFinalRaceExtraChallenge();
      if(nextFinal)challenges.push(nextFinal);
    }else if(currentLevel===4){
      if(!perfectRaceDeck.length)refillPerfectRaceDeck();
      const nextPerfect=perfectRaceDeck.shift();
      if(nextPerfect)challenges.push(makePerfectRaceChallenge(nextPerfect));
    }else if(currentLevel===3){
      if(!timeClueDeck.length)refillTimeClueDeck();
      const nextTimeClue=timeClueDeck.shift();
      if(nextTimeClue)challenges.push(makeTimeClueChallenge(nextTimeClue));
    }else if(currentLevel===2){
      if(!sentenceDeck.length)refillSentenceDeck();
      const nextSentence=sentenceDeck.shift();
      if(nextSentence)challenges.push(makeSentenceChallenge(nextSentence));
    }else{
      if(!verbDeck.length)refillVerbDeck();
      const nextVerb=verbDeck.shift();
      if(nextVerb)challenges.push(makeChallengeFromVerb(nextVerb));
    }
  }

  const missed=challenges.splice(challengeIndex,1)[0];
  if(missed){
    if(isTextRace()){
      challenges.push(missed);
    }else{
      const verb=window.VerbRunnerBank?.findVerb?.(missed.base);
      challenges.push(verb?makeChallengeFromVerb(verb):missed);
    }
  }

  showNotice((currentLevel===5?'CORRECT ANSWER':(currentLevel===4?'CORRECT PERFECT FORM':(currentLevel===3?'CORRECT TIME CLUE':'CORRECT FORM')))+' MISSED · MOVED TO END','info');
  renderChallenge();
  launchChallengeChain(.6);
}

let pendingPauseAction=null;

function hidePauseSubpanels(){
  if(pauseRunnerPanel)pauseRunnerPanel.hidden=true;
  if(controlsPanel)controlsPanel.hidden=true;
  if(errorReportPanel)errorReportPanel.hidden=true;
}

function showPauseConfirmation(action){
  pendingPauseAction=action;
  if(!pauseConfirm)return;
  const restart=action==='restart';
  pauseConfirmTitle.textContent=restart?'RESTART THIS RACE?':'QUIT THIS RACE?';
  pauseConfirmText.textContent=restart
    ?'Your current progress will be lost and this race will start again.'
    :'Your current progress will be lost. You will return to the race menu.';
  confirmPauseAction.textContent=restart?'RESTART':'QUIT';
  pauseConfirm.hidden=false;
}

function hidePauseConfirmation(){
  pendingPauseAction=null;
  if(pauseConfirm)pauseConfirm.hidden=true;
}

function returnToRaceMenu(){
  stopMusic();
  gameStarted=false;
  gamePaused=false;
  victoryMode=false;
  answerResolutionActive=false;
  pauseOverlay.hidden=true;
  resultOverlay.hidden=true;
  pauseButton.classList.remove('is-paused'); pauseButton.setAttribute('aria-label','Pause game');
  hidePauseConfirmation();
  hidePauseSubpanels();
  clearAnswers();
  for(const o of obstacles.splice(0)){
    o.mixer?.stopAllAction?.();
    scene.remove(o.mesh);
  }
  picker.classList.remove('hidden');
  play('idle',.12);
  setLevelUI();
  modelStatus.textContent='Choose a race, runner and difficulty';
}

function restartCurrentRace(){
  hidePauseConfirmation();
  hidePauseSubpanels();
  pauseOverlay.hidden=true;
  resetRun();
  gameStarted=true;
  gamePaused=false;
  pauseButton.classList.remove('is-paused'); pauseButton.setAttribute('aria-label','Pause game');
  play('run',.10);
  playSfx('resume');
  startMusic();
  modelStatus.textContent=variants[selectedVariant].name+' robot · COASTAL VILLAGE';
  launchChallengeChain(gameSettings.preview?1.55:.55);
}


function sentenceHintFor(challenge){
  if(!challenge)return 'Look for time clues and decide when the action happens.';
  const clues=(challenge.timeExpressions||[]).filter(Boolean);
  const clueText=clues.length?' Time clue'+(clues.length>1?'s':'')+': '+clues.join(' + ')+'.':'';
  const hints={
    'present-simple':'Use Present Simple for routines, repeated actions, facts, and schedules. Look for words such as usually, every day, or always.',
    'past-simple':'Use Past Simple when the action is finished at a finished past time such as yesterday, last week, or two days ago.',
    'future-will':'Use will + base verb for a prediction, spontaneous decision, promise, or future statement when the context points forward.',
    'present-continuous':'Use am/is/are + -ing for an action happening now or a temporary situation around now.',
    'past-continuous':'Use was/were + -ing for an action that was in progress at a specific moment in the past.',
    'future-continuous':'Use will be + -ing for an action that will be in progress at a specific future time.',
    'present-perfect':'Use have/has + past participle for a result, experience, or completed action connected to now. Avoid it with a finished past-time expression.',
    'past-perfect':'Use had + past participle for an action completed before another past action or past reference point.',
    'future-perfect':'Use will have + past participle when the action will be completed by a future deadline.',
    'present-perfect-continuous':'Use have/has been + -ing when the sentence emphasizes an activity continuing up to now, its duration, or visible ongoing/recent effects. Compare: Perfect Simple (have learned) focuses more on result or achievement; Perfect Continuous (have been learning) focuses on the ongoing activity and its duration. Here, clues such as still, continuously, or has not stopped make the continuous form the better choice.',
    'past-perfect-continuous':'Use had been + -ing when an activity continued for a period before another past event, especially when duration or the ongoing process matters. Past Perfect Simple focuses more on a completed result; this exercise gives continuity clues so the continuous form is the intended choice.',
    'future-perfect-continuous':'Use will have been + -ing when an activity will have continued for a duration up to a future point. Future Perfect Simple focuses on what will be completed by that point; Future Perfect Continuous focuses on how long the activity will have been continuing.',
    'going-to':'Use am/is/are going to + base verb for a prior plan or a prediction based on present evidence.',
    'imperative':'Use the base form of the verb for a command or instruction. The subject you is normally omitted.',
    'modals':'After a modal such as can, could, may, might, must, should, or would, use the base form of the verb.'
  };
  return (hints[challenge.group]||'Identify the time reference, decide whether the action is completed or ongoing, and then choose the matching verb structure.')+clueText;
}

function timeClueHintFor(challenge){
  if(!challenge)return 'First identify the tense or grammar structure. Then choose the time expression that matches it.';
  const hints={
    'present-simple':'Present Simple usually matches routines, frequency, schedules, and repeated-time expressions such as every..., usually, or on Mondays.',
    'past-simple':'Past Simple needs a finished past time: yesterday, last..., ...ago, or a completed past date or event.',
    'future-will':'Future with will pairs with a future point or future clause such as tomorrow, next..., later, when..., or as soon as....',
    'present-continuous':'Present Continuous commonly matches now, right now, at the moment, currently, or a temporary period around now.',
    'past-continuous':'Past Continuous describes an action in progress at a past moment, often with at [time] yesterday, while..., or when another past event happened.',
    'future-continuous':'Future Continuous describes an action in progress at a specific future moment, such as this time tomorrow or at 10 tomorrow morning.',
    'present-perfect':'Present Perfect connects the past to now. Look for since, for, already, yet, ever, recently, so far, or unfinished time periods.',
    'past-perfect':'Past Perfect places one completed event before another past point. Look for before..., by the time..., or already in a past sequence.',
    'future-perfect':'Future Perfect looks toward a future deadline. The strongest clues are by..., before..., or by the time... plus a future reference.',
    'present-perfect-continuous':'Present Perfect Continuous emphasizes duration or ongoing activity up to now. Look especially for since, for, all morning, or for the past....',
    'past-perfect-continuous':'Past Perfect Continuous emphasizes how long an activity had continued before another past event. Look for duration + before/when a past event.',
    'future-perfect-continuous':'Future Perfect Continuous measures duration up to a future point. Look for by [future time] together with a duration such as for ten years.',
    'going-to':'Be going to describes a future plan or evidence-based prediction, so choose a genuinely future time expression.',
    'imperative':'Imperatives give instructions or commands. Choose the time expression that tells when, how long, or until when the instruction should be followed.',
    'modals':'Modals express obligation, advice, permission, possibility, or ability. Use the rest of the sentence to choose the time expression that makes that meaning and timing natural.'
  };
  return (challenge.grammarLabel||'This structure')+': '+(hints[challenge.group]||'Match the verb structure to the time relationship expressed by the clue.');
}

function perfectRaceHintFor(challenge){
  if(!challenge)return 'Ask two questions: is the context emphasizing a completed result, or the duration/process of an activity?';
  const group=String(challenge.group||'');
  const simple=group.endsWith('-simple');
  const period=group.startsWith('present-')?'present':(group.startsWith('past-')?'past':'future');
  const anchors={
    present:'Present Perfect connects the past to now.',
    past:'Past Perfect looks back from a later past point.',
    future:'Future Perfect looks forward to a future reference point.'
  };
  const contrast=simple
    ?'Choose Perfect Simple when the important idea is a completed result, a finished amount, a count, or what has been achieved.'
    :'Choose Perfect Continuous when the important idea is duration, repetition, an activity in progress, or evidence caused by that activity.';
  return anchors[period]+' '+contrast;
}

function finalRaceHintFor(challenge){
  if(!challenge)return 'Read the whole context before choosing. First locate the time reference, then decide what grammar relationship the sentence needs.';
  if(challenge.finalCategory==='principal-parts')return 'Identify which principal part is missing: base form, Simple Past, or Past Participle. Ignore tense clues because this item is testing the verb form itself.';
  if(challenge.finalCategory==='time-clue')return 'The verb is already fixed. Choose the time expression that is compatible with that tense, aspect, and reference point.';
  if(challenge.finalCategory==='perfect')return perfectRaceHintFor(challenge);
  if(challenge.finalCategory==='tense-context')return 'Use the entire context: when does the action happen, and is it a routine, completed event, action in progress, future event, or Perfect relationship?';
  return 'Mixed challenge: identify the time reference first, then decide whether the sentence emphasizes completion/result or duration/process. Check every part of the context before choosing.';
}

function updatePauseReadingCard(){
  const sentenceMode=isTextRace()&&currentChallenge;
  if(!pauseReadingCard)return;
  pauseReadingCard.hidden=!sentenceMode;
  if(!sentenceMode)return;

  if(pauseReadingMode){
    pauseReadingMode.textContent=currentLevel===5
      ?(difficulty.name==='hard'?'FINAL RACE · READ THE WHOLE CONTEXT':'FINAL RACE COACH')
      :currentLevel===4
        ?(difficulty.name==='hard'?'PERFECT RUNNING · COMPARE THE MEANING':'PERFECT RUNNING COACH')
        :currentLevel===3
          ?(difficulty.name==='hard'?'TIME CLUES · THINK IT THROUGH':'TIME CLUE COACH')
          :(difficulty.name==='hard'?'HARD MODE · TAKE YOUR TIME':'READ AT YOUR OWN PACE');
  }

  if(pauseSentenceText){
    pauseSentenceText.textContent=String(currentChallenge.text||'').replace(/___/g,'_____');
  }

  if(pauseHintText){
    pauseHintText.textContent=currentLevel===5
      ?finalRaceHintFor(currentChallenge)
      :currentLevel===4
        ?perfectRaceHintFor(currentChallenge)
        :currentLevel===3
          ?timeClueHintFor(currentChallenge)
          :sentenceHintFor(currentChallenge);
  }
}

function setPaused(next){
  if(!gameStarted||victoryMode)return;
  gamePaused=next;
  pauseOverlay.hidden=!next;
  if(pauseRaceTitle)pauseRaceTitle.textContent=raceLabel();
  if(next){
    setPlayerSpeedPercent(Math.round(playerSpeedMultiplier*100));
    hidePauseConfirmation();
    hidePauseSubpanels();
    updatePauseReadingCard();
    updateErrorReport();
    stopMusic();
    playSfx('pause');
  }else{
    if(musicEnabled)startMusic();
    playSfx('resume');
  }
  pauseButton.classList.toggle('is-paused',next); pauseButton.setAttribute('aria-label',next?'Resume game':'Pause game');
  modelStatus.textContent=next?'Paused':variants[selectedVariant].name+' robot · COASTAL VILLAGE';
  if(sessionData)sessionUpdate({status:next?'paused':'running'}).catch(()=>{});
}

function finishRun(){
  sessionRunFinished=true;
  stopMusic();
  playSfx('victory');
  gameStarted=false;
  victoryMode=false;
  victoryArmBlend=0;
  gamePaused=false;
  answerResolutionActive=false;
  lastCorrectAnswerIndex=-1;
  recentCorrectPositions=[];
  blankUsage=[0,0,0];
  lastBlankByVerb.clear();
  setLevelUI();
  clearAnswers();
  for(const o of obstacles.splice(0))scene.remove(o.mesh);
  if(activeAction&&actions.idle)play('idle',.15);

  const summary=window.VerbRunnerGameCore.summarize(runState,runElapsed*1000);
  resultTime.textContent=formatTime(summary.timeMs);
  resultAccuracy.textContent=summary.accuracy+'%';
  resultCorrect.textContent=summary.correctLabel;
  resultStreak.textContent=String(summary.bestStreak);
  resultObstacles.textContent=String(summary.obstacleHits);
  resultMomentum.textContent=summary.momentum+'%';
  if(resultKicker)resultKicker.textContent=raceLabel()+' COMPLETE';
  if(nextLevelButton)nextLevelButton.hidden=currentLevel>=5;
  resultOverlay.hidden=false;

  try{
    localStorage.setItem('verbRunnerV2LastResult',JSON.stringify({
      ...summary,
      difficulty:difficulty.name,
      runner:selectedVariant,
      level:currentLevel,
      mode:raceMode(),
      completedAt:Date.now()
    }));
  }catch{}

  if(sessionData){
    sessionFinish({
      level:currentLevel,
      mode:raceMode(),
      progress:totalChallenges,
      total:totalChallenges,
      momentum:summary.momentum,
      bestStreak:summary.bestStreak,
      accuracy:summary.accuracy,
      correct:runState.correct,
      grammarErrors:runState.grammarErrors,
      obstacleHits:summary.obstacleHits,
      timeMs:summary.timeMs
    }).catch(()=>{});
  }
}

function configureVictoryArmRig(root){
  const bones=[];
  root?.traverse?.(obj=>{if(obj.isBone)bones.push(obj);});
  const clean=name=>String(name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const pick=side=>{
    const sideWord=side==='left'?'left':'right';
    const sideLetter=side==='left'?'l':'r';
    const strong=bones.filter(b=>{
      const n=clean(b.name);
      return (n.includes('upperarm')||n.includes('uparm'))&&
        (n.includes(sideWord)||n.endsWith(sideLetter));
    });
    if(strong.length)return strong[0];
    return bones.find(b=>{
      const n=clean(b.name);
      return !n.includes('armature')&&!n.includes('fore')&&!n.includes('lower')&&!n.includes('hand')&&
        n.includes('arm')&&(n.includes(sideWord)||n.endsWith(sideLetter));
    })||null;
  };
  const makeRig=bone=>{
    if(!bone)return null;
    const lower=bone.children.find(child=>child.isBone)||null;
    const childDir=lower&&lower.position.lengthSq()>.0001
      ?lower.position.clone().normalize()
      :new THREE.Vector3(0,-1,0);
    return {
      bone,
      lower,
      childDir,
      lowerRest:lower?lower.quaternion.clone():null
    };
  };
  victoryArmRig={left:makeRig(pick('left')),right:makeRig(pick('right'))};
}

function applyVictoryArmPose(){
  if(!victoryMode||victoryArmBlend<=0)return;
  const pose=(rig,worldDirection)=>{
    if(!rig?.bone?.parent)return;
    const parentQ=new THREE.Quaternion();
    rig.bone.parent.getWorldQuaternion(parentQ);
    const localTarget=worldDirection.clone().applyQuaternion(parentQ.invert()).normalize();
    const targetQ=new THREE.Quaternion().setFromUnitVectors(rig.childDir,localTarget);
    rig.bone.quaternion.slerp(targetQ,victoryArmBlend);
    if(rig.lower&&rig.lowerRest)rig.lower.quaternion.slerp(rig.lowerRest,Math.min(1,victoryArmBlend*.9));
  };
  pose(victoryArmRig.left,new THREE.Vector3(-.72,.76,0));
  pose(victoryArmRig.right,new THREE.Vector3(.72,.76,0));
}

function beginVictorySprint(){
  victoryMode=true;
  victoryArmBlend=0;
  clearAnswers();
  for(const o of obstacles.splice(0))scene.remove(o.mesh);
  showNotice('VICTORY SPRINT!','correct');
  if(actions.run){
    actions.run.timeScale=1.7;
    play('run',.1);
  }
  setTimeout(()=>{
    if(actions.run)actions.run.timeScale=1.2;
    victoryArmBlend=0;
    finishRun();
  },2500);
}

function resetRun(){
  totalChallenges=currentLevel===5?30:TOTAL_CHALLENGES;
  runState=window.VerbRunnerGameCore.createRunState(totalChallenges);
  challengeIndex=0;
  runElapsed=0;
  distance=0;
  speed=Math.max(6,gameSettings.initialSpeed*gameSettings.speedScale*playerSpeedMultiplier);
  nextSpawn=26;
  hitCooldown=0;
  victoryMode=false;
  gamePaused=false;
  mistakeLog=[];
  updateErrorReport();
  clearAnswers();
  lastCorrectLane=-1;
  verbDeck=[];
  sentenceDeck=[];
  timeClueDeck=[];
  perfectRaceDeck=[];
  finalRaceDeck=[];
  currentChallenge=null;
  applySentenceRunTuning();
  setLevelUI();
  buildChallenges();
  renderChallenge();
  updateHud();
  raceTime.textContent='00:00.000';
}

function hashName(name='mesh'){
  let h=0;
  for(const c of name)h=(h*31+c.charCodeAt(0))|0;
  return Math.abs(h);
}

function applyRobotPalette(index){
  selectedVariant=index;
  const cfg=variants[index];
  const palette=[cfg.accent,cfg.dark,cfg.secondary,cfg.light,cfg.dark,cfg.accent];

  if(model){
    model.traverse(obj=>{
      if(!obj.isMesh)return;
      const n=hashName(obj.name);
      if(obj.material?.dispose)obj.material.dispose();
      obj.material=new THREE.MeshToonMaterial({
        color:palette[n%palette.length],
        emissive:n%6===0?cfg.secondary:0x000000,
        emissiveIntensity:n%6===0?.35:0
      });
      obj.castShadow=true;
      obj.receiveShadow=true;
    });
  }

  const hex='#'+cfg.accent.toString(16).padStart(6,'0');
  document.documentElement.style.setProperty('--runner-accent',hex);
  runnerName.textContent=cfg.name;
  runnerDot.style.background=hex;
  runnerDot.style.boxShadow='0 0 15px '+hex;

  document.querySelectorAll('.robot-option').forEach((btn,i)=>btn.classList.toggle('active',i===index));
  document.querySelectorAll('[data-pause-runner]').forEach((btn,i)=>btn.classList.toggle('active',i===index));
}

function fitToHeight(root,target=2.35){
  root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root);
  const size=new THREE.Vector3();
  box.getSize(size);
  if(size.y<=0)return;
  const s=target/size.y;
  root.scale.setScalar(s);
  root.updateMatrixWorld(true);
  const fitted=new THREE.Box3().setFromObject(root);
  root.position.y-=fitted.min.y;
}

function chooseClip(clips,words){
  return clips.find(c=>words.some(w=>c.name.toLowerCase().includes(w)));
}

function play(name,fade=.16){
  const next=actions[name];
  if(!next||next===activeAction)return;
  next.reset().fadeIn(fade).play();
  if(activeAction)activeAction.fadeOut(fade);
  activeAction=next;
}

const pedestrianLoader=new GLTFLoader();
pedestrianLoader.load(
  PEDESTRIAN_URL,
  gltf=>{
    pedestrianTemplate=gltf.scene;
    pedestrianAnimations=gltf.animations||[];
    fitToHeight(pedestrianTemplate,2.02);
    pedestrianTemplate.traverse(obj=>{
      if(obj.isMesh){
        obj.castShadow=!IS_MOBILE;
        obj.receiveShadow=false;
      }
    });
  },
  undefined,
  err=>console.warn('Pedestrian doll failed to load',err)
);

const loader=new GLTFLoader();
function loadRunnerModel(attempt=0){
  const url=ROBOT_URLS[attempt];
  loader.load(
    url,
    gltf=>{
      model=gltf.scene;
      fitToHeight(model,2.35);
      baseScale=model.scale.clone();
      model.rotation.y=Math.PI;
      model.position.y=0;
      runnerRoot.add(model);
      configureVictoryArmRig(model);

      mixer=new THREE.AnimationMixer(model);
      const runClip=chooseClip(gltf.animations,['running','run'])||gltf.animations[0];
      const jumpClip=chooseClip(gltf.animations,['jump']);
      const idleClip=chooseClip(gltf.animations,['idle','standing']);

      actions.run=mixer.clipAction(runClip);
      if(jumpClip)actions.jump=mixer.clipAction(jumpClip);
      if(idleClip)actions.idle=mixer.clipAction(idleClip);

      actions.run.timeScale=1.2;
      if(actions.jump){
        actions.jump.setLoop(THREE.LoopOnce,1);
        actions.jump.clampWhenFinished=false;
      }

      applyRobotPalette(selectedVariant);
      play('idle',0);
      runnerReady=true;
      runnerLoadFailed=false;
      updateStartButtonState();
      modelStatus.textContent='Robot ready · choose a color and start';
    },
    undefined,
    err=>{
      console.warn('Runner model failed from',url,err);
      if(attempt+1<ROBOT_URLS.length){
        modelStatus.textContent='Retrying runner model…';
        loadRunnerModel(attempt+1);
        return;
      }
      runnerReady=false;
      runnerLoadFailed=true;
      updateStartButtonState();
      modelStatus.textContent='Robot failed to load — check network/CDN';
    }
  );
}
loadRunnerModel();

document.querySelectorAll('[data-race]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    if(assignmentContextLocked)return;
    selectRace(btn.dataset.level);
  });
});

document.querySelectorAll('.robot-option').forEach((btn,index)=>{
  btn.addEventListener('click',()=>{
    playSfx('click');
    applyRobotPalette(index);
  });
});
document.querySelectorAll('[data-pause-runner]').forEach((btn,index)=>{
  btn.addEventListener('click',()=>{
    playSfx('click');
    applyRobotPalette(index);
  });
});

document.querySelectorAll('[data-difficulty]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    if(assignmentContextLocked)return;
    if(sessionCode&&sessionData)return;
    const preset=difficultyPresets[btn.dataset.difficulty]||difficultyPresets.medium;
    applyDifficultyDefaults(preset);
    document.querySelectorAll('[data-difficulty]').forEach(b=>b.classList.toggle('active',b===btn));
    if(!runnerReady&&!runnerLoadFailed)modelStatus.textContent='Difficulty selected · loading runner…';
    updateStartButtonState();
  });
});

startButton.addEventListener('click',async()=>{
  ensureAudio();
  window.VerbRunnerPronunciation?.unlockPronunciation();
  await sessionLoadPromise;
  sessionRunFinished=false;
  resetRun();
  picker.classList.add('hidden');
  resultOverlay.hidden=true;
  gameStarted=true;
  ensureAudio();
  playSfx('click');
  startMusic();
  play('run',.12);
  modelStatus.textContent=variants[selectedVariant].name+' robot · COASTAL VILLAGE';
  if(sessionData){
    await sessionConnect({
      level:currentLevel,
      mode:raceMode(),
      total:totalChallenges,
      runner:selectedVariant,
      difficulty:difficulty.name,
      ...monitorIdentityData()
    }).catch(()=>{});
    renderChallenge();
    updateHud();
  }
  launchChallengeChain(gameSettings.preview?1.55:.55);
});

runnerChip.addEventListener('click',()=>{
  if(gameStarted){showNotice('PAUSE THE RACE TO CHANGE RUNNER','info');return;}
  picker.classList.remove('hidden');
  play('idle',.12);
});

pauseButton.addEventListener('click',()=>setPaused(!gamePaused));
resumeButton.addEventListener('click',()=>setPaused(false));
pauseOverlay?.addEventListener('click',event=>{
  if(event.target===pauseOverlay&&gamePaused){
    setPaused(false);
  }
});
sentenceChallenge?.addEventListener('click',()=>{
  if(gameStarted&&!gamePaused&&isTextRace())setPaused(true);
});
sentenceChallenge?.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&gameStarted&&!gamePaused&&isTextRace()){
    e.preventDefault();
    setPaused(true);
  }
});
speedControl?.addEventListener('input',()=>setPlayerSpeedPercent(speedControl.value));
startingSpeedControl?.addEventListener('input',()=>setPlayerSpeedPercent(startingSpeedControl.value));
changeRunnerButton?.addEventListener('click',()=>{
  playSfx('click');
  const nextHidden=!pauseRunnerPanel?.hidden;
  hidePauseSubpanels();
  if(pauseRunnerPanel)pauseRunnerPanel.hidden=nextHidden;
});
controlsButton?.addEventListener('click',()=>{
  playSfx('click');
  const nextHidden=!controlsPanel?.hidden;
  hidePauseSubpanels();
  if(controlsPanel)controlsPanel.hidden=nextHidden;
});
errorReportButton?.addEventListener('click',()=>{
  playSfx('click');
  const nextHidden=!errorReportPanel?.hidden;
  hidePauseSubpanels();
  updateErrorReport();
  if(errorReportPanel)errorReportPanel.hidden=nextHidden;
});
restartRaceButton?.addEventListener('click',()=>{playSfx('click');showPauseConfirmation('restart');});
quitRaceButton?.addEventListener('click',()=>{playSfx('click');showPauseConfirmation('quit');});
cancelPauseAction?.addEventListener('click',()=>{playSfx('click');hidePauseConfirmation();});
confirmPauseAction?.addEventListener('click',()=>{
  playSfx('click');
  if(pendingPauseAction==='restart')restartCurrentRace();
  else if(pendingPauseAction==='quit')returnToRaceMenu();
});
backToMenuButton?.addEventListener('click',()=>{playSfx('click');returnToRaceMenu();});

soundControl?.addEventListener('input',()=>{
  sfxVolume=Math.max(0,Math.min(1,Number(soundControl.value)/100));
  if(sfxVolume>0)sfxEnabled=true;
  updateAudioUI();
  saveAudioSettings();
});
soundControl?.addEventListener('change',()=>playSfx('click'));
soundToggle?.addEventListener('click',()=>{
  sfxEnabled=!sfxEnabled;
  updateAudioUI();
  saveAudioSettings();
  if(sfxEnabled)playSfx('click');
});
musicControl?.addEventListener('input',()=>{
  musicVolume=Math.max(0,Math.min(.35,Number(musicControl.value)/100));
  if(musicVolume>0)musicEnabled=true;
  if(musicBus&&audioCtx){
    musicBus.gain.setTargetAtTime(musicVolume,audioCtx.currentTime,.08);
  }
  updateAudioUI();
  saveAudioSettings();
  if(musicEnabled&&gameStarted&&!gamePaused)startMusic();
});
musicToggle?.addEventListener('click',()=>{
  musicEnabled=!musicEnabled;
  if(musicEnabled&&musicVolume<=0)musicVolume=.12;
  if(musicEnabled&&gameStarted&&!gamePaused)startMusic();
  else stopMusic();
  updateAudioUI();
  saveAudioSettings();
  playSfx('click');
});
setPlayerSpeedPercent(100);
runAgainButton.addEventListener('click',()=>{
  playSfx('click');
  resultOverlay.hidden=true;
  picker.classList.remove('hidden');
  play('idle',.12);
});

nextLevelButton?.addEventListener('click',async()=>{
  if(currentLevel>=5)return;
  sessionRunFinished=false;
  currentLevel+=1;
  totalChallenges=currentLevel===5?30:TOTAL_CHALLENGES;
  resultOverlay.hidden=true;
  if(sessionCode&&sessionData)applySessionSettings(sessionData.settings||{});
  else{
    gameSettings={
      ...gameSettings,
      initialSpeed:12,
      maxSpeed:31,
      speedScale:difficulty.speed,
      answerSpacing:difficulty.answerSpacing
    };
  }
  applySentenceRunTuning();
  setLevelUI();
  resetRun();
  gameStarted=true;
  ensureAudio();
  playSfx('click');
  startMusic();
  play('run',.12);
  modelStatus.textContent=variants[selectedVariant].name+' robot · COASTAL VILLAGE';
  if(sessionData){
    await sessionConnect({
      level:currentLevel,
      mode:raceMode(),
      total:totalChallenges,
      runner:selectedVariant,
      difficulty:difficulty.name,
      ...monitorIdentityData()
    }).catch(()=>{});
    renderChallenge();
    updateHud();
  }
  launchChallengeChain(gameSettings.preview?1.55:.55);
});


function autoPauseForFocusChange(reason='window'){
  if(!gameStarted||gamePaused||victoryMode)return;
  setPaused(true);
  if(pauseReadingMode){
    pauseReadingMode.textContent=isTextRace()
      ?'AUTO-PAUSED · TAKE YOUR TIME'
      :'AUTO-PAUSED';
  }
  modelStatus.textContent='Auto-paused when the app lost focus';
}

document.addEventListener('visibilitychange',()=>{
  if(document.hidden)autoPauseForFocusChange('visibility');
});
window.addEventListener('blur',()=>autoPauseForFocusChange('blur'));
window.addEventListener('pagehide',()=>autoPauseForFocusChange('pagehide'));

const lanes=[-3,0,3];
let lane=1;
let targetX=lanes[lane];
let jumpTime=0;
const jumpDuration=.78;
let distance=0;
let speed=12;
let nextSpawn=26;
let hitCooldown=0;

function moveLane(dir){
  if(!gameStarted||gamePaused||victoryMode)return;
  lane=THREE.MathUtils.clamp(lane+dir,0,2);
  targetX=lanes[lane];
}

function jump(){
  if(!gameStarted||gamePaused||victoryMode||jumpTime>0)return;
  jumpTime=.001;
  playSfx('jump');
  if(actions.jump)play('jump',.08);
}

window.addEventListener('keydown',e=>{
  if(e.code==='Escape'&&gameStarted&&!victoryMode){
    e.preventDefault();
    setPaused(!gamePaused);
    return;
  }
  if(['ArrowLeft','KeyA'].includes(e.code))moveLane(-1);
  if(['ArrowRight','KeyD'].includes(e.code))moveLane(1);
  if(['ArrowUp','Space','KeyW'].includes(e.code))jump();
});
window.addEventListener('resize',()=>requestAnimationFrame(fitPrincipalPartText));

let touchStart=null;
canvas.addEventListener('pointerdown',e=>{
  touchStart={x:e.clientX,y:e.clientY,t:performance.now()};
});
canvas.addEventListener('pointerup',e=>{
  if(!touchStart)return;
  const start=touchStart;
  touchStart=null;

  const dx=e.clientX-start.x;
  const dy=e.clientY-start.y;
  const distance=Math.hypot(dx,dy);
  const elapsed=performance.now()-start.t;

  if(distance<22&&elapsed<420){
    jump();
    return;
  }

  if(dy<=-36&&Math.abs(dy)>Math.abs(dx)*1.05){
    jump();
    return;
  }

  if(Math.abs(dx)>=36&&Math.abs(dx)>Math.abs(dy)*1.15){
    moveLane(dx>0?1:-1);
  }
});
canvas.addEventListener('pointercancel',()=>{touchStart=null;});

const obstacles=[];

const obstacleMaterials={
  asphaltDark:new THREE.MeshToonMaterial({color:0x1c2228}),
  rubber:new THREE.MeshToonMaterial({color:0x101215}),
  metal:new THREE.MeshToonMaterial({color:0xaeb7bd}),
  glass:new THREE.MeshBasicMaterial({color:0x80c7df,transparent:true,opacity:.92}),
  orange:new THREE.MeshToonMaterial({color:0xf17828}),
  white:new THREE.MeshToonMaterial({color:0xf1eee5}),
  yellow:new THREE.MeshToonMaterial({color:0xf3c52f}),
  blue:new THREE.MeshToonMaterial({color:0x2878b8}),
  brown:new THREE.MeshToonMaterial({color:0xa56d45}),
  black:new THREE.MeshToonMaterial({color:0x17191d})
};

function cylinderBetween(a,b,r,mat){
  const delta=new THREE.Vector3().subVectors(b,a);
  const length=delta.length();
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,length,10),mat);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
  return mesh;
}

function pickObstacleLane(type){
  const blocked=new Set();
  for(const a of answers){
    if(!a?.mesh)continue;
    if(Math.abs(a.mesh.position.z-OBSTACLE_SPAWN_Z)<14)blocked.add(a.laneIndex);
  }
  const available=[0,1,2].filter(i=>!blocked.has(i));
  if(!available.length)return null;
  return available[Math.floor(Math.random()*available.length)];
}

function createRoadCar(index=0){
  const car=new THREE.Group();
  const colors=[0xc83e3e,0x2d6fb3,0xd19a2d,0x3f805c,0x747b86,0x8b54a7];
  const paint=new THREE.MeshToonMaterial({color:colors[index%colors.length]});
  const trim=new THREE.MeshToonMaterial({color:0x252a30});
  const glass=new THREE.MeshBasicMaterial({color:0x7ecbe4,transparent:true,opacity:.9});
  const chrome=new THREE.MeshToonMaterial({color:0xc7cfd4});
  const lightFront=new THREE.MeshBasicMaterial({color:0xfff0b1});
  const lightRear=new THREE.MeshBasicMaterial({color:0xe83a3f});

  const chassis=new THREE.Mesh(new THREE.BoxGeometry(1.82,.48,3.28),paint);
  chassis.position.y=.56;
  chassis.castShadow=true;
  car.add(chassis);

  const lowerSkirt=new THREE.Mesh(new THREE.BoxGeometry(1.92,.18,2.95),trim);
  lowerSkirt.position.y=.31;
  car.add(lowerSkirt);

  const hood=new THREE.Mesh(new THREE.BoxGeometry(1.68,.28,1.05),paint);
  hood.position.set(0,.82,-1.03);
  hood.rotation.x=-.055;
  hood.castShadow=true;
  car.add(hood);

  const trunk=new THREE.Mesh(new THREE.BoxGeometry(1.62,.25,.70),paint);
  trunk.position.set(0,.83,1.24);
  trunk.rotation.x=.045;
  car.add(trunk);

  const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.46,.72,1.48),paint);
  cabin.position.set(0,1.17,.17);
  cabin.castShadow=true;
  car.add(cabin);

  const roof=new THREE.Mesh(new THREE.BoxGeometry(1.30,.13,.92),paint);
  roof.position.set(0,1.58,.22);
  car.add(roof);

  const windshield=new THREE.Mesh(new THREE.PlaneGeometry(1.20,.48),glass);
  windshield.position.set(0,1.28,-.59);
  windshield.rotation.x=-.40;
  car.add(windshield);

  const rearWindow=new THREE.Mesh(new THREE.PlaneGeometry(1.16,.44),glass);
  rearWindow.position.set(0,1.29,.92);
  rearWindow.rotation.x=.38;
  rearWindow.rotation.y=Math.PI;
  car.add(rearWindow);

  for(const side of [-1,1]){
    const sideGlassFront=new THREE.Mesh(new THREE.PlaneGeometry(.62,.43),glass);
    sideGlassFront.rotation.y=side>0?-Math.PI/2:Math.PI/2;
    sideGlassFront.position.set(side*.738,1.30,-.18);
    car.add(sideGlassFront);

    const sideGlassRear=new THREE.Mesh(new THREE.PlaneGeometry(.55,.43),glass);
    sideGlassRear.rotation.y=side>0?-Math.PI/2:Math.PI/2;
    sideGlassRear.position.set(side*.738,1.30,.48);
    car.add(sideGlassRear);

    const mirror=new THREE.Mesh(new THREE.BoxGeometry(.18,.10,.25),paint);
    mirror.position.set(side*.92,1.15,-.48);
    car.add(mirror);
  }

  for(const x of [-.94,.94]){
    for(const z of [-1.02,1.02]){
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.30,.30,.20,18),obstacleMaterials.rubber);
      wheel.rotation.z=Math.PI/2;
      wheel.position.set(x,.34,z);
      car.add(wheel);

      const hub=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.205,12),chrome);
      hub.rotation.z=Math.PI/2;
      hub.position.set(x,.34,z);
      car.add(hub);
    }
  }

  const grille=new THREE.Mesh(new THREE.BoxGeometry(.90,.20,.08),trim);
  grille.position.set(0,.58,-1.67);
  car.add(grille);

  const frontBumper=new THREE.Mesh(new THREE.BoxGeometry(1.60,.11,.10),chrome);
  frontBumper.position.set(0,.35,-1.69);
  car.add(frontBumper);

  const rearBumper=frontBumper.clone();
  rearBumper.position.z=1.69;
  car.add(rearBumper);

  for(const x of [-.57,.57]){
    const headlight=new THREE.Mesh(new THREE.BoxGeometry(.28,.17,.065),lightFront);
    headlight.position.set(x,.73,-1.665);
    car.add(headlight);

    const taillight=new THREE.Mesh(new THREE.BoxGeometry(.27,.16,.065),lightRear);
    taillight.position.set(x,.72,1.665);
    car.add(taillight);
  }

  car.scale.set(.82,.82,.82);
  return car;
}

function makeRoadBarricadeTexture(){
  const c=document.createElement('canvas');
  c.width=512;
  c.height=192;
  const ctx=c.getContext('2d');

  ctx.fillStyle='#f4f1e8';
  ctx.fillRect(0,0,c.width,c.height);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0,0,c.width,c.height);
  ctx.clip();
  ctx.lineWidth=64;
  ctx.strokeStyle='#f07724';
  for(let x=-180;x<c.width+220;x+=150){
    ctx.beginPath();
    ctx.moveTo(x,c.height+45);
    ctx.lineTo(x+170,-45);
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle='#262b30';
  ctx.lineWidth=16;
  ctx.strokeRect(8,8,c.width-16,c.height-16);

  ctx.fillStyle='rgba(255,255,255,.30)';
  ctx.fillRect(20,18,c.width-40,12);

  for(const x of [42,c.width-42]){
    ctx.fillStyle='#555b60';
    ctx.beginPath();
    ctx.arc(x,c.height/2,9,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle='#d9dde0';
    ctx.beginPath();
    ctx.arc(x,c.height/2,4,0,Math.PI*2);
    ctx.fill();
  }

  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  return tex;
}

const roadBarricadeTexture=makeRoadBarricadeTexture();

function createRoadSign(){
  const g=new THREE.Group();

  const boardMat=new THREE.MeshStandardMaterial({
    map:roadBarricadeTexture,
    roughness:.48,
    metalness:.08
  });
  const board=new THREE.Mesh(new THREE.BoxGeometry(1.72,.68,.12),boardMat);
  board.position.y=.94;
  board.castShadow=true;
  g.add(board);

  const frameMat=new THREE.MeshToonMaterial({color:0x30363b});
  const reflectorMat=new THREE.MeshBasicMaterial({color:0xffd45a});

  for(const x of [-.72,.72]){
    const post=new THREE.Mesh(new THREE.BoxGeometry(.10,.88,.11),frameMat);
    post.position.set(x,.48,.015);
    g.add(post);

    const foot=new THREE.Mesh(new THREE.BoxGeometry(.52,.12,.58),obstacleMaterials.black);
    foot.position.set(x,.07,0);
    foot.rotation.y=x>0?.06:-.06;
    g.add(foot);

    const reflector=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.035,16),reflectorMat);
    reflector.rotation.x=Math.PI/2;
    reflector.position.set(x,.94,-.075);
    g.add(reflector);
  }

  const topLamp=new THREE.Mesh(new THREE.CylinderGeometry(.10,.10,.07,16),reflectorMat);
  topLamp.rotation.x=Math.PI/2;
  topLamp.position.set(0,1.36,-.065);
  g.add(topLamp);

  const cap=new THREE.Mesh(new THREE.BoxGeometry(1.82,.08,.16),frameMat);
  cap.position.y=1.30;
  g.add(cap);

  return g;
}

function createDeliveryBoxes(){
  const g=new THREE.Group();
  const sizes=[
    {x:-.35,y:.28,z:.05,w:.68,h:.56,d:.62},
    {x:.31,y:.34,z:.02,w:.62,h:.68,d:.58},
    {x:.02,y:.82,z:.04,w:.72,h:.5,d:.64}
  ];
  for(const s of sizes){
    const box=new THREE.Mesh(new THREE.BoxGeometry(s.w,s.h,s.d),obstacleMaterials.brown);
    box.position.set(s.x,s.y,s.z);
    box.castShadow=true;
    g.add(box);
    const tape=new THREE.Mesh(new THREE.BoxGeometry(.09,s.h+.01,s.d+.02),obstacleMaterials.white);
    tape.position.copy(box.position);
    g.add(tape);
  }
  return g;
}

function stylePedestrian(root,index=0){
  const look=pedestrianLooks[index%pedestrianLooks.length];

  root.traverse(obj=>{
    if(!obj.isMesh)return;

    const source=Array.isArray(obj.material)?obj.material:[obj.material];
    const styled=source.map(material=>{
      if(!material)return material;
      const mat=material.clone();
      const name=(mat.name||'').toLowerCase();

      if(name.includes('shirt')||name.includes('top'))mat.color?.setHex(look.shirt);
      else if(name.includes('pants')||name.includes('trouser'))mat.color?.setHex(look.pants);
      else if(name.includes('belt'))mat.color?.setHex(look.belt);
      else if(name.includes('hair'))mat.color?.setHex(look.hair);
      else if(name.includes('shoe')||name.includes('sneaker'))mat.color?.setHex(look.shoes);
      else if(name==='skin'||name.includes('skin'))mat.color?.setHex(look.skin);

      if('roughness' in mat)mat.roughness=.74;
      if('metalness' in mat)mat.metalness=.02;
      return mat;
    });

    obj.material=Array.isArray(obj.material)?styled:styled[0];
    obj.castShadow=!IS_MOBILE;
    obj.receiveShadow=false;
  });

  root.scale.x*=look.width;
  root.scale.z*=look.width;
  root.scale.y*=look.height;
  return look;
}

function createPedestrian(index=0){
  if(!pedestrianTemplate)return null;

  const g=SkeletonUtils.clone(pedestrianTemplate);
  const look=stylePedestrian(g,index);
  const crossDir=Math.random()<.5?1:-1;

  g.userData.crossDir=crossDir;
  g.userData.crossSpeed=(1.48+Math.random()*.42)*look.walkSpeed;
  g.userData.startSide=crossDir>0?-1:1;
  g.userData.voiceVariant=index;

  // Casual_Female faces +Z natively. +90° faces +X; -90° faces -X.
  // Match orientation to travel direction so the pedestrian walks forward.
  g.rotation.y=crossDir>0?Math.PI/2:-Math.PI/2;
  g.userData.facingDir=crossDir;

  if(pedestrianAnimations.length){
    const mixer=new THREE.AnimationMixer(g);
    const walkClip=
      pedestrianAnimations.find(c=>c.name.toLowerCase().endsWith('|walk')) ||
      pedestrianAnimations.find(c=>c.name.toLowerCase()==='walk') ||
      pedestrianAnimations.find(c=>/walk/i.test(c.name));

    if(walkClip){
      const action=mixer.clipAction(walkClip);
      action.setLoop(THREE.LoopRepeat,Infinity);
      action.timeScale=(.92+Math.random()*.12)*look.walkSpeed;
      action.play();
    }
    g.userData.mixer=mixer;
  }

  return g;
}

function spawnObstacle(){
  const roll=Math.random();
  let type;
  let kind;

  if(roll<.24){type='car';kind='car';}
  else if(roll<.47){type='jump';kind='sign';}
  else if(roll<.68){type='jump';kind='boxes';}
  else {type='dodge';kind='pedestrian';}

  if(kind==='pedestrian'){
    const answerCorridorBusy=
      pendingAnswers.length>0 ||
      answers.some(a=>a?.mesh&&Math.abs(a.mesh.position.z-OBSTACLE_SPAWN_Z)<18);
    if(answerCorridorBusy){
      kind=Math.random()<.5?'sign':'boxes';
      type='jump';
    }
  }

  const laneIndex=pickObstacleLane(type);
  if(laneIndex===null)return;

  let mesh;
  if(kind==='car')mesh=createRoadCar(Math.floor(Math.random()*6));
  else if(kind==='sign')mesh=createRoadSign();
  else if(kind==='boxes')mesh=createDeliveryBoxes();
  else{
    mesh=createPedestrian(Math.floor(Math.random()*pedestrianLooks.length));
    if(!mesh){
      kind='boxes';
      type='jump';
      mesh=createDeliveryBoxes();
    }
  }

  if(kind==='pedestrian'){
    mesh.position.set(mesh.userData.startSide*5.25,0,OBSTACLE_SPAWN_Z);
  }else{
    mesh.position.set(lanes[laneIndex],0,OBSTACLE_SPAWN_Z);
  }

  scene.add(mesh);
  obstacles.push({mesh,type,kind,laneIndex,passed:false,mixer:mesh.userData.mixer||null});
}


const PEDESTRIAN_COMPLAINTS=[
  'Ow!',
  'Hey!',
  'Careful!',
  'Watch it, buddy!',
  'Watch where you’re going!',
  'Whoa! Easy there!',
  'These kids today!',
  'Come on!',
  'Seriously?',
  'Ouch! That hurt!'
];
let lastPedestrianComplaint=-1;

function pickPedestrianComplaint(){
  let index=Math.floor(Math.random()*PEDESTRIAN_COMPLAINTS.length);
  if(PEDESTRIAN_COMPLAINTS.length>1&&index===lastPedestrianComplaint){
    index=(index+1+Math.floor(Math.random()*(PEDESTRIAN_COMPLAINTS.length-1)))%PEDESTRIAN_COMPLAINTS.length;
  }
  lastPedestrianComplaint=index;
  return PEDESTRIAN_COMPLAINTS[index];
}

function showPedestrianComplaint(mesh,text){
  if(!mesh)return;
  const bubble=document.createElement('div');
  bubble.className='pedestrian-complaint';
  bubble.textContent=text;
  document.querySelector('#app')?.appendChild(bubble);

  const world=new THREE.Vector3();
  mesh.getWorldPosition(world);
  world.y+=2.55;
  world.project(camera);
  const rect=canvas.getBoundingClientRect();
  const x=rect.left+(world.x*.5+.5)*rect.width;
  const y=rect.top+(-world.y*.5+.5)*rect.height;
  bubble.style.left=x+'px';
  bubble.style.top=y+'px';

  requestAnimationFrame(()=>bubble.classList.add('show'));
  setTimeout(()=>bubble.classList.add('leave'),900);
  setTimeout(()=>bubble.remove(),1250);
}

function pedestrianComplain(mesh){
  const text=pickPedestrianComplaint();
  showPedestrianComplaint(mesh,text);
}

function hit(){
  if(hitCooldown>0||victoryMode)return;
  hitCooldown=.9;
  flash.classList.add('on');
  setTimeout(()=>flash.classList.remove('on'),180);
  applyRunEvent('obstacle-hit');
  if(sessionData){
    sessionUpdate({
      latestResult:'obstacle',
      lastAction:'Obstacle hit',
      lastEventAt:Date.now()
    }).catch(()=>{});
  }
  showNotice('OBSTACLE HIT · −'+gameSettings.penalty+' ADVANCE','wrong');
}

function updateRunner(dt){
  runnerRoot.position.x=THREE.MathUtils.damp(runnerRoot.position.x,targetX,11,dt);
  const lean=(targetX-runnerRoot.position.x)*-.05;
  runnerRoot.rotation.z=THREE.MathUtils.damp(runnerRoot.rotation.z,lean,8,dt);

  let y=0;

  if(jumpTime>0){
    jumpTime+=dt;
    const t=jumpTime/jumpDuration;
    if(t>=1){
      jumpTime=0;
      if(gameStarted)play('run',.1);
    }else{
      y=Math.sin(Math.PI*t)*2.45;
    }
  }



  runnerRoot.position.y=y;
  shadow.scale.setScalar(THREE.MathUtils.lerp(1,.62,Math.min(1,y/2.45)));
  shadow.material.opacity=THREE.MathUtils.lerp(.34,.1,Math.min(1,y/2.45));
}

function updateWorld(dt){
  const travel=speed*dt;

  updateAnswerSpawns(dt);

  for(const mover of environmentMovers){
    mover.object.position.z+=travel*mover.speedFactor;
    if(mover.object.position.z>16)mover.object.position.z-=mover.span;
  }

  for(const mover of farMovers){
    mover.object.position.z+=travel*mover.speedFactor;
    if(mover.object.position.z>8)mover.object.position.z-=mover.span;
  }

  for(const m of laneMarkers){
    m.position.z+=travel;
    if(m.position.z>8)m.position.z-=160;
  }

  for(let i=answers.length-1;i>=0;i--){
    const a=answers[i];
    if(answerResolutionActive)continue;
    a.mesh.position.z+=travel;
    const closeToRunner=Math.abs(a.mesh.position.z-runnerRoot.position.z)<1.25;
    const sameLane=a.laneIndex===lane&&Math.abs(a.mesh.position.x-runnerRoot.position.x)<1.3;
    const verticalHit=a.heightMode==='low'
      ? runnerRoot.position.y<.82
      : runnerRoot.position.y>1.18;

    if(!a.resolved&&closeToRunner&&sameLane&&verticalHit){
      collectAnswer(a);
      if(!gameStarted||victoryMode)break;
      continue;
    }

    if(a.mesh.position.z>13){
      const wasCorrect=a.item.correct&&!a.resolved;
      scene.remove(a.mesh);
      answers.splice(i,1);
      if(wasCorrect){
        const anotherCorrectActive=answers.some(other=>!other.resolved&&other.item.correct);
        const anotherCorrectPending=pendingAnswers.some(other=>other.item.correct);
        if(!anotherCorrectActive&&!anotherCorrectPending){
          missedCorrectAnswer();
          break;
        }
      }
    }
  }

  for(let i=obstacles.length-1;i>=0;i--){
    const o=obstacles[i];
    o.mesh.position.z+=travel;

    if(o.kind==='pedestrian'){
      o.mixer?.update(dt);
      o.mesh.position.x+=o.mesh.userData.crossDir*o.mesh.userData.crossSpeed*dt;
    }

    if(o.kind==='pedestrian'){
      const closeZ=Math.abs(o.mesh.position.z-runnerRoot.position.z)<1.15;
      const closeX=Math.abs(o.mesh.position.x-runnerRoot.position.x)<.72;
      const protectedByAnswer=answerResolutionActive||answers.some(a=>
        !a.resolved &&
        Math.abs(a.mesh.position.z-o.mesh.position.z)<12
      );

      if(!o.passed&&closeZ&&closeX){
        o.passed=true;
        if(!protectedByAnswer){
          pedestrianComplain(o.mesh);
          hit();
        }
      }else if(o.mesh.position.z>4.2){
        o.passed=true;
      }
    }else if(!o.passed&&o.mesh.position.z>1.1){
      o.passed=true;
      const sameLane=o.laneIndex===lane&&Math.abs(o.mesh.position.x-runnerRoot.position.x)<1.25;
      if(sameLane){
        const safe=o.type==='jump'
          ? runnerRoot.position.y>.92
          : (o.type==='car'?runnerRoot.position.y>1.28:false);
        if(!safe)hit();
      }
    }

    if(o.mesh.position.z>13){
      o.mixer?.stopAllAction();
      scene.remove(o.mesh);
      obstacles.splice(i,1);
    }
  }

  if(!victoryMode){
    nextSpawn-=travel;
    if(nextSpawn<=0){
      spawnObstacle();
      const frequencyScale=THREE.MathUtils.lerp(1.75,.58,gameSettings.obstacleFrequency/100);
      nextSpawn=(22+Math.random()*18)*frequencyScale/gameSettings.speedScale;
    }
  }
}


setInterval(()=>{
  if(sessionData&&!sessionRunFinished){
    sessionUpdate({
      status:gameStarted?(gamePaused?'paused':(victoryMode?'victory':'running')):'waiting',
      progress:runState?.completed||0,
      total:totalChallenges,
      momentum:runState?.momentum??75
    }).catch(()=>{});
  }
},15000);

const clock=new THREE.Clock();

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04);
  coastalWorld.update(clock.elapsedTime);

  if(mixer&&!gamePaused)mixer.update(dt);
  if(victoryMode&&!gamePaused){
    victoryArmBlend=Math.min(1,victoryArmBlend+dt*4.2);
    applyVictoryArmPose();
  }
  hitCooldown=Math.max(0,hitCooldown-dt);

  if(noticeTimer>0){
    noticeTimer-=dt;
    if(noticeTimer<=0)gameNotice.className='game-notice';
  }

  if(gameStarted&&!gamePaused){
    runElapsed+=dt;
    raceTime.textContent=formatTime(runElapsed*1000);

    if(victoryMode){
      speed=34;
      distance+=speed*dt;
      updateRunner(dt);
      for(const mover of environmentMovers){
        mover.object.position.z+=speed*dt*mover.speedFactor;
        if(mover.object.position.z>16)mover.object.position.z-=mover.span;
      }
      for(const mover of farMovers){
        mover.object.position.z+=speed*dt*mover.speedFactor;
        if(mover.object.position.z>8)mover.object.position.z-=mover.span;
      }
      for(const m of laneMarkers){
        m.position.z+=speed*dt;
        if(m.position.z>8)m.position.z-=160;
      }
    }else{
      const progress=THREE.MathUtils.clamp(
        totalChallenges>1?(runState?.completed||0)/(totalChallenges-1):0,
        0,
        1
      );

      // Momentum now matters in every race:
      // high momentum pushes the runner faster; mistakes lower momentum and
      // visibly ease the pace again.
      const momentum=THREE.MathUtils.clamp((runState?.momentum??75)/100,0,1);
      const momentumBoost=currentLevel===5
        ?THREE.MathUtils.lerp(.80,1.24,momentum)
        :THREE.MathUtils.lerp(.82,1.14,momentum);

      // Every level accelerates gradually. Final Race has a much stronger
      // late-race surge so the last questions feel genuinely fast.
      const finalCurve=Math.pow(progress,1.12);
      const progressBoost=currentLevel===5
        ?THREE.MathUtils.lerp(.92,1.60,finalCurve)
        :THREE.MathUtils.lerp(.92,1.20,progress);

      const capBoost=currentLevel===5
        ?THREE.MathUtils.lerp(.94,1.36,finalCurve)
        :THREE.MathUtils.lerp(.92,1.08,progress);

      const baseTarget=(gameSettings.initialSpeed+distance/700)
        *gameSettings.speedScale
        *momentumBoost
        *playerSpeedMultiplier;

      const dynamicCap=gameSettings.maxSpeed*capBoost*playerSpeedMultiplier;
      const targetSpeed=Math.min(dynamicCap,baseTarget*progressBoost);

      // Final Race reacts faster to each progress/momentum change so the
      // acceleration is clearly felt instead of being barely noticeable.
      speed=THREE.MathUtils.damp(speed,targetSpeed,currentLevel===5?3.1:1.85,dt);

      distance+=speed*dt;
      updateRunner(dt);
      updateWorld(dt);
    }
  }

  if(distanceEl)distanceEl.textContent=String(Math.floor(distance)).padStart(4,'0');
  if(speedEl){
    const referenceSpeed=Math.max(1,gameSettings.initialSpeed*gameSettings.speedScale*playerSpeedMultiplier);
    speedEl.textContent=(speed/referenceSpeed).toFixed(2)+'×';
  }

  camera.position.x=THREE.MathUtils.damp(camera.position.x,runnerRoot.position.x*.15,3.5,dt);
  renderer.render(scene,camera);
}

animate();

function resize(){
  const w=innerWidth;
  const h=innerHeight;
  if(IS_MOBILE)renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.1));
  renderer.setSize(w,h,false);
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
  requestAnimationFrame(fitSentencePrompt);
}

addEventListener('resize',resize);
resize();
