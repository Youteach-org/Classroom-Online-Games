(function(){
  const $=id=>document.getElementById(id);
  const screens={character:$('characterScreen'),game:$('gameScreen'),result:$('resultScreen')};
  const nameInput=$('playerName'),characterGrid=$('characterGrid'),startBtn=$('startRunnerBtn');
  const TOTAL=12;
  let playerName='',characterIndex=null,runState=null,challenges=[],challengeIndex=0,currentSequence=[],sequenceIndex=0,phaserGame=null,scene=null,startAt=0,timerId=null,paused=false,pauseStartedAt=0,totalPausedMs=0;

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
      const data=art[i]||{name:`RUNNER ${i+1}`,tagline:'SAME SKILLS · SAME SPEED',color:'#36b9ff',accent:'#8ad8ff',pose:'ready'};
      const button=document.createElement('button');button.type='button';button.className='character-card';button.dataset.pose=data.pose||'ready';button.style.setProperty('--runner-color',data.color);button.style.setProperty('--runner-accent',data.accent||data.color);button.setAttribute('aria-pressed',String(characterIndex===i));button.setAttribute('aria-label',`Choose runner ${i+1}`);
      button.innerHTML=`<span class="runner-art" aria-hidden="true"><span class="pack"></span><span class="hair"></span><span class="head"></span><span class="body"></span><span class="arm left"></span><span class="arm right"></span><span class="leg left"></span><span class="leg right"></span><span class="shoe left"></span><span class="shoe right"></span></span><span class="runner-caption"><strong>${data.name}</strong><small>${data.tagline}</small></span>`;
      button.onclick=()=>{characterIndex=i;[...characterGrid.children].forEach((card,index)=>card.setAttribute('aria-pressed',String(index===i)));selectionReady();};
      characterGrid.appendChild(button);
    }
  }

  function buildChallenges(){
    challenges=[];
    const bank=[...VerbRunnerBank.VERBS];
    VerbRunnerChallenge.shuffled(bank).slice(0,TOTAL).forEach(verb=>challenges.push(VerbRunnerChallenge.createChallenge(verb,{bank:VerbRunnerBank.VERBS,distractorCount:3})));
  }
  function renderChallenge(){
    const challenge=challenges[challengeIndex],slotEls=[...document.querySelectorAll('[data-slot]')];
    slotEls.forEach((el,index)=>{const value=challenge.slots[index];el.querySelector('strong').textContent=value?String(value).toUpperCase():'____';el.classList.toggle('blank',value===null);});
    $('challengeNumber').textContent=`${challengeIndex+1} / ${TOTAL}`;
    currentSequence=VerbRunnerChallenge.buildAnswerSequence(challenge,{distractorsBeforeCorrect:2});sequenceIndex=0;queueNextAnswer(420);
  }
  function queueNextAnswer(delay=300){if(challengeIndex>=TOTAL||!scene)return;scene.time.delayedCall(delay,()=>{if(!scene.answer&&sequenceIndex<currentSequence.length)scene.spawnAnswer(currentSequence[sequenceIndex++]);});}
  function retryCorrect(){const challenge=challenges[challengeIndex];currentSequence=VerbRunnerChallenge.buildAnswerSequence(challenge,{distractorsBeforeCorrect:1});sequenceIndex=0;queueNextAnswer(360);}
  function updateHud(){
    $('streakValue').textContent=runState.streak;
    $('momentumValue').textContent=`${runState.momentum}%`;
    $('momentumFill').style.width=`${runState.momentum}%`;
    $('momentumTrack').setAttribute('aria-valuenow',String(runState.momentum));
    $('progressValue').textContent=`${runState.completed} / ${TOTAL}`;
    if(scene)scene.runState=runState;
  }
  function answerHit(item){
    if(item.correct){runState=VerbRunnerGameCore.applyEvent(runState,'correct');setNotice('CORRECT!','correct');updateHud();challengeIndex++;if(challengeIndex>=TOTAL){setTimeout(finish,500);return;}setTimeout(renderChallenge,420);}
    else{runState=VerbRunnerGameCore.applyEvent(runState,'grammar-error');setNotice(`${String(item.value).toUpperCase()} — WRONG FORM`,'wrong');updateHud();queueNextAnswer(360);}
  }
  function answerMissed(item){if(item.correct){setNotice('Correct form missed — it will come back.','info');retryCorrect();}else queueNextAnswer(260);}
  function obstacleHit(type){runState=VerbRunnerGameCore.applyEvent(runState,'obstacle-hit');updateHud();setNotice(type==='crate'?'Obstacle hit — jump!':'Obstacle hit — slide!','obstacle');}

  function tickTimer(){if(!screens.game.hidden)$('raceTime').textContent=formatTime(elapsedNow());timerId=requestAnimationFrame(tickTimer);}
  function setPaused(next){
    if(!scene||paused===next)return;
    paused=next;
    $('pauseOverlay').hidden=!paused;
    $('pauseBtn').setAttribute('aria-label',paused?'Resume game':'Pause game');
    if(paused){pauseStartedAt=performance.now();scene.scene.pause();}
    else{totalPausedMs+=performance.now()-pauseStartedAt;scene.scene.resume();}
  }
  function togglePause(){setPaused(!paused);}

  function start(){
    playerName=cleanName(nameInput.value);
    if(!playerName){$('nameError').textContent='Enter your name to start.';nameInput.focus();return;}
    if(characterIndex===null){$('nameError').textContent='Choose a runner.';return;}
    localStorage.setItem('verbRunnerTestName',playerName);$('nameError').textContent='';syncDisplayMode();
    runState=VerbRunnerGameCore.createRunState(TOTAL);challengeIndex=0;currentSequence=[];sequenceIndex=0;buildChallenges();show(screens.game);updateHud();paused=false;totalPausedMs=0;startAt=performance.now();$('pauseOverlay').hidden=true;
    if(timerId)cancelAnimationFrame(timerId);tickTimer();
    phaserGame=VerbRunnerPhaser.createVerbRunnerGame('phaserMount',{characterIndex,runState,desktop:desktopMode(),callbacks:{ready:s=>{scene=s;renderChallenge();},answerHit,answerMissed,obstacleHit}});
  }
  function finish(){
    if(!runState)return;
    if(paused)setPaused(false);
    scene?.stopRun();if(timerId)cancelAnimationFrame(timerId);
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
