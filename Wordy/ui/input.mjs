function toTileId(target){
  const tile=target?.closest?.('[data-tile-id]');
  const id=String(tile?.dataset?.tileId??'');
  return id||null;
}

export function directionFromSwipe(dx,dy,{threshold=24,dominance=1.15}={}){
  const ax=Math.abs(dx),ay=Math.abs(dy);
  if(Math.max(ax,ay)<threshold)return null;
  if(ax>ay*dominance)return dx>0?'right':'left';
  if(ay>ax*dominance)return dy>0?'down':'up';
  return null;
}

export function bindBoardInput(boardElement,{getNeighbor,areNeighbors,onSwap}={}){
  if(!boardElement?.addEventListener||!boardElement?.removeEventListener)throw new Error('boardElement must support DOM event listeners');
  if(typeof getNeighbor!=='function')throw new Error('getNeighbor must be a function');
  if(typeof areNeighbors!=='function')throw new Error('areNeighbors must be a function');
  if(typeof onSwap!=='function')throw new Error('onSwap must be a function');

  let selected=null,pointerStart=null,suppressNextClick=false;
  const onPointerDown=event=>{
    const tileId=toTileId(event.target);
    if(!tileId)return;
    pointerStart={pointerId:event.pointerId,x:Number(event.clientX)||0,y:Number(event.clientY)||0,tileId};
  };
  const onPointerUp=event=>{
    if(!pointerStart||event.pointerId!==pointerStart.pointerId){pointerStart=null;return;}
    const dx=(Number(event.clientX)||0)-pointerStart.x;
    const dy=(Number(event.clientY)||0)-pointerStart.y;
    const direction=directionFromSwipe(dx,dy);
    const fromTileId=pointerStart.tileId;
    pointerStart=null;
    if(!direction)return;
    selected=null;
    suppressNextClick=true;
    const toTileId=getNeighbor(fromTileId,direction);
    if(toTileId)onSwap(fromTileId,toTileId);
  };
  const onClick=event=>{
    if(suppressNextClick){suppressNextClick=false;return;}
    const tileId=toTileId(event.target);
    if(!tileId)return;
    if(!selected){selected=tileId;return;}
    if(areNeighbors(selected,tileId)){
      const from=selected;
      selected=null;
      onSwap(from,tileId);
      return;
    }
    selected=tileId;
  };

  boardElement.addEventListener('pointerdown',onPointerDown);
  boardElement.addEventListener('pointerup',onPointerUp);
  boardElement.addEventListener('click',onClick);
  return ()=>{
    boardElement.removeEventListener('pointerdown',onPointerDown);
    boardElement.removeEventListener('pointerup',onPointerUp);
    boardElement.removeEventListener('click',onClick);
    selected=null;pointerStart=null;
  };
}
