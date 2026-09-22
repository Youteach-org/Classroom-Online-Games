import { normalizeWord, spanForWord } from './tile-size.mjs';

function cloneTile(tile){
  return {...tile};
}

function assertPositiveInt(value,label){
  if(!Number.isInteger(value)||value<1)throw new Error(`${label} must be a positive integer`);
}

function validateBoard(board){
  if(!board||typeof board!=='object')throw new Error('board is required');
  assertPositiveInt(board.rows,'board rows');
  assertPositiveInt(board.columns,'board columns');
  if(!Array.isArray(board.tiles))throw new Error('board tiles must be an array');

  const ids=new Set();
  const map=Array.from({length:board.rows},()=>Array(board.columns).fill(null));
  for(const tile of board.tiles){
    if(!tile||typeof tile!=='object')throw new Error('invalid tile');
    const id=String(tile.id??'');
    if(!id)throw new Error('tile id is required');
    if(ids.has(id))throw new Error(`duplicate tile id: ${id}`);
    ids.add(id);
    if(!normalizeWord(tile.word))throw new Error(`empty word for tile ${id}`);
    if(!Number.isInteger(tile.row)||tile.row<0||tile.row>=board.rows)throw new Error(`tile ${id} row is outside board`);
    if(!Number.isInteger(tile.startColumn)||tile.startColumn<0)throw new Error(`tile ${id} startColumn is invalid`);
    if(!Number.isInteger(tile.span)||tile.span<1||tile.span>4)throw new Error(`tile ${id} span must be 1-4`);
    if(tile.startColumn+tile.span>board.columns)throw new Error(`tile ${id} exceeds ${board.columns} columns`);
    for(let col=tile.startColumn;col<tile.startColumn+tile.span;col++){
      if(map[tile.row][col]!=null)throw new Error(`tile ${id} overlaps tile ${map[tile.row][col]}`);
      map[tile.row][col]=id;
    }
  }
  return map;
}

function rawTileById(board,tileId){
  return board.tiles.find(tile=>tile.id===String(tileId))??null;
}

export function createBoard(wordRows,options={}){
  if(!Array.isArray(wordRows)||wordRows.length===0)throw new Error('board must contain at least one row');
  if(wordRows.some(row=>!Array.isArray(row)||row.length===0))throw new Error('board rows must contain words');

  const opts=typeof options==='function'?{idFactory:options}:options??{};
  const columns=opts.columns??12;
  assertPositiveInt(columns,'board columns');
  const makeId=typeof opts.idFactory==='function'
    ?opts.idFactory
    :({index})=>`tile-${index+1}`;

  let index=0;
  const tiles=[];
  wordRows.forEach((row,rowIndex)=>{
    let startColumn=0;
    row.forEach((value,wordIndex)=>{
      const word=normalizeWord(value);
      if(!word)throw new Error(`empty word at ${rowIndex},${wordIndex}`);
      const span=spanForWord(word);
      if(startColumn+span>columns)throw new Error(`row ${rowIndex} exceeds ${columns} columns`);
      const tileIndex=index++;
      const id=String(makeId({row:rowIndex,index:tileIndex,wordIndex,word,startColumn,span}));
      if(!id)throw new Error(`empty tile id at ${rowIndex},${wordIndex}`);
      tiles.push({id,word,row:rowIndex,startColumn,span});
      startColumn+=span;
    });
    if(startColumn!==columns)throw new Error(`row ${rowIndex} must occupy exactly ${columns} columns`);
  });

  const board={rows:wordRows.length,columns,tiles};
  validateBoard(board);
  return board;
}

export function cloneBoard(board){
  validateBoard(board);
  return {rows:board.rows,columns:board.columns,tiles:board.tiles.map(cloneTile)};
}

export function tileById(board,tileId){
  validateBoard(board);
  const tile=rawTileById(board,tileId);
  return tile?cloneTile(tile):null;
}

