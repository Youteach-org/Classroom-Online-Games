import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderGame, renderResult } from '../ui/render.mjs';
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');

test('board is one 12-column by 7-row CSS grid with no free-flex size buckets',()=>{
  assert.match(css,/grid-template-columns:\s*repeat\(12/);
  assert.match(css,/grid-template-rows:\s*repeat\(7/);
  assert.doesNotMatch(css,/\.wordy-row\{/);
  assert.doesNotMatch(css,/\.wordy-tile\.size-xs/);
  assert.match(css,/touch-action:\s*none/);
});

class FakeClassList{constructor(){this.values=new Set();}add(...values){values.forEach(v=>this.values.add(v));}contains(v){return this.values.has(v);}}
class FakeElement{constructor(){this._textContent='';this.disabled=false;this.hidden=false;this.dataset={};this.style={};this.className='';this.classList=new FakeClassList();this.children=[];this.attributes=new Map();}get textContent(){return this._textContent;}set textContent(v){this._textContent=String(v);this.children=[];}append(...children){this.children.push(...children);}replaceChildren(...children){this.children=[...children];}setAttribute(n,v){this.attributes.set(n,String(v));}}
class FakeDocument{constructor(){this.nodes=new Map();for(const id of ['wordyBoard','popButton','movesValue','scoreValue','objectiveText','readyCount','levelLabel','eventLabel','resultOverlay','newLearningList','missedList','replayBoard'])this.nodes.set('#'+id,new FakeElement());}querySelector(s){return this.nodes.get(s)??null;}createElement(){return new FakeElement();}}

test('renderGame places physical tiles directly from row startColumn and span',()=>{
  const root=new FakeDocument();
  renderGame(root,{
    levelId:'F',levelTitle:'Cross',movesLeft:9,score:100,instruction:'Build',phase:'playing',eventLabel:'',
    board:{rows:7,columns:12,tiles:[
      {id:'make',word:'MAKE',row:1,startColumn:0,span:2},
      {id:'a',word:'A',row:1,startColumn:2,span:1},
      {id:'decision',word:'DECISION',row:1,startColumn:3,span:3},
      {id:'take',word:'TAKE',row:0,startColumn:1,span:2},
      {id:'break',word:'BREAK',row:2,startColumn:1,span:2}
    ]},
    readyMatches:[
      {orientation:'horizontal',tileIds:['make','a','decision']},
      {orientation:'vertical',tileIds:['take','a','break']}
    ]
  });
  const tiles=root.querySelector('#wordyBoard').children;
  assert.equal(tiles.length,5);
  const decision=tiles.find(tile=>tile.dataset.tileId==='decision');
  assert.equal(decision.dataset.row,'1');
  assert.equal(decision.dataset.startColumn,'3');
  assert.equal(decision.dataset.span,'3');
  assert.equal(decision.style.gridRow,'2');
  assert.equal(decision.style.gridColumn,'4 / span 3');
  const shared=tiles.find(tile=>tile.dataset.tileId==='a');
  assert.equal(shared.classList.contains('is-ready'),true);
  assert.equal(shared.classList.contains('is-cross'),true);
  assert.equal(root.querySelector('#popButton').textContent,'POP ×2');
});

test('missed-opportunity replay uses saved 12-column tile geometry and suggested tile ids',()=>{
  const root=new FakeDocument();
  renderResult(root,{
    newLearning:[],
    missed:[{
      relationshipId:'look-after',projectedScore:170,
      boardSnapshot:{rows:7,columns:12,tiles:[
        {id:'look',word:'LOOK',row:0,startColumn:0,span:2},
        {id:'x',word:'WENT',row:0,startColumn:2,span:2},
        {id:'after',word:'AFTER',row:0,startColumn:4,span:2}
      ]},
      suggestedSwap:{fromTileId:'x',toTileId:'after'},
      relationship:{tokens:['LOOK','AFTER'],meaning:'take care of'}
    }]
  });
  const replay=root.querySelector('#replayBoard');
  assert.equal(replay.children.length,3);
  const look=replay.children.find(tile=>tile.dataset.tileId==='look');
  const x=replay.children.find(tile=>tile.dataset.tileId==='x');
  const after=replay.children.find(tile=>tile.dataset.tileId==='after');
  assert.equal(look.style.gridColumn,'1 / span 2');
  assert.equal(x.style.gridColumn,'3 / span 2');
  assert.equal(after.style.gridColumn,'5 / span 2');
  assert.equal(x.classList.contains('is-suggested'),true);
  assert.equal(after.classList.contains('is-suggested'),true);
  assert.equal(look.classList.contains('is-suggested'),false);
  assert.match(css,/\.replay-board\{[\s\S]*?grid-template-columns:repeat\(12/);
  assert.match(css,/\.replay-board\{[\s\S]*?grid-template-rows:repeat\(7/);
});
