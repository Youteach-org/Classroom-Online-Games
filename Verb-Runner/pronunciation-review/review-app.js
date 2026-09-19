import {watchRecords,requestRepairBatch} from './firebase-store.js';
import {seedKnownReports} from './review-actions.js';
import {renderCard} from './review-render.js';
import {bindReviewEvents} from './review-events.js';
import {exportJson,exportMarkdown} from './review-export.js';

const core=window.VerbRunnerPronunciationReviewCore;
const manifest=window.VerbRunnerPronunciationManifest||{};
const REVIEWER_STORAGE='verbRunnerPronunciationReviewer';

const reviewerName=document.querySelector('#reviewerName');
const searchInput=document.querySelector('#searchInput');
const statusFilter=document.querySelector('#statusFilter');
const audioList=document.querySelector('#audioList');
const template=document.querySelector('#audioCardTemplate');
const syncState=document.querySelector('#syncState');
const totalCount=document.querySelector('#totalCount');
const reviewedCount=document.querySelector('#reviewedCount');
const problemCount=document.querySelector('#problemCount');
const duplicateCount=document.querySelector('#duplicateCount');
const repairReported=document.querySelector('#repairReported');

let records={};
let catalog=[];
let seeded=false;
let renderTimer=null;

const gameRootUrl=()=>new URL('../',window.location.href);
const audioUrl=src=>/^https?:\/\//i.test(src)?src:new URL(src,gameRootUrl()).href;
const getEntryById=id=>catalog.find(item=>item.id===id)||null;
const getEntryByNumber=value=>catalog.find(item=>item.n===Number(value))||null;
const getRecordById=id=>records[id]||{};

function reviewer(silent=false){
  const value=String(reviewerName.value||'').trim();
  if(!value){
    if(!silent){
      reviewerName.focus();
      alert('Enter the reviewer name first.');
    }
    return null;
  }
  localStorage.setItem(REVIEWER_STORAGE,value);
  return value;
}

function matches(entry){
  const filter=statusFilter.value;
  if(filter==='all'&&entry.status==='removed-duplicate')return false;
  if(filter==='review-again'&&!entry.sourceChanged)return false;
  if(filter!=='all'&&filter!=='review-again'&&entry.status!==filter)return false;
  const q=String(searchInput.value||'').trim().toLowerCase();
  if(!q)return true;
  const ref=String(entry.n),ref3=ref.padStart(3,'0');
  return `${ref} ${ref3} #${ref} #${ref3} ${entry.key} ${entry.src}`.toLowerCase().includes(q);
}

function hasPlayingAudio(){
  return Array.from(audioList.querySelectorAll('audio')).some(audio=>!audio.paused&&!audio.ended);
}

function hasActiveReportEditor(){
  const active=document.activeElement;
  return Boolean(active?.classList?.contains('report-text')||active?.classList?.contains('report-kind'));
}

function captureViewState(){
  const openPanels=[];
  for(const card of audioList.querySelectorAll('.audio-card')){
    const audioId=card.dataset.audioId;
    if(!audioId)continue;
    for(const selector of ['.report-panel','.duplicate-panel','.review-history-panel']){
      const panel=card.querySelector(selector);
      if(panel&&!panel.hidden)openPanels.push({audioId,selector});
    }
  }
  return {scrollY:window.scrollY,openPanels};
}

function restoreViewState(state){
  if(!state)return;
  for(const item of state.openPanels||[]){
    const card=audioList.querySelector(`.audio-card[data-audio-id="${CSS.escape(item.audioId)}"]`);
    const panel=card?.querySelector(item.selector);
    if(panel)panel.hidden=false;
  }
  window.scrollTo({top:state.scrollY,left:0,behavior:'instant'});
}

function requestSafeRender(delay=180){
  if(renderTimer)clearTimeout(renderTimer);
  renderTimer=setTimeout(()=>{
    if(hasPlayingAudio()||hasActiveReportEditor()){
      requestSafeRender(300);
      return;
    }
    renderTimer=null;
    const state=captureViewState();
    render(state);
  },delay);
}

function render(viewState=null){
  catalog=core.mergeCatalog(manifest,records);
  const visible=catalog.filter(matches);
  audioList.replaceChildren(...visible.map(entry=>renderCard(entry,template,audioUrl)));
  if(!visible.length){
    const empty=document.createElement('div');
    empty.className='empty';
    empty.textContent='No matching audio.';
    audioList.appendChild(empty);
  }
  totalCount.textContent=`Total ${catalog.length}`;
  reviewedCount.textContent=`Reviewed ${catalog.filter(x=>x.status==='reviewed').length}`;
  problemCount.textContent=`Reported ${catalog.filter(x=>x.status==='reported').length}`;
  duplicateCount.textContent=`Duplicates ${catalog.filter(x=>x.status==='duplicate'||x.status==='removed-duplicate').length}`;
  restoreViewState(viewState);
}

bindReviewEvents({audioList,getEntryById,getEntryByNumber,getRecordById,reviewer});

reviewerName.value=localStorage.getItem(REVIEWER_STORAGE)||'';
reviewerName.addEventListener('change',()=>localStorage.setItem(REVIEWER_STORAGE,String(reviewerName.value||'').trim()));
searchInput.addEventListener('input',render);
statusFilter.addEventListener('change',render);
repairReported.addEventListener('click',async()=>{
  const by=reviewer(); if(!by)return;
  const reported=catalog.filter(entry=>entry.status==='reported');
  if(!reported.length){
    alert('There are no reported audios to repair.');
    return;
  }
  repairReported.disabled=true;
  const original=repairReported.textContent;
  repairReported.textContent=`Queueing ${reported.length}…`;
  try{
    const result=await requestRepairBatch(reported,by);
    repairReported.textContent=`Queued ${result.count}`;
    setTimeout(()=>{ repairReported.textContent=original; repairReported.disabled=false; },1800);
  }catch(error){
    console.error(error);
    repairReported.textContent=original;
    repairReported.disabled=false;
    alert('Could not queue the reported audios for repair.');
  }
});

document.querySelector('#exportJson').addEventListener('click',()=>exportJson(records));
document.querySelector('#exportMarkdown').addEventListener('click',()=>exportMarkdown(catalog));

syncState.textContent='Firebase: connecting…';
watchRecords(next=>{
  records=next;
  syncState.textContent='Firebase: saved';
  requestSafeRender();
  if(!seeded){
    seeded=true;
    seedKnownReports(catalog,records).catch(error=>{
      console.error(error);
      syncState.textContent='Firebase: seed error';
    });
  }
},error=>{
  console.error(error);
  syncState.textContent='Firebase: connection error';
  requestSafeRender();
});
