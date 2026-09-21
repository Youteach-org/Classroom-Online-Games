export const LEVELS=[
  {
    id:'A',title:'First Move',moves:10,
    goal:{type:'score',target:250},
    instruction:'Swap neighboring words to build a valid English relationship.',
    boardRows:[
      ['LOOK','WENT','AFTER','MONEY','BEGUN'],
      ['COFFEE','NOTES','PROMISE','SCHOOL','FUN'],
      ['BROKE','CHOSEN','RAIN','FOOD','HABIT'],
      ['WROTE','SEEN','COLD','TIME','TRUTH'],
      ['DRANK','GONE','EXERCISE','BREAKFAST','DIFFERENCE'],
      ['GAVE','KNOWN','WORK','IDEA','HOMEWORK'],
      ['DROVE','FALLEN','COURSE','OPINION','ATTENTION']
    ],
    fixtureMoves:[[{row:0,col:1},{row:0,col:2}]]
  },
  {
    id:'B',title:'Ready, Set, Pop',moves:12,
    goal:{type:'score',target:500},
    instruction:'Build a relationship, leave it ready, then use POP.',
    boardRows:[
      ['MAKE','WENT','SENSE','MONEY','BEGUN'],
      ['COFFEE','NOTES','PROMISE','SCHOOL','FUN'],
      ['BROKE','CHOSEN','RAIN','FOOD','HABIT'],
      ['WROTE','SEEN','COLD','TIME','TRUTH'],
      ['DRANK','GONE','EXERCISE','BREAKFAST','DIFFERENCE'],
      ['GAVE','KNOWN','WORK','IDEA','HOMEWORK'],
      ['DROVE','FALLEN','COURSE','OPINION','ATTENTION']
    ],
    fixtureMoves:[[{row:0,col:1},{row:0,col:2}]]
  },
  {
    id:'C',title:'Build the Batch',moves:16,
    goal:{type:'batch',target:2},
    instruction:'Keep one relationship ready while you prepare another.',
    boardRows:[
      ['LOOK','WENT','AFTER','MONEY','BEGUN'],
      ['COFFEE','NOTES','PROMISE','SCHOOL','FUN'],
      ['MAKE','GONE','SENSE','RAIN','FOOD'],
      ['WROTE','SEEN','COLD','TIME','TRUTH'],
      ['DRANK','EXERCISE','BREAKFAST','DIFFERENCE','HABIT'],
      ['GAVE','KNOWN','WORK','IDEA','HOMEWORK'],
      ['DROVE','FALLEN','COURSE','OPINION','ATTENTION']
    ],
    fixtureMoves:[
      [{row:0,col:1},{row:0,col:2}],
      [{row:2,col:1},{row:2,col:2}]
    ]
  },
  {
    id:'D',title:'Let It Fall',moves:16,
    goal:{type:'cascade',target:1},
    instruction:'Use POP so falling words create another relationship.',
    boardRows:[
      ['WENT','TAKE','GONE','COFFEE','NOTES'],
      ['LOOK','AFTER','PROMISE','SCHOOL','FUN'],
      ['BROKE','A','CHOSEN','RAIN','FOOD'],
      ['WROTE','BREAK','SEEN','COLD','TIME'],
      ['DRANK','MONEY','EXERCISE','HABIT','TRUTH'],
      ['GAVE','KNOWN','WORK','IDEA','HOMEWORK'],
      ['DROVE','FALLEN','COURSE','OPINION','ATTENTION']
    ],
    fixtureMoves:[],
    fixtureRefillWords:['ZZZ','YYY']
  },
  {
    id:'E',title:'Long Thought',moves:18,
    goal:{type:'long-relation',target:5},
    instruction:'Build a five-word expression.',
    boardRows:[
      ['AS','MATTER','A','OF','FACT'],
      ['COFFEE','NOTES','PROMISE','SCHOOL','FUN'],
      ['BROKE','CHOSEN','RAIN','FOOD','HABIT'],
      ['WROTE','SEEN','COLD','TIME','TRUTH'],
      ['DRANK','GONE','EXERCISE','BREAKFAST','DIFFERENCE'],
      ['GAVE','KNOWN','WORK','IDEA','HOMEWORK'],
      ['DROVE','FALLEN','COURSE','OPINION','ATTENTION']
    ],
    fixtureMoves:[[{row:0,col:1},{row:0,col:2}]]
  },
  {
    id:'F',title:'Crossroads',moves:18,
    goal:{type:'cross',target:1},
    instruction:'Keep the horizontal phrase ready and build a phrase through it.',
    boardRows:[
      ['WENT','COFFEE','GONE','NOTES','BEGUN'],
      ['BROKE','PROMISE','CHOSEN','SCHOOL','FUN'],
      ['RAIN','TAKE','FOOD','HABIT','TRUTH'],
      ['COLD','MAKE','A','DECISION','TIME'],
      ['SEEN','WORK','BREAK','IDEA','HOMEWORK'],
      ['DRANK','KNOWN','EXERCISE','BREAKFAST','DIFFERENCE'],
      ['DROVE','FALLEN','COURSE','OPINION','ATTENTION']
    ],
    fixtureMoves:[[{row:2,col:1},{row:2,col:2}]]
  },
  {
    id:'G',title:'Mixed Play',moves:20,
    goal:{type:'score',target:1800},
    instruction:'Use everything you have learned to build stronger activations.',
    boardRows:[
      ['LOOK','WENT','AFTER','MONEY','BEGUN'],
      ['COFFEE','TAKE','NOTES','SCHOOL','FUN'],
      ['MAKE','GONE','SENSE','RAIN','FOOD'],
      ['WROTE','A','COLD','TIME','TRUTH'],
      ['DRANK','BREAK','EXERCISE','HABIT','DIFFERENCE'],
      ['GAVE','KNOWN','WORK','IDEA','HOMEWORK'],
      ['DROVE','FALLEN','COURSE','OPINION','ATTENTION']
    ],
    generated:true,
    fixtureMoves:[
      [{row:0,col:1},{row:0,col:2}],
      [{row:2,col:1},{row:2,col:2}]
    ]
  }
];

export const FALLBACK_BOARD_ROWS=LEVELS.find(level=>level.id==='G').boardRows;

export function getLevel(id){
  const level=LEVELS.find(candidate=>candidate.id===id);
  if(!level)throw new Error('unknown level: '+id);
  return level;
}

export function isObjectiveComplete(level,state){
  switch(level.goal.type){
    case 'score': return state.score>=level.goal.target;
    case 'batch': return state.bestBatch>=level.goal.target;
    case 'cascade': return state.bestCascade>=level.goal.target;
    case 'long-relation': return state.longestRelation>=level.goal.target;
    case 'cross': return state.crossCount>=level.goal.target;
    default: throw new Error('unsupported goal: '+level.goal.type);
  }
}
