import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderGame, renderResult } from '../ui/render.mjs';

const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const renderSource=readFileSync(new URL('../ui/render.mjs',import.meta.url),'utf8');

test('board is a uniform 7x7 CSS grid with no span geometry',()=>{
  assert.match(css,/\.wordy-board\{[\s\S]*?grid-template-columns:\s*repeat\(7,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css,/\.wordy-board\{[\s\S]*?grid-template-rows:\s*repeat\(7,\s*minmax\(0,\s*1fr\)\)/);
  assert.doesNotMatch(renderSource,/startColumn|dataset\.span|spanForWord/);
  assert.match(css,/touch-action:\s*none/);
});

test('long-word typography classes exist without changing tile dimensions',()=>{
  assert.match(css,/\.wordy-tile\.text-medium/);
  assert.match(css,/\.wordy-tile\.text-long/);
  assert.match(css,/\.wordy-tile\.text-xlong/);
  assert.doesNotMatch(css,/\.wordy-tile\.size-(?:xs|sm|md|lg)/);
});

class FakeClassList{
  constructor(){this.values=new Set();}
  add(...values){values.forEach(v=>this.values.add(v));}
  contains(v){return this.values.has(v);}
}
class FakeElement{
  constructor(){
    this._textContent='';this.disabled=false;this.hidden=false;this.dataset={};this.style={};
    this.className='';this.classList=new FakeClassList();this.children=[];this.attributes=new Map();
  }
  get textContent(){return this._textContent;}
  set textContent(v){this._textContent=String(v);this.children=[];}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=[...children];}
  setAttribute(n,v){this.attributes.set(n,String(v));}
}
class FakeDocument{
  constructor(){
    this.nodes=new Map();
    for(const id of ['wordyBoard','popButton','movesValue','scoreValue','objectiveText','readyCount','levelLabel','eventLabel','resultOverlay','newLearningList','missedList','replayBoard']){
      this.nodes.set('#'+id,new FakeElement());
    }
  }
  querySelector(s){return this.nodes.get(s)??null;}
  createElement(){return new FakeElement();}
}

test('renderGame places equal physical tiles directly from row and column',()=>{
  const root=new FakeDocument();
  renderGame(root,{
    levelId:'F',levelTitle:'Cross',movesLeft:9,score:100,instruction:'Build',phase:'playing',eventLabel:'',
    board:{rows:7,columns:7,tiles:[
      {id:'make',word:'MAKE',row:1,column:0},
      {id:'a',word:'A',row:1,column:1},
      {id:'decision',word:'DECISION',row:1,column:2},
      {id:'take',word:'TAKE',row:0,column:1},
      {id:'break',word:'BREAK',row:2,column:1},
      {id:'attention',word:'ATTENTION',row:0,column:6}
    ]},
    readyMatches:[
      {orientation:'horizontal',tileIds:['make','a','decision']},
      {orientation:'vertical',tileIds:['take','a','break']}
    ]
  });
  const tiles=root.querySelector('#wordyBoard').children;
  assert.equal(tiles.length,6);
  const decision=tiles.find(tile=>tile.dataset.tileId==='decision');
  assert.equal(decision.dataset.row,'1');
  assert.equal(decision.dataset.column,'2');
  assert.equal('startColumn' in decision.dataset,false);
  assert.equal('span' in decision.dataset,false);
  assert.equal(decision.style.gridRow,'2');
  assert.equal(decision.style.gridColumn,'3');
  const attention=tiles.find(tile=>tile.dataset.tileId==='attention');
  assert.equal(attention.classList.contains('text-xlong'),true);
  const shared=tiles.find(tile=>tile.dataset.tileId==='a');
  assert.equal(shared.classList.contains('is-ready'),true);
  assert.equal(shared.classList.contains('is-cross'),true);
  assert.equal(root.querySelector('#popButton').textContent,'POP ×2');
});

test('missed-opportunity replay uses saved row-column geometry and suggested ids',()=>{
  const root=new FakeDocument();
  renderResult(root,{
    newLearning:[],
    missed:[{
      relationshipId:'look-after',projectedScore:170,
      boardSnapshot:{rows:7,columns:7,tiles:[
        {id:'look',word:'LOOK',row:0,column:0},
        {id:'x',word:'WENT',row:0,column:1},
        {id:'after',word:'AFTER',row:0,column:2}
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
  assert.equal(look.style.gridColumn,'1');
  assert.equal(x.style.gridColumn,'2');
  assert.equal(after.style.gridColumn,'3');
  assert.equal(x.classList.contains('is-suggested'),true);
  assert.equal(after.classList.contains('is-suggested'),true);
  assert.equal(look.classList.contains('is-suggested'),false);
  assert.match(css,/\.replay-board\{[\s\S]*?grid-template-columns:repeat\(7/);
  assert.match(css,/\.replay-board\{[\s\S]*?grid-template-rows:repeat\(7/);
});


test('READY article tile renders AN for HAVE AN OPINION while canonical board word remains A',()=>{
  const root=new FakeDocument();
  const state={
    levelId:'A',levelTitle:'Article',movesLeft:5,score:0,instruction:'Build',phase:'playing',eventLabel:'',
    board:{rows:7,columns:7,tiles:[
      {id:'have',word:'HAVE',row:0,column:0},
      {id:'article',word:'A',row:0,column:1},
      {id:'opinion',word:'OPINION',row:0,column:2}
    ]},
    readyMatches:[
      {relationshipId:'have-an-opinion',orientation:'horizontal',tileIds:['have','article','opinion'],tokens:['HAVE','AN','OPINION']}
    ]
  };
  renderGame(root,state);
  const article=root.querySelector('#wordyBoard').children.find(tile=>tile.dataset.tileId==='article');
  assert.equal(state.board.tiles[1].word,'A');
  assert.equal(article.textContent,'AN');
  assert.equal(article.classList.contains('is-ready'),true);
});

test('article tile stays A when READY relation requires A',()=>{
  const root=new FakeDocument();
  renderGame(root,{
    levelId:'A',levelTitle:'Article',movesLeft:5,score:0,instruction:'Build',phase:'playing',eventLabel:'',
    board:{rows:7,columns:7,tiles:[
      {id:'take',word:'TAKE',row:0,column:0},
      {id:'article',word:'A',row:0,column:1},
      {id:'break',word:'BREAK',row:0,column:2}
    ]},
    readyMatches:[
      {relationshipId:'take-a-break',orientation:'horizontal',tileIds:['take','article','break'],tokens:['TAKE','A','BREAK']}
    ]
  });
  const article=root.querySelector('#wordyBoard').children.find(tile=>tile.dataset.tileId==='article');
  assert.equal(article.textContent,'A');
});
