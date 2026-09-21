import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderGame, renderResult } from '../ui/render.mjs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');

test('prototype exposes required HUD, board, global pop, and result hooks',()=>{
  for(const id of ['wordyBoard','popButton','movesValue','scoreValue','objectiveText','resultOverlay','newLearningList','missedList','replayBoard']){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
});

test('board uses seven block rows with word-length flex sizing instead of equal square cells',()=>{
  assert.doesNotMatch(css,/grid-template-columns:\s*repeat\(5/);
  assert.match(css,/\.wordy-board\{[\s\S]*?display:flex/);
  assert.match(css,/\.wordy-row\{/);
  assert.match(css,/\.wordy-tile\.size-xs[\s\S]*?flex:/);
  assert.match(css,/\.wordy-tile\.size-lg[\s\S]*?flex:/);
  assert.match(css,/touch-action:\s*none/);
  assert.match(css,/\.wordy-tile\.is-ready/);
  assert.match(css,/\.wordy-tile\.is-cross/);
});

class FakeClassList{
  constructor(){ this.values=new Set(); }
  add(...values){ values.forEach(value=>this.values.add(value)); }
  contains(value){ return this.values.has(value); }
}

class FakeElement{
  constructor(tag='div'){
    this.tagName=tag.toUpperCase();
    this._textContent='';
    this.disabled=false;
    this.hidden=false;
    this.dataset={};
    this.className='';
    this.classList=new FakeClassList();
    this.children=[];
    this.attributes=new Map();
  }
  get textContent(){ return this._textContent; }
  set textContent(value){ this._textContent=String(value); this.children=[]; }
  append(...children){ this.children.push(...children); }
  replaceChildren(...children){ this.children=[...children]; }
  setAttribute(name,value){ this.attributes.set(name,String(value)); }
}

class FakeDocument{
  constructor(){
    this.nodes=new Map();
    for(const id of ['wordyBoard','popButton','movesValue','scoreValue','objectiveText','resultOverlay','readyCount','levelLabel','eventLabel','newLearningList','missedList','replayBoard']){
      this.nodes.set('#'+id,new FakeElement(id==='popButton'?'button':'div'));
    }
  }
  querySelector(selector){ return this.nodes.get(selector)??null; }
  createElement(tag){ return new FakeElement(tag); }
}

test('renderGame marks ready and crossing cells and enables global pop',()=>{
  const root=new FakeDocument();
  const state={
    levelId:'F',levelTitle:'Crossroads',movesLeft:12,score:640,
    instruction:'Build a cross.',phase:'playing',eventLabel:'CROSS!',
    board:[
      [{id:'a',word:'MAKE'},{id:'b',word:'A'}],
      [{id:'c',word:'TAKE'},{id:'d',word:'BREAK'}]
    ],
    readyMatches:[
      {orientation:'horizontal',cells:[{row:0,col:0},{row:0,col:1}]},
      {orientation:'vertical',cells:[{row:0,col:1},{row:1,col:1}]}
    ]
  };
  renderGame(root,state);
  const rows=root.querySelector('#wordyBoard').children;
  const tiles=rows.flatMap(row=>row.children);
  assert.equal(rows.length,2);
  assert.equal(tiles.length,4);
  assert.equal(tiles[0].classList.contains('is-ready'),true);
  assert.equal(tiles[1].classList.contains('is-cross'),true);
  assert.equal(root.querySelector('#popButton').disabled,false);
  assert.equal(root.querySelector('#popButton').textContent,'POP ×2');
});

test('renderResult shows concise new-learning and missed-opportunity cards',()=>{
  const root=new FakeDocument();
  renderResult(root,{
    newLearning:[{id:'x',tokens:['LOOK','AFTER'],meaning:'take care of',category:'phrasal-verb'}],
    missed:[{relationshipId:'y',projectedScore:220,relationship:{tokens:['TAKE','A','BREAK'],meaning:'pause for rest'}}]
  });
  assert.equal(root.querySelector('#newLearningList').children.length,1);
  assert.equal(root.querySelector('#newLearningList').children[0].children.length,2);
  assert.match(root.querySelector('#newLearningList').children[0].children[0].textContent,/LOOK AFTER/);
  assert.equal(root.querySelector('#missedList').children.length,1);
  assert.equal(root.querySelector('#missedList').children[0].children.length,2);
  assert.match(root.querySelector('#missedList').children[0].children[0].textContent,/TAKE A BREAK/);
  assert.equal(root.querySelector('#resultOverlay').hidden,false);
});


test('renderResult re-renders the logical board snapshot for the top missed opportunity',()=>{
  const root=new FakeDocument();
  renderResult(root,{
    newLearning:[],
    missed:[{
      relationshipId:'look-after',
      projectedScore:170,
      boardRows:[
        ['LOOK','X','AFTER','Y','Z'],
        ['A','B','C','D','E'],
        ['F','G','H','I','J'],
        ['K','L','M','N','O'],
        ['P','Q','R','S','T'],
        ['U','V','W','AA','BB'],
        ['CC','DD','EE','FF','GG']
      ],
      suggestedSwap:{from:{row:0,col:1},to:{row:0,col:2}},
      relationship:{tokens:['LOOK','AFTER'],meaning:'take care of'}
    }]
  });
  const replay=root.querySelector('#replayBoard');
  assert.equal(replay.children.length,35);
  assert.equal(replay.children[1].classList.contains('is-suggested'),true);
  assert.equal(replay.children[2].classList.contains('is-suggested'),true);
});


test('renderGame gives short words less width and long words more width',()=>{
  const root=new FakeDocument();
  renderGame(root,{
    levelId:'T',levelTitle:'Test',movesLeft:5,score:0,instruction:'Test',phase:'playing',eventLabel:'',
    board:[[{id:'short',word:'A'},{id:'mid',word:'LOOK'},{id:'long',word:'ATTENTION'}]],
    readyMatches:[]
  });
  const row=root.querySelector('#wordyBoard').children[0];
  const tiles=row.children;
  assert.equal(tiles[0].classList.contains('size-xs'),true);
  assert.equal(tiles[1].classList.contains('size-sm'),true);
  assert.equal(tiles[2].classList.contains('size-lg'),true);
});

test('tutorial replay stays miniature on a phone screen',()=>{
  assert.match(css,/\.replay-board\{[\s\S]*?width:min\(62vw,240px\)/);
});

test('miniature replay keeps long filler words readable',()=>{
  assert.match(css,/\.replay-tile\{[\s\S]*?font-size:clamp\(6px,1\.7vw,8px\)/);
});
