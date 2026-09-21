function qs(root,selector){
  return root?.querySelector?.(selector)??null;
}

function readyUsage(matches){
  const usage=new Map();
  for(const match of matches??[]){
    for(const cell of match.cells??[]){
      const key=`${cell.row}:${cell.col}`;
      if(!usage.has(key))usage.set(key,[]);
      usage.get(key).push(match);
    }
  }
  return usage;
}

function create(root,tag){
  if(!root?.createElement)throw new Error('render root must provide createElement');
  return root.createElement(tag);
}

function setText(root,selector,value){
  const node=qs(root,selector);
  if(node)node.textContent=String(value??'');
}

export function renderGame(root,state){
  if(!state?.board)throw new Error('state.board is required');
  const boardNode=qs(root,'#wordyBoard');
  const popButton=qs(root,'#popButton');
  const readyCount=qs(root,'#readyCount');
  const matches=state.readyMatches??[];
  const usage=readyUsage(matches);

  setText(root,'#levelLabel',`${state.levelId??''}${state.levelTitle?` · ${state.levelTitle}`:''}`);
  setText(root,'#scoreValue',state.score??0);
  setText(root,'#movesValue',state.movesLeft??0);
  setText(root,'#objectiveText',state.instruction??'');
  setText(root,'#eventLabel',state.eventLabel??'');

  if(boardNode){
    const rows=[];
    state.board.forEach((row,rowIndex)=>{
      const rowNode=create(root,'div');
      rowNode.className='wordy-row';
      rowNode.classList?.add?.('wordy-row');
      rowNode.setAttribute?.('role','row');
      const tiles=[];

      row.forEach((tile,colIndex)=>{
        const button=create(root,'button');
        button.className='wordy-tile';
        button.classList?.add?.('wordy-tile');
        button.setAttribute?.('type','button');
        button.setAttribute?.('role','gridcell');
        button.dataset.row=String(rowIndex);
        button.dataset.col=String(colIndex);
        button.dataset.tileId=tile?.id??'';

        const word=tile?.word??'';
        button.textContent=word;
        const length=word.length;
        if(length<=2)button.classList?.add?.('size-xs');
        else if(length<=5)button.classList?.add?.('size-sm');
        else if(length<=7)button.classList?.add?.('size-md');
        else if(length<=10)button.classList?.add?.('size-lg');
        else button.classList?.add?.('size-xl');

        button.disabled=state.phase!=='playing'||!tile;
        const cellMatches=usage.get(`${rowIndex}:${colIndex}`)??[];
        if(cellMatches.length>0)button.classList?.add?.('is-ready');
        const orientations=new Set(cellMatches.map(match=>match.orientation));
        if(orientations.has('horizontal')&&orientations.has('vertical'))button.classList?.add?.('is-cross');
        tiles.push(button);
      });

      rowNode.append?.(...tiles);
      rows.push(rowNode);
    });
    boardNode.replaceChildren?.(...rows);
  }

  if(readyCount)readyCount.textContent=matches.length===1?'1 ready':`${matches.length} ready`;
  if(popButton){
    popButton.disabled=state.phase!=='playing'||matches.length===0;
    popButton.textContent=matches.length>1?`POP ×${matches.length}`:'POP';
  }
}

function reviewCard(root,title,detail){
  const card=create(root,'article');
  card.className='review-card';
  card.classList?.add?.('review-card');
  const strong=create(root,'strong');
  strong.textContent=title;
  const span=create(root,'span');
  span.textContent=detail;
  card.append?.(strong,span);
  return card;
}


function sameCell(a,b){
  return a?.row===b?.row&&a?.col===b?.col;
}

function renderMissedReplay(root,item){
  const replay=qs(root,'#replayBoard');
  if(!replay)return;
  const rows=item?.boardRows;
  if(!Array.isArray(rows)||rows.length===0){
    replay.replaceChildren?.();
    return;
  }
  const suggested=item?.suggestedSwap;
  const cells=[];
  rows.forEach((row,rowIndex)=>row.forEach((word,colIndex)=>{
    const tile=create(root,'div');
    tile.className='replay-tile';
    tile.classList?.add?.('replay-tile');
    tile.textContent=word??'';
    const cell={row:rowIndex,col:colIndex};
    if(sameCell(cell,suggested?.from)||sameCell(cell,suggested?.to)){
      tile.classList?.add?.('is-suggested');
    }
    cells.push(tile);
  }));
  replay.replaceChildren?.(...cells);
}

export function renderResult(root,review={newLearning:[],missed:[]}){
  const overlay=qs(root,'#resultOverlay');
  const newList=qs(root,'#newLearningList');
  const missedList=qs(root,'#missedList');

  if(newList){
    const cards=(review.newLearning??[]).map(relation=>
      reviewCard(root,(relation.tokens??[]).join(' '),relation.meaning??relation.category??'New relationship')
    );
    newList.replaceChildren?.(...cards);
  }

  if(missedList){
    const cards=(review.missed??[]).map(item=>{
      const relation=item.relationship??{};
      const title=(relation.tokens??[item.relationshipId]).join(' ');
      const detail=`+${item.projectedScore??0} possible · ${relation.meaning??'Missed opportunity'}`;
      return reviewCard(root,title,detail);
    });
    missedList.replaceChildren?.(...cards);
  }

  renderMissedReplay(root,(review.missed??[])[0]??null);

  if(overlay){
    overlay.hidden=false;
    overlay.setAttribute?.('aria-hidden','false');
  }
}

export function hideResult(root){
  const overlay=qs(root,'#resultOverlay');
  if(overlay){
    overlay.hidden=true;
    overlay.setAttribute?.('aria-hidden','true');
  }
}
