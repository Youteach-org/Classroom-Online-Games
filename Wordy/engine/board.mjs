function normalizeWord(value){
  return String(value??'').trim().replace(/\s+/g,' ').toUpperCase();
}

function assertRectangular(rows){
  if(!Array.isArray(rows)||rows.length===0)throw new Error('board must contain at least one row');
  if(!Array.isArray(rows[0])||rows[0].length===0)throw new Error('board must contain at least one column');
  const width=rows[0].length;
  if(rows.some(row=>!Array.isArray(row)||row.length!==width))throw new Error('board rows must be rectangular');
}

function inside(board,cell){
  return Number.isInteger(cell?.row)&&Number.isInteger(cell?.col)&&
    cell.row>=0&&cell.row<board.length&&cell.col>=0&&cell.col<board[0].length;
}

function assertCell(board,cell){
  if(!inside(board,cell))throw new Error('cell is outside board');
}

function cloneTile(tile){
  return tile==null?null:{...tile};
}

export function createBoard(wordRows,idFactory){
  assertRectangular(wordRows);
  let index=0;
  const makeId=typeof idFactory==='function'
    ?idFactory
    :({index})=>`tile-${index+1}`;

  return wordRows.map((row,rowIndex)=>row.map((value,colIndex)=>{
    const cellIndex=index++;
    if(value==null)return null;
    const word=normalizeWord(value);
    if(!word)throw new Error(`empty word at ${rowIndex},${colIndex}`);
    const id=String(makeId({row:rowIndex,col:colIndex,index:cellIndex,word}));
    if(!id)throw new Error(`empty tile id at ${rowIndex},${colIndex}`);
    return {id,word};
  }));
}

export function areAdjacent(a,b){
  if(!a||!b)return false;
  const rowDistance=Math.abs(Number(a.row)-Number(b.row));
  const colDistance=Math.abs(Number(a.col)-Number(b.col));
  return rowDistance+colDistance===1;
}

export function swapTiles(board,a,b){
  assertRectangular(board);
  assertCell(board,a);
  assertCell(board,b);
  if(!areAdjacent(a,b))throw new Error('invalid non-adjacent swap');
  const next=board.map(row=>row.map(cloneTile));
  [next[a.row][a.col],next[b.row][b.col]]=[next[b.row][b.col],next[a.row][a.col]];
  return next;
}

export function removeCells(board,cells){
  assertRectangular(board);
  const next=board.map(row=>row.map(cloneTile));
  const unique=new Set();
  for(const cell of cells??[]){
    assertCell(board,cell);
    unique.add(`${cell.row}:${cell.col}`);
  }
  for(const key of unique){
    const [row,col]=key.split(':').map(Number);
    next[row][col]=null;
  }
  return next;
}

export function collapseColumns(board,refillTile){
  assertRectangular(board);
  if(typeof refillTile!=='function')throw new Error('refillTile must be a function');
  const rows=board.length;
  const cols=board[0].length;
  const next=Array.from({length:rows},()=>Array(cols).fill(null));

  for(let col=0;col<cols;col++){
    const survivors=[];
    for(let row=0;row<rows;row++){
      if(board[row][col]!=null)survivors.push(cloneTile(board[row][col]));
    }
    const gapCount=rows-survivors.length;
    for(let row=0;row<gapCount;row++){
      const tile=refillTile({row,col});
      if(!tile||!String(tile.id||'')||!normalizeWord(tile.word))throw new Error(`invalid refill tile at ${row},${col}`);
      next[row][col]={...tile,id:String(tile.id),word:normalizeWord(tile.word)};
    }
    for(let i=0;i<survivors.length;i++){
      next[gapCount+i][col]=survivors[i];
    }
  }
  return next;
}

export function boardKey(board){
  assertRectangular(board);
  return board.map(row=>row.map(tile=>tile?.word??'∅').join('\u001f')).join('\u001e');
}
