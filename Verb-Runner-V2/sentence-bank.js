(function(global){
  const SENTENCES=[
    {base:'do',targetIndex:0,text:'You should ___ your homework before dinner.'},
    {base:'choose',targetIndex:0,text:'They can ___ a new route tomorrow.'},
    {base:'bring',targetIndex:0,text:'Please ___ your notebook to class.'},
    {base:'catch',targetIndex:0,text:'We might ___ the train if we leave now.'},
    {base:'give',targetIndex:0,text:'I will ___ you the answer later.'},
    {base:'fall',targetIndex:0,text:'Be careful not to ___ on the wet floor.'},

    {base:'begin',targetIndex:1,text:'The class ___ at eight yesterday.'},
    {base:'break',targetIndex:1,text:'Mia ___ her phone screen last night.'},
    {base:'drive',targetIndex:1,text:'My uncle ___ to work early yesterday.'},
    {base:'drink',targetIndex:1,text:'I ___ water after the race.'},
    {base:'eat',targetIndex:1,text:'We ___ lunch at noon yesterday.'},
    {base:'find',targetIndex:1,text:'She ___ her keys under the chair.'},
    {base:'blow',targetIndex:1,text:'The wind ___ hard all afternoon.'},
    {base:'forget',targetIndex:1,text:'He ___ his password yesterday.'},

    {base:'beat',targetIndex:2,text:'The old record has been ___ twice this year.'},
    {base:'bite',targetIndex:2,text:'The dog has never ___ anyone.'},
    {base:'freeze',targetIndex:2,text:'The lake has ___ overnight.'},
    {base:'forgive',targetIndex:2,text:'She has already ___ him.'},
    {base:'build',targetIndex:2,text:'They have ___ a new science lab.'},
    {base:'become',targetIndex:2,text:'The weather has ___ much colder.'}
  ];

  function shuffled(values,random=Math.random){
    const copy=[...values];
    for(let i=copy.length-1;i>0;i--){
      const j=Math.max(0,Math.min(i,Math.floor(random()*(i+1))));
      [copy[i],copy[j]]=[copy[j],copy[i]];
    }
    return copy;
  }

  function createChallenge(template,{difficulty='medium',distractorCount=null,random=Math.random}={}){
    const verb=global.VerbRunnerBank?.findVerb?.(template.base);
    if(!verb)throw new Error('Sentence Run verb not found: '+template.base);
    const targetIndex=Math.max(0,Math.min(2,Number(template.targetIndex)||0));
    const correctAnswer=String(verb.forms[targetIndex]).toLowerCase();
    const distractors=global.VerbRunnerChallenge.chooseDistractors(
      verb,
      targetIndex,
      difficulty,
      random,
      distractorCount
    );
    if(!distractors.length)throw new Error('Sentence Run needs distractors for '+template.base);
    return {
      level:2,
      mode:'sentence-run',
      base:verb.forms[0],
      type:verb.type||'irregular',
      targetIndex,
      text:template.text,
      cue:verb.forms[0],
      correctAnswer,
      distractors
    };
  }

  function buildDeck({difficulty='medium',distractorCount=null,random=Math.random}={}){
    return shuffled(SENTENCES,random).map(item=>createChallenge(item,{
      difficulty,
      distractorCount,
      random
    }));
  }

  const api={SENTENCES,createChallenge,buildDeck,shuffled};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.VerbRunnerSentenceBank=api;
})(typeof window!=='undefined'?window:globalThis);
