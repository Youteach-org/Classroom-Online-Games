import { RELATIONSHIPS } from './data/relationships.mjs';
import { LEVELS } from './data/levels.mjs';
import { createRelationshipBank } from './engine/relationship-bank.mjs';
import { createGameController } from './engine/controller.mjs';
import { bindBoardInput } from './ui/input.mjs';
import { renderGame, renderResult, hideResult } from './ui/render.mjs';
import { playResolutionTimeline } from './ui/timeline.mjs';

const bank=createRelationshipBank(RELATIONSHIPS);
const controller=createGameController({
  bank,
  levels:LEVELS,
  initialLevelId:LEVELS[0].id,
  rng:Math.random,
  storage:window.localStorage
});

const boardElement=document.querySelector('#wordyBoard');
const popButton=document.querySelector('#popButton');
const replayButton=document.querySelector('#replayButton');
const nextButton=document.querySelector('#nextButton');
let timelinePlaying=false;

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
