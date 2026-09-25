function level({
  id,title,moves,target,instruction,pool,minMoves,required=[]
}){
  return {
    id,title,moves,
    goal:{type:'score',target},
    instruction,
    generated:true,
    rows:7,
    columns:7,
    relationshipPoolSize:pool,
    minScoringMoves:minMoves,
    minProductiveRows:4,
    minProductiveColumns:4,
    minRelationshipCoverage:0.85,
    requiredRelationshipIds:required
  };
}

export const LEVELS=[
  level({
    id:'A',title:'First Move',moves:18,target:900,pool:12,minMoves:8,
    instruction:'Find several useful relationships. Build them, decide when to POP, and keep the board working.',
    required:['phrasal-verb:look-after']
  }),
  level({
    id:'B',title:'Ready, Set, Pop',moves:20,target:1100,pool:14,minMoves:8,
    instruction:'Keep useful relationships ready and choose when a larger POP is worth more.',
    required:['collocation:make-sense']
  }),
  level({
    id:'C',title:'Build the Batch',moves:22,target:1400,pool:16,minMoves:10,
    instruction:'Look for several different relationships before you cash the board in.',
    required:['phrasal-verb:look-after','collocation:make-sense']
  }),
  level({
    id:'D',title:'Let It Fall',moves:22,target:1500,pool:16,minMoves:10,
    instruction:'Plan POPs that leave useful words above each other and watch for cascade opportunities.',
    required:['collocation:take-a-break']
  }),
  level({
    id:'E',title:'Long Thought',moves:24,target:1700,pool:18,minMoves:10,
    instruction:'Short relationships are useful, but longer expressions are worth hunting for too.',
    required:['fixed-expression:as-a-matter-of-fact']
  }),
  level({
    id:'F',title:'Crossroads',moves:24,target:1900,pool:18,minMoves:10,
    instruction:'Build multiple relationships and look for words that can participate in more than one.',
    required:['collocation:make-a-decision','collocation:take-a-break']
  }),
  level({
    id:'G',title:'Mixed Play',moves:26,target:2300,pool:20,minMoves:12,
    instruction:'Use the whole board: phrasal verbs, collocations, expressions and irregular verbs can all connect.',
    required:[]
  })
];

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
