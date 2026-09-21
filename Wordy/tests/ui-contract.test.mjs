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

test('board is a five-column equal-cell phone-first grid',()=>{
  assert.match(css,/grid-template-columns:\s*repeat\(5/);
  assert.match(css,/aspect-ratio:\s*5\s*\/\s*7/);
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
  const tiles=root.querySelector('#wordyBoard').children;
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


test('renderGame gives long words a smaller responsive typography class',()=>{
  const root=new FakeDocument();
  renderGame(root,{
    levelId:'T',levelTitle:'Test',movesLeft:5,score:0,instruction:'Test',phase:'playing',eventLabel:'',
    board:[[{id:'long',word:'HOMEWORK'},{id:'very',word:'RESPONSIBILITY'}]],
    readyMatches:[]
  });
  const tiles=root.querySelector('#wordyBoard').children;
  assert.equal(tiles[0].classList.contains('is-long'),true);
  assert.equal(tiles[1].classList.contains('is-very-long'),true);
  assert.match(css,/\.wordy-tile\.is-long/);
  assert.match(css,/\.wordy-tile\.is-very-long/);
});

test('tutorial replay stays miniature on a phone screen',()=>{
  assert.match(css,/\.replay-board\{[\s\S]*?width:min\(62vw,240px\)/);
});

test('miniature replay keeps long filler words readable',()=>{
  assert.match(css,/\.replay-tile\{[\s\S]*?font-size:clamp\(6px,1\.7vw,8px\)/);
});
