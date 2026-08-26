(() => {
  const cfg = window.SUPPORT_METER_CONFIG || {};
  const sb = (window.supabase && cfg.supabaseUrl) ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {auth:{persistSession:false,autoRefreshToken:false}}) : null;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const lang = window.SupportMeterLanguage;
  const questionFeeling = lang.questionFeeling;
  const questionExpression = lang.questionExpression;
  const pronounForms = lang.forms;

  const stories = [
    {id:1,name:'Cable chaos',targetName:'Ethan',targetPronoun:'he',targetBadgePos:'center',feeling:'Frustration',expression:"I'm at my wits' end.",frames:["Ethan's phone is almost dead.",'Ethan tries charger after charger.','Nothing works. Ethan has tried everything.'],options:["I'm at my wits' end.",'That must be tough.','Hang in there.','I hear you.'],speaker:'Ethan, the frustrated person'},
    {id:2,name:'Rainy wait',targetName:'Leo',targetPronoun:'he',targetBadgePos:'right',feeling:'Empathy',expression:'That must be tough.',frames:['Mia has been waiting in the rain.','The bus is delayed again while Leo stays with Mia.','Leo listens as Mia explains the problem.'],options:['I give up.','That must be tough.','Stick with it.',"I've had it."],speaker:'Leo, the friend who is listening'},
    {id:3,name:'Guitar practice',targetName:'Maya',targetPronoun:'she',targetBadgePos:'right',feeling:'Encouragement',expression:'Stick with it.',frames:['Noah is learning a difficult guitar chord.','Noah misses it again and gets frustrated.','Maya wants Noah to keep practicing.'],options:['Stick with it.','I hear you.',"I'm at my wits' end.",'That must be tough.'],speaker:'Maya, the friend encouraging Noah'},
    {id:4,name:'Basketball',targetName:'Alex',targetPronoun:'he',targetBadgePos:'center',feeling:'Frustration',expression:'I give up.',approvedFrames:true,nativeBubble:true,frames:['Alex has been practicing his shots for over an hour.','But Alex keeps missing the basket... again and again.','Now Alex is completely fed up and does not want to try anymore.'],options:['That must be tough.','Hang in there.','I give up.','Stick with it.'],speaker:'Alex, the frustrated player'},
    {id:5,name:'A bad day',targetName:'Sofia',targetPronoun:'she',targetBadgePos:'right',feeling:'Empathy',expression:'I hear you.',frames:['Elena tells Sofia about a terrible day.','Elena explains everything that went wrong.','Sofia listens carefully and understands Elena.'],options:['I hear you.',"I've had it.",'Hang in there.','I give up.'],speaker:'Sofia, the friend who is listening'},
    {id:6,name:'Almost there',targetName:'Eli',targetPronoun:'he',showTargetBadge:false,feeling:'Encouragement',expression:'Hang in there.',frames:['Noah finds the climb much harder than expected.','Noah starts to slow down.','Eli knows Noah is close to the top and wants him to continue.'],options:['Hang in there.',"I'm at my wits' end.",'That must be tough.','I give up.'],speaker:'Eli, the friend encouraging Noah'},
    {id:7,name:'Furniture fail',targetName:'Lucas',targetPronoun:'he',targetBadgePos:'center',feeling:'Frustration',expression:"I've had it.",frames:['Lucas starts assembling the furniture.','The pieces still do not fit for Lucas.','After a long time, Lucas is completely fed up.'],options:["I've had it.",'I hear you.','Don\'t give up.','That must be tough.'],speaker:'Lucas, the frustrated person'},
    {id:8,name:'Flat tire',targetName:'Maya',targetPronoun:'she',targetBadgePos:'center',feeling:'Encouragement',expression:"Don't give up.",frames:["Noah's bike tire goes flat while Maya and Daniel are with him.",'Noah tries to fix it but gets discouraged.','Maya wants Noah to keep trying.'],options:["Don't give up.",'I give up.','I hear you.',"I've had it."],speaker:'Maya, the friend encouraging Noah'}
  ];

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
  function asset(id,frame){ if(id===4){return frame===3?'assets/story1_3_blank.jpg':`assets/story1_${frame}.jpg`;} return `assets/stories/scenario${String(id).padStart(2,'0')}-${frame}.webp`; }
  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function renderStory(){
    const s=story();
    el.frames.innerHTML='';
    s.frames.forEach((caption,i)=>{
      const card=document.createElement('div');card.className='story-frame';card.style.setProperty('--frame-bg',`url("${asset(s.id,i+1)}")`);
      const speech=(i===2)?`<div id="frameSpeech" class="speech ${s.nativeBubble?'native-bubble ':''}empty">${state.selectedExpression?escapeHtml(state.selectedExpression):''}</div>`:'';
      const targetBadge=(i===2 && s.showTargetBadge!==false)?`<div class="target-badge ${escapeHtml(s.targetBadgePos||'center')}">${escapeHtml(s.targetName)}</div>`:'';
      card.innerHTML=`<div class="story-visual" style="--scene-image:url(&quot;${asset(s.id,i+1)}&quot;)"><img class="story-image" src="${asset(s.id,i+1)}" alt="Story ${s.id}, scene ${i+1}"><div class="frame-num">${i+1}</div>${targetBadge}${speech}</div><div class="caption">${escapeHtml(caption)}</div>${i<2?'<div class="story-arrow">➜</div>':''}`;
      el.frames.appendChild(card);
    });
    el.feelingTitle.textContent=`What is ${s.targetName} feeling?`;
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
    state.storyIndex++;state.selectedFeeling=null;state.selectedExpression=null;state.wrongFeelings=[];state.wrongExpressions=[];state.attempt=1;state.resolved=false;el.submit.classList.remove('hidden');el.next.classList.add('hidden');renderStory();live('Viewing next mini-story','story');
  }

  el.startBtn.onclick=async()=>{el.startError.classList.add('hidden');if(await createSession()){el.start.classList.add('hidden');el.game.classList.remove('hidden');renderStory();setInterval(()=>live('Active in game','playing'),cfg.heartbeatMs||10000);}};
  el.coachToggle.onclick=()=>{state.coachEnabled=!state.coachEnabled;renderCoachToggle();setCoachVisible();};
  el.feedbackClose.onclick=hideFeedback;el.submit.onclick=submit;el.next.onclick=nextStory;renderCoachToggle();setCoachVisible();
})();
