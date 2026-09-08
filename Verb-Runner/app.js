(function(){
  const $=id=>document.getElementById(id);
  const screens={character:$('characterScreen'),game:$('gameScreen'),result:$('resultScreen')};
  const nameInput=$('playerName'),characterGrid=$('characterGrid'),startBtn=$('startRunnerBtn');
  const TOTAL=12;
  const ANSWER_SPACING_MS=820;
  let playerName='',characterIndex=null,runState=null,challenges=[],challengeIndex=0,currentSequence=[],phaserGame=null,scene=null,startAt=0,timerId=null,paused=false,pauseStartedAt=0,totalPausedMs=0,answerTimers=[];

  function finePointer(){return Boolean(window.matchMedia&&window.matchMedia('(pointer:fine)').matches);}
  function desktopMode(){return VerbRunnerRunnerCore.isDesktopViewport(window.innerWidth,window.innerHeight,finePointer());}
  function syncDisplayMode(){
    const desktop=desktopMode();
    document.documentElement.classList.toggle('desktop-game-ui',desktop);
    $('gameStage')?.classList.toggle('desktop-game-ui',desktop);
  }
  syncDisplayMode();
  window.addEventListener('resize',syncDisplayMode);

  function show(screen){for(const el of Object.values(screens)){el.hidden=el!==screen;el.classList.toggle('screen-active',el===screen);}scrollTo({top:0,behavior:'instant'});}
  function cleanName(value){return String(value||'').replace(/\s+/g,' ').trim().slice(0,28);}
  function formatTime(ms){const total=Math.max(0,Math.round(ms)),minutes=Math.floor(total/60000),seconds=Math.floor((total%60000)/1000),millis=total%1000;return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(millis).padStart(3,'0')}`;}
  function elapsedNow(){const now=paused?pauseStartedAt:performance.now();return Math.max(0,now-startAt-totalPausedMs);}
  function setNotice(text,kind=''){const el=$('gameNotice');el.textContent=text;el.className=`game-notice ${kind}`.trim();clearTimeout(setNotice.timer);setNotice.timer=setTimeout(()=>{el.textContent='';el.className='game-notice';},900);}
  function selectionReady(){playerName=cleanName(nameInput.value);startBtn.disabled=!(playerName&&characterIndex!==null);$('nameError').textContent=nameInput.value&&!playerName?'Enter a valid name.':'';}

  function renderCharacters(){
    characterGrid.innerHTML='';
    const art=window.VERB_RUNNER_ART||[];
    for(let i=0;i<6;i++){
      const data=art[i]||{color:'#36b9ff',accent:'#8ad8ff',pose:'ready'};
      const button=document.createElement('button');button.type='button';button.className='character-card anonymous-runner';button.dataset.pose=data.pose||'ready';button.style.setProperty('--runner-color',data.color);button.style.setProperty('--runner-accent',data.accent||data.color);button.setAttribute('aria-pressed',String(characterIndex===i));button.setAttribute('aria-label',`Choose runner ${i+1}`);
      button.innerHTML='<span class="runner-art" aria-hidden="true"><span class="pack"></span><span class="hair"></span><span class="head"></span><span class="body"></span><span class="arm left"></span><span class="arm right"></span><span class="leg left"></span><span class="leg right"></span><span class="shoe left"></span><span class="shoe right"></span></span>';
      button.onclick=()=>{characterIndex=i;[...characterGrid.children].forEach((card,index)=>card.setAttribute('aria-pressed',String(index===i)));selectionReady();};
      characterGrid.appendChild(button);
    }
  }

  function buildChallenges(){
    challenges=[];
    const bank=[...VerbRunnerBank.VERBS];
    VerbRunnerChallenge.shuffled(bank).slice(0,TOTAL).forEach(verb=>challenges.push(VerbRunnerChallenge.createChallenge(verb,{bank:VerbRunnerBank.VERBS,distractorCount:5})));
  }
  function cancelAnswerTimers(){for(const timer of answerTimers)timer?.remove?.(false);answerTimers=[];}
  function launchAnswerChain(sequence,initialDelay=260){
    if(!scene||challengeIndex>=TOTAL)return;
    cancelAnswerTimers();scene.clearAnswers();currentSequence=[...sequence];
    currentSequence.forEach((item,index)=>{
      const timer=scene.time.delayedCall(initialDelay+index*ANSWER_SPACING_MS,()=>scene.spawnAnswer(item));
      answerTimers.push(timer);
    });
  }
  function renderChallenge(){
    const challenge=challenges[challengeIndex],slotEls=[...document.querySelectorAll('[data-slot]')];
    slotEls.forEach((el,index)=>{const value=challenge.slots[index];el.querySelector('strong').textContent=value?String(value).toUpperCase():'____';el.classList.toggle('blank',value===null);});
    $('challengeNumber').textContent=`${challengeIndex+1} / ${TOTAL}`;
    launchAnswerChain(VerbRunnerChallenge.buildMediumSequence(challenge),300);
  }
  function retryCorrect(){
    if(challengeIndex>=TOTAL)return;
    const challenge=challenges[challengeIndex];
    launchAnswerChain(VerbRunnerChallenge.buildMediumSequence(challenge),420);
  }
  function updateHud(){
    $('streakValue').textContent=runState.streak;
    $('momentumValue').textContent=`${runState.momentum}%`;
    $('momentumFill').style.width=`${runState.momentum}%`;
    $('momentumTrack').setAttribute('aria-valuenow',String(runState.momentum));
    $('progressValue').textContent=`${runState.completed} / ${TOTAL}`;
    if(scene)scene.runState=runState;
  }
  function answerHit(item){
    if(item.correct){
      cancelAnswerTimers();runState=VerbRunnerGameCore.applyEvent(runState,'correct');setNotice('CORRECT!','correct');updateHud();challengeIndex++;
      if(challengeIndex>=TOTAL){setTimeout(finish,520);return;}
      setTimeout(renderChallenge,360);
    }else{
      runState=VerbRunnerGameCore.applyEvent(runState,'grammar-error');setNotice(`${String(item.value).toUpperCase()} — WRONG FORM`,'wrong');updateHud();
    }
  }
  function answerMissed(item){if(item.correct){setNotice('Correct form missed — new chain incoming.','info');retryCorrect();}}
  function obstacleHit(type){runState=VerbRunnerGameCore.applyEvent(runState,'obstacle-hit');updateHud();setNotice(type==='crate'?'Obstacle hit — jump!':'Obstacle hit — slide!','obstacle');}

  function tickTimer(){if(!screens.game.hidden)$('raceTime').textContent=formatTime(elapsedNow());timerId=requestAnimationFrame(tickTimer);}
  function setPaused(next){
    if(!scene||paused===next)return;
    paused=next;
    $('pauseOverlay').hidden=!paused;
    $('pauseBtn').setAttribute('aria-label',paused?'Resume game':'Pause game');
    if(paused){pauseStartedAt=performance.now();scene.pauseRun();}
    else{totalPausedMs+=performance.now()-pauseStartedAt;scene.resumeRun();}
  }
  function togglePause(){setPaused(!paused);}

  function start(){
    playerName=cleanName(nameInput.value);
    if(!playerName){$('nameError').textContent='Enter your name to start.';nameInput.focus();return;}
    if(characterIndex===null){$('nameError').textContent='Choose a runner.';return;}
    localStorage.setItem('verbRunnerTestName',playerName);$('nameError').textContent='';syncDisplayMode();
    runState=VerbRunnerGameCore.createRunState(TOTAL);challengeIndex=0;currentSequence=[];cancelAnswerTimers();buildChallenges();show(screens.game);updateHud();paused=false;totalPausedMs=0;startAt=performance.now();$('pauseOverlay').hidden=true;
    if(timerId)cancelAnimationFrame(timerId);tickTimer();
    phaserGame=VerbRunnerPhaser.createVerbRunnerGame('phaserMount',{characterIndex,runState,desktop:desktopMode(),callbacks:{ready:s=>{scene=s;renderChallenge();},answerHit,answerMissed,obstacleHit}});
  }
  function finish(){
    if(!runState)return;
    if(paused)setPaused(false);
    cancelAnswerTimers();scene?.stopRun();if(timerId)cancelAnimationFrame(timerId);
    const elapsed=elapsedNow(),result=VerbRunnerGameCore.summarize(runState,elapsed);
    $('resultNickname').textContent=playerName;$('resultTime').textContent=formatTime(result.timeMs);$('resultAccuracy').textContent=`${result.accuracy}%`;$('resultCorrect').textContent=result.correctLabel;$('resultStreak').textContent=result.bestStreak;$('resultObstacles').textContent=result.obstacleHits;$('resultMomentum').textContent=`${result.momentum}%`;$('victoryRunner').className=`victory-runner runner-${characterIndex}`;
    show(screens.result);setTimeout(()=>{phaserGame?.destroy(true);phaserGame=null;scene=null;},50);
  }
  function restart(){characterIndex=null;startBtn.disabled=true;show(screens.character);renderCharacters();selectionReady();}

  nameInput.value=localStorage.getItem('verbRunnerTestName')||'';
  nameInput.addEventListener('input',selectionReady);
  nameInput.addEventListener('keydown',event=>{if(event.key==='Enter'&&!startBtn.disabled)start();});
  startBtn.onclick=start;$('pauseBtn').onclick=togglePause;$('resumeBtn').onclick=()=>setPaused(false);$('runAgainBtn').onclick=restart;$('backMenuBtn').onclick=()=>location.assign('/');
  document.querySelectorAll('.mobile-controls button').forEach(button=>button.addEventListener('pointerdown',event=>{event.preventDefault();if(!scene||paused)return;const action=button.dataset.action;if(action==='left')scene.shift(-1);else if(action==='right')scene.shift(1);else if(action==='jump')scene.jump();else if(action==='slide')scene.slide();}));
  renderCharacters();selectionReady();
})();
