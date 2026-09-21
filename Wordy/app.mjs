import { RELATIONSHIPS } from './data/relationships.mjs';
import { LEVELS } from './data/levels.mjs';
import { createRelationshipBank } from './engine/relationship-bank.mjs';
import { createGameController } from './engine/controller.mjs';
import { bindBoardInput } from './ui/input.mjs';
import { renderGame, renderResult, hideResult } from './ui/render.mjs';

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

bindBoardInput(boardElement,{
  onSwap:(from,to)=>controller.swap(from,to)
});

popButton?.addEventListener('click',()=>controller.pop());
replayButton?.addEventListener('click',()=>controller.replay());
nextButton?.addEventListener('click',()=>{
  if(!controller.next())nextButton.disabled=true;
});

controller.subscribe(state=>{
  renderGame(document,state);
  if(state.phase==='result'){
    renderResult(document,state.review??{newLearning:[],missed:[]});
  }else{
    hideResult(document);
  }
});

window.addEventListener('pagehide',()=>controller.abandon());

window.WordyPrototype={controller};
