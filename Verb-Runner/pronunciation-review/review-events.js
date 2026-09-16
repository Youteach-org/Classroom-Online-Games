import {
  markReviewed,saveAutosaveReport,clearAutosaveReport,resolveReport,deleteReport,
  markDuplicate,removeDuplicate,restoreDuplicate
} from './review-actions.js';

export function bindReviewEvents({audioList,getEntryById,getEntryByNumber,getRecordById,reviewer}){
  const autosaveTimers=new Map();

  function scheduleAutosave(card,entry){
    const status=card.querySelector('.autosave-status');
    const textarea=card.querySelector('.report-text');
    const kind=card.querySelector('.report-kind').value;
    const by=reviewer(true);
    if(!by){
      if(status)status.textContent='Reviewer required';
      return;
    }

    if(status)status.textContent='Saving…';
    const previous=autosaveTimers.get(entry.id);
    if(previous)clearTimeout(previous);

    const timer=setTimeout(async()=>{
      try{
        const record=getRecordById(entry.id);
        const text=String(textarea.value||'');
        if(text.trim()){
          await saveAutosaveReport(entry,record,by,text,kind);
          if(status)status.textContent='Saved';
        }else{
          await clearAutosaveReport(entry,record,by);
          if(status)status.textContent='';
        }
      }catch(error){
        console.error(error);
        if(status)status.textContent='Save error';
      }finally{
        autosaveTimers.delete(entry.id);
      }
    },450);

    autosaveTimers.set(entry.id,timer);
  }

  audioList.addEventListener('input',event=>{
    const textarea=event.target.closest('.report-text');
    if(!textarea)return;
    const card=textarea.closest('.audio-card');
    const entry=getEntryById(card?.dataset.audioId);
    if(entry)scheduleAutosave(card,entry);
  });

  audioList.addEventListener('change',event=>{
    const select=event.target.closest('.report-kind');
    if(!select)return;
    const card=select.closest('.audio-card');
    const entry=getEntryById(card?.dataset.audioId);
    if(entry)scheduleAutosave(card,entry);
  });

  function updateDuplicateMatch(card){
    const input=card.querySelector('.duplicate-target-ref');
    const match=card.querySelector('.duplicate-match');
    const current=getEntryById(card?.dataset.audioId);
    const value=String(input?.value||'').trim();
    if(!value){
      match.textContent='Enter the original audio number.';
      match.dataset.state='empty';
      return null;
    }
    const original=getEntryByNumber(value);
    if(!original){
      match.textContent='No audio exists with that number.';
      match.dataset.state='error';
      return null;
    }
    if(original.id===current?.id){
      match.textContent='This cannot be the same audio.';
      match.dataset.state='error';
      return null;
    }
    match.textContent=`#${String(original.n).padStart(3,'0')} — ${original.key}`;
    match.dataset.state='ok';
    return original;
  }

  audioList.addEventListener('input',event=>{
    const input=event.target.closest('.duplicate-target-ref');
    if(!input)return;
    const card=input.closest('.audio-card');
    if(card)updateDuplicateMatch(card);
  });

  audioList.addEventListener('click',async event=>{
    const button=event.target.closest('button[data-action]');
    if(!button)return;
    const card=button.closest('.audio-card');
    const entry=getEntryById(card?.dataset.audioId);
    if(!entry)return;
    const record=getRecordById(entry.id);
    try{
      const action=button.dataset.action;
      if(action==='toggle-history'){
        const panel=card.querySelector('.review-history-panel');
        panel.hidden=!panel.hidden;
      }else if(action==='toggle-report'){
        const panel=card.querySelector('.report-panel');
        panel.hidden=!panel.hidden;
        if(!panel.hidden)panel.querySelector('textarea').focus();
      }else if(action==='toggle-duplicate'){
        const panel=card.querySelector('.duplicate-panel');
        panel.hidden=!panel.hidden;
        if(!panel.hidden){
          updateDuplicateMatch(card);
          panel.querySelector('input').focus();
        }
      }else if(action==='reviewed'){
        const by=reviewer(); if(by)await markReviewed(entry,record,by);
      }else if(action==='mark-duplicate'){
        const by=reviewer(); if(!by)return;
        const canonical=updateDuplicateMatch(card);
        if(!canonical){
          alert('Enter the number of the original audio first.');
          card.querySelector('.duplicate-target-ref').focus();
          return;
        }
        await markDuplicate(entry,record,canonical,by);
      }else if(action==='remove-duplicate'){
        const by=reviewer(); if(!by)return;
        if(confirm('Queue this duplicate for deletion? The audit trail will be retained.')){
          await removeDuplicate(entry,record,by);
        }
      }else if(action==='restore-duplicate'){
        const by=reviewer(); if(by)await restoreDuplicate(entry,record,by);
      }else if(action==='resolve-report'){
        const by=reviewer(); if(by)await resolveReport(entry,button.dataset.reportId,by);
      }else if(action==='delete-report'){
        const by=reviewer(); if(!by)return;
        if(confirm('Delete this repeated report from the active list? Its history will be retained.')){
          await deleteReport(entry,button.dataset.reportId,by);
        }
      }
    }catch(error){
      console.error(error);
      alert('Could not save this review change. Please try again.');
    }
  });
}
