function normalizeWord(value){
  return String(value??'').trim().replace(/\s+/g,' ').toUpperCase();
}

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
    if(!Number.isInteger(tile.column)||tile.column<0||tile.column>=board.columns)throw new Error(`tile ${id} column is outside board`);
    if(map[tile.row][tile.column]!=null)throw new Error(`tile ${id} overlaps tile ${map[tile.row][tile.column]}`);
    map[tile.row][tile.column]=id;
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
  const columns=opts.columns??wordRows[0].length;
  assertPositiveInt(columns,'board columns');
  if(wordRows.some(row=>row.length!==columns))throw new Error('all board rows must contain the same number of columns');

  const makeId=typeof opts.idFactory==='function'
    ?opts.idFactory
    :({index})=>`tile-${index+1}`;

  let index=0;
  const tiles=[];
  wordRows.forEach((row,rowIndex)=>{
    row.forEach((value,column)=>{
      const word=normalizeWord(value);
      if(!word)throw new Error(`empty word at ${rowIndex},${column}`);
      const tileIndex=index++;
      const id=String(makeId({row:rowIndex,column,index:tileIndex,word}));
      if(!id)throw new Error(`empty tile id at ${rowIndex},${column}`);
      tiles.push({id,word,row:rowIndex,column});
    });
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
    .sort((a,b)=>a.column-b.column||a.id.localeCompare(b.id))
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
  return Math.abs(a.row-b.row)+Math.abs(a.column-b.column)===1;
}

export function neighborForDirection(board,tileId,direction){
  validateBoard(board);
  const tile=rawTileById(board,tileId);
  if(!tile)return null;

  const deltas={
    left:[0,-1],
    right:[0,1],
    up:[-1,0],
    down:[1,0]
  };
  const delta=deltas[direction];
  if(!delta)throw new Error('unknown direction: '+direction);
  const row=tile.row+delta[0];
  const column=tile.column+delta[1];
  if(row<0||row>=board.rows||column<0||column>=board.columns)return null;
  return board.tiles.find(candidate=>candidate.row===row&&candidate.column===column)?.id??null;
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
  [nextA.row,nextB.row]=[nextB.row,nextA.row];
  [nextA.column,nextB.column]=[nextB.column,nextA.column];
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

export function settleGravity(board){
  validateBoard(board);
  const next=cloneBoard(board);
  for(let column=0;column<next.columns;column++){
    const tiles=next.tiles
      .filter(tile=>tile.column===column)
      .sort((a,b)=>b.row-a.row||a.id.localeCompare(b.id));
    let targetRow=next.rows-1;
    for(const tile of tiles)tile.row=targetRow--;
  }
  validateBoard(next);
  return next;
}

export function emptyCellsByColumn(board){
  const map=occupancyMap(board);
  const empty=[];
  for(let column=0;column<board.columns;column++){
    for(let row=0;row<board.rows;row++){
      if(map[row][column]==null)empty.push({row,column});
    }
  }
  return empty;
}

export function boardKey(board){
  validateBoard(board);
  return board.tiles
    .slice()
    .sort((a,b)=>a.row-b.row||a.column-b.column||a.word.localeCompare(b.word))
    .map(tile=>`${tile.row}:${tile.column}:${tile.word}`)
    .join('\u001e');
}
