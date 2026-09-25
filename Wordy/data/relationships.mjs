function slug(value){
  return value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

function baseScoreFor(tokens,difficulty){
  const length=tokens.length;
  if(length===2)return 100+(difficulty-1)*20;
  if(length===3)return 150+(difficulty-1)*30;
  if(length===4)return 220+(difficulty-1)*40;
  return 300;
}

function item(category,phrase,difficulty,meaning,explanation){
  const tokens=phrase.split(' ');
  return {
    id:`${category}:${slug(phrase)}`,
    category,
    tokens,
    baseScore:baseScoreFor(tokens,difficulty),
    difficulty,
    meaning,
    explanation
  };
}

const PHRASAL=[
  ['LOOK AFTER',1,'take care of someone or something'],
  ['LOOK FOR',1,'try to find someone or something'],
  ['LOOK INTO',2,'investigate or examine something'],
  ['LOOK UP',1,'search for information'],
  ['GIVE UP',1,'stop trying or stop doing something'],
  ['TURN ON',1,'start a device or supply'],
  ['TURN OFF',1,'stop a device or supply'],
  ['PICK UP',1,'lift, collect, or acquire something'],
  ['FIND OUT',1,'discover information'],
  ['GET UP',1,'rise from bed or a seated position'],
  ['WAKE UP',1,'stop sleeping'],
  ['SIT DOWN',1,'move into a seated position'],
  ['STAND UP',1,'rise to a standing position'],
  ['TAKE OFF',1,'remove clothing or leave the ground'],
  ['PUT ON',1,'place clothing or an item on oneself'],
  ['PUT AWAY',1,'return something to its proper place'],
  ['COME BACK',1,'return to a place'],
  ['GO OUT',1,'leave home or stop burning/shining'],
  ['GROW UP',1,'develop from a child into an adult'],
  ['CARRY ON',2,'continue doing something'],
  ['KEEP UP',1,'continue at the same pace or maintain a level'],
  ['KEEP IN',2,'make someone stay indoors or remain inside']
];

const COLLOCATIONS=[
  ['MAKE A DECISION',2,'choose after considering options'],
  ['MAKE A MISTAKE',1,'do something incorrectly'],
  ['MAKE SENSE',1,'be understandable or reasonable'],
  ['MAKE PROGRESS',2,'advance toward a goal'],
  ['MAKE MONEY',1,'earn money'],
  ['TAKE A BREAK',1,'pause an activity for rest'],
  ['TAKE NOTES',1,'write down important information'],
  ['TAKE A CHANCE',2,'accept a risk or opportunity'],
  ['TAKE CARE OF',2,'look after or deal with something'],
  ['TAKE PART IN',2,'participate in an activity'],
  ['PAY ATTENTION',1,'focus carefully'],
  ['DO HOMEWORK',1,'complete school work assigned for home'],
  ['DO EXERCISE',1,'perform physical activity'],
  ['HAVE BREAKFAST',1,'eat the morning meal'],
  ['HAVE FUN',1,'enjoy an activity'],
  ['HAVE A LOOK',1,'look at something briefly'],
  ['HAVE AN OPINION',1,'hold or express a personal view'],
  ['HEAVY RAIN',1,'rain that falls strongly'],
  ['STRONG COFFEE',1,'coffee with an intense flavor or effect'],
  ['FAST FOOD',1,'quickly prepared commercial food'],
  ['HARD WORK',1,'work requiring substantial effort'],
  ['GOOD IDEA',1,'a useful or sensible suggestion'],
  ['BAD HABIT',1,'a repeated behavior that is harmful or undesirable'],
  ['HIGH SCHOOL',1,'secondary school'],
  ['BIG DIFFERENCE',1,'a substantial contrast'],
  ['CATCH A BUS',1,'board a bus in time'],
  ['CATCH A COLD',1,'become ill with a cold'],
  ['KEEP A PROMISE',2,'do what one promised'],
  ['SAVE TIME',1,'reduce the time needed'],
  ['SPEND TIME',1,'use time doing something'],
  ['TELL THE TRUTH',1,'state what is true']
];

const FIXED=[
  ['BY THE WAY',1,'used to introduce an additional or related point'],
  ['IN FRONT OF',1,'in a position ahead of something'],
  ['AS A MATTER OF FACT',3,'used to introduce a fact that adds emphasis or correction'],
  ['AT THE MOMENT',1,'right now'],
  ['ON THE OTHER HAND',2,'used to introduce a contrasting point'],
  ['IN THE END',1,'finally or after everything has happened'],
  ['AS SOON AS POSSIBLE',2,'at the earliest possible time'],
  ['ONCE IN A WHILE',2,'occasionally'],
  ['ALL OF A SUDDEN',2,'suddenly and unexpectedly'],
  ['FOR A LONG TIME',1,'during an extended period'],
  ['IN MY OPINION',1,'used to state a personal view'],
  ['OF COURSE',1,'used to show something is expected or obvious'],
  ['NO MATTER WHAT',2,'regardless of what happens'],
  ['WHETHER OR NOT',2,'regardless of which of two possibilities is true'],
  ['EVEN IF',2,'despite the possibility that something happens']
];

const IRREGULAR=[
  ['GO WENT GONE',1],['SEE SAW SEEN',1],['TAKE TOOK TAKEN',1],['WRITE WROTE WRITTEN',2],
  ['GIVE GAVE GIVEN',1],['COME CAME COME',1],['BECOME BECAME BECOME',2],['BEGIN BEGAN BEGUN',2],
  ['BREAK BROKE BROKEN',2],['CHOOSE CHOSE CHOSEN',2],['DRINK DRANK DRUNK',1],['DRIVE DROVE DRIVEN',2],
  ['EAT ATE EATEN',1],['FALL FELL FALLEN',1],['FORGET FORGOT FORGOTTEN',2],['KNOW KNEW KNOWN',1],
  ['SPEAK SPOKE SPOKEN',1],['SWIM SWAM SWUM',2],['WEAR WORE WORN',1],['SING SANG SUNG',1]
];

const explain=(phrase,category)=>{
  if(category==='phrasal-verb')return `${phrase} is a common phrasal verb: the verb and particle work together as one unit.`;
  if(category==='collocation')return `${phrase} is a common English collocation whose words naturally occur together.`;
  if(category==='fixed-expression')return `${phrase} is a fixed expression normally learned and used as a complete chunk.`;
  return `${phrase} shows the base form, simple past, and past participle of one irregular verb.`;
};

export const RELATIONSHIPS=[
  ...PHRASAL.map(([phrase,difficulty,meaning])=>item('phrasal-verb',phrase,difficulty,meaning,explain(phrase,'phrasal-verb'))),
  ...COLLOCATIONS.map(([phrase,difficulty,meaning])=>item('collocation',phrase,difficulty,meaning,explain(phrase,'collocation'))),
  ...FIXED.map(([phrase,difficulty,meaning])=>item('fixed-expression',phrase,difficulty,meaning,explain(phrase,'fixed-expression'))),
  ...IRREGULAR.map(([phrase,difficulty])=>item('irregular-set',phrase,difficulty,`principal parts of ${phrase.split(' ')[0]}`,explain(phrase,'irregular-set')))
];
