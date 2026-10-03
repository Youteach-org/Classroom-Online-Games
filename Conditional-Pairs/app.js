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

const app=initializeApp(firebaseConfig);
const db=getDatabase(app);
const root='classroomGames/supportMeter/conditionalPairs';

const pairs=[
  [
    "If people don't get enough sleep during the week and stay up using their phones,",
    "they usually feel exhausted in class and have trouble paying attention to what the teacher says."
  ],
  [
    "If we leave early tomorrow and the traffic doesn't get backed up on the main road,",
    "we'll get there on time and we won't have to make a big deal out of being late again."
  ],
  [
    "If my log-on credentials were stronger and I used a different password for every account,",
    "I would feel more secure online and wouldn't worry so much about someone getting into my accounts."
  ],
  [
    "If she were using a password manager and two-factor authentication on all her accounts,",
    "she wouldn't be worrying about identity theft every time she receives a strange security alert."
  ],
  [
    "If they had checked the hotel Wi-Fi before sending personal information over the Internet,",
    "they would have realized the network wasn't secure and wouldn't have taken such an unnecessary risk."
  ],
  [
    "If I hadn't been downloading files from a source I didn't trust yesterday afternoon,",
    "I wouldn't have been dealing with malware on my laptop for the rest of the evening."
  ],
  [
    "If we had taken the earlier bus instead of waiting around at the station yesterday,",
    "we wouldn't be stuck in this traffic now trying to figure out how to get there on time."
  ],
  [
    "If he weren't always shrugging problems off instead of dealing with them when they happen,",
    "he wouldn't have gotten so frustrated yesterday and lost his temper with everyone in the group."
  ],
  [
    "If you should receive a fraud alert while you are using public Wi-Fi somewhere,",
    "take it seriously and check your account before deciding that the warning is a little over the top."
  ]
];

const sentences=pairs.flat();
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const sessionId=params.get('session');

function randomCode(){
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes=crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes,b=>alphabet[b%alphabet.length]).join('');
}

function shuffle(items){
  const a=[...items];
  for(let i=a.length-1;i>0;i--){
    const b=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);
    [a[i],a[b]]=[a[b],a[i]];
  }
  return a;
}

function getClientId(){
  const key='conditional-pairs-client-id';
  let id=localStorage.getItem(key);
  if(!id){
    id=crypto.randomUUID();
    localStorage.setItem(key,id);
  }
  return id;
}

function assignmentCacheKey(id){
  return 'conditional-pairs-assignment:'+id;
}

async function createRound(){
  const btn=$('createRoundBtn');
  const total=Number($('cardCount')?.value||18);
  const pairCount=Math.max(1,Math.min(pairs.length,total/2));
  btn.disabled=true;
  $('teacherStatus').textContent='Creating round...';

  try{
    let id;
    for(let attempts=0;attempts<8;attempts++){
      id=randomCode();
      const snap=await get(ref(db,root+'/sessions/'+id));
      if(!snap.exists())break;
      id=null;
    }
    if(!id)throw new Error('Could not create a unique round code.');

    const chosenPairs=shuffle([...Array(pairs.length).keys()]).slice(0,pairCount);
    const chosenSentenceIndexes=[];
    for(const pairIndex of chosenPairs){
      chosenSentenceIndexes.push(pairIndex*2,pairIndex*2+1);
    }
    const order=shuffle(chosenSentenceIndexes);

    await set(ref(db,root+'/sessions/'+id),{
      status:'open',
      createdAt:Date.now(),
      totalCards:order.length,
      selectedPairs:chosenPairs,
      nextIndex:0,
      order,
      assignments:{}
    });

    localStorage.setItem('conditional-pairs-teacher-session',id);
    showTeacherRound(id);
    $('teacherStatus').textContent='Round ready.';
  }catch(err){
    console.error(err);
    $('teacherStatus').textContent='Could not create the round. Try again.';
  }finally{
    btn.disabled=false;
  }
}

function showTeacherRound(id){
  const url=new URL(location.href);
  url.search='';
  url.hash='';
  url.searchParams.set('session',id);

  $('studentLink').textContent=url.toString();
  $('teacherRound').classList.remove('hidden');
  $('copyLinkBtn').classList.remove('hidden');
  $('closeRoundBtn')?.classList.remove('hidden');

  const sessionRef=ref(db,root+'/sessions/'+id);
  onValue(sessionRef,snap=>{
    const data=snap.val()||{};
    const count=data.assignments?Object.keys(data.assignments).length:0;
    const total=Number(data.totalCards||18);
    $('assignedCount').textContent=String(Math.min(count,total));
    if($('roundTotal'))$('roundTotal').textContent=String(total);

    if(data.status==='closed'){
      $('teacherStatus').textContent='Round closed.';
      $('closeRoundBtn')?.classList.add('hidden');
      $('copyLinkBtn')?.classList.add('hidden');
    }
  });
}

