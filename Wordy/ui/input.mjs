function toCell(target){
  const tile=target?.closest?.('[data-row][data-col]');
  if(!tile)return null;
  const row=Number(tile.dataset.row);
  const col=Number(tile.dataset.col);
  if(!Number.isInteger(row)||!Number.isInteger(col))return null;
  return {row,col};
}

function adjacent(a,b){
  return !!a&&!!b&&(Math.abs(a.row-b.row)+Math.abs(a.col-b.col)===1);
}

export function directionFromSwipe(dx,dy,{threshold=24,dominance=1.15}={}){
  const ax=Math.abs(dx);
  const ay=Math.abs(dy);
  if(Math.max(ax,ay)<threshold)return null;
  if(ax>ay*dominance)return dx>0?'right':'left';
  if(ay>ax*dominance)return dy>0?'down':'up';
  return null;
}

export function neighborForDirection(cell,direction){
  const offsets={
    up:{row:-1,col:0},
    down:{row:1,col:0},
    left:{row:0,col:-1},
    right:{row:0,col:1}
  };
  const delta=offsets[direction];
  if(!delta)throw new Error('unknown direction: '+direction);
  return {row:cell.row+delta.row,col:cell.col+delta.col};
}

export function bindBoardInput(boardElement,{onSwap}={}){
  if(!boardElement?.addEventListener||!boardElement?.removeEventListener){
    throw new Error('boardElement must support DOM event listeners');
  }
  if(typeof onSwap!=='function')throw new Error('onSwap must be a function');

  let selected=null;
  let pointerStart=null;
  let suppressNextClick=false;

  const onPointerDown=event=>{
    const cell=toCell(event.target);
    if(!cell)return;
    pointerStart={
      pointerId:event.pointerId,
      x:Number(event.clientX)||0,
      y:Number(event.clientY)||0,
      cell
    };
  };

  const onPointerUp=event=>{
    if(!pointerStart||event.pointerId!==pointerStart.pointerId){
      pointerStart=null;
      return;
    }
    const dx=(Number(event.clientX)||0)-pointerStart.x;
    const dy=(Number(event.clientY)||0)-pointerStart.y;
    const direction=directionFromSwipe(dx,dy);
    const from=pointerStart.cell;
    pointerStart=null;
    if(!direction)return;
    selected=null;
    suppressNextClick=true;
    onSwap(from,neighborForDirection(from,direction));
  };

  const onClick=event=>{
    if(suppressNextClick){
      suppressNextClick=false;
      return;
    }
    const cell=toCell(event.target);
    if(!cell)return;
    if(!selected){
      selected=cell;
      return;
    }
    if(adjacent(selected,cell)){
      const from=selected;
      selected=null;
      onSwap(from,cell);
      return;
    }
    selected=cell;
  };

  boardElement.addEventListener('pointerdown',onPointerDown);
  boardElement.addEventListener('pointerup',onPointerUp);
  boardElement.addEventListener('click',onClick);

  return ()=>{
    boardElement.removeEventListener('pointerdown',onPointerDown);
    boardElement.removeEventListener('pointerup',onPointerUp);
    boardElement.removeEventListener('click',onClick);
    selected=null;
    pointerStart=null;
  };
}