export function tilesInRow(board,row){
  validateBoard(board);
  if(!Number.isInteger(row)||row<0||row>=board.rows)throw new Error('row is outside board');
  return board.tiles
    .filter(tile=>tile.row===row)
    .sort((a,b)=>a.startColumn-b.startColumn||a.id.localeCompare(b.id))
    .map(cloneTile);
}

export function occupancyMap(board){
  return validateBoard(board).map(row=>[...row]);
}

export function areSwapNeighbors(board,aId,bId){
  validateBoard(board);
  const a=rawTileById(board,aId);
  const b=rawTileById(board,bId);
  if(!a||!b||a.id===b.id)return false;

  if(a.row===b.row){
    return a.startColumn+a.span===b.startColumn || b.startColumn+b.span===a.startColumn;
  }

  return Math.abs(a.row-b.row)===1 &&
    a.startColumn===b.startColumn &&
    a.span===b.span;
}

export function neighborForDirection(board,tileId,direction){
  validateBoard(board);
  const tile=rawTileById(board,tileId);
  if(!tile)return null;

  let neighbor=null;
  if(direction==='left'){
    neighbor=board.tiles.find(candidate=>candidate.row===tile.row && candidate.startColumn+candidate.span===tile.startColumn)??null;
  }else if(direction==='right'){
    const edge=tile.startColumn+tile.span;
    neighbor=board.tiles.find(candidate=>candidate.row===tile.row && candidate.startColumn===edge)??null;
  }else if(direction==='up'||direction==='down'){
    const row=tile.row+(direction==='up'?-1:1);
    neighbor=board.tiles.find(candidate=>
      candidate.row===row && candidate.startColumn===tile.startColumn && candidate.span===tile.span
    )??null;
  }else{
    throw new Error('unknown direction: '+direction);
  }
  return neighbor?.id??null;
}

export function swapTiles(board,aId,bId){
  validateBoard(board);
  const a=rawTileById(board,aId);
  const b=rawTileById(board,bId);
  if(!a||!b)throw new Error('unknown tile id');
  if(!areSwapNeighbors(board,a.id,b.id))throw new Error('invalid non-adjacent swap');

  const next=cloneBoard(board);
  const nextA=rawTileById(next,a.id);
  const nextB=rawTileById(next,b.id);

  if(a.row===b.row){
    const left=a.startColumn<b.startColumn?a:b;
    const right=left.id===a.id?b:a;
    const nextLeft=rawTileById(next,left.id);
    const nextRight=rawTileById(next,right.id);
    const footprintStart=left.startColumn;
    nextRight.startColumn=footprintStart;
    nextLeft.startColumn=footprintStart+right.span;
  }else{
    const row=nextA.row;
    nextA.row=nextB.row;
    nextB.row=row;
  }

  validateBoard(next);
  return next;
}

export function removeTiles(board,tileIds){
  validateBoard(board);
  const ids=new Set((tileIds??[]).map(String));
  for(const id of ids){
    if(!rawTileById(board,id))throw new Error(`unknown tile id: ${id}`);
  }
  return {
    rows:board.rows,
    columns:board.columns,
    tiles:board.tiles.filter(tile=>!ids.has(tile.id)).map(cloneTile)
  };
}

export function emptyRuns(board,row){
  const map=occupancyMap(board);
  if(!Number.isInteger(row)||row<0||row>=board.rows)throw new Error('row is outside board');
  const runs=[];
  let start=null;
  for(let col=0;col<=board.columns;col++){
    const empty=col<board.columns&&map[row][col]==null;
    if(empty&&start==null)start=col;
    if(!empty&&start!=null){
      runs.push({row,startColumn:start,width:col-start});
      start=null;
    }
  }
  return runs;
}

export function boardKey(board){
  validateBoard(board);
  return board.tiles
    .slice()
    .sort((a,b)=>a.row-b.row||a.startColumn-b.startColumn||a.span-b.span||a.word.localeCompare(b.word))
    .map(tile=>`${tile.row}:${tile.startColumn}:${tile.span}:${tile.word}`)
    .join('\u001e');
}
