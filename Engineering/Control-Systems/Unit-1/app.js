const byId=id=>document.getElementById(id);
const ui={
  scene:byId('scene'),caption:byId('caption'),kind:byId('kind'),qnum:byId('qnum'),question:byId('question'),answers:byId('answers'),fb:byId('fb'),
  score:byId('scoreEl'),streak:byId('streakEl'),progText:byId('progText'),progFill:byId('progFill'),
  prev:byId('prevBtn'),hint:byId('hintBtn'),summary:byId('summaryBtn'),next:byId('nextBtn'),
  modal:byId('modal'),close:byId('closeBtn'),sumline:byId('sumline'),sumlist:byId('sumlist')
};

const GAME_BANK=Array.isArray(window.QUESTION_BANK)?window.QUESTION_BANK:[];
const GAME_ITEMS=[...GAME_BANK];
for(let i=GAME_ITEMS.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[GAME_ITEMS[i],GAME_ITEMS[j]]=[GAME_ITEMS[j],GAME_ITEMS[i]]}

const gameParams=new URLSearchParams(location.search);
const gameVersion=gameParams.get('v')||'1';
let gameIndex=0,gameUnlocked=0,gameScore=0,gameStreak=0;
const gameAnswers=Array(GAME_ITEMS.length).fill(null);
const gameReview=Array(GAME_ITEMS.length).fill(null);
const gameHinted=Array(GAME_ITEMS.length).fill(false);
const gameOpenText=Array(GAME_ITEMS.length).fill('');
const gameRevealed=Array(GAME_ITEMS.length).fill(false);
const gameSelf=Array(GAME_ITEMS.length).fill(null);
const gameErrors=[];

function setVisual(q){
  ui.scene.innerHTML='';
  ui.caption.textContent=q.caption||'';
  const card=document.querySelector('.visual');
  const main=document.querySelector('.main');
  if(card&&main){
    if(q.scene){card.style.display='';main.style.gridTemplateColumns='';}
    else{card.style.display='none';main.style.gridTemplateColumns='1fr';}
  }
}

function gameDone(i=gameIndex){
  const q=GAME_ITEMS[i];
  if(!q)return false;
  return q.type==='open'?gameSelf[i]!==null:gameAnswers[i]!==null;
}

function gameRefresh(){
  const total=GAME_ITEMS.length||1;
  ui.score.textContent=gameScore;
  ui.streak.textContent=gameStreak;
  ui.progText.textContent=GAME_ITEMS.length?`${gameIndex+1}/${GAME_ITEMS.length}`:'0/0';
  ui.progFill.style.width=GAME_ITEMS.length?`${((gameIndex+1)/total)*100}%`:'0%';
  ui.prev.disabled=gameIndex===0;
  ui.next.disabled=!(gameDone()||gameIndex<gameUnlocked);
}

function gameFeedback(type,title,pts,text,sub){
  ui.fb.className='feedback '+(type||'');
  ui.fb.innerHTML=`<div class="fbrow"><div class="fbtitle">${title}</div><div class="fbpts">${pts||''}</div></div><div class="fbtext">${text||''}</div><div class="fbsub">${sub||''}</div>`;
}

function render(){
  if(!GAME_ITEMS.length){
    ui.question.textContent='No se pudo cargar el banco de preguntas.';
    gameFeedback('bad','Error','','El banco no se cargó correctamente.','Recarga la página.');
    gameRefresh();
    return;
  }
  const q=GAME_ITEMS[gameIndex];
  setVisual(q);
  ui.kind.textContent=q.kind||'';
  ui.qnum.textContent=`Pregunta ${gameIndex+1} de ${GAME_ITEMS.length}`;
  ui.question.textContent=q.q||'';
  q.type==='open'?renderOpen():renderMCQ();
  gameRefresh();
}

function renderMCQ(){
  const q=GAME_ITEMS[gameIndex];
  ui.answers.className='answers mcq';
  ui.answers.innerHTML='';
  q.options.forEach((label,i)=>{
    const btn=document.createElement('button');
    btn.className='opt';
    btn.innerHTML=`<div class="mark">${String.fromCharCode(65+i)}</div><div>${label}</div>`;
    if(gameAnswers[gameIndex]===null){
      btn.onclick=()=>gameAnswer(i);
    }else{
      if(i===q.correct)btn.classList.add('correct');
      if(i===gameAnswers[gameIndex]&&i!==q.correct)btn.classList.add('wrong');
      if(gameReview[gameIndex]===i&&i!==q.correct&&i!==gameAnswers[gameIndex])btn.classList.add('review');
      btn.onclick=()=>gameWhy(i);
    }
    ui.answers.appendChild(btn);
  });
  if(gameAnswers[gameIndex]===null){
    gameFeedback('','Listo','0 pts','Elige la opción más precisa.','Después de responder puedes tocar cualquier opción para revisar por qué es correcta o incorrecta.');
  }else{
    gameWhy(gameReview[gameIndex]!==null?gameReview[gameIndex]:gameAnswers[gameIndex],false);
  }
}

function gameAnswer(i){
  const q=GAME_ITEMS[gameIndex];
  if(gameAnswers[gameIndex]!==null)return;
  gameAnswers[gameIndex]=i;
  gameReview[gameIndex]=i;
  if(i===q.correct){
    const gain=Math.max(40,100+gameStreak*15-(gameHinted[gameIndex]?25:0));
    gameScore+=gain;
    gameStreak++;
  }else{
    gameStreak=0;
    gameErrors.push({q:q.q,got:q.options[i],correct:q.options[q.correct]});
  }
  gameUnlocked=Math.max(gameUnlocked,gameIndex+1);
  renderMCQ();
  gameRefresh();
}

