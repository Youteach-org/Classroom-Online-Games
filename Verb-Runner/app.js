(function(){
  const $=id=>document.getElementById(id);
  const screens={entry:$('identityScreen'),character:$('characterScreen'),game:$('gameScreen'),result:$('resultScreen')};
  const nameInput=$('playerName'),enterBtn=$('enterGameBtn'),characterGrid=$('characterGrid'),startBtn=$('startRunnerBtn');
  const TOTAL=12;
  let playerName='',characterIndex=null,runState=null,challenges=[],challengeIndex=0,currentSequence=[],sequenceIndex=0,phaserGame=null,scene=null,startAt=0,timerId=null;

  function finePointer(){return Boolean(window.matchMedia&&window.matchMedia('(pointer:fine)').matches);}
  function syncDisplayMode(){
    const desktop=VerbRunnerRunnerCore.isDesktopViewport(window.innerWidth,window.innerHeight,finePointer());
    document.documentElement.classList.toggle('desktop-game-ui',desktop);
  }
  syncDisplayMode();
  window.addEventListener('resize',syncDisplayMode);

  function show(screen){for(const el of Object.values(screens)){el.hidden=el!==screen;el.classList.toggle('screen-active',el===screen);}scrollTo({top:0,behavior:'instant'});}
  function cleanName(value){return String(value||'').replace(/\s+/g,' ').trim().slice(0,28);}
  function formatTime(ms){const total=Math.max(0,Math.round(ms)),minutes=Math.floor(total/60000),seconds=Math.floor((total%60000)/1000),millis=total%1000;return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(millis).padStart(3,'0')}`;}
  function setNotice(text,kind=''){const el=$('gameNotice');el.textContent=text;el.className=`game-notice ${kind}`.trim();clearTimeout(setNotice.timer);setNotice.timer=setTimeout(()=>{el.textContent='';el.className='game-notice';},900);}

  function enter(){
    playerName=cleanName(nameInput.value);if(!playerName){$('nameError').textContent='Enter your name to start.';nameInput.focus();return;}
    localStorage.setItem('verbRunnerTestName',playerName);$('nameError').textContent='';$('playerNickname').textContent=playerName;show(screens.character);renderCharacters();
  }
  function renderCharacters(){
    const poses=['ready','lean','step','jump','look','sport'];
    characterGrid.innerHTML='';
    for(let i=0;i<6;i++){
      const button=document.createElement('button');button.type='button';button.className='character-card';button.setAttribute('aria-pressed',String(characterIndex===i));button.innerHTML=`<span class="runner-number">Runner ${i+1}</span><span class="avatar-placeholder pose-${poses[i]}"><span class="avatar-head"></span><span class="avatar-body"></span><span class="avatar-arm a1"></span><span class="avatar-arm a2"></span><span class="avatar-leg l1"></span><span class="avatar-leg l2"></span></span>`;
      button.onclick=()=>{characterIndex=i;[...characterGrid.children].forEach((card,index)=>card.setAttribute('aria-pressed',String(index===i)));startBtn.disabled=false;};characterGrid.appendChild(button);
    }
  }
  function buildChallenges(){
    const bank=[...VerbRunnerBank.VERBS];VerbRunnerChallenge.shuffled(bank).slice(0,TOTAL).forEach(verb=>challenges.push(VerbRunnerChallenge.createChallenge(verb,{bank:VerbRunnerBank.VERBS,distractorCount:3})));
  }
  function renderChallenge(){
    const challenge=challenges[challengeIndex],slotEls=[...document.querySelectorAll('[data-slot]')];slotEls.forEach((el,index)=>{const value=challenge.slots[index];el.querySelector('strong').textContent=value?String(value).toUpperCase():'____';el.classList.toggle('blank',value===null);});
    $('challengeNumber').textContent=`${challengeIndex+1} / ${TOTAL}`;
    currentSequence=VerbRunnerChallenge.buildAnswerSequence(challenge,{distractorsBeforeCorrect:2});sequenceIndex=0;queueNextAnswer(420);
  }
  function queueNextAnswer(delay=300){
    if(challengeIndex>=TOTAL||!scene)return;scene.time.delayedCall(delay,()=>{if(!scene.answer&&sequenceIndex<currentSequence.length)scene.spawnAnswer(currentSequence[sequenceIndex++]);});
  }
  function retryCorrect(){
    const challenge=challenges[challengeIndex];currentSequence=VerbRunnerChallenge.buildAnswerSequence(challenge,{distractorsBeforeCorrect:1});sequenceIndex=0;queueNextAnswer(360);
  }
  function updateHud(){
    $('streakValue').textContent=runState.streak;$('momentumValue').textContent=`${runState.momentum}%`;$('momentumFill').style.width=`${runState.momentum}%`;$('momentumTrack').setAttribute('aria-valuenow',String(runState.momentum));$('progressValue').textContent=`${runState.completed} / ${TOTAL}`;if(scene)scene.runState=runState;
  }
  function answerHit(item){
    if(item.correct){runState=VerbRunnerGameCore.applyEvent(runState,'correct');setNotice('CORRECT!','correct');updateHud();challengeIndex++;if(challengeIndex>=TOTAL){setTimeout(finish,500);return;}setTimeout(renderChallenge,420);}
    else{runState=VerbRunnerGameCore.applyEvent(runState,'grammar-error');setNotice(`${String(item.value).toUpperCase()} — NOT THIS FORM`,'wrong');updateHud();queueNextAnswer(360);}
  }
  function answerMissed(item){
    if(item.correct){setNotice('Correct form missed — it will come back.','info');retryCorrect();}else queueNextAnswer(260);
  }
  function obstacleHit(type){runState=VerbRunnerGameCore.applyEvent(runState,'obstacle-hit');updateHud();setNotice(type==='crate'?'Obstacle hit — jump!':'Obstacle hit — slide!','obstacle');}
  function start(){
    syncDisplayMode();runState=VerbRunnerGameCore.createRunState(TOTAL);challenges=[];challengeIndex=0;currentSequence=[];sequenceIndex=0;buildChallenges();show(screens.game);$('hudNickname').textContent=playerName;updateHud();startAt=performance.now();
    if(timerId)cancelAnimationFrame(timerId);const tick=()=>{$('raceTime').textContent=formatTime(performance.now()-startAt);timerId=requestAnimationFrame(tick);};tick();
    phaserGame=VerbRunnerPhaser.createVerbRunnerGame('phaserMount',{characterIndex,runState,callbacks:{ready:s=>{scene=s;renderChallenge();},answerHit,answerMissed,obstacleHit}});
  }
  function finish(){
    if(!runState)return;scene?.stopRun();if(timerId)cancelAnimationFrame(timerId);const elapsed=performance.now()-startAt,result=VerbRunnerGameCore.summarize(runState,elapsed);$('resultNickname').textContent=playerName;$('resultTime').textContent=formatTime(result.timeMs);$('resultAccuracy').textContent=`${result.accuracy}%`;$('resultCorrect').textContent=result.correctLabel;$('resultStreak').textContent=result.bestStreak;$('resultObstacles').textContent=result.obstacleHits;$('resultMomentum').textContent=`${result.momentum}%`;$('victoryRunner').className=`victory-runner runner-${characterIndex}`;show(screens.result);setTimeout(()=>{phaserGame?.destroy(true);phaserGame=null;scene=null;},50);
  }
  function restart(){characterIndex=null;startBtn.disabled=true;show(screens.character);renderCharacters();}

  enterBtn.onclick=enter;nameInput.addEventListener('keydown',event=>{if(event.key==='Enter')enter();});startBtn.onclick=start;$('runAgainBtn').onclick=restart;$('backMenuBtn').onclick=()=>location.assign('/');
  nameInput.value=localStorage.getItem('verbRunnerTestName')||'';
})();
