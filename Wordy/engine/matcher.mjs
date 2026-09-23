import { occupancyMap, tilesInRow } from './board.mjs';

function sameTokens(actual,expected){
  if(!actual||actual.length!==expected.length)return false;
  for(let i=0;i<expected.length;i++){
    if(actual[i]!==expected[i])return false;
  }
  return true;
}

function touchingSequence(tiles){
  for(let i=1;i<tiles.length;i++){
    if(tiles[i-1].startColumn+tiles[i-1].span!==tiles[i].startColumn)return false;
  }
  return true;
}

function containsSequence(outerIds,innerIds){
  if(outerIds.length<=innerIds.length)return false;
  for(let start=0;start<=outerIds.length-innerIds.length;start++){
    let same=true;
    for(let i=0;i<innerIds.length;i++){
      if(outerIds[start+i]!==innerIds[i]){
        same=false;
        break;
      }
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
  return tile??{row:Number.MAX_SAFE_INTEGER,startColumn:Number.MAX_SAFE_INTEGER};
}

export function findMatches(board,bank){
  if(!board?.rows||!board?.columns||!Array.isArray(board.tiles)||!bank?.byLength)return [];
  const byId=tileMap(board);
  const raw=[];
  const dedup=new Set();

  for(const [length,relationships] of bank.byLength.entries()){
    for(let row=0;row<board.rows;row++){
      const rowTiles=tilesInRow(board,row);
      if(length>rowTiles.length)continue;
      for(let start=0;start<=rowTiles.length-length;start++){
        const sequence=rowTiles.slice(start,start+length);
        if(!touchingSequence(sequence))continue;
        const words=sequence.map(tile=>tile.word);
        for(const relation of relationships){
          if(!sameTokens(words,relation.tokens))continue;
          const match={
            relationshipId:relation.id,
            orientation:'horizontal',
            tileIds:sequence.map(tile=>tile.id),
            tokens:[...relation.tokens]
          };
          const key=matchKey(match);
          if(!dedup.has(key)){
            dedup.add(key);
            raw.push(match);
          }
        }
      }
    }
  }

  const map=occupancyMap(board);
  for(const [length,relationships] of bank.byLength.entries()){
    if(length>board.rows)continue;
    for(let col=0;col<board.columns;col++){
      for(let startRow=0;startRow<=board.rows-length;startRow++){
        const ids=[];
        let complete=true;
        for(let offset=0;offset<length;offset++){
          const id=map[startRow+offset][col];
          if(!id){ complete=false; break; }
          ids.push(id);
        }
        if(!complete)continue;
        const words=ids.map(id=>byId.get(id)?.word);
        if(words.some(word=>!word))continue;
        for(const relation of relationships){
          if(!sameTokens(words,relation.tokens))continue;
          const match={
            relationshipId:relation.id,
            orientation:'vertical',
            tileIds:[...ids],
            tokens:[...relation.tokens]
          };
          const key=matchKey(match);
          if(!dedup.has(key)){
            dedup.add(key);
            raw.push(match);
          }
        }
      }
    }
  }

  return suppressContained(raw).sort((a,b)=>{
    const ap=firstPosition(a,byId);
    const bp=firstPosition(b,byId);
    return ap.row-bp.row||ap.startColumn-bp.startColumn||
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