async function assignStudent(id){
  $('studentView').classList.remove('hidden');
  const clientId=getClientId();
  const localKey=assignmentCacheKey(id);

  const cached=localStorage.getItem(localKey);
  if(cached!==null){
    const idx=Number(cached);
    if(Number.isInteger(idx)&&sentences[idx]){
      showSentence(idx);
      return;
    }
  }

  const sessionRef=ref(db,root+'/sessions/'+id);

  try{
    // Important: fetch the session before starting a transaction.
    // A fresh RTDB client may otherwise invoke the transaction callback with null
    // before server state has been loaded and abort a valid round.
    const initialSnap=await get(sessionRef);
    if(!initialSnap.exists()||initialSnap.val()?.status!=='open'){
      throw new Error('This round is no longer available.');
    }

    const result=await runTransaction(sessionRef,current=>{
      if(!current||current.status!=='open')return current;

      current.assignments=current.assignments||{};
      if(current.assignments[clientId]!==undefined){
        return current;
      }

      const next=Number(current.nextIndex||0);
      const order=Array.isArray(current.order)?current.order:Object.values(current.order||{});
      const total=Number(current.totalCards||order.length||18);

      if(next>=total||next>=order.length){
        return current;
      }

      current.assignments[clientId]=Number(order[next]);
      current.nextIndex=next+1;
      return current;
    });

    const data=result.snapshot.val();
    if(!data||data.status!=='open'){
      throw new Error('This round is no longer available.');
    }

    if(data.assignments&&data.assignments[clientId]!==undefined){
      const assignedIndex=Number(data.assignments[clientId]);
      localStorage.setItem(localKey,String(assignedIndex));
      showSentence(assignedIndex);
      return;
    }

    const total=Number(data.totalCards||18);
    if(Number(data.nextIndex||0)>=total){
      throw new Error('All cards for this round have already been assigned.');
    }

    throw new Error('Could not assign a sentence. Please reload once.');
  }catch(err){
    console.error(err);
    showStudentError(err.message||'Could not get your sentence.');
  }
}

function showSentence(index){
  $('loadingText').classList.add('hidden');
  $('studentError').classList.add('hidden');
  $('studentClosed')?.classList.add('hidden');
  $('sentenceText').textContent=sentences[index];
  $('assignment').classList.remove('hidden');
}

function watchRoundStatus(id){
  const sessionRef=ref(db,root+'/sessions/'+id);
  onValue(sessionRef,snap=>{
    const data=snap.val();
    if(!data||data.status==='closed'){
      $('loadingText').classList.add('hidden');
      $('assignment').classList.add('hidden');
      $('studentError').classList.add('hidden');
      $('studentClosed')?.classList.remove('hidden');
    }
  });
}

function showStudentError(message){
  $('loadingText').classList.add('hidden');
  $('assignment').classList.add('hidden');
  $('studentErrorText').textContent=message;
  $('studentError').classList.remove('hidden');
}

$('createRoundBtn')?.addEventListener('click',createRound);
$('copyLinkBtn')?.addEventListener('click',async()=>{
  try{
    await navigator.clipboard.writeText($('studentLink').textContent);
    $('teacherStatus').textContent='Student link copied.';
  }catch{
    $('teacherStatus').textContent='Copy the link shown above.';
  }
});

$('closeRoundBtn')?.addEventListener('click',async()=>{
  const id=localStorage.getItem('conditional-pairs-teacher-session');
  if(!id)return;
  $('closeRoundBtn').disabled=true;
  $('teacherStatus').textContent='Closing round...';
  try{
    await update(ref(db,root+'/sessions/'+id),{
      status:'closed',
      closedAt:Date.now()
    });
    $('teacherStatus').textContent='Round closed.';
    $('closeRoundBtn').classList.add('hidden');
    $('copyLinkBtn').classList.add('hidden');
  }catch(err){
    console.error(err);
    $('teacherStatus').textContent='Could not close the round. Try again.';
    $('closeRoundBtn').disabled=false;
  }
});

if(sessionId){
  const normalizedSession=sessionId.trim().toUpperCase();
  assignStudent(normalizedSession);
  watchRoundStatus(normalizedSession);
}else{
  $('teacherView').classList.remove('hidden');
  const last=localStorage.getItem('conditional-pairs-teacher-session');
  if(last){
    get(ref(db,root+'/sessions/'+last)).then(snap=>{
      if(snap.exists()&&snap.val()?.status==='open'){
        showTeacherRound(last);
        $('teacherStatus').textContent='Last open round restored.';
      }
    }).catch(()=>{});
  }
}
