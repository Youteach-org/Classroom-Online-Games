const COMMON_ROWS={
  ONE:['COFFEE','NOTES','PROMISE','SCHOOL','COLD','TIME','TRUTH'],
  TWO:['BROKE','CHOSEN','RAIN','FOOD','HABIT','IDEA','WORK'],
  THREE:['WROTE','SEEN','COURSE','MONEY','BEGUN','KNOWN','HOME'],
  FOUR:['DRANK','GONE','EXERCISE','DIFFERENCE','GAVE','FALLEN','FUN'],
  FIVE:['DROVE','PAY','ATTENTION','FRONT','WAY','FACT','MATTER'],
  SIX:['HEAVY','BREAK','DECISION','TAKE','WRITE','TURN','GIVE']
};

const LOOK_ROW=['LOOK','WENT','AFTER','MONEY','BEGUN','OF','A'];
const MAKE_ROW=['MAKE','WENT','SENSE','MONEY','BEGUN','OF','A'];

export const LEVELS=[
  {
    id:'A',title:'First Move',moves:10,
    goal:{type:'score',target:250},
    instruction:'Swap neighboring words to build a valid English relationship.',
    boardRows:[LOOK_ROW,COMMON_ROWS.ONE,COMMON_ROWS.TWO,COMMON_ROWS.THREE,COMMON_ROWS.FOUR,COMMON_ROWS.FIVE,COMMON_ROWS.SIX],
    fixtureMoveWords:[['WENT','AFTER']],fixtureMoveRows:[0]
  },
  {
    id:'B',title:'Ready, Set, Pop',moves:12,
    goal:{type:'score',target:500},
    instruction:'Build a relationship, leave it ready, then use POP.',
    boardRows:[MAKE_ROW,COMMON_ROWS.ONE,COMMON_ROWS.TWO,COMMON_ROWS.THREE,COMMON_ROWS.FOUR,COMMON_ROWS.FIVE,COMMON_ROWS.SIX],
    fixtureMoveWords:[['WENT','SENSE']],fixtureMoveRows:[0]
  },
  {
    id:'C',title:'Build the Batch',moves:16,
    goal:{type:'batch',target:2},
    instruction:'Keep one relationship ready while you prepare another.',
    boardRows:[
      LOOK_ROW,
      COMMON_ROWS.ONE,
      ['COLD','TIME','MAKE','GONE','SENSE','FOOD','HABIT'],
      COMMON_ROWS.THREE,COMMON_ROWS.FOUR,COMMON_ROWS.FIVE,COMMON_ROWS.SIX
    ],
    fixtureMoveWords:[['WENT','AFTER'],['GONE','SENSE']],fixtureMoveRows:[0,2]
  },
  {
    id:'D',title:'Let It Fall',moves:16,
    goal:{type:'cascade',target:1},
    instruction:'Use POP so falling words create another relationship.',
    boardRows:[
      ['TAKE','COURSE','MONEY','BEGUN','TRUTH','WORK','IDEA'],
      ['LOOK','AFTER','PROMISE','SCHOOL','COLD','TIME','FACT'],
      ['A','NOTES','RAIN','FOOD','HABIT','HOME','FUN'],
      ['BREAK','COFFEE','SEEN','KNOWN','GAVE','FALLEN','END'],
      COMMON_ROWS.FOUR,COMMON_ROWS.FIVE,COMMON_ROWS.SIX
    ],
    fixtureMoveWords:[],fixtureMoveRows:[]
  },
  {
    id:'E',title:'Long Thought',moves:18,
    goal:{type:'long-relation',target:5},
    instruction:'Build a five-word expression.',
    boardRows:[
      ['AS','MATTER','A','OF','FACT','TIME','TRUTH'],
      COMMON_ROWS.ONE,COMMON_ROWS.TWO,COMMON_ROWS.THREE,COMMON_ROWS.FOUR,COMMON_ROWS.FIVE,COMMON_ROWS.SIX
    ],
    fixtureMoveWords:[['MATTER','A']],fixtureMoveRows:[0]
  },
  {
    id:'F',title:'Crossroads',moves:18,
    goal:{type:'cross',target:1},
    instruction:'Keep the horizontal phrase ready and build a phrase through it.',
    boardRows:[
      COMMON_ROWS.ONE,
      COMMON_ROWS.TWO,
      ['TAKE','PROMISE','SCHOOL','FUN','OF','TIME','TRUTH'],
      ['MAKE','A','DECISION','COLD','WORK','IDEA','HOME'],
      ['I','BREAK','COFFEE','NOTES','MONEY','COURSE','HABIT'],
      COMMON_ROWS.FIVE,
      COMMON_ROWS.SIX
    ],
    fixtureMoveWords:[['PROMISE','TAKE']],fixtureMoveRows:[2]
  },
  {
    id:'G',title:'Mixed Play',moves:20,
    goal:{type:'score',target:1800},
    instruction:'Use everything you have learned to build stronger activations.',
    boardRows:[
      ['LOOK','WENT','AFTER','MONEY','BEGUN','OF','A'],
      ['COLD','TIME','TRUTH','WORK','IDEA','HOME','COURSE'],
      ['FOOD','HABIT','MAKE','GONE','SENSE','BREAK','COFFEE'],
      ['BROKE','CHOSEN','SEEN','FALLEN','KNOWN','FUN','SCHOOL'],
      ['PROMISE','MATTER','FACT','FRONT','TAKE','WENT','NOTES'],
      ['WRITE','TURN','PICK','FIND','STAND','WAKE','SIT'],
      ['PAY','WENT','ATTENTION','GIVE','WENT','UP','END']
    ],
    generated:true,
    fixtureMoveWords:[['WENT','AFTER'],['GONE','SENSE'],['WENT','NOTES'],['WENT','ATTENTION'],['WENT','UP']],
    fixtureMoveRows:[0,2,4,6,6]
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
