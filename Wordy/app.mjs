import { RELATIONSHIPS } from './data/relationships.mjs';
import { LEVELS } from './data/levels.mjs';
import { createRelationshipBank } from './engine/relationship-bank.mjs';
import { createGameController } from './engine/controller.mjs';
import { bindBoardInput } from './ui/input.mjs';
import { renderGame, renderResult, hideResult } from './ui/render.mjs';
import { playResolutionTimeline } from './ui/timeline.mjs';

const searchParams=new URLSearchParams(window.location.search);
const requestedLevel=searchParams.get('level')?.trim().toUpperCase();
const requestedLevelId=LEVELS.some(level=>level.id===requestedLevel)
  ?requestedLevel
  :LEVELS[0].id;
const isLocalPreview=['localhost','127.0.0.1','::1'].includes(window.location.hostname);

const bank=createRelationshipBank(RELATIONSHIPS);
const controller=createGameController({
  bank,
  levels:LEVELS,
  initialLevelId:requestedLevelId,
  rng:Math.random,
  storage:window.localStorage
});

const boardElement=document.querySelector('#wordyBoard');
const popButton=document.querySelector('#popButton');
const replayButton=document.querySelector('#replayButton');
const nextButton=document.querySelector('#nextButton');
let timelinePlaying=false;

function mountLocalDevbar(){
  if(!isLocalPreview)return;

  const bar=document.createElement('div');
  bar.className='wordy-devbar';
  bar.setAttribute('aria-label','Local development controls');

  const badge=document.createElement('strong');
  badge.textContent='DEV';

  const select=document.createElement('select');
  select.setAttribute('aria-label','Validation level');
  LEVELS.forEach(level=>{
    const option=document.createElement('option');
    option.value=level.id;
    option.textContent=`${level.id} · ${level.title}`;
    select.append(option);
  });
  select.value=controller.state().levelId;
  select.addEventListener('change',()=>{
    const next=new URL(window.location.href);
    next.searchParams.set('level',select.value);
    window.location.href=next.toString();
  });

  const restart=document.createElement('button');
  restart.type='button';
  restart.textContent='Restart';
  restart.addEventListener('click',()=>controller.replay());

  bar.append(badge,select,restart);
  document.body.append(bar);
}

mountLocalDevbar();

bindBoardInput(boardElement,{
  onSwap:(from,to)=>{
    if(!timelinePlaying)controller.swap(from,to);
  }
});

popButton?.addEventListener('click',async()=>{
  if(timelinePlaying||controller.state().readyMatches.length===0)return;
  timelinePlaying=true;
  try{
    if(!controller.pop())return;
    const state=controller.state();
    await playResolutionTimeline(document,state.resolutionEvents);
  }finally{
    timelinePlaying=false;
  }
  const state=controller.state();
  renderGame(document,state);
  if(state.phase==='result'){
    renderResult(document,state.review??{newLearning:[],missed:[]});
  }
});
replayButton?.addEventListener('click',()=>controller.replay());
nextButton?.addEventListener('click',()=>{
  if(!controller.next())nextButton.disabled=true;
});

controller.subscribe(state=>{
  renderGame(document,state);
  if(state.phase==='result'&&!timelinePlaying){
    renderResult(document,state.review??{newLearning:[],missed:[]});
  }else{
    hideResult(document);
  }
});

window.addEventListener('pagehide',()=>controller.abandon());

window.WordyPrototype={controller};
