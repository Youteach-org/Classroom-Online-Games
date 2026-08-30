import {resolveJoinToken,createRun,updateRun,completeRun,appendResponse,watchRun,deleteRun,cleanupExpiredFreeRuns} from './firebase-client.js';

(() => {
  const cfg = window.SUPPORT_METER_CONFIG || {};
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const lang = window.SupportMeterLanguage;
  const questionFeeling = lang.questionFeeling;
  const questionExpression = lang.questionExpression;
  const pronounForms = lang.forms;
  const core = window.SupportMeterCore;
  const allExpressions = core.allExpressions;
  const expressionCategory = core.expressionCategory;
  function selectRandomSet(random=Math.random){return Math.floor(random()*3)+1;}
  function encodeStory(setId,storyId){return setId*10+storyId;}
  const joinToken=core.parseJoinToken(location.search);
  let selectedSet=selectRandomSet();
  let stories=core.buildRun({setNumber:selectedSet,assigned:false});
  let stopWatchingRun=null;

  const feelingHints = {
    Frustration:['Frustration describes the person who is fed up or upset because something is not working.','Look for the person who wants to stop because repeated attempts have failed.'],
    Empathy:['Empathy is about understanding another person’s difficult experience.','Look for the character who is listening and recognizing how hard the situation is for someone else.'],
    Encouragement:['Encouragement pushes someone to continue or stay strong.','Look for the character who is trying to help another person keep going.']
  };
  const expressionMeaning = {
    "I'm at my wits' end.":'This is something a person says about their own extreme frustration when they do not know what else to do.',
    "I've had it.":'This is something a person says when they are completely fed up with a situation.',
    'I give up.':'This is something a person says when they decide to stop trying.',
    'That must be tough.':'This is said to another person to recognize that their situation is difficult.',
    'I hear you.':'This tells another person that you are listening and understand how they feel.',
    'Hang in there.':'This encourages another person to stay strong through a difficult moment.',
    "Don't give up.":'This directly encourages another person not to stop trying.',
    'Stick with it.':'This encourages another person to keep working on a task or skill.'
  };

  const el = {
    start:$('#startScreen'),game:$('#game'),name:$('#studentName'),code:$('#classCode'),startBtn:$('#startBtn'),startError:$('#startError'),
    frames:$('#storyFrames'),feelings:$('#feelings'),expressions:$('#expressions'),feelingTitle:$('#feelingTitle'),expressionTitle:$('#expressionTitle'),
    meterFill:$('#meterFill'),meterValue:$('#meterValue'),streak:$('#streakValue'),story:$('#storyValue'),
    coachToggle:$('#coachToggle'),coachToggleState:$('#coachToggleState'),submit:$('#submitBtn'),next:$('#nextBtn'),
    feedback:$('#feedback'),coachImage:$('#coachImage'),feedbackTitle:$('#feedbackTitle'),feedbackText:$('#feedbackText'),feedbackClose:$('#feedbackClose'),
    studentMenu:$('#studentMenuBtn'),mobileStudentMenu:$('#mobileStudentMenuBtn'),mobilePlayerName:$('#mobilePlayerName'),desktopPlayerName:$('#desktopPlayerName'),mobileCoachToggle:$('#mobileCoachToggle'),mobileCoachToggleState:$('#mobileCoachToggleState'),exitDialog:$('#exitDialog'),exitCancel:$('#exitCancel'),exitConfirm:$('#exitConfirm'),exitError:$('#exitError'),
    redirectDialog:$('#redirectDialog'),redirectMessage:$('#redirectMessage'),redirectAccept:$('#redirectAccept'),translationDialog:$('#translationDialog'),translationMessage:$('#translationMessage'),translationCheck:$('#translationCheck'),
    gameShell:$('.game-shell'),resultScreen:$('#resultScreen'),resultStudentName:$('#resultStudentName'),resultSetLine:$('#resultSetLine'),resultMeter:$('#resultMeter'),resultStreak:$('#resultStreak'),resultCompleted:$('#resultCompleted'),resultCode:$('#resultCode'),resultCanvas:$('#resultCanvas'),downloadResult:$('#downloadResult'),finishedStudentMenu:$('#finishedStudentMenu')
  };

  const state = {storyIndex:0,selectedFeeling:null,selectedExpression:null,wrongFeelings:[],wrongExpressions:[],attempt:1,meter:0,streak:0,coachEnabled:true,resolved:false,completed:false,started:false,runId:null,sessionId:'free',studentName:'',classCode:cfg.defaultClassCode||'CONNECT5',controlGeneration:0,pendingRedirect:null,translationAttemptCount:0,translationBlocked:false,resultData:null};
  el.code.value = state.classCode;

  function story(){ return stories[state.storyIndex]; }
  function questionForFeeling(s){return ({Frustration:`What is ${s.targetName} feeling?`,Empathy:`What is ${s.targetName} showing?`,Encouragement:`What is ${s.targetName} offering?`})[s.feeling];}
  function asset(id,frame){return `assets/stories-v16/set-${selectedSet}/story-${id}-frame-${frame}.webp`;}
  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function renderStory(){
    const s=story();
    el.frames.innerHTML='';
    s.frames.forEach((caption,i)=>{
      const card=document.createElement('div');card.className=`story-frame story-${s.id} frame-${i+1}`;card.style.setProperty('--frame-bg',`url("${asset(s.id,i+1)}")`);
      const speech=(i===2)?`<div id="frameSpeech" class="speech speech-position-${escapeHtml(s.speechPosition)} empty">${state.selectedExpression?escapeHtml(state.selectedExpression):''}</div>`:'';
      card.innerHTML=`<div class="story-visual" style="--scene-image:url(&quot;${asset(s.id,i+1)}&quot;)"><img class="story-image" src="${asset(s.id,i+1)}" alt="Story ${s.id}, scene ${i+1}"><div class="frame-num">${i+1}</div>${speech}</div><div class="caption">${escapeHtml(caption)}</div>${i<2?'<div class="story-arrow">➜</div>':''}`;
      el.frames.appendChild(card);
    });
    el.feelingTitle.textContent=questionForFeeling(s);
    el.expressionTitle.textContent=`What would ${s.targetName} say?`;
    renderFeelings();renderExpressions();updateHud();hideFeedback();
  }
  function renderFeelings(){
    $$('#feelings button').forEach(b=>{const f=b.dataset.feeling;b.classList.toggle('selected',state.selectedFeeling===f);b.classList.toggle('eliminated',state.wrongFeelings.includes(f));b.disabled=state.resolved||state.wrongFeelings.includes(f);b.onclick=()=>{state.selectedFeeling=f;hideFeedback();renderFeelings();live(`Selected feeling: ${f}`,'choosing');};});
  }
  function renderExpressions(){
    el.expressions.innerHTML='';
    story().options.forEach(x=>{const b=document.createElement('button');b.type='button';b.textContent=x;b.classList.toggle('selected',state.selectedExpression===x);b.classList.toggle('eliminated',state.wrongExpressions.includes(x));b.disabled=state.resolved||state.wrongExpressions.includes(x);b.onclick=()=>{state.selectedExpression=x;hideFeedback();renderStorySpeech();renderExpressions();live(`Selected expression: ${x}`,'choosing');};el.expressions.appendChild(b);});
  }
  function renderStorySpeech(){const sp=$('#frameSpeech');if(!sp)return;sp.textContent=state.selectedExpression||'';sp.classList.toggle('empty',!state.selectedExpression);}
  function updateHud(){el.meterFill.style.width=`${state.meter}%`;el.meterValue.textContent=`${Math.round(state.meter)}%`;el.streak.textContent=state.streak;el.story.textContent=`${state.storyIndex+1} / ${stories.length}`;}
  function renderCoachToggle(){const value=state.coachEnabled?'ON':'OFF';el.coachToggleState.textContent=value;el.coachToggle.setAttribute('aria-pressed',String(state.coachEnabled));if(el.mobileCoachToggleState)el.mobileCoachToggleState.textContent=value;if(el.mobileCoachToggle)el.mobileCoachToggle.setAttribute('aria-pressed',String(state.coachEnabled));}
  function renderPlayerName(){const label=`Playing as: ${state.studentName}`;el.mobilePlayerName.textContent=label;el.desktopPlayerName.textContent=label;}
  function setCoachVisible(){
    el.feedback.classList.toggle('coach-disabled',!state.coachEnabled);
  }
  function hideFeedback(){el.feedback.classList.add('hidden');}
  function showFeedback(kind,title,text){
    el.feedback.classList.remove('correct','wrong','hidden');el.feedback.classList.add(kind);
    el.coachImage.src=kind==='correct'?'assets/coach_happy_clean_v2.png':'assets/coach_wrong_clean_v2.png';
    el.coachImage.alt=kind==='correct'?'Support Meter coach celebrating a correct answer':'Support Meter coach giving a correction';
    el.feedbackTitle.textContent=title;el.feedbackText.textContent=text;
    setCoachVisible();
  }
  function choiceWhy(expression){return expressionMeaning[expression]||'Think about who is speaking and what the phrase normally does in a conversation.';}
  function wrongFeedback(feelingCorrect,expressionCorrect){
    const s=story();
    const p=pronounForms(s.targetPronoun);const who=s.targetName;
    if(feelingCorrect && !expressionCorrect){
      return `You identified the feeling correctly: ${s.feeling}. But “${state.selectedExpression}” does not match what ${who} would say here. ${choiceWhy(state.selectedExpression)} Keep the feeling and choose a line that fits ${who}.`;
    }
    if(!feelingCorrect && expressionCorrect){
      return `The expression “${state.selectedExpression}” fits this moment, but ${state.selectedFeeling} is not the feeling being represented. Think about what ${who} ${p.be} experiencing or trying to communicate, then choose the feeling again.`;
    }
    if(!feelingCorrect && !expressionCorrect){
      return `Both choices need another look. ${state.selectedFeeling} does not match what ${who} ${p.be} feeling, and “${state.selectedExpression}” is used differently in conversation. Think first about what ${who} ${p.be} experiencing and what ${who} would say.`;
    }
    return `Look again at what ${who} ${p.be} feeling and what ${who} would say.`;
  }
  function revealFeedback(){const s=story();const p=pronounForms(s.targetPronoun);return `The best match for ${s.targetName} is ${s.feeling}, and the line is “${s.expression}” because that matches what ${s.targetName} ${p.be} feeling and what ${s.targetName} would say in this moment.`;}

  async function createSession(){
    state.studentName=(el.name.value.trim()||'Student').slice(0,60);state.classCode=(el.code.value.trim()||cfg.defaultClassCode||'CONNECT5').toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,40);
    if(joinToken){
      const resolved=await resolveJoinToken(joinToken);
      if(!resolved){el.startError.textContent='This activity link is invalid or has expired.';el.startError.classList.remove('hidden');return false;}
      state.sessionId=resolved.sessionId;selectedSet=Number(resolved.setNumber);stories=core.buildRun({setNumber:selectedSet,assigned:true});
    }
    try{const created=await createRun({studentName:state.studentName,classCode:state.classCode,sessionId:state.sessionId,setNumber:selectedSet,storyOrder:stories.map(s=>s.id)});state.runId=created.runId;state.controlGeneration=created.run.redirectGeneration||0;stopWatchingRun=watchRun(state.runId,receiveTeacherControl);return true;}
    catch(error){console.error(error);el.startError.textContent='Could not connect to the class monitor. Please try again.';el.startError.classList.remove('hidden');return false;}
  }
  function livePayload(lastAction,phase){return {studentName:state.studentName,currentStory:encodeStory(selectedSet,story().id),storyTitle:story().name,storySummary:story().frames.join(' '),storyProgress:state.storyIndex+1,phase,lastAction,liveExpression:state.selectedExpression,liveFeeling:state.selectedFeeling,attempt:state.attempt,supportMeter:state.meter,streak:state.streak,translationAttemptCount:state.translationAttemptCount,latestResult:lastAction.includes('Correct')?'correct':lastAction.includes('Incorrect')||lastAction.includes('revealed')?'incorrect':'waiting',status:state.completed?'completed':'online'};}
  async function live(lastAction,phase){if(!state.runId)return;try{await updateRun(state.runId,livePayload(lastAction,phase));}catch(error){console.error(error);}}
  async function log(feelingCorrect,expressionCorrect,resolved){if(!state.runId)return;await appendResponse(state.runId,{storyId:encodeStory(selectedSet,story().id),storyTitle:story().name,attempt:state.attempt,selectedExpression:state.selectedExpression||'',selectedFeeling:state.selectedFeeling||'',expressionCorrect,feelingCorrect,resolved,correctExpression:story().expression,correctFeeling:story().feeling,supportMeter:state.meter,streak:state.streak});}

  async function submit(){
    if(!state.selectedFeeling||!state.selectedExpression){showFeedback('wrong','Choose both first','Select the feeling and the expression before you submit.');return;}
    const s=story();const fc=state.selectedFeeling===s.feeling,ec=state.selectedExpression===s.expression;
    if(fc&&ec){
      state.resolved=true;Object.assign(state,core.applyAnswerResult(state,{correct:true,attempt:state.attempt}));await log(true,true,true);updateHud();renderFeelings();renderExpressions();el.submit.classList.add('hidden');el.next.classList.remove('hidden');showFeedback('correct','Exactly! 😆👍',`Great choice. ${choiceWhy(s.expression)}`);await live('Correct answer','feedback');return;
    }
    if(!fc&&!state.wrongFeelings.includes(state.selectedFeeling))state.wrongFeelings.push(state.selectedFeeling);
    if(!ec&&!state.wrongExpressions.includes(state.selectedExpression))state.wrongExpressions.push(state.selectedExpression);
    Object.assign(state,core.applyAnswerResult(state,{correct:false,attempt:state.attempt}));await log(fc,ec,false);updateHud();
    const thisAttempt=state.attempt;state.attempt++;
    if(thisAttempt===1){
      const msg=wrongFeedback(fc,ec);showFeedback('wrong','Not quite.',msg+' Try again.');if(!fc)state.selectedFeeling=null;if(!ec){state.selectedExpression=null;}renderFeelings();renderExpressions();renderStorySpeech();await live('Incorrect attempt 1','retry');
    }else{
      const reveal=revealFeedback();state.selectedFeeling=s.feeling;state.selectedExpression=s.expression;state.resolved=true;renderFeelings();renderExpressions();renderStorySpeech();el.submit.classList.add('hidden');el.next.classList.remove('hidden');showFeedback('wrong','Here is the match',reveal);await live('Answer revealed after second attempt','feedback');
    }
  }
  function showFinalResult(completedAt){
    state.resultData=window.SupportMeterResult.buildResultData({studentName:state.studentName,setNumber:selectedSet,supportMeter:state.meter,streak:state.streak,completedAt,runId:state.runId});
    el.resultStudentName.textContent=state.resultData.studentName;el.resultSetLine.textContent=`Connectivity 5 · ${state.resultData.setLabel} · 8 of 8 stories completed`;el.resultMeter.textContent=state.resultData.supportMeter;el.resultStreak.textContent=state.resultData.streak;el.resultCompleted.textContent=state.resultData.completedLabel;el.resultCode.textContent=state.resultData.recordCode;
    window.SupportMeterResult.drawResult(el.resultCanvas,state.resultData);el.gameShell.classList.add('hidden');el.resultScreen.classList.remove('hidden');scrollTo({top:0,behavior:'smooth'});
  }
  function downloadFinalResult(){
    if(!state.completed||!state.resultData)return;const name=window.SupportMeterResult.fileName(state.resultData),save=href=>{const anchor=document.createElement('a');anchor.href=href;anchor.download=name;anchor.click();};
    el.resultCanvas.toBlob(blob=>{if(!blob){save(el.resultCanvas.toDataURL('image/png'));return;}const url=URL.createObjectURL(blob);save(url);setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');
  }
  async function nextStory(){
    if(state.storyIndex>=stories.length-1){state.resolved=true;try{const completed=await completeRun(state.runId,{lastAction:'Completed Support Meter',latestResult:'completed',storyProgress:stories.length,supportMeter:state.meter,streak:state.streak});state.completed=true;el.next.classList.add('hidden');showFinalResult(completed.completedAt);}catch(error){console.error(error);showFeedback('wrong','Could not save your result','Check your connection, then select Next Story again to finish and create your verified result.');}return;}
    state.storyIndex++;state.selectedFeeling=null;state.selectedExpression=null;state.wrongFeelings=[];state.wrongExpressions=[];state.attempt=1;state.resolved=false;el.submit.classList.remove('hidden');el.next.classList.add('hidden');renderStory();if(matchMedia('(max-width:900px)').matches)scrollTo({top:0,behavior:'smooth'});live('Viewing next mini-story','story');
  }

  async function leaveGame(){
    el.exitError.classList.add('hidden');
    if(state.runId){try{await deleteRun(state.runId);}catch(error){el.exitError.textContent='Could not delete this activity. Please try again.';el.exitError.classList.remove('hidden');return;}}
    location.assign('/');
  }
  function requestStudentMenu(){if(core.shouldWarnBeforeExit(state))el.exitDialog.showModal();else location.assign('/');}
  function receiveTeacherControl(control){
    if(!control||state.pendingRedirect)return;
    const generation=Number(control.redirectGeneration||0);
    if(generation<=state.controlGeneration)return;
    state.pendingRedirect=control;el.redirectMessage.textContent=control.redirectReason||'You joined the wrong session. Your teacher moved you to the correct activity and cleared your previous progress.';el.redirectDialog.showModal();
  }
  function acceptRedirect(){
    const control=state.pendingRedirect;if(!control)return;
    state.controlGeneration=Number(control.redirectGeneration||0);state.sessionId=control.sessionId;selectedSet=Number(control.setNumber);stories=core.buildRun({setNumber:selectedSet,assigned:true});
    Object.assign(state,{storyIndex:0,selectedFeeling:null,selectedExpression:null,wrongFeelings:[],wrongExpressions:[],attempt:1,meter:0,streak:0,resolved:false,completed:false,pendingRedirect:null});
    el.submit.classList.remove('hidden');el.next.classList.add('hidden');el.redirectDialog.close();renderStory();live('Started correct teacher session','story');
  }
  function translationSignal(){return core.isTranslationDetected({className:document.documentElement.className,hasGoogleBanner:Boolean(document.querySelector('.goog-te-banner-frame,iframe.goog-te-banner-frame'))});}
  function blockForTranslation(){if(!state.started||state.translationBlocked||!translationSignal())return;state.translationBlocked=true;state.translationAttemptCount++;el.translationMessage.textContent='Translation is not allowed during this activity. Turn translation off, then select Check again.';if(!el.translationDialog.open)el.translationDialog.showModal();live('Translation attempt detected','blocked');}
  function checkTranslation(){if(translationSignal()){el.translationMessage.textContent='Translation is still active. Turn it off before continuing.';return;}state.translationBlocked=false;el.translationDialog.close();live('Translation disabled; activity resumed','playing');}
  new MutationObserver(blockForTranslation).observe(document.documentElement,{attributes:true,attributeFilter:['class','lang'],childList:true,subtree:true});
  el.studentMenu.onclick=requestStudentMenu;if(el.mobileStudentMenu)el.mobileStudentMenu.onclick=requestStudentMenu;
  el.exitCancel.onclick=()=>el.exitDialog.close();
  el.exitConfirm.onclick=leaveGame;
  addEventListener('beforeunload',event=>{if(core.shouldWarnBeforeExit(state)){event.preventDefault();event.returnValue='';}});
  el.startBtn.onclick=async()=>{el.startError.classList.add('hidden');if(await createSession()){state.started=true;renderPlayerName();el.start.classList.add('hidden');el.game.classList.remove('hidden');renderStory();await live('Viewing mini-story','story');setInterval(()=>state.runId&&updateRun(state.runId,{status:state.completed?'completed':'online'}),cfg.heartbeatMs||30000);cleanupExpiredFreeRuns().catch(console.error);}};
  function toggleCoach(){state.coachEnabled=!state.coachEnabled;renderCoachToggle();setCoachVisible();}
  el.coachToggle.onclick=toggleCoach;if(el.mobileCoachToggle)el.mobileCoachToggle.onclick=toggleCoach;
  el.redirectAccept.onclick=acceptRedirect;
  el.translationCheck.onclick=checkTranslation;el.translationDialog.addEventListener('cancel',event=>event.preventDefault());
  el.feedbackClose.onclick=hideFeedback;el.submit.onclick=submit;el.next.onclick=nextStory;el.downloadResult.onclick=downloadFinalResult;el.finishedStudentMenu.onclick=requestStudentMenu;renderCoachToggle();setCoachVisible();
})();
