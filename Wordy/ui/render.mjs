function qs(root,selector){
  return root?.querySelector?.(selector)??null;
}

function readyUsage(matches){
  const usage=new Map();
  for(const match of matches??[]){
    for(const tileId of match.tileIds??[]){
      if(!usage.has(tileId))usage.set(tileId,[]);
      usage.get(tileId).push(match);
    }
  }
  return usage;
}

function readySurfaceWord(tile,matches){
  if(tile?.word!=='A'||!matches?.length)return tile?.word??'';
  const forms=new Set();
  for(const match of matches){
    const index=(match.tileIds??[]).indexOf(tile.id);
    if(index<0)continue;
    const token=match.tokens?.[index];
    if(token==='A'||token==='AN')forms.add(token);
  }
  if(forms.has('A')&&forms.has('AN'))return 'A/AN';
  if(forms.has('AN'))return 'AN';
  return 'A';
}

function create(root,tag){
  if(!root?.createElement)throw new Error('render root must provide createElement');
  return root.createElement(tag);
}

function setText(root,selector,value){
  const node=qs(root,selector);
  if(node)node.textContent=String(value??'');
}

function typographyClass(word){
  const length=String(word??'').length;
  if(length>=9)return 'text-xlong';
  if(length>=8)return 'text-long';
  if(length>=6)return 'text-medium';
  return '';
}

function applyTilePosition(node,tile){
  node.dataset.tileId=tile.id;
  node.dataset.row=String(tile.row);
  node.dataset.column=String(tile.column);
  if(!node.style)node.style={};
  node.style.gridRow=String(tile.row+1);
  node.style.gridColumn=String(tile.column+1);
}

export function renderBoardSnapshot(root,board,{matches=[],disabled=true}={}){
  if(!board?.tiles)throw new Error('board.tiles is required');
  const boardNode=qs(root,'#wordyBoard');
  if(!boardNode)return null;
  const usage=readyUsage(matches);
  const tiles=board.tiles
    .slice()
    .sort((a,b)=>a.row-b.row||a.column-b.column||a.id.localeCompare(b.id))
    .map(tile=>{
      const button=create(root,'button');
      button.className='wordy-tile';
      button.classList?.add?.('wordy-tile');
      const tileMatches=usage.get(tile.id)??[];
      const surfaceWord=readySurfaceWord(tile,tileMatches);
      const textClass=typographyClass(surfaceWord);
      if(textClass)button.classList?.add?.(textClass);
      button.setAttribute?.('type','button');
      button.setAttribute?.('role','gridcell');
      applyTilePosition(button,tile);
      button.textContent=surfaceWord;
      button.disabled=!!disabled;
      if(tileMatches.length)button.classList?.add?.('is-ready');
      const orientations=new Set(tileMatches.map(match=>match.orientation));
      if(orientations.has('horizontal')&&orientations.has('vertical'))button.classList?.add?.('is-cross');
      return button;
    });
  boardNode.replaceChildren?.(...tiles);
  return boardNode;
}

export function renderGame(root,state){
  if(!state?.board?.tiles)throw new Error('state.board.tiles is required');
  const popButton=qs(root,'#popButton');
  const readyCount=qs(root,'#readyCount');
  const matches=state.readyMatches??[];

  setText(root,'#levelLabel',`${state.levelId??''}${state.levelTitle?` · ${state.levelTitle}`:''}`);
  setText(root,'#scoreValue',state.score??0);
  setText(root,'#movesValue',state.movesLeft??0);
  setText(root,'#objectiveText',state.instruction??'');
  setText(root,'#eventLabel',state.eventLabel??'');

  renderBoardSnapshot(root,state.board,{
    matches,
    disabled:state.phase!=='playing'||Number(state.movesLeft??0)<=0
  });

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

function renderMissedReplay(root,item){
  const replay=qs(root,'#replayBoard');
  if(!replay)return;
  const board=item?.boardSnapshot;
  if(!board?.tiles){
    replay.replaceChildren?.();
    return;
  }
  const suggested=new Set([
    String(item?.suggestedSwap?.fromTileId??''),
    String(item?.suggestedSwap?.toTileId??'')
  ].filter(Boolean));
  const tiles=board.tiles
    .slice()
    .sort((a,b)=>a.row-b.row||a.column-b.column||a.id.localeCompare(b.id))
    .map(source=>{
      const tile=create(root,'div');
      tile.className='replay-tile';
      tile.classList?.add?.('replay-tile');
      const textClass=typographyClass(source.word);
      if(textClass)tile.classList?.add?.(textClass);
      applyTilePosition(tile,source);
      tile.textContent=source.word??'';
      if(suggested.has(source.id))tile.classList?.add?.('is-suggested');
      return tile;
    });
  replay.replaceChildren?.(...tiles);
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
