import { occupancyMap } from './board.mjs';

function sameTokens(actual,expected){
  if(!actual||actual.length!==expected.length)return false;
  for(let i=0;i<expected.length;i++)if(actual[i]!==expected[i])return false;
  return true;
}

function containsSequence(outerIds,innerIds){
  if(outerIds.length<=innerIds.length)return false;
  for(let start=0;start<=outerIds.length-innerIds.length;start++){
    let same=true;
    for(let i=0;i<innerIds.length;i++){
      if(outerIds[start+i]!==innerIds[i]){same=false;break;}
    }
    if(same)return true;
  }
  return false;
}

function suppressContained(matches){
  return matches.filter((candidate,index)=>
    !matches.some((other,otherIndex)=>
      otherIndex!==index &&
      other.orientation===candidate.orientation &&
      containsSequence(other.tileIds,candidate.tileIds)
    )
  );
}

function matchKey(match){
  return `${match.relationshipId}|${match.orientation}|${match.tileIds.join(',')}`;
}

function tileMap(board){
  return new Map((board?.tiles??[]).map(tile=>[tile.id,tile]));
}

function firstPosition(match,byId){
  const tile=byId.get(match.tileIds[0]);
  return tile??{row:Number.MAX_SAFE_INTEGER,column:Number.MAX_SAFE_INTEGER};
}

function addMatch(raw,dedup,relation,orientation,ids){
  const match={
    relationshipId:relation.id,
    orientation,
    tileIds:[...ids],
    tokens:[...relation.tokens]
  };
  const key=matchKey(match);
  if(dedup.has(key))return;
  dedup.add(key);
  raw.push(match);
}

export function findMatches(board,bank){
  if(!board?.rows||!board?.columns||!Array.isArray(board.tiles)||!bank?.byLength)return [];
  const byId=tileMap(board);
  const map=occupancyMap(board);
  const raw=[];
  const dedup=new Set();

  for(const [length,relationships] of bank.byLength.entries()){
    if(length<=board.columns){
      for(let row=0;row<board.rows;row++){
        for(let columnStart=0;columnStart<=board.columns-length;columnStart++){
          const ids=[];
          let complete=true;
          for(let offset=0;offset<length;offset++){
            const id=map[row][columnStart+offset];
            if(!id){complete=false;break;}
            ids.push(id);
          }
          if(!complete)continue;
          const words=ids.map(id=>byId.get(id)?.word);
          for(const relation of relationships){
            if(sameTokens(words,relation.tokens))addMatch(raw,dedup,relation,'horizontal',ids);
          }
        }
      }
    }

    if(length<=board.rows){
      for(let column=0;column<board.columns;column++){
        for(let startRow=0;startRow<=board.rows-length;startRow++){
          const ids=[];
          let complete=true;
          for(let offset=0;offset<length;offset++){
            const id=map[startRow+offset][column];
            if(!id){complete=false;break;}
            ids.push(id);
          }
          if(!complete)continue;
          const words=ids.map(id=>byId.get(id)?.word);
          for(const relation of relationships){
            if(sameTokens(words,relation.tokens))addMatch(raw,dedup,relation,'vertical',ids);
          }
        }
      }
    }
  }

  return suppressContained(raw).sort((a,b)=>{
    const ap=firstPosition(a,byId);
    const bp=firstPosition(b,byId);
    return ap.row-bp.row||ap.column-bp.column||
      (a.orientation===b.orientation?0:(a.orientation==='horizontal'?-1:1))||
      b.tileIds.length-a.tileIds.length||a.relationshipId.localeCompare(b.relationshipId);
  });
}

export function findCrossings(matches){
  const byTile=new Map();
  for(const match of matches??[]){
    for(const tileId of match.tileIds??[]){
      if(!byTile.has(tileId))byTile.set(tileId,{tileId,matches:[]});
      byTile.get(tileId).matches.push(match);
    }
  }

  return [...byTile.values()]
    .filter(entry=>{
      if(entry.matches.length<2)return false;
      const orientations=new Set(entry.matches.map(match=>match.orientation));
      return orientations.has('horizontal')&&orientations.has('vertical');
    })
    .sort((a,b)=>String(a.tileId).localeCompare(String(b.tileId)));
}