function gameWhy(i,repaint=true){
  const q=GAME_ITEMS[gameIndex];
  gameReview[gameIndex]=i;
  if(repaint)renderMCQ();
  const good=i===q.correct;
  const chosen=i===gameAnswers[gameIndex];
  const why=Array.isArray(q.why)?(q.why[i]||''):'';
  if(good)gameFeedback('good',chosen?'Correcto':'Respuesta correcta','',why,'Toca los distractores para revisar por qué fallan.');
  else if(chosen)gameFeedback('bad','Tu respuesta','',why,'La correcta está marcada en verde. Toca las demás para revisarlas.');
  else gameFeedback('warn','Distractor revisado','',why,'Revisa el detalle que hace incorrecta esta opción.');
  gameRefresh();
}

function renderOpen(){
  const q=GAME_ITEMS[gameIndex];
  ui.answers.className='answers';
  ui.answers.innerHTML='';
  const ta=document.createElement('textarea');
  ta.placeholder='Escribe tu respuesta y argumento…';
  ta.value=gameOpenText[gameIndex];
  ta.oninput=e=>gameOpenText[gameIndex]=e.target.value;
  ui.answers.appendChild(ta);

  const row=document.createElement('div');
  row.className='openActions';
  const reveal=document.createElement('button');
  reveal.className='btn blue';
  reveal.textContent=gameRevealed[gameIndex]?'Modelo visible':'Ver respuesta modelo';
  reveal.onclick=()=>{gameRevealed[gameIndex]=true;renderOpen()};
  row.appendChild(reveal);
  ui.answers.appendChild(row);

  if(gameRevealed[gameIndex]){
    const model=document.createElement('div');
    model.className='model';
    model.innerHTML='<b>Respuesta modelo:</b> '+(q.model||'');
    ui.answers.appendChild(model);

    const criteria=document.createElement('div');
    criteria.className='criteria';
    criteria.innerHTML=(q.criteria||[]).map(x=>`<div class="crit">✓ ${x}</div>`).join('');
    ui.answers.appendChild(criteria);

    if(gameSelf[gameIndex]===null){
      const assessRow=document.createElement('div');
      assessRow.className='openActions';
      const yes=document.createElement('button');
      yes.className='btn accent';
      yes.textContent='La tengo ✓';
      yes.onclick=()=>gameAssess(true);
      const no=document.createElement('button');
      no.className='btn ghost';
      no.textContent='Me faltó';
      no.onclick=()=>gameAssess(false);
      assessRow.append(yes,no);
      ui.answers.appendChild(assessRow);
    }else{
      gameFeedback(gameSelf[gameIndex]?'good':'bad',gameSelf[gameIndex]?'Bien':'Para repasar','',gameSelf[gameIndex]?'Tu respuesta quedó marcada como lograda.':'Esta pregunta quedó registrada para repasar.','Compara tu argumento con los criterios.');
    }
  }else{
    gameFeedback('','Respuesta libre','0 pts','Escribe primero tu ejemplo o argumento.','Después muestra el modelo y autoevalúate.');
  }
  gameRefresh();
}

function gameAssess(ok){
  if(gameSelf[gameIndex]!==null)return;
  const q=GAME_ITEMS[gameIndex];
  gameSelf[gameIndex]=ok;
  if(ok){gameScore+=100;gameStreak++;}
  else{gameStreak=0;gameErrors.push({q:q.q,got:gameOpenText[gameIndex]||'(sin respuesta)',correct:q.model||''});}
  gameUnlocked=Math.max(gameUnlocked,gameIndex+1);
  renderOpen();
  gameRefresh();
}

function gameHint(){
  if(gameDone())return;
  if(!gameHinted[gameIndex]){gameScore=Math.max(0,gameScore-25);gameHinted[gameIndex]=true;}
  gameFeedback('warn','Pista','-25 pts',GAME_ITEMS[gameIndex].hint||'Revisa la definición y elimina opciones que mezclan clasificaciones distintas.','Solo se descuenta una vez.');
  gameRefresh();
}

function gamePrev(){if(gameIndex>0){gameIndex--;render();}}
function gameNext(){
  if(!gameDone()&&gameIndex>=gameUnlocked)return;
  if(gameIndex<GAME_ITEMS.length-1){gameIndex++;render();}
  else gameSummary();
}

function gameSummary(){
  ui.modal.classList.add('show');
  ui.sumline.textContent=`Versión ${gameVersion} · Puntos: ${gameScore} · Racha actual: ${gameStreak} · Para repasar: ${gameErrors.length}`;
  ui.sumlist.innerHTML='';
  if(!gameErrors.length){ui.sumlist.innerHTML='<div class="sumitem"><b>Sin errores registrados.</b></div>';return;}
  gameErrors.forEach((e,i)=>{
    const d=document.createElement('div');
    d.className='sumitem';
    d.innerHTML=`<b>${i+1}. ${e.q}</b><br><br><span style="color:#607595">Tu respuesta:</span> ${e.got}<br><span style="color:#607595">Correcta / modelo:</span> ${e.correct}`;
    ui.sumlist.appendChild(d);
  });
}

ui.prev.onclick=gamePrev;
ui.next.onclick=gameNext;
ui.hint.onclick=gameHint;
ui.summary.onclick=gameSummary;
ui.close.onclick=()=>ui.modal.classList.remove('show');
ui.modal.onclick=e=>{if(e.target===ui.modal)ui.modal.classList.remove('show')};
render();
