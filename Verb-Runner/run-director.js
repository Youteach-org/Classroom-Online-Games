(function(global){
  function shuffled(values,random=Math.random){
    const copy=[...values];
    for(let i=copy.length-1;i>0;i--){
      const j=Math.max(0,Math.min(i,Math.floor(random()*(i+1))));
      [copy[i],copy[j]]=[copy[j],copy[i]];
    }
    return copy;
  }

  function presentationFor({level=1,challengeIndex=0}={}){
    if(Number(level)!==2)return 'cards';
    return Math.max(0,Number(challengeIndex)||0)%2===0?'grammar-gate':'cards';
  }

  function buildGrammarGateSequence(sequence,random=Math.random){
    const source=Array.isArray(sequence)
      ?sequence.filter(item=>item&&item.value!=null)
      :[];
    const correct=source.find(item=>item.correct===true);
    if(!correct)return [];

    const distractors=shuffled(
      source.filter(item=>item!==correct&&!item.correct),
      random
    ).slice(0,2);

    if(distractors.length<2)return [];
    return shuffled([correct,...distractors],random);
  }

  const api={presentationFor,buildGrammarGateSequence};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.VerbRunnerRunDirector=api;
})(typeof window!=='undefined'?window:globalThis);
