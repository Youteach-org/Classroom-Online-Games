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

  const selectionImageCache=new Map();
  function rgbToHsv(r,g,b){
    r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=0;
    if(d){if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;if(h<0)h+=360;}
    return [h,max?d/max:0,max];
  }
  function foreignEdgePixel(index,h,s,v,x,w){
    const edge=x<w*.18||x>w*.82;
    if(!edge||s<.16)return false;
    const red=(h<12||h>348)&&s>.52,blue=h>185&&h<245&&s>.32,green=h>75&&h<165&&s>.30,pink=h>315&&h<348&&s>.30,purple=h>250&&h<315&&s>.28;
    if(index===0)return blue||green||purple;
    if(index===1)return red||green||pink||purple;
    if(index===2)return red||blue||pink||purple;
    if(index===3)return green||blue||purple;
    if(index===4)return red||green||pink||purple;
    if(index===5){
      if(x<w*.14&&s<.18)return true;
      return red||green||blue||pink;
    }
    return false;
  }
  function cleanPortrait(dataUrl,index){
    return new Promise((resolve,reject)=>{
      const image=new Image();
      image.onload=()=>{
        const pad=Math.max(8,Math.round(image.width*.035));
        const canvas=document.createElement('canvas');canvas.width=image.width+pad*2;canvas.height=image.height;
        const ctx=canvas.getContext('2d',{willReadFrequently:true});
        ctx.drawImage(image,pad,0);
        const img=ctx.getImageData(0,0,canvas.width,canvas.height),d=img.data;
        const w=canvas.width,h=canvas.height;
        for(let y=0;y<h;y++)for(let x=0;x<w;x++){
          const p=(y*w+x)*4;if(d[p+3]===0)continue;
          const [hh,s,v]=rgbToHsv(d[p],d[p+1],d[p+2]);
          if(foreignEdgePixel(index,hh,s,v,x,w))d[p+3]=0;
        }
        ctx.putImageData(img,0,0);resolve(canvas.toDataURL('image/webp',.92));
      };
      image.onerror=reject;image.src=dataUrl;
    });
  }
  function loadSelectionImage(url,index){
    if(!url)return Promise.reject(new Error('Missing selection portrait'));
    const cacheKey=`${index}:${url}`;if(selectionImageCache.has(cacheKey))return selectionImageCache.get(cacheKey);
    const promise=fetch(url,{cache:'no-store'})
      .then(response=>{if(!response.ok)throw new Error(`${url}: HTTP ${response.status}`);return response.text();})
      .then(encoded=>{const clean=encoded.replace(/\s+/g,'');if(!clean.startsWith('UklG'))throw new Error(`${url}: invalid WebP payload`);return cleanPortrait(`data:image/webp;base64,${clean}`,index);});
    selectionImageCache.set(cacheKey,promise);return promise;
  }

  function renderCharacters(){
    characterGrid.innerHTML='';
    const art=window.VERB_RUNNER_ART||[],sprites=window.VERB_RUNNER_SPRITES||{};
    for(let i=0;i<6;i++){
      const data=art[i]||{color:'#36b9ff',accent:'#8ad8ff'};
      const button=document.createElement('button');button.type='button';button.className='character-card anonymous-runner sprite-card';button.style.setProperty('--runner-color',data.color);button.style.setProperty('--runner-accent',data.accent||data.color);button.setAttribute('aria-pressed',String(characterIndex===i));button.setAttribute('aria-label',`Choose runner ${i+1}`);
      button.innerHTML='<img class="runner-art sprite-runner" alt="" aria-hidden="true" decoding="async">';
      const sprite=button.querySelector('.sprite-runner');
      const portrait=(sprites.selectFrames||[])[i];
      sprite.classList.add('loading');
      if(i===0){
        sprite.src=portrait;
        sprite.onload=()=>sprite.classList.remove('loading');
        sprite.onerror=()=>{console.error('Verb Runner red portrait failed');sprite.classList.remove('loading');sprite.classList.add('failed');};
      }else{
        loadSelectionImage(portrait,i).then(src=>{sprite.src=src;sprite.classList.remove('loading');}).catch(error=>{console.error('Verb Runner portrait failed',error);sprite.classList.remove('loading');sprite.classList.add('failed');});
      }
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
    currentSequence.forEach((item,index)=>{const timer=scene.time.delayedCall(initialDelay+index*ANSWER_SPACING_MS,()=>scene.spawnAnswer(item));answerTimers.push(timer);});
  }
  function renderChallenge(){
    const challenge=challenges[challengeIndex],slotEls=[...document.querySelectorAll('[data-slot]')];
    slotEls.forEach((el,index)=>{const value=challenge.slots[index];el.querySelector('strong').textContent=value?String(value).toUpperCase():'____';el.classList.toggle('blank',value===null);});
    $('challengeNumber').textContent=`${challengeIndex+1} / ${TOTAL}`;
    launchAnswerChain(VerbRunnerChallenge.buildMediumSequence(challenge),300);
  }
  function retryCorrect(){if(challengeIndex>=TOTAL)return;const challenge=challenges[challengeIndex];launchAnswerChain(VerbRunnerChallenge.buildMediumSequence(challenge),420);}
  function updateHud(){
    $('streakValue').textContent=runState.streak;$('momentumValue').textContent=`${runState.momentum}%`;$('momentumFill').style.width=`${runState.momentum}%`;$('momentumTrack').setAttribute('aria-valuenow',String(runState.momentum));$('progressValue').textContent=`${runState.completed} / ${TOTAL}`;if(scene)scene.runState=runState;
  }
  function answerHit(item){
    if(item.correct){cancelAnswerTimers();runState=VerbRunnerGameCore.applyEvent(runState,'correct');setNotice('CORRECT!','correct');updateHud();challengeIndex++;if(challengeIndex>=TOTAL){setTimeout(finish,520);return;}setTimeout(renderChallenge,360);}
    else{runState=VerbRunnerGameCore.applyEvent(runState,'grammar-error');setNotice(`${String(item.value).toUpperCase()} — WRONG FORM`,'wrong');updateHud();}
  }
  function answerMissed(item){if(item.correct){setNotice('Correct form missed — new chain incoming.','info');retryCorrect();}}
  function obstacleHit(type){runState=VerbRunnerGameCore.applyEvent(runState,'obstacle-hit');updateHud();setNotice(type==='crate'?'Obstacle hit — jump!':'Obstacle hit — slide!','obstacle');}

  function tickTimer(){if(!screens.game.hidden)$('raceTime').textContent=formatTime(elapsedNow());timerId=requestAnimationFrame(tickTimer);}
  function setPaused(next){
    if(!scene||paused===next)return;paused=next;$('pauseOverlay').hidden=!paused;$('pauseBtn').setAttribute('aria-label',paused?'Resume game':'Pause game');if(paused){pauseStartedAt=performance.now();scene.pauseRun();}else{totalPausedMs+=performance.now()-pauseStartedAt;scene.resumeRun();}
  }
  function togglePause(){setPaused(!paused);}

  function start(){
    playerName=cleanName(nameInput.value);if(!playerName){$('nameError').textContent='Enter your name to start.';nameInput.focus();return;}if(characterIndex===null){$('nameError').textContent='Choose a runner.';return;}
    localStorage.setItem('verbRunnerTestName',playerName);$('nameError').textContent='';syncDisplayMode();runState=VerbRunnerGameCore.createRunState(TOTAL);challengeIndex=0;currentSequence=[];cancelAnswerTimers();buildChallenges();show(screens.game);updateHud();paused=false;totalPausedMs=0;startAt=performance.now();$('pauseOverlay').hidden=true;if(timerId)cancelAnimationFrame(timerId);tickTimer();
    phaserGame=VerbRunnerPhaser.createVerbRunnerGame('phaserMount',{characterIndex,runState,desktop:desktopMode(),callbacks:{ready:s=>{scene=s;renderChallenge();},answerHit,answerMissed,obstacleHit}});
  }
  function finish(){
    if(!runState)return;if(paused)setPaused(false);cancelAnswerTimers();scene?.stopRun();if(timerId)cancelAnimationFrame(timerId);const elapsed=elapsedNow(),result=VerbRunnerGameCore.summarize(runState,elapsed);$('resultNickname').textContent=playerName;$('resultTime').textContent=formatTime(result.timeMs);$('resultAccuracy').textContent=`${result.accuracy}%`;$('resultCorrect').textContent=result.correctLabel;$('resultStreak').textContent=result.bestStreak;$('resultObstacles').textContent=result.obstacleHits;$('resultMomentum').textContent=`${result.momentum}%`;$('victoryRunner').className=`victory-runner runner-${characterIndex}`;show(screens.result);setTimeout(()=>{phaserGame?.destroy(true);phaserGame=null;scene=null;},50);
  }
  function restart(){characterIndex=null;startBtn.disabled=true;show(screens.character);renderCharacters();selectionReady();}

  nameInput.value=localStorage.getItem('verbRunnerTestName')||'';nameInput.addEventListener('input',selectionReady);nameInput.addEventListener('keydown',event=>{if(event.key==='Enter'&&!startBtn.disabled)start();});startBtn.onclick=start;$('pauseBtn').onclick=togglePause;$('resumeBtn').onclick=()=>setPaused(false);$('runAgainBtn').onclick=restart;$('backMenuBtn').onclick=()=>location.assign('/');
  document.querySelectorAll('.mobile-controls button').forEach(button=>button.addEventListener('pointerdown',event=>{event.preventDefault();if(!scene||paused)return;const action=button.dataset.action;if(action==='left')scene.shift(-1);else if(action==='right')scene.shift(1);else if(action==='jump')scene.jump();else if(action==='slide')scene.slide();}));
  renderCharacters();selectionReady();
})();
