export function cellKey(cell){
  return `${cell.row}:${cell.col}`;
}

function wordsAt(board,cells){
  const words=[];
  for(const cell of cells){
    const tile=board[cell.row]?.[cell.col];
    if(!tile)return null;
    words.push(tile.word);
  }
  return words;
}

function sameTokens(actual,expected){
  if(!actual||actual.length!==expected.length)return false;
  for(let i=0;i<expected.length;i++){
    if(actual[i]!==expected[i])return false;
  }
  return true;
}

function cellsFor(row,col,length,orientation){
  return Array.from({length},(_,index)=>orientation==='horizontal'
    ?{row,col:col+index}
    :{row:row+index,col}
  );
}

function lineIdentity(match){
  const first=match.cells[0];
  return match.orientation==='horizontal'?`r:${first.row}`:`c:${first.col}`;
}

function fullyContains(outer,inner){
  if(outer.orientation!==inner.orientation)return false;
  if(lineIdentity(outer)!==lineIdentity(inner))return false;
  if(outer.cells.length<=inner.cells.length)return false;
  const keys=new Set(outer.cells.map(cellKey));
  return inner.cells.every(cell=>keys.has(cellKey(cell)));
}

function suppressContained(matches){
  return matches.filter((candidate,index)=>
    !matches.some((other,otherIndex)=>otherIndex!==index&&fullyContains(other,candidate))
  );
}

export function findMatches(board,bank){
  if(!Array.isArray(board)||board.length===0||!Array.isArray(board[0]))return [];
  if(!bank?.byLength)return [];
  const rows=board.length;
  const cols=board[0].length;
  const raw=[];

  for(const [length,relationships] of bank.byLength.entries()){
    if(length<=cols){
      for(let row=0;row<rows;row++){
        for(let col=0;col<=cols-length;col++){
          const cells=cellsFor(row,col,length,'horizontal');
          const words=wordsAt(board,cells);
          if(!words)continue;
          for(const relation of relationships){
            if(sameTokens(words,relation.tokens)){
              raw.push({
                relationshipId:relation.id,
                orientation:'horizontal',
                cells,
                tokens:[...relation.tokens]
              });
            }
          }
        }
      }
    }

    if(length<=rows){
      for(let col=0;col<cols;col++){
        for(let row=0;row<=rows-length;row++){
          const cells=cellsFor(row,col,length,'vertical');
          const words=wordsAt(board,cells);
          if(!words)continue;
          for(const relation of relationships){
            if(sameTokens(words,relation.tokens)){
              raw.push({
                relationshipId:relation.id,
                orientation:'vertical',
                cells,
                tokens:[...relation.tokens]
              });
            }
          }
        }
      }
    }
  }

  return suppressContained(raw).sort((a,b)=>{
    const ac=a.cells[0];
    const bc=b.cells[0];
    return ac.row-bc.row||ac.col-bc.col||
      (a.orientation===b.orientation?0:(a.orientation==='horizontal'?-1:1))||
      b.cells.length-a.cells.length||a.relationshipId.localeCompare(b.relationshipId);
  });
}

export function findCrossings(matches){
  const byCell=new Map();
  for(const match of matches??[]){
    for(const cell of match.cells??[]){
      const key=cellKey(cell);
      if(!byCell.has(key))byCell.set(key,{cell:{row:cell.row,col:cell.col},matches:[]});
      byCell.get(key).matches.push(match);
    }
  }

  const crossings=[];
  for(const entry of byCell.values()){
    if(entry.matches.length<2)continue;
    const orientations=new Set(entry.matches.map(match=>match.orientation));
    if(orientations.has('horizontal')&&orientations.has('vertical'))crossings.push(entry);
  }
  return crossings.sort((a,b)=>a.cell.row-b.cell.row||a.cell.col-b.cell.col);
}
