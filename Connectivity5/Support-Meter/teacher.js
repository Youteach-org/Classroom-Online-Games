(() => {
  const cfg=window.SUPPORT_METER_CONFIG;
  const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const $=id=>document.getElementById(id);
  const el={code:$('monitorClassCode'),connect:$('connectMonitor'),hide:$('hideOffline'),dot:$('monitorDot'),status:$('monitorStatus'),grid:$('studentGrid'),empty:$('emptyMonitor'),online:$('onlineCount'),total:$('totalCount')};
  el.code.value=cfg.defaultClassCode;
  let classCode=cfg.defaultClassCode,sessions=new Map(),responses=new Map(),channel=null,hideOffline=false,timer=null;

  function online(s){return Date.now()-new Date(s.last_seen).getTime()<cfg.onlineThresholdMs&&s.status!=='completed'&&s.status!=='offline';}
  function decodeStory(value){const code=Number(value)||1;return code>10?{setId:Math.floor(code/10),storyId:code%10}:{setId:1,storyId:code};}
  function storyFrame(s,f){const {setId,storyId}=decodeStory(s.current_story);const frame=Math.max(1,Math.min(3,f));return `assets/stories-v16/set-${setId}/story-${storyId}-frame-${frame}.webp`;}
  function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function setStatus(ok,text){el.dot.className='dot'+(ok?' live':'');el.status.textContent=text;}

  async function loadAll(){
    const {data:s,error:e1}=await sb.from('support_meter_sessions').select('*').eq('class_code',classCode).order('updated_at',{ascending:false});
    const {data:r,error:e2}=await sb.from('support_meter_responses').select('*').eq('class_code',classCode).order('created_at',{ascending:false});
    if(e1||e2){setStatus(false,'Connection problem');return;}
    sessions.clear();(s||[]).forEach(x=>sessions.set(x.id,x));responses.clear();(r||[]).forEach(x=>{if(!responses.has(x.session_id))responses.set(x.session_id,[]);responses.get(x.session_id).push(x);});render();setStatus(true,'Live');
  }

  function responseHtml(row){const ok=row.expression_correct&&row.feeling_correct,{setId,storyId}=decodeStory(row.story_id);return `<div class="history-row ${ok?'ok':'no'}"><div class="history-title">Set ${setId} · Story ${storyId} · Attempt ${row.attempt} · ${ok?'✓ Correct':'✕ Incorrect'}</div><div class="history-answer">Feeling: <strong>${escapeHtml(row.selected_feeling)}</strong><br>Expression: <strong>${escapeHtml(row.selected_expression)}</strong></div><div class="history-meta">${new Date(row.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div></div>`;}

  function renderCard(s){
    const isOn=online(s),rs=responses.get(s.id)||[],{setId,storyId}=decodeStory(s.current_story),card=document.createElement('article');card.className='student-card card';card.dataset.id=s.id;
    const liveExp=s.live_expression?`<div>Expression: <strong>${escapeHtml(s.live_expression)}</strong></div>`:'';
    const liveFeel=s.live_feeling?`<div>Feeling: <strong>${escapeHtml(s.live_feeling)}</strong></div>`:'';
    card.innerHTML=`<div class="student-top"><div class="student-name">${escapeHtml(s.student_name)}</div><span class="${isOn?'online-badge':'offline-badge'}">${isOn?'● ONLINE':s.status==='completed'?'COMPLETED':'OFFLINE'}</span></div>
      <div class="teacher-story-strip"><img src="${storyFrame(s,1)}" alt="Story scene 1"><img src="${storyFrame(s,2)}" alt="Story scene 2"><img src="${storyFrame(s,3)}" alt="Story scene 3"></div>
      <div class="live-copy monitor-live-copy"><strong>Set ${setId} · Story ${storyId} · ${escapeHtml(s.phase)}</strong><div style="margin-top:4px">${escapeHtml(s.last_action)}</div><div class="live-choice">${liveFeel||'<div>Feeling: —</div>'}${liveExp||'<div>Expression: —</div>'}<div>Attempt: <strong>${s.attempt_in_progress||1}</strong></div></div></div>
      <div class="student-stats"><div><small>Support</small><strong>${s.support_meter}%</strong></div><div><small>Score</small><strong>${s.score}</strong></div><div><small>Streak</small><strong>${s.streak}</strong></div></div>
      <button class="history-toggle secondary" type="button">Responses (${rs.length}) ▾</button><div class="history hidden">${rs.length?rs.map(responseHtml).join(''):'<div class="history-row">No submitted answers yet.</div>'}</div>`;
    card.querySelector('.history-toggle').addEventListener('click',()=>card.querySelector('.history').classList.toggle('hidden'));
    return card;
  }

  function render(){const arr=[...sessions.values()].sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at)),filtered=hideOffline?arr.filter(online):arr;el.grid.innerHTML='';filtered.forEach(s=>el.grid.appendChild(renderCard(s)));el.empty.classList.toggle('hidden',filtered.length>0);el.total.textContent=`${arr.length} student${arr.length===1?'':'s'}`;el.online.textContent=`${arr.filter(online).length} online`;}

  async function subscribe(){
    if(channel)await sb.removeChannel(channel);
    channel=sb.channel('support-meter-'+classCode)
      .on('postgres_changes',{event:'*',schema:'public',table:'support_meter_sessions',filter:`class_code=eq.${classCode}`},payload=>{const row=payload.new||payload.old;if(payload.eventType==='DELETE')sessions.delete(row.id);else sessions.set(row.id,row);render();})
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'support_meter_responses',filter:`class_code=eq.${classCode}`},payload=>{const row=payload.new;if(!responses.has(row.session_id))responses.set(row.session_id,[]);responses.get(row.session_id).unshift(row);render();})
      .subscribe(status=>setStatus(status==='SUBSCRIBED',status==='SUBSCRIBED'?'Live':status));
  }

  async function connect(){classCode=(el.code.value.trim()||cfg.defaultClassCode).toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,40)||cfg.defaultClassCode;el.code.value=classCode;setStatus(false,'Connecting…');await loadAll();await subscribe();clearInterval(timer);timer=setInterval(render,5000);history.replaceState(null,'',`teacher.html?class=${encodeURIComponent(classCode)}`);}
  el.connect.addEventListener('click',connect);el.hide.addEventListener('click',()=>{hideOffline=!hideOffline;el.hide.textContent=hideOffline?'Show offline':'Hide offline';render();});
  const q=new URLSearchParams(location.search).get('class');if(q)el.code.value=q.toUpperCase();connect();
})();
