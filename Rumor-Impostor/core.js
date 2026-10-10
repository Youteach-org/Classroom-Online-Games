import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getDatabase,ref,set,get,onValue,runTransaction,update} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

const firebaseConfig={
  apiKey:'AIzaSyCpKL-4eHrqFiUntViiUB2BPs60XumC1K4',
  authDomain:'youteach-d9a79.firebaseapp.com',
  databaseURL:'https://youteach-d9a79-default-rtdb.firebaseio.com',
  projectId:'youteach-d9a79',
  storageBucket:'youteach-d9a79.firebasestorage.app',
  messagingSenderId:'302548732789',
  appId:'1:302548732789:web:b230b7f74366488d45a13c'
};

export const db=getDatabase(initializeApp(firebaseConfig));
export const root='classroomGames/supportMeter/rumorImpostor';
export {ref,set,get,onValue,runTransaction,update};

export const scenarios={
  phobias:[
    {id:'elevator',vocabulary:'claustrophobia',situation:'You have to enter a crowded elevator on the 20th floor.',general:['intense anxiety','avoiding certain places','feeling trapped or unsafe'],specific:['choosing the stairs','a small crowded space','closed doors']},
    {id:'plane',vocabulary:'aerophobia',situation:'You have to board a plane for a five-hour flight.',general:['intense anxiety','avoiding certain trips','feeling unsafe while traveling'],specific:['choosing another way to travel','takeoff and landing','being inside an aircraft']},
    {id:'balcony',vocabulary:'acrophobia',situation:'You step onto a balcony on the 30th floor and look down.',general:['intense anxiety','avoiding certain places','feeling unsafe'],specific:['high floors','looking down','balconies or mountains']},
    {id:'spider',vocabulary:'arachnophobia',situation:'You find a large spider next to your bed at night.',general:['a very strong fear reaction','avoiding certain places','something that may be harmless'],specific:['corners and webs','a small animal','eight legs']},
    {id:'snake',vocabulary:'ophidiophobia',situation:'You see a snake moving across the garden path.',general:['a very strong fear reaction','avoiding certain places','something that may be harmless'],specific:['gardens and trails','a long animal','moving close to the ground']},
    {id:'square',vocabulary:'agoraphobia',situation:'You are alone in a huge crowded public square far from home.',general:['intense anxiety','avoiding certain places','wanting to return somewhere safe'],specific:['public spaces','being away from home','large open or crowded places']}
  ],
  superstitions:[
    {id:'mirror',vocabulary:'superstition · bad luck',situation:'You accidentally break a mirror at home.',general:['expecting something bad','an old belief','changing behavior because of a belief'],specific:['a household object','something breaks','bad luck lasting for years']},
    {id:'ladder',vocabulary:'superstition · bad luck',situation:'You are about to walk under a ladder on the sidewalk.',general:['expecting something bad','avoiding an action','an old belief'],specific:['changing your path','something above you','walking underneath it']},
    {id:'black-cat',vocabulary:'superstition · bad luck',situation:'A black cat crosses the street directly in front of you.',general:['expecting something bad','an old belief','an animal connected with luck'],specific:['crossing your path','a dark-colored animal','changing direction']},
    {id:'salt',vocabulary:'superstition · bad luck',situation:'You spill salt at dinner and immediately throw some over your shoulder.',general:['an old belief','a small action to prevent bad luck','changing behavior because of a belief'],specific:['at the dinner table','something is spilled','throwing a little behind you']},
    {id:'horseshoe',vocabulary:'good luck charm',situation:'You hang a horseshoe near the door because you believe it brings luck.',general:['trying to attract good luck','an object with symbolic power','keeping something for protection'],specific:['hanging an object','near a door','a curved metal object']},
    {id:'clover',vocabulary:'good luck charm',situation:'You find a four-leaf clover and keep it in your wallet.',general:['trying to attract good luck','keeping a special object','an unusual symbol'],specific:['a plant','four leaves','keeping it with you']},
    {id:'bracelet',vocabulary:'good luck charm',situation:'You wear the same charm bracelet every time you take an important exam.',general:['trying to attract good luck','wearing something special','repeating a ritual'],specific:['jewelry','an important test','wearing it every time']},
    {id:'curse',vocabulary:'curse',situation:'You believe someone wished misfortune on you after an argument.',general:['expecting something bad','believing another person caused it','a negative belief'],specific:['another person is involved','a wish for misfortune','something bad happening afterward']},
    {id:'friday-13',vocabulary:'superstition · bad luck',situation:'You refuse to travel because the date is Friday the 13th.',general:['expecting something bad','changing plans because of a belief','a traditional idea'],specific:['a date on the calendar','the number 13','canceling plans']}
  ]
};

export const phaseText={
  teams:{title:'Teams ready',description:'Students move into their teams and privately reveal their cards.',button:'Start general clues'},
  clue1:{title:'General clue',description:'Each student gives one general clue using a reporting-belief structure.',button:'Start specific clues'},
  clue2:{title:'More specific clue',description:'Each student gives a more specific clue. Do not say the situation directly.',button:'Open voting'},
  vote:{title:'Vote',description:'Students vote on their phones for the impostor in their own team.',button:'Reveal'},
  reveal:{title:'Reveal',description:'The impostor, crew situation and Unit 7 vocabulary are revealed.',button:''}
};

export const teamNames=['Comet','Vinyl','Neon','Disco','Groove','Nova','Starlight','Rocket','Electric','Cosmic'];

export function randomCode(){
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes=crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes,b=>alphabet[b%alphabet.length]).join('');
}

export function randomToken(){
  return crypto.randomUUID().replaceAll('-','');
}

export function randomIndex(max){
  if(max<=1)return 0;
  return crypto.getRandomValues(new Uint32Array(1))[0]%max;
}

export function shuffle(items){
  const out=[...items];
  for(let i=out.length-1;i>0;i--){
    const j=randomIndex(i+1);
    [out[i],out[j]]=[out[j],out[i]];
  }
  return out;
}

export function esc(value){
  return String(value??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));
}

export function scenarioById(category,id){
  return scenarios[category]?.find(item=>item.id===id)||null;
}

export function studentUrl(sessionId){
  const url=new URL(location.origin+'/Rumor-Impostor/');
  url.searchParams.set('session',sessionId);
  return url.toString();
}

export function teacherUrl(sessionId,token){
  const url=new URL(location.origin+'/Rumor-Impostor/teacher/');
  url.searchParams.set('session',sessionId);
  url.searchParams.set('token',token);
  return url.toString();
}
