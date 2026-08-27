(() => {
  const cfg = window.SUPPORT_METER_CONFIG || {};
  const sb = (window.supabase && cfg.supabaseUrl) ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {auth:{persistSession:false,autoRefreshToken:false}}) : null;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const lang = window.SupportMeterLanguage;
  const questionFeeling = lang.questionFeeling;
  const questionExpression = lang.questionExpression;
  const pronounForms = lang.forms;

  const allExpressions=["I'm at my wits' end.","I've had it.",'I give up.','That must be tough.','I hear you.','Hang in there.',"Don't give up.",'Stick with it.'];
  const expressionCategory={"I'm at my wits' end.":'Frustration',"I've had it.":'Frustration','I give up.':'Frustration','That must be tough.':'Empathy','I hear you.':'Empathy','Hang in there.':'Encouragement',"Don't give up.":'Encouragement','Stick with it.':'Encouragement'};
  const frustrationExpressions=allExpressions.filter(x=>expressionCategory[x]==='Frustration');
  const supportDistractors=['That must be tough.','I hear you.','Hang in there.'];
  const make=(setId,id,name,targetName,targetPronoun,feeling,expression,frames,speechPosition)=>{const distractors=expressionCategory[expression]==='Frustration'?supportDistractors:frustrationExpressions;return {setId,id,name,targetName,targetPronoun,feeling,expression,frames,speechPosition,options:[expression,...distractors]};};
  const storySets = [
    [
      make(1,1,"Maya's Science Project",'Maya','she','Frustration',"I'm at my wits' end.",['Maya finishes her science project.','She tries the experiment again.','Nothing works after several attempts.'],'bottom-right'),
      make(1,2,"Ethan's Broken Laptop",'Ethan','he','Frustration',"I've had it.",['Ethan works on his presentation.','The laptop freezes and restarts again.','The same problem happens one more time.'],'bottom-right'),
      make(1,3,"Sofia's Model Airplane",'Sofia','she','Frustration','I give up.',['Sofia starts building a model airplane.','The wings keep falling off.','The airplane comes apart again.'],'bottom-right'),
      make(1,4,'Leo Misses the Soccer Final','Sofia','she','Empathy','That must be tough.',['Leo hurts his ankle during soccer practice.','He learns that he cannot play in the final.','Leo tells Sofia how disappointed he feels.'],'bottom-left'),
      make(1,5,"Ava's Audition",'Maya','she','Empathy','I hear you.',['Ava practices for her audition.','She forgets part of the song on stage.','Ava tells Maya what happened.'],'bottom-right'),
      make(1,6,"Ethan's Driving Test",'Leo','he','Encouragement','Hang in there.',['Ethan takes his driving test.','He makes a mistake and fails the test.','Leo talks with Ethan afterward.'],'bottom-left'),
      make(1,7,"Maya's Running Practice",'Ava','she','Encouragement',"Don't give up.",['Maya practices on the school track.','She becomes exhausted during practice.','Ava returns to talk with Maya.'],'bottom-left'),
      make(1,8,'Leo Learns the Guitar','Ethan','he','Encouragement','Stick with it.',['Leo starts learning the guitar.','He struggles after many attempts.','Ethan joins Leo during practice.'],'bottom-right')
    ],
    [
      make(2,1,"Ethan's Robot",'Ethan','he','Frustration',"I'm at my wits' end.",['Ethan builds a small robot.','The robot fails after another repair.','Ethan faces another pile of broken parts.'],'bottom-right'),
      make(2,2,"Ava's Photography Project",'Ava','she','Frustration',"I've had it.",['Ava prepares her photography project.','Her camera creates another bad result.','The problem happens again.'],'bottom-left'),
      make(2,3,"Leo's Cake",'Leo','he','Frustration','I give up.',['Leo starts baking a cake.','Another cake turns out badly.','The kitchen shows several failed attempts.'],'bottom-right'),
      make(2,4,'Sofia Misses the School Trip','Maya','she','Empathy','That must be tough.',['Sofia packs for a school trip.','She becomes sick and misses the trip.','Sofia tells Maya how disappointed she is.'],'bottom-right'),
      make(2,5,"Maya's Debate",'Ethan','he','Empathy','I hear you.',['Maya practices for a debate.','She forgets her argument.','Maya tells Ethan about the mistake.'],'bottom-left'),
      make(2,6,'Ava Learns to Skateboard','Sofia','she','Encouragement','Hang in there.',['Ava begins learning to skateboard.','She struggles after many attempts.','Sofia talks with Ava at the skate park.'],'bottom-left'),
      make(2,7,"Sofia's Chemistry Test",'Ava','she','Encouragement',"Don't give up.",['Sofia studies for chemistry.','A practice test shows many errors.','Ava joins Sofia at the study table.'],'bottom-left'),
      make(2,8,"Ethan's Basketball Practice",'Leo','he','Encouragement','Stick with it.',['Ethan practices basketball.','He misses several shots.','Leo joins Ethan on the court.'],'bottom-left')
    ],
    [
      make(3,1,"Maya's Jammed Printer",'Maya','she','Frustration',"I'm at my wits' end.",['Maya prints her assignment.','She clears the jam, but paper sticks again.','The printer jams after another attempt.'],'bottom-right'),
      make(3,2,"Sofia's Lost Presentation",'Sofia','she','Frustration',"I've had it.",['Sofia looks for her presentation.','She checks every folder and her USB drive.','The presentation is still missing.'],'bottom-right'),
      make(3,3,"Ava's Costume Project",'Ava','she','Frustration','I give up.',['Ava sews a costume for the school play.','The seam tears while she repairs it.','The costume tears again.'],'bottom-right'),
      make(3,4,'Ethan Misses the Concert','Leo','he','Empathy','That must be tough.',['Ethan gets ready for a concert.','A long delay makes him miss it.','Ethan tells Leo how disappointed he feels.'],'bottom-left'),
      make(3,5,"Leo's Missed Bus",'Maya','she','Empathy','I hear you.',['Leo hurries toward the bus stop.','The bus leaves before he can board.','Leo tells Maya why he is upset.'],'bottom-left'),
      make(3,6,"Maya's Piano Practice",'Sofia','she','Encouragement','Hang in there.',['Maya practices a difficult piano piece.','Repeated mistakes discourage her.','Sofia joins Maya at the piano.'],'bottom-left'),
      make(3,7,"Ethan's Chess Practice",'Ava','she','Encouragement',"Don't give up.",['Ethan practices chess carefully.','Another loss leaves him discouraged.','Ava joins Ethan at the chessboard.'],'bottom-left'),
      make(3,8,"Sofia's Community Garden",'Leo','he','Encouragement','Stick with it.',['Sofia plants a community garden.','Bad weather damages the young plants.','Leo joins Sofia in the garden.'],'bottom-left')
    ]
  ];
  function chooseSet(storage,random=Math.random){let used=[];try{used=JSON.parse(storage.getItem('support-meter-played-sets-v16')||'[]');}catch{}if(!Array.isArray(used)||used.length>=3)used=[];const available=[1,2,3].filter(x=>!used.includes(x));const selected=available[Math.floor(random()*available.length)];storage.setItem('support-meter-played-sets-v16',JSON.stringify([...used,selected]));return selected;}
  function shuffleStories(items,random=Math.random){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
  const selectedSet=chooseSet(localStorage);
  const stories=shuffleStories(storySets[selectedSet-1]);

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
    meterFill:$('#meterFill'),meterValue:$('#meterValue'),score:$('#scoreValue'),streak:$('#streakValue'),story:$('#storyValue'),
    coachToggle:$('#coachToggle'),coachToggleState:$('#coachToggleState'),submit:$('#submitBtn'),next:$('#nextBtn'),
    feedback:$('#feedback'),coachImage:$('#coachImage'),feedbackTitle:$('#feedbackTitle'),feedbackText:$('#feedbackText'),feedbackClose:$('#feedbackClose')
  };

  const state = {storyIndex:0,selectedFeeling:null,selectedExpression:null,wrongFeelings:[],wrongExpressions:[],attempt:1,meter:55,score:0,streak:0,coachEnabled:true,resolved:false,sessionId:null,studentName:'',classCode:cfg.defaultClassCode||'CONNECT5'};
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
  function updateHud(){el.meterFill.style.width=`${state.meter}%`;el.meterValue.textContent=`${state.meter}%`;el.score.textContent=state.score.toLocaleString();el.streak.textContent=state.streak;el.story.textContent=`${state.storyIndex+1} / ${stories.length}`;}
  function renderCoachToggle(){el.coachToggleState.textContent=state.coachEnabled?'ON':'OFF';el.coachToggle.setAttribute('aria-pressed',String(state.coachEnabled));}
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
    if(matchMedia('(max-width:900px)').matches)scrollTo({top:0,behavior:'smooth'});
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
    if(!sb)return true;
    const {data,error}=await sb.from('support_meter_sessions').insert({student_name:state.studentName,class_code:state.classCode,current_story:1,current_frame:3,phase:'story',last_action:'Started Support Meter',support_meter:state.meter,score:state.score,streak:state.streak,status:'online',attempt_in_progress:1}).select('id').single();
    if(error){el.startError.textContent='Could not connect to the class monitor. Please try again.';el.startError.classList.remove('hidden');return false;}state.sessionId=data.id;return true;
  }
  async function live(last_action,phase){if(!sb||!state.sessionId)return;await sb.from('support_meter_sessions').update({current_story:story().id,current_frame:3,phase,last_action,live_expression:state.selectedExpression,live_feeling:state.selectedFeeling,attempt_in_progress:state.attempt,support_meter:state.meter,score:state.score,streak:state.streak,last_seen:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',state.sessionId);}
  async function log(feelingCorrect,expressionCorrect,resolved){if(!sb||!state.sessionId)return;await sb.from('support_meter_responses').insert({session_id:state.sessionId,class_code:state.classCode,story_id:story().id,story_title:story().name,attempt:state.attempt,selected_expression:state.selectedExpression||'',selected_feeling:state.selectedFeeling||'',expression_correct:expressionCorrect,feeling_correct:feelingCorrect,resolved});}

  async function submit(){
    if(!state.selectedFeeling||!state.selectedExpression){showFeedback('wrong','Choose both first','Select the feeling and the expression before you submit.');return;}
    const s=story();const fc=state.selectedFeeling===s.feeling,ec=state.selectedExpression===s.expression;
    if(fc&&ec){
      await log(true,true,true);state.resolved=true;state.score+=100+state.streak*20;state.streak++;state.meter=Math.min(100,state.meter+8);updateHud();renderFeelings();renderExpressions();el.submit.classList.add('hidden');el.next.classList.remove('hidden');showFeedback('correct','Exactly! 😆👍',`Great choice. ${choiceWhy(s.expression)}`);await live('Correct answer','feedback');return;
    }
    await log(fc,ec,false);
    if(!fc&&!state.wrongFeelings.includes(state.selectedFeeling))state.wrongFeelings.push(state.selectedFeeling);
    if(!ec&&!state.wrongExpressions.includes(state.selectedExpression))state.wrongExpressions.push(state.selectedExpression);
    state.streak=0;state.meter=Math.max(0,state.meter-4);updateHud();
    const thisAttempt=state.attempt;state.attempt++;
    if(thisAttempt===1){
      const msg=wrongFeedback(fc,ec);showFeedback('wrong','Not quite.',msg+' Try again.');if(!fc)state.selectedFeeling=null;if(!ec){state.selectedExpression=null;}renderFeelings();renderExpressions();renderStorySpeech();await live('Incorrect attempt 1','retry');
    }else{
      const reveal=revealFeedback();state.selectedFeeling=s.feeling;state.selectedExpression=s.expression;state.resolved=true;renderFeelings();renderExpressions();renderStorySpeech();el.submit.classList.add('hidden');el.next.classList.remove('hidden');showFeedback('wrong','Here is the match',reveal);await live('Answer revealed after second attempt','feedback');
    }
  }
  function nextStory(){
    if(state.storyIndex>=stories.length-1){state.resolved=true;showFeedback('correct','Finished! 😆👍',`Final score: ${state.score.toLocaleString()} · Support Meter: ${state.meter}%`);el.next.classList.add('hidden');live('Completed game','completed');if(sb&&state.sessionId)sb.from('support_meter_sessions').update({status:'completed',phase:'completed',last_action:'Completed Support Meter',last_seen:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',state.sessionId);return;}
    state.storyIndex++;state.selectedFeeling=null;state.selectedExpression=null;state.wrongFeelings=[];state.wrongExpressions=[];state.attempt=1;state.resolved=false;el.submit.classList.remove('hidden');el.next.classList.add('hidden');renderStory();if(matchMedia('(max-width:900px)').matches)scrollTo({top:0,behavior:'smooth'});live('Viewing next mini-story','story');
  }

  el.startBtn.onclick=async()=>{el.startError.classList.add('hidden');if(await createSession()){el.start.classList.add('hidden');el.game.classList.remove('hidden');renderStory();setInterval(()=>live('Active in game','playing'),cfg.heartbeatMs||10000);}};
  el.coachToggle.onclick=()=>{state.coachEnabled=!state.coachEnabled;renderCoachToggle();setCoachVisible();};
  el.feedbackClose.onclick=hideFeedback;el.submit.onclick=submit;el.next.onclick=nextStory;renderCoachToggle();setCoachVisible();
})();
