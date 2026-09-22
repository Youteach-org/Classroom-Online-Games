function tileNodes(boardElement){
  const nodes=boardElement?.querySelectorAll?.('[data-tile-id]')??[];
  return new Map([...nodes].map(node=>[String(node?.dataset?.tileId??''),node]).filter(([id])=>id));
}

function rectOf(node){
  const rect=node?.getBoundingClientRect?.();
  if(!rect)return null;
  return {left:Number(rect.left)||0,top:Number(rect.top)||0,width:Number(rect.width)||0,height:Number(rect.height)||0};
}

export function translationBetween(oldRect,newRect){
  return {x:(Number(oldRect?.left)||0)-(Number(newRect?.left)||0),y:(Number(oldRect?.top)||0)-(Number(newRect?.top)||0)};
}

export function captureTileRects(boardElement,tileIds){
  const wanted=new Set((tileIds??[]).map(String));
  const nodes=tileNodes(boardElement);
  const rects=new Map();
  for(const id of wanted){
    const rect=rectOf(nodes.get(id));
    if(rect)rects.set(id,rect);
  }
  return rects;
}

function finished(animation){
  if(!animation?.finished)return Promise.resolve();
  return Promise.resolve(animation.finished).catch(()=>{});
}

export async function animateAcceptedSwap(boardElement,beforeRects,tileIds,{duration=150}={}){
  const nodes=tileNodes(boardElement);
  const animations=[];
  for(const id of tileIds??[]){
    const node=nodes.get(String(id));
    const before=beforeRects?.get?.(String(id));
    const after=rectOf(node);
    if(!node||!before||!after||typeof node.animate!=='function')continue;
    const delta=translationBetween(before,after);
    if(delta.x===0&&delta.y===0)continue;
    animations.push(node.animate([
      {transform:`translate(${delta.x}px, ${delta.y}px)`},
      {transform:'translate(0px, 0px)'}
    ],{duration,easing:'cubic-bezier(.2,.8,.2,1)'}));
  }
  await Promise.all(animations.map(finished));
}

export async function animateRejectedSwap(boardElement,tileIds,{duration=110}={}){
  const [aId,bId]=(tileIds??[]).map(String);
  if(!aId||!bId)return;
  const nodes=tileNodes(boardElement);
  const a=nodes.get(aId),b=nodes.get(bId);
  const ar=rectOf(a),br=rectOf(b);
  if(!a||!b||!ar||!br)return;
  const animations=[];
  for(const [node,from,to] of [[a,ar,br],[b,br,ar]]){
    if(typeof node.animate!=='function')continue;
    const x=to.left-from.left,y=to.top-from.top;
    animations.push(node.animate([
      {transform:'translate(0px, 0px)'},
      {transform:`translate(${x}px, ${y}px)`},
      {transform:'translate(0px, 0px)'}
    ],{duration:duration*2,easing:'cubic-bezier(.36,.07,.19,.97)'}));
  }
  await Promise.all(animations.map(finished));
}
