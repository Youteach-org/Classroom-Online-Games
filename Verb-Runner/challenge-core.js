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

  function vowelMutations(word){
    const w=String(word||'').toLowerCase();
    if(!w)return [];
    const swaps={
      a:['e','o','u'],
      e:['a','i','o'],
      i:['a','e','o'],
      o:['a','e','u'],
      u:['a','i','o']
    };
    const out=[];
    const vowelIndexes=[...w].map((ch,i)=>isVowel(ch)?i:-1).filter(i=>i>=0);

    for(const i of vowelIndexes){
      const choices=swaps[w[i]]||[];
      for(const repl of choices){
        out.push(w.slice(0,i)+repl+w.slice(i+1));
      }
    }

    const clusters=[
      ['ea','ee'],['ea','ai'],['ee','ea'],['oo','ou'],['ou','ow'],
      ['ow','ou'],['oa','ow'],['i','ai'],['a','o'],['o','u']
    ];
    for(const [from,to] of clusters){
      if(w.includes(from))out.push(w.replace(from,to));
    }

    return unique(out).filter(v=>v!==w);
  }

  function baseFormMutations(word){
    const w=String(word||'').toLowerCase();
    if(!w)return [];

    const out=[...vowelMutations(w)];
    const diphthongs={
      a:['ai','ea'],
      e:['ea','ee'],
      i:['ie','ai'],
      o:['oa','ou'],
      u:['ou','au'],
      y:['i','ie','ai','ey']
    };

    for(let i=0;i<w.length;i++){
      const ch=w[i];
      const choices=diphthongs[ch]||[];
      for(const repl of choices){
        out.push(w.slice(0,i)+repl+w.slice(i+1));
      }
    }

    return unique(out).filter(v=>v!==w);
  }

  function spellingMutations(word){
    const w=String(word||'').toLowerCase();
    if(!w)return [];
    const out=[...vowelMutations(w)];

    if(/ied$/.test(w))out.push(w.replace(/ied$/,'yed'));
    if(/ed$/.test(w))out.push(w.replace(/ed$/,'id'),w.replace(/ed$/,'ad'));
    if(/en$/.test(w))out.push(w.replace(/en$/,'an'),w.replace(/en$/,'on'));

    return unique(out).filter(v=>v!==w);
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
        ...baseFormMutations(base)
      ]).filter(v=>
        v!==correct &&
        !verb.forms.includes(v) &&
        !verb.accepted?.includes(v)
      );
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

  function consonantSkeleton(word){
    return String(word||'').toLowerCase().replace(/[aeiou]/g,'');
  }

  function scoreDistractor(value,verb,correct){
    const base=verb.forms[0];
    let score=0;
    const valueSkeleton=consonantSkeleton(value);
    const correctSkeleton=consonantSkeleton(correct);
    const baseSkeleton=consonantSkeleton(base);
    if(valueSkeleton===correctSkeleton||valueSkeleton===baseSkeleton)score+=7;
    if(value.startsWith(base.slice(0,Math.max(2,base.length-2))))score+=4;
    if(Math.abs(value.length-correct.length)<=1)score+=3;
    const vowelDiff=[...value].reduce((n,ch,i)=>n+(isVowel(ch)&&ch!==correct[i]?1:0),0);
    if(vowelDiff>0&&vowelDiff<=2)score+=5;
    if(value.endsWith('ed'))score+=1;
    if(value.endsWith('en'))score+=1;
    if((verb.spellingDecoys||[]).includes(value))score+=2;
    if((verb.irregularDecoys||[]).includes(value))score+=3;
    return score;
  }

  function chooseDistractors(verb,blankIndex,difficulty='medium',random=Math.random,countOverride=null){
    const correct=String(verb.forms[blankIndex]).toLowerCase();
    const pool=sameVerbDistractors(verb,blankIndex);
    const count=Math.max(1,Math.floor(countOverride??LEVELS[difficulty]?.count??3));
    const correctSkeleton=consonantSkeleton(correct);
    const baseSkeleton=consonantSkeleton(verb.forms[0]);
    const vowelFocused=pool.filter(value=>{
      const skeleton=consonantSkeleton(value);
      return skeleton===correctSkeleton||skeleton===baseSkeleton;
    });
    const preferred=unique([...vowelFocused,...pool]);

    if(blankIndex===0){
      const baseOnly=preferred.filter(value=>{
        const skeleton=consonantSkeleton(value);
        return skeleton===baseSkeleton;
      });
      const basePool=baseOnly.length>=count?baseOnly:preferred;
      if(difficulty==='hard'){
        const ranked=[...basePool].sort((a,b)=>scoreDistractor(b,verb,correct)-scoreDistractor(a,verb,correct));
        return shuffled(ranked.slice(0,Math.max(count+3,count)),random).slice(0,count);
      }
      return shuffled(basePool,random).slice(0,count);
    }

    if(difficulty==='hard'){
      const ranked=[...preferred].sort((a,b)=>scoreDistractor(b,verb,correct)-scoreDistractor(a,verb,correct));
      return shuffled(ranked.slice(0,Math.max(count+3,count)),random).slice(0,count);
    }
    if(difficulty==='easy'){
      const obvious=[];
      const regularized=regularPast(verb.forms[0]);
      if(verb.type==='irregular'&&regularized!==correct)obvious.push(regularized);
      if(verb.type==='regular')obvious.push(...(verb.irregularDecoys||[]));
      obvious.push(...(verb.spellingDecoys||[]),...(verb.decoys||[]),...pool);
      return unique(obvious).filter(v=>v!==correct).slice(0,count);
    }
    const mediumPool=vowelFocused.length>=count?vowelFocused:preferred;
    return shuffled(mediumPool,random).slice(0,count);
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

  const api={LABELS,LEVELS,regularPast,vowelMutations,baseFormMutations,consonantSkeleton,createChallenge,buildAnswerSequence,buildMediumSequence,chooseDistractors,shuffled};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.VerbRunnerChallenge=api;
})(typeof window!=='undefined'?window:globalThis);
