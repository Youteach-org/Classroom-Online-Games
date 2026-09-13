(function(global){
  const LABELS=['BASE FORM','SIMPLE PAST','PAST PARTICIPLE'];
  const LEVELS={
    easy:{count:2},
    medium:{count:3},
    hard:{count:4}
  };

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

  function isVowel(ch){return /[aeiou]/i.test(ch||'');}
  function regularPast(base){
    const word=String(base||'').toLowerCase();
    if(!word)return '';
    if(/[^aeiou]y$/.test(word))return word.slice(0,-1)+'ied';
    if(/e$/.test(word))return word+'d';
    if(word.length>=3){
      const a=word.at(-3),b=word.at(-2),c=word.at(-1);
      if(!isVowel(a)&&isVowel(b)&&!isVowel(c)&&!/[wxy]$/.test(word))return word+c+'ed';
    }
    return word+'ed';
  }

  function spellingMutations(word){
    const w=String(word||'').toLowerCase();
    if(!w)return [];
    const out=[];
    if(/ied$/.test(w))out.push(w.replace(/ied$/,'yed'),w.replace(/ied$/,'id'));
    if(/pped$/.test(w))out.push(w.replace(/pped$/,'ped'));
    if(/nned$/.test(w))out.push(w.replace(/nned$/,'ned'));
    if(/tted$/.test(w))out.push(w.replace(/tted$/,'ted'));
    if(/ed$/.test(w))out.push(w.slice(0,-1),w+'ed');
    if(/en$/.test(w))out.push(w.slice(0,-1),w+'ed');
    if(w.length>4){
      out.push(w.slice(0,-2)+w.at(-1));
      out.push(w.slice(0,-1)+w.at(-1)+w.at(-1));
    }
    return unique(out);
  }

  function sameVerbDistractors(verb,blankIndex){
    const base=String(verb.forms[0]).toLowerCase();
    const correct=String(verb.forms[blankIndex]).toLowerCase();
    const otherForms=verb.forms.filter((_,i)=>i!==blankIndex);
    const regularized=regularPast(base);
    const explicit=[
      ...(verb.decoys||[]),
      ...(verb.spellingDecoys||[]),
      ...(verb.irregularDecoys||[]),
      ...(verb.regularizationDecoys||[])
    ];

    if(blankIndex===0){
      return unique([
        ...explicit,
        ...spellingMutations(base),
        base+'s',
        base+'ed'
      ]).filter(v=>v!==correct&&!verb.forms.includes(v));
    }

    const generated=verb.type==='regular'
      ? [
          ...(verb.irregularDecoys||[]),
          ...spellingMutations(correct),
          base+'en',
          base+'t'
        ]
      : [
          regularized,
          ...spellingMutations(correct),
          correct+'ed',
          base+'ed'
        ];

    return unique([
      ...explicit,
      ...generated,
      ...otherForms
    ]).filter(v=>v!==correct&&!verb.accepted?.includes(v));
  }

  function scoreDistractor(value,verb,correct){
    const base=verb.forms[0];
    let score=0;
    if(value.startsWith(base.slice(0,Math.max(2,base.length-2))))score+=4;
    if(Math.abs(value.length-correct.length)<=1)score+=3;
    if(value.endsWith('ed'))score+=2;
    if(value.endsWith('en')||value.endsWith('t'))score+=2;
    if((verb.spellingDecoys||[]).includes(value))score+=4;
    if((verb.irregularDecoys||[]).includes(value))score+=4;
    return score;
  }

  function chooseDistractors(verb,blankIndex,difficulty='medium',random=Math.random,countOverride=null){
    const correct=String(verb.forms[blankIndex]).toLowerCase();
    const pool=sameVerbDistractors(verb,blankIndex);
    const count=Math.max(1,Math.floor(countOverride??LEVELS[difficulty]?.count??3));

    if(difficulty==='hard'){
      const ranked=[...pool].sort((a,b)=>scoreDistractor(b,verb,correct)-scoreDistractor(a,verb,correct));
      return shuffled(ranked.slice(0,Math.max(count+2,count)),random).slice(0,count);
    }
    if(difficulty==='easy'){
      const obvious=[];
      const regularized=regularPast(verb.forms[0]);
      if(verb.type==='irregular'&&regularized!==correct)obvious.push(regularized);
      if(verb.type==='regular')obvious.push(...(verb.irregularDecoys||[]));
      obvious.push(...(verb.spellingDecoys||[]),...(verb.decoys||[]),...pool);
      return unique(obvious).filter(v=>v!==correct).slice(0,count);
    }
    return shuffled(pool,random).slice(0,count);
  }

  function createChallenge(verb,{random=Math.random,distractorCount=null,difficulty='medium'}={}){
    if(!verb||!Array.isArray(verb.forms)||verb.forms.length!==3)throw new Error('A verb with three principal parts is required.');
    const blankIndex=clampIndex(random());
    const correctAnswer=String(verb.forms[blankIndex]).toLowerCase();
    const distractors=chooseDistractors(verb,blankIndex,difficulty,random,distractorCount);
    if(!distractors.length)throw new Error('Not enough same-verb distractors for this challenge.');
    return {
      base:verb.forms[0],
      type:verb.type||'irregular',
      labels:[...LABELS],
      blankIndex,
      slots:verb.forms.map((form,index)=>index===blankIndex?null:form),
      correctAnswer,
      distractors
    };
  }

  function buildAnswerSequence(challenge,{random=Math.random,distractorCount=null}={}){
    const amount=Math.max(1,Math.min(
      challenge.distractors.length,
      Math.floor(distractorCount??challenge.distractors.length)
    ));
    const items=[
      ...shuffled(challenge.distractors,random).slice(0,amount).map(value=>({value,correct:false})),
      {value:challenge.correctAnswer,correct:true}
    ];
    return shuffled(items,random);
  }

  function buildMediumSequence(challenge,{random=Math.random}={}){
    return buildAnswerSequence(challenge,{random,distractorCount:3});
  }

  const api={LABELS,LEVELS,regularPast,createChallenge,buildAnswerSequence,buildMediumSequence,chooseDistractors,shuffled};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.VerbRunnerChallenge=api;
})(typeof window!=='undefined'?window:globalThis);
