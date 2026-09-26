import { renderBoardSnapshot } from './render.mjs';

const defaultSleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function boardNode(root){
  return root?.querySelector?.('#wordyBoard')??null;
}

function tileNodes(node){
  return [...(node?.querySelectorAll?.('.wordy-tile')??[])];
}

function rectMap(node){
  const map=new Map();
  for(const tile of tileNodes(node)){
    if(!tile?.dataset?.tileId||typeof tile.getBoundingClientRect!=='function')continue;
    const rect=tile.getBoundingClientRect();
    map.set(tile.dataset.tileId,{
      top:rect.top,left:rect.left,width:rect.width,height:rect.height,
      right:rect.right,bottom:rect.bottom
    });
  }
  return map;
}

async function runAnimation(node,keyframes,options){
  if(typeof node?.animate!=='function')return;
  try{
    const animation=node.animate(keyframes,options);
    if(animation?.finished)await animation.finished.catch(()=>{});
  }catch{}
}

async function defaultAnimateRemoval(root,event){
  if(!event?.boardBefore||!event?.boardAfterRemoval)return;
  renderBoardSnapshot(root,event.boardBefore,{disabled:true});
  const node=boardNode(root);
  const removed=new Set((event.removedTileIds??[]).map(String));
  const animations=tileNodes(node)
    .filter(tile=>removed.has(String(tile?.dataset?.tileId??'')))
    .map(tile=>runAnimation(tile,[
      {transform:'scale(1)',opacity:1},
      {transform:'scale(.18)',opacity:0}
    ],{
      duration:170,
      easing:'cubic-bezier(.4,0,.8,.2)',
      fill:'forwards'
    }));
  await Promise.all(animations);
  renderBoardSnapshot(root,event.boardAfterRemoval,{disabled:true});
}

export function gravityAnimationSpec(from,to){
  const dx=Number(from?.left??0)-Number(to?.left??0);
  const dy=Number(from?.top??0)-Number(to?.top??0);
  const distance=Math.hypot(dx,dy);
  const duration=Math.round(Math.min(680,Math.max(480,380+distance*0.85)));
  return {
    keyframes:[
      {transform:`translate(${dx}px,${dy}px)`},
      {offset:.84,transform:'translate(0px,8px)'},
      {transform:'translate(0px,0px)'}
    ],
    options:{
      duration,
      easing:'cubic-bezier(.18,.72,.18,1)',
      fill:'both'
    }
  };
}

export function refillAnimationSpec({dy,row=0,column=0}={}){
  const distance=Math.abs(Number(dy)||0);
  const duration=Math.round(Math.min(720,Math.max(520,440+distance*0.65)));
  return {
    keyframes:[
      {transform:`translateY(${Number(dy)||0}px)`,opacity:.28},
      {offset:.84,transform:'translateY(8px)',opacity:1},
      {transform:'translateY(0px)',opacity:1}
    ],
    options:{
      duration,
      delay:Math.max(0,Number(column)||0)*10+Math.max(0,Number(row)||0)*8,
      easing:'cubic-bezier(.18,.72,.18,1)',
      fill:'both'
    }
  };
}

async function defaultAnimateGravity(root,event){
  if(!event?.boardAfterRemoval||!event?.boardAfterGravity)return;
  const node=boardNode(root);
  if(!node)return;
  const before=rectMap(node);
  renderBoardSnapshot(root,event.boardAfterGravity,{disabled:true});
  const after=rectMap(node);
  const animations=[];
  for(const tile of tileNodes(node)){
    const id=String(tile?.dataset?.tileId??'');
    const from=before.get(id);
    const to=after.get(id);
    if(!from||!to)continue;
    const dx=from.left-to.left;
    const dy=from.top-to.top;
    if(Math.abs(dx)<0.5&&Math.abs(dy)<0.5)continue;
    const spec=gravityAnimationSpec(from,to);
    animations.push(runAnimation(tile,spec.keyframes,spec.options));
  }
  await Promise.all(animations);
}

async function defaultAnimateRefill(root,event){
  if(!event?.boardAfterGravity||!event?.boardAfterRefill)return;
  const node=boardNode(root);
  if(!node)return;
  const existing=new Set(event.boardAfterGravity.tiles.map(tile=>String(tile.id)));
  renderBoardSnapshot(root,event.boardAfterRefill,{disabled:true});

  const boardRect=typeof node.getBoundingClientRect==='function'
    ?node.getBoundingClientRect()
    :null;
  const animations=[];
  for(const tile of tileNodes(node)){
    const id=String(tile?.dataset?.tileId??'');
    if(existing.has(id)||typeof tile.getBoundingClientRect!=='function')continue;
    const rect=tile.getBoundingClientRect();
    const fallbackDistance=(Number(tile?.dataset?.row??0)+1)*Math.max(1,rect.height)+18;
    const dy=boardRect
      ?Math.min(-fallbackDistance,boardRect.top-rect.bottom-12)
      :-fallbackDistance;
    const spec=refillAnimationSpec({
      dy,
      row:Number(tile?.dataset?.row??0),
      column:Number(tile?.dataset?.column??0)
    });
    animations.push(runAnimation(tile,spec.keyframes,spec.options));
  }
  await Promise.all(animations);
}

function hasVisualStages(event){
  return !!(
    event?.boardBefore&&
    event?.boardAfterRemoval&&
    event?.boardAfterGravity&&
    event?.boardAfterRefill
  );
}

export async function playResolutionTimeline(root,events,{
  delayMs=120,
  sleep=defaultSleep,
  animateRemoval=defaultAnimateRemoval,
  animateGravity=defaultAnimateGravity,
  animateRefill=defaultAnimateRefill
}={}){
  const node=root?.querySelector?.('#eventLabel');
  const timeline=Array.isArray(events)?events.filter(event=>event?.label):[];
  if(!node||timeline.length===0)return;
  for(let index=0;index<timeline.length;index++){
    const event=timeline[index];
    node.textContent=event.label;
    if(hasVisualStages(event)){
      await animateRemoval(root,event);
      await animateGravity(root,event);
      await animateRefill(root,event);
    }
    if(index<timeline.length-1&&delayMs>0)await sleep(delayMs);
  }
}
