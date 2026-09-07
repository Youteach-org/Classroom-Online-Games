(function(global){
  const LABELS=['BASE FORM','SIMPLE PAST','PAST PARTICIPLE'];

  function clampIndex(value){return Math.max(0,Math.min(2,Math.floor(Number(value)*3)));}
  function unique(values){return [...new Set(values.filter(Boolean).map(v=>String(v).toLowerCase()))];}
  function shuffled(values,random=Math.random){
    const copy=[...values];
    for(let i=copy.length-1;i>0;i--){
      const j=Math.max(0,Math.min(i,Math.floor(random()*(i+1))));
      [copy[i],copy[j]]=[copy[j],copy[i]];
    }
    return copy;
  }

  function candidateDistractors(verb,blankIndex,bank){
    const correct=verb.forms[blankIndex].toLowerCase();
    const sameVerb=[...(verb.decoys||[]),...verb.forms];
    const sameSlot=(bank||[]).map(v=>v.forms?.[blankIndex]);
    const allForms=(bank||[]).flatMap(v=>v.forms||[]);
    return unique([...sameVerb,...sameSlot,...allForms]).filter(value=>value!==correct);
  }

  function createChallenge(verb,{random=Math.random,distractorCount=2,bank=[]}={}){
    if(!verb||!Array.isArray(verb.forms)||verb.forms.length!==3) throw new Error('A verb with three principal parts is required.');
    const blankIndex=clampIndex(random());
    const correctAnswer=String(verb.forms[blankIndex]).toLowerCase();
    const pool=shuffled(candidateDistractors(verb,blankIndex,bank),random);
    const count=Math.max(1,Math.floor(distractorCount));
    const distractors=pool.slice(0,count);
    if(distractors.length<count) throw new Error('Not enough distractors for this challenge.');
    return {
      base:verb.forms[0],
      labels:[...LABELS],
      blankIndex,
      slots:verb.forms.map((form,index)=>index===blankIndex?null:form),
      correctAnswer,
      distractors
    };
  }

  function buildAnswerSequence(challenge,{random=Math.random,distractorsBeforeCorrect=2}={}){
    const amount=Math.max(0,Math.min(challenge.distractors.length,Math.floor(distractorsBeforeCorrect)));
    const wrong=shuffled(challenge.distractors,random).slice(0,amount).map(value=>({value,correct:false}));
    return [...wrong,{value:challenge.correctAnswer,correct:true}];
  }

  const api={LABELS,createChallenge,buildAnswerSequence,shuffled};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  global.VerbRunnerChallenge=api;
})(typeof window!=='undefined'?window:globalThis);
