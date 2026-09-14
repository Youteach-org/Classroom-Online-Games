(function(global){
  const SENTENCES=[
    // BASE FORM — 20
    {id:'b01',group:'base',base:'do',text:'Could you ___ me a favor before class?',timeExpressions:['before class'],correctAnswers:['do'],distractors:['make','take','give','bring']},
    {id:'b02',group:'base',base:'pay',text:'You should ___ attention during the explanation.',timeExpressions:['during the explanation'],correctAnswers:['pay'],distractors:['make','take','keep','catch']},
    {id:'b03',group:'base',base:'catch',text:'We must ___ the 7:10 bus tomorrow morning or we will arrive late.',timeExpressions:['tomorrow morning'],correctAnswers:['catch'],distractors:['drive','bring','send','build']},
    {id:'b04',group:'base',base:'bring',text:'Please ___ your ID to the office tomorrow; do not leave it at home.',timeExpressions:['tomorrow'],correctAnswers:['bring'],distractors:['choose','find','write','open']},
    {id:'b05',group:'base',base:'choose',text:'You must ___ one answer as the best option before the timer ends.',timeExpressions:['before the timer ends'],correctAnswers:['choose'],distractors:['bring','catch','build','write']},
    {id:'b06',group:'base',base:'give',text:'The principal will ___ a short speech to welcome the new students this afternoon.',timeExpressions:['this afternoon'],correctAnswers:['give'],distractors:['catch','drive','build','wear']},
    {id:'b07',group:'base',base:'begin',text:'The opening ceremony will ___ at noon tomorrow, marking the start of the festival.',timeExpressions:['at noon tomorrow'],correctAnswers:['begin'],distractors:['finish','continue','stop','wait']},
    {id:'b08',group:'base',base:'break',text:'Be careful not to ___ the glass while you wash it.',timeExpressions:[],correctAnswers:['break'],distractors:['freeze','choose','drink','drive']},
    {id:'b09',group:'base',base:'drink',text:'Athletes should ___ enough water during the race to avoid dehydration.',timeExpressions:['during the race'],correctAnswers:['drink'],distractors:['bring','catch','choose','drive']},
    {id:'b10',group:'base',base:'drive',text:'Can you ___ us home in your car after the meeting?',timeExpressions:['after the meeting'],correctAnswers:['drive'],distractors:['drink','build','freeze','choose']},
    {id:'b11',group:'base',base:'eat',text:'We should ___ our sandwiches before the movie starts because we skipped lunch.',timeExpressions:['before the movie starts'],correctAnswers:['eat'],distractors:['drive','build','freeze','choose']},
    {id:'b12',group:'base',base:'find',text:'Can you ___ the missing document before lunch? We need to know where it is.',timeExpressions:['before lunch'],correctAnswers:['find'],distractors:['break','eat','drive','freeze']},
    {id:'b13',group:'base',base:'forget',text:'Do not ___ to submit the form tonight; it is due at midnight.',timeExpressions:['tonight'],correctAnswers:['forget'],distractors:['catch','build','drive','choose']},
    {id:'b14',group:'base',base:'forgive',text:'It may take time to ___ someone and stop feeling angry after an argument.',timeExpressions:['after an argument'],correctAnswers:['forgive'],distractors:['freeze','drive','catch','build']},
    {id:'b15',group:'base',base:'freeze',text:'Water can ___ quickly below zero degrees.',timeExpressions:[],correctAnswers:['freeze'],distractors:['drive','eat','choose','forgive']},
    {id:'b16',group:'base',base:'make',text:'We have to ___ a list before we go shopping.',timeExpressions:['before we go shopping'],correctAnswers:['make'],distractors:['do','pay','catch','wear']},
    {id:'b17',group:'base',base:'wear',text:'You must ___ a helmet while riding in the bike race.',timeExpressions:['during the bike race'],correctAnswers:['wear'],distractors:['bring','build','choose','catch']},
    {id:'b18',group:'base',base:'take',text:'Please ___ a seat while you wait.',timeExpressions:['while you wait'],correctAnswers:['take'],distractors:['make','give','pay','do']},
    {id:'b19',group:'base',base:'keep',text:'Try to ___ calm during the interview.',timeExpressions:['during the interview'],correctAnswers:['keep'],distractors:['make','take','give','pay']},
    {id:'b20',group:'base',base:'write',text:'You need to ___ your name on the line at the top of the page.',timeExpressions:[],correctAnswers:['write'],distractors:['bring','choose','catch','build']},

    // SIMPLE PAST — 20
    {id:'p01',group:'past',base:'begin',text:'The new course ___ last Tuesday and continues through December.',timeExpressions:['last Tuesday'],correctAnswers:['began'],distractors:['ended','stopped','waited','finished']},
    {id:'p02',group:'past',base:'break',text:'The glass fell from the counter and ___ into three pieces last night.',timeExpressions:['last night'],correctAnswers:['broke'],distractors:['froze','grew','flew','sank']},
    {id:'p03',group:'past',base:'drive',text:'My uncle ___ his car to work before sunrise last Thursday.',timeExpressions:['before sunrise last Thursday'],correctAnswers:['drove'],distractors:['walked','rode','flew','sailed']},
    {id:'p04',group:'past',base:'drink',text:'I ___ two bottles of water in a few minutes because I was extremely thirsty after the race three days ago.',timeExpressions:['three days ago'],correctAnswers:['drank'],distractors:['brought','bought','found','chose']},
    {id:'p05',group:'past',base:'eat',text:'We ___ every bite of our lunch last Saturday.',timeExpressions:['last Saturday'],correctAnswers:['ate'],distractors:['bought','brought','found','chose']},
    {id:'p06',group:'past',base:'find',text:'After searching for an hour, she ___ her keys under the sofa last Wednesday.',timeExpressions:['last Wednesday'],correctAnswers:['found'],distractors:['lost','threw','broke','bought']},
    {id:'p07',group:'past',base:'blow',text:'The wind ___ so hard that the door slammed shut last night.',timeExpressions:['last night'],correctAnswers:['blew'],distractors:['drove','broke','froze','brought']},
    {id:'p08',group:'past',base:'forget',text:'He ___ his password and could not log in two days ago.',timeExpressions:['two days ago'],correctAnswers:['forgot'],distractors:['found','wrote','chose','brought']},
    {id:'p09',group:'past',base:'catch',text:'The goalkeeper ___ the ball securely and prevented a goal last Saturday.',timeExpressions:['last Saturday'],correctAnswers:['caught'],distractors:['threw','kicked','dropped','hit']},
    {id:'p10',group:'past',base:'choose',text:'After comparing all five jackets, Leo ___ the blue one as his final choice last Friday.',timeExpressions:['last Friday'],correctAnswers:['chose'],distractors:['brought','found','sold','broke']},
    {id:'p11',group:'past',base:'bring',text:'Ana ___ her camera with her on the field trip last Wednesday.',timeExpressions:['last Wednesday'],correctAnswers:['brought'],distractors:['found','bought','chose','wrote']},
    {id:'p12',group:'past',base:'buy',text:'We paid $200 and ___ a new printer for the office last month.',timeExpressions:['last month'],correctAnswers:['bought'],distractors:['found','brought','sold','chose']},
    {id:'p13',group:'past',base:'write',text:'The doctor ___ my prescription from scratch a few minutes ago.',timeExpressions:['a few minutes ago'],correctAnswers:['wrote'],distractors:['read','spoke','heard','chose']},
    {id:'p14',group:'past',base:'fall',text:'Several books ___ off the shelf when it collapsed during the storm last night.',timeExpressions:['last night'],correctAnswers:['fell'],distractors:['flew','broke','grew','froze']},
    {id:'p15',group:'past',base:'give',text:'The teacher ___ each of us an extra worksheet last Monday.',timeExpressions:['last Monday'],correctAnswers:['gave'],distractors:['brought','found','chose','wrote']},
    {id:'p16',group:'past',base:'learn',text:'After studying every evening, she finally ___ the new vocabulary last week.',timeExpressions:['last week'],correctAnswers:['learned','learnt'],distractors:['forgot','wrote','read','spoke']},
    {id:'p17',group:'past',base:'dream',text:'I ___ that I was flying over the ocean while asleep when I was a child.',timeExpressions:['when I was a child'],correctAnswers:['dreamed','dreamt'],distractors:['thought','spoke','wrote','read']},
    {id:'p18',group:'past',base:'burn',text:'The toast ___ while I was answering the phone an hour ago.',timeExpressions:['an hour ago'],correctAnswers:['burned','burnt'],distractors:['froze','fell','broke','grew']},
    {id:'p19',group:'past',base:'travel',text:'They ___ across Canada last summer.',timeExpressions:['last summer'],correctAnswers:['traveled','travelled'],distractors:['stayed','worked','studied','lived']},
    {id:'p20',group:'past',base:'spell',text:'He ___ every word correctly, letter by letter, in the quiz three weeks ago.',timeExpressions:['three weeks ago'],correctAnswers:['spelled','spelt'],distractors:['wrote','read','said','heard']},

    // PAST PARTICIPLE — 20
    {id:'pp01',group:'participle',base:'beat',text:'Our team has been ___ by the same rival twice this year, and we lost both matches.',timeExpressions:['this year'],correctAnswers:['beaten'],distractors:['broken','chosen','written','driven']},
    {id:'pp02',group:'participle',base:'bite',text:'The dog has never ___ anyone with its teeth.',timeExpressions:['never'],correctAnswers:['bitten'],distractors:['beaten','broken','driven','chosen']},
    {id:'pp03',group:'participle',base:'freeze',text:'The lake has ___ overnight.',timeExpressions:['overnight'],correctAnswers:['frozen'],distractors:['broken','fallen','grown','flown']},
    {id:'pp04',group:'participle',base:'forgive',text:'She has already ___ him for the mistake.',timeExpressions:['already'],correctAnswers:['forgiven'],distractors:['forgotten','chosen','broken','driven']},
    {id:'pp05',group:'participle',base:'build',text:'The construction crew has ___ three new classrooms from the ground up this semester.',timeExpressions:['this semester'],correctAnswers:['built'],distractors:['bought','brought','found','sold']},
    {id:'pp06',group:'participle',base:'become',text:'The neighborhood has ___ much quieter since June.',timeExpressions:['since June'],correctAnswers:['become','grown'],distractors:['fallen','broken','frozen','stayed']},
    {id:'pp07',group:'participle',base:'begin',text:'The meeting had already ___, so the first speaker was talking when we arrived.',timeExpressions:['already','when we arrived'],correctAnswers:['begun'],distractors:['ended','stopped','waited','finished']},
    {id:'pp08',group:'participle',base:'break',text:'Glass is all over the floor because someone has ___ the window again today.',timeExpressions:['today'],correctAnswers:['broken'],distractors:['frozen','chosen','driven','written']},
    {id:'pp09',group:'participle',base:'choose',text:'After voting, we have already ___ our final project topic.',timeExpressions:['already'],correctAnswers:['chosen'],distractors:['written','broken','driven','forgotten']},
    {id:'pp10',group:'participle',base:'drive',text:'She has never ___ a car in snow before.',timeExpressions:['never','before'],correctAnswers:['driven'],distractors:['flown','ridden','sailed','walked']},
    {id:'pp11',group:'participle',base:'drink',text:'His bottle was empty and he was still thirsty because he had ___ all the water before the hike ended.',timeExpressions:['before the hike ended'],correctAnswers:['drunk'],distractors:['brought','bought','found','chosen']},
    {id:'pp12',group:'participle',base:'eat',text:'Their plates are empty because they have already ___ dinner.',timeExpressions:['already'],correctAnswers:['eaten'],distractors:['bought','brought','found','chosen']},
    {id:'pp13',group:'participle',base:'get',text:'My inbox shows that I have ___ three emails from the school since Monday.',timeExpressions:['since Monday'],correctAnswers:['gotten','got'],distractors:['found','bought','brought','chosen']},
    {id:'pp14',group:'participle',base:'travel',text:'My grandparents have ___ to more than twenty countries this year.',timeExpressions:['this year'],correctAnswers:['traveled','travelled'],distractors:['stayed','worked','studied','lived']},
    {id:'pp15',group:'participle',base:'learn',text:'After weeks of practice, she has finally ___ all the new vocabulary and can now use every word correctly.',timeExpressions:['finally'],correctAnswers:['learned','learnt'],distractors:['forgotten','written','read','spoken']},
    {id:'pp16',group:'participle',base:'dream',text:'I have often ___ that I was walking through Tokyo while asleep.',timeExpressions:['often'],correctAnswers:['dreamed','dreamt'],distractors:['thought','spoken','written','read']},
    {id:'pp17',group:'participle',base:'burn',text:'The toast has ___ again this morning.',timeExpressions:['this morning'],correctAnswers:['burned','burnt'],distractors:['frozen','fallen','broken','grown']},
    {id:'pp18',group:'participle',base:'spell',text:'She has ___ your surname letter by letter aloud every time.',timeExpressions:['every time'],correctAnswers:['spelled','spelt'],distractors:['written','read','said','heard']},
    {id:'pp19',group:'participle',base:'write',text:'He has already ___ three pages of the report from scratch.',timeExpressions:['already'],correctAnswers:['written'],distractors:['read','spoken','chosen','broken']},
    {id:'pp20',group:'participle',base:'see',text:'We have never ___ that movie before, so tonight will be our first time watching it.',timeExpressions:['never','before'],correctAnswers:['seen'],distractors:['heard','read','written','chosen']}
  ];

  const GROUPS=['base','past','participle'];

  function shuffled(values,random=Math.random){
    const copy=[...values];
    for(let i=copy.length-1;i>0;i--){
      const j=Math.max(0,Math.min(i,Math.floor(random()*(i+1))));
      [copy[i],copy[j]]=[copy[j],copy[i]];
    }
    return copy;
  }

  function unique(values){
    return [...new Set((values||[]).filter(Boolean).map(v=>String(v).toLowerCase()))];
  }

  function createChallenge(template,{difficulty='medium',distractorCount=null,random=Math.random}={}){
    const correctAnswers=unique(template.correctAnswers);
    const wanted=Math.max(1,Math.floor(distractorCount??3));
    const distractors=shuffled(
      unique(template.distractors).filter(v=>!correctAnswers.includes(v)),
      random
    ).slice(0,wanted);

    if(!correctAnswers.length)throw new Error('Sentence Run needs a correct answer: '+template.id);
    if(!distractors.length)throw new Error('Sentence Run needs distractors: '+template.id);

    return {
      id:template.id,
      level:2,
      mode:'sentence-run',
      group:template.group,
      base:template.base,
      targetIndex:template.group==='base'?0:(template.group==='past'?1:2),
      text:template.text,
      timeExpressions:[...(template.timeExpressions||[])],
      cue:template.base,
      correctAnswer:correctAnswers[0],
      correctAnswers,
      distractors,
      difficulty
    };
  }

  function buildAnswerSequence(challenge,{random=Math.random,distractorCount=null}={}){
    const amount=Math.max(1,Math.min(
      challenge.distractors.length,
      Math.floor(distractorCount??challenge.distractors.length)
    ));
    const correctAnswers=unique(challenge.correctAnswers?.length?challenge.correctAnswers:[challenge.correctAnswer]);
    return shuffled([
      ...challenge.distractors.slice(0,amount).map(value=>({value,correct:false})),
      ...correctAnswers.map(value=>({value,correct:true}))
    ],random);
  }

  function buildRound(count=20,{difficulty='medium',distractorCount=null,random=Math.random}={}){
    const total=Math.max(3,Math.min(SENTENCES.length,Math.floor(count)));
    const baseEach=Math.floor(total/3);
    const remainder=total-baseEach*3;
    const bonusOrder=shuffled(GROUPS,random);
    const quotas={base:baseEach,past:baseEach,participle:baseEach};
    for(let i=0;i<remainder;i++)quotas[bonusOrder[i]]+=1;

    const picked=[];
    for(const group of GROUPS){
      const pool=shuffled(SENTENCES.filter(item=>item.group===group),random);
      picked.push(...pool.slice(0,quotas[group]));
    }

    return shuffled(picked,random).map(item=>createChallenge(item,{
      difficulty,
      distractorCount,
      random
    }));
  }

  const api={SENTENCES,GROUPS,createChallenge,buildAnswerSequence,buildRound,shuffled};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.VerbRunnerSentenceBank=api;
})(typeof window!=='undefined'?window:globalThis);
