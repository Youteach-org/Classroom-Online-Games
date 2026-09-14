(function(global){
  const GROUP_LABELS={
    "present-simple":"Present Simple",
    "past-simple":"Past Simple",
    "future-will":"Future with will",
    "present-continuous":"Present Continuous",
    "past-continuous":"Past Continuous",
    "future-continuous":"Future Continuous",
    "present-perfect":"Present Perfect",
    "past-perfect":"Past Perfect",
    "future-perfect":"Future Perfect",
    "present-perfect-continuous":"Present Perfect Continuous",
    "past-perfect-continuous":"Past Perfect Continuous",
    "future-perfect-continuous":"Future Perfect Continuous",
    "going-to":"Be going to"
  };

  const EXTRA_HARD={
    th01:"during the next two years",
    th02:"at noon yesterday",
    th03:"before joining the hospital",
    th04:"during the next few weeks",
    th05:"until early March last year",
    th06:"for one hour yesterday",
    th07:"after the doctor returns tomorrow",
    th08:"during the trip next month",
    th09:"for three hours next Saturday",
    th10:"from dawn tomorrow",
    th11:"for nearly an hour tomorrow",
    th12:"during the previous week",
    th13:"after you return tomorrow",
    th14:"after the trip begins",
    th15:"ten years from now",
    th16:"three hours from now",
    th17:"during the next six months",
    th18:"throughout last month",
    th19:"during the previous month",
    th20:"by the time the alarm sounds tomorrow",
    th21:"before the meeting starts tomorrow",
    th22:"after the results were confirmed",
    th23:"at the beginning of last year",
    th24:"at 10:30 tomorrow night"
  };

  const rows=[
    // EASY — highly visible time markers.
    ["te01","easy","present-simple","Maya drinks coffee ___.","every morning",["yesterday morning","right now","by tomorrow"]],
    ["te02","easy","present-simple","Leo plays soccer ___.","on Saturdays",["last Saturday","at the moment","by Saturday"]],
    ["te03","easy","present-simple","We visit our grandparents ___.","twice a month",["two months ago","right now","next month"]],
    ["te04","easy","past-simple","I finished the report ___.","yesterday",["every day","right now","by tomorrow"]],
    ["te05","easy","past-simple","They moved to Morelia ___.","last year",["every year","this year so far","by next year"]],
    ["te06","easy","past-simple","She called me ___.","two hours ago",["for two hours","in two hours","every two hours"]],
    ["te07","easy","present-continuous","Dad is cooking dinner ___.","right now",["every night","last night","by tonight"]],
    ["te08","easy","present-continuous","The students are taking a test ___.","at the moment",["every Monday","last Monday","by Monday"]],
    ["te09","easy","present-continuous","They are repairing the road ___.","currently",["last month","every month","by next month"]],
    ["te10","easy","past-continuous","I was studying ___.","at 8 p.m. last night",["at 8 p.m. tonight","every night at 8","by 8 p.m. tomorrow"]],
    ["te11","easy","past-continuous","She was driving home ___.","when you called",["when you call tomorrow","every time you call","since you called"]],
    ["te12","easy","future-will","I will call you ___.","tomorrow morning",["yesterday morning","every morning","since this morning"]],
    ["te13","easy","future-will","We will see the doctor ___.","next week",["last week","every week","since last week"]],
    ["te14","easy","future-continuous","We will be flying to Cancún ___.","this time tomorrow",["this time yesterday","every morning","since yesterday"]],
    ["te15","easy","future-continuous","She will be working ___.","at 9 tomorrow morning",["at 9 yesterday morning","every morning at 9","since 9 this morning"]],
    ["te16","easy","present-perfect","She has lived here ___.","since 2022",["in 2022","next year","yesterday"]],
    ["te17","easy","present-perfect","I have known him ___.","for five years",["five years ago","next five years","last year"]],
    ["te18","easy","present-perfect","We have already eaten ___.","today",["yesterday at noon","tomorrow at noon","last Saturday"]],
    ["te19","easy","past-perfect","They had left ___.","before I arrived",["after I arrive tomorrow","every time I arrive","since I arrived"]],
    ["te20","easy","past-perfect","The movie had started ___.","by the time we got there",["by the time we get there tomorrow","every time we go there","since we got there"]],
    ["te21","easy","future-perfect","I will have finished the project ___.","by Friday",["last Friday","every Friday","since Friday"]],
    ["te22","easy","future-perfect","They will have arrived ___.","by noon tomorrow",["at noon yesterday","every day at noon","since noon today"]],
    ["te23","easy","present-perfect-continuous","He has been waiting ___.","since noon",["at noon yesterday","by noon tomorrow","every noon"]],
    ["te24","easy","going-to","We are going to visit Oaxaca ___.","next weekend",["last weekend","every weekend","since the weekend"]],

    // MEDIUM — tense recognition matters; markers are less obvious.
    ["tm01","medium","present-simple","The clinic opens at seven ___.","on weekdays",["last weekday","at the moment","by next Monday"]],
    ["tm02","medium","present-simple","Our team practices ___.","every other Friday",["last Friday evening","this Friday right now","by Friday evening"]],
    ["tm03","medium","past-simple","I first met Ana ___.","when I was ten",["since I was ten","when I am ten","by the time I am ten"]],
    ["tm04","medium","past-simple","We traveled across Mexico ___.","last summer",["this summer so far","every summer","by next summer"]],
    ["tm05","medium","present-continuous","My brother is working from home ___.","this week",["last week only","every week","by next week"]],
    ["tm06","medium","present-continuous","More students are using the new lab ___.","these days",["in those days years ago","every decade","by next decade"]],
    ["tm07","medium","past-continuous","We were having lunch ___.","when the lights went out",["when the lights go out tomorrow","since the lights went out","every time the lights go out"]],
    ["tm08","medium","past-continuous","The children were playing outside ___.","while it was raining",["while it rains tomorrow","since it rained","every rainy day"]],
    ["tm09","medium","future-will","I will send the file ___.","as soon as I get home",["as soon as I got home yesterday","every time I get home","since I got home"]],
    ["tm10","medium","future-will","The results will be posted ___.","later tonight",["earlier last night","every night","since tonight began"]],
    ["tm11","medium","future-continuous","We will be staying in Mérida ___.","at this time next week",["at this time last week","every week","since last week"]],
    ["tm12","medium","future-continuous","She will be taking her exam ___.","at 10 tomorrow morning",["at 10 yesterday morning","every morning at 10","since 10 this morning"]],
    ["tm13","medium","present-perfect","Have you ever visited Chiapas ___.","before",["yesterday","next weekend","at 8 last night"]],
    ["tm14","medium","present-perfect","We haven't received the package ___.","yet",["yesterday","tomorrow","two days ago"]],
    ["tm15","medium","present-perfect","The class has completed six chapters ___.","so far",["last semester","next semester","three months ago"]],
    ["tm16","medium","present-perfect","I have seen her several times ___.","recently",["in 2018","next year","two weeks from now"]],
    ["tm17","medium","past-perfect","She had already submitted the form ___.","before the deadline passed",["after the deadline passes tomorrow","every deadline","since the deadline passed"]],
    ["tm18","medium","past-perfect","By the time the teacher arrived, we had finished the activity ___.","already",["tomorrow","right now","next week"]],
    ["tm19","medium","future-perfect","She will have graduated from college ___.","by next June",["last June","every June","since June"]],
    ["tm20","medium","future-perfect","We will have completed the first phase ___.","before you arrive",["after you arrived yesterday","every time you arrive","since you arrived"]],
    ["tm21","medium","present-perfect-continuous","It has been raining ___.","all morning",["yesterday morning","tomorrow morning","every morning"]],
    ["tm22","medium","present-perfect-continuous","I have been trying to reach you ___.","for the last two hours",["two hours ago","in two hours","every two hours"]],
    ["tm23","medium","past-perfect-continuous","They had been driving ___.","for six hours before they stopped",["for six hours tomorrow","six hours ago","every six hours"]],
    ["tm24","medium","going-to","She is going to start medical school ___.","next semester",["last semester","every semester","since last semester"]],

    // HARD — advanced perfect and continuous relationships.
    ["th01","hard","present-perfect","The research team has published four papers ___.","over the past two years",["two years ago","during next year","by 2019"]],
    ["th02","hard","present-perfect","No one has solved the problem ___.","up to now",["at that moment yesterday","by tomorrow morning","every afternoon"]],
    ["th03","hard","present-perfect","He has worked in three departments ___.","since joining the hospital",["before he joined the hospital","after he joins next year","when he joined yesterday"]],
    ["th04","hard","present-perfect-continuous","She has been preparing for the exam ___.","for the past few weeks",["a few weeks ago","during next week","by last week"]],
    ["th05","hard","present-perfect-continuous","They have been renovating the building ___.","since early March",["in early March only","by early March next year","every March"]],
    ["th06","hard","present-perfect-continuous","My eyes hurt because I have been reading ___.","all afternoon",["yesterday afternoon","tomorrow afternoon","every afternoon"]],
    ["th07","hard","past-perfect","The patient had already left ___.","by the time the doctor returned",["by the time the doctor returns tomorrow","whenever the doctor returns","since the doctor returned"]],
    ["th08","hard","past-perfect","We had never seen snow ___.","before that trip",["during next winter","since tomorrow","every trip"]],
    ["th09","hard","past-perfect-continuous","She had been studying ___.","for three hours when the power failed",["for three hours tomorrow","three hours from now","every three hours"]],
    ["th10","hard","past-perfect-continuous","The workers had been repairing the bridge ___.","since dawn before the storm began",["since dawn tomorrow","by dawn next week","every dawn"]],
    ["th11","hard","past-perfect-continuous","He was exhausted because he had been running ___.","for nearly an hour",["an hour from now","an hour ago only","every hour"]],
    ["th12","hard","future-perfect","The team will have finished the analysis ___.","by the end of the week",["at the end of last week","every weekend","since the week began"]],
    ["th13","hard","future-perfect","I will have written the report ___.","by the time you return",["by the time you returned yesterday","whenever you return","since you returned"]],
    ["th14","hard","future-perfect","She will have saved enough money ___.","before the trip begins",["after the trip began","every time the trip begins","since the trip began"]],
    ["th15","hard","future-perfect-continuous","By next July, she will have been teaching here ___.","for ten years",["ten years ago","during last year","every ten years"]],
    ["th16","hard","future-perfect-continuous","At noon, we will have been waiting ___.","for three hours",["three hours ago","in three hours","every three hours"]],
    ["th17","hard","future-perfect-continuous","By the concert, he will have been practicing this piece ___.","for six months",["six months ago","during last month","every six months"]],
    ["th18","hard","future-continuous","The surgeons will be operating ___.","throughout tomorrow morning",["throughout yesterday morning","every morning","since last week"]],
    ["th19","hard","future-continuous","We will be working on the new system ___.","throughout next week",["throughout last week","every previous week","since last week"]],
    ["th20","hard","past-continuous","I was talking to the receptionist ___.","when the alarm sounded",["when the alarm sounds tomorrow","every time the alarm sounds","since the alarm sounded"]],
    ["th21","hard","past-continuous","The team was still discussing the case ___.","when the meeting ended",["when the meeting ends tomorrow","since the meeting ended","every meeting"]],
    ["th22","hard","future-will","I will let you know ___.","once the results are confirmed",["once the results were confirmed yesterday","every time results are confirmed","since the results were confirmed"]],
    ["th23","hard","going-to","They are going to launch the new service ___.","at the beginning of next month",["at the beginning of last month","every month","since the beginning of this month"]],
    ["th24","hard","present-simple","The final train leaves ___.","at 10:30 tonight",["at 10:30 last night","since 10:30","by 10:30 yesterday"]]
  ];

  const ITEMS=rows.map(([id,tier,group,text,correct,distractors])=>({
    id,tier,group,text,
    grammarLabel:GROUP_LABELS[group]||group,
    correctAnswers:[correct],
    distractors:[...distractors,...(tier==='hard'&&EXTRA_HARD[id]?[EXTRA_HARD[id]]:[])]
  }));

  function shuffled(values,random=Math.random){
    const copy=[...values];
    for(let i=copy.length-1;i>0;i--){
      const j=Math.max(0,Math.min(i,Math.floor(random()*(i+1))));
      [copy[i],copy[j]]=[copy[j],copy[i]];
    }
    return copy;
  }

  function unique(values){
    return [...new Set((values||[]).filter(Boolean).map(v=>String(v)))];
  }

  function createChallenge(template,{difficulty='medium',distractorCount=3,random=Math.random}={}){
    const correctAnswers=unique(template.correctAnswers);
    const wanted=Math.max(1,Math.floor(distractorCount||3));
    const distractors=shuffled(
      unique(template.distractors).filter(v=>!correctAnswers.some(c=>c.toLowerCase()===v.toLowerCase())),
      random
    ).slice(0,wanted);
    return {
      id:template.id,
      level:3,
      mode:'time-clues',
      tier:template.tier,
      group:template.group,
      grammarLabel:template.grammarLabel,
      text:template.text,
      timeExpressions:[],
      cue:template.grammarLabel,
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
    return shuffled([
      ...challenge.distractors.slice(0,amount).map(value=>({value,correct:false})),
      ...challenge.correctAnswers.map(value=>({value,correct:true}))
    ],random);
  }

  function buildRound(count=20,{difficulty='medium',distractorCount=3,random=Math.random}={}){
    const tier=['easy','medium','hard'].includes(difficulty)?difficulty:'medium';
    const pool=shuffled(ITEMS.filter(item=>item.tier===tier),random);
    const total=Math.max(3,Math.min(pool.length,Math.floor(count)));
    return pool.slice(0,total).map(item=>createChallenge(item,{difficulty:tier,distractorCount,random}));
  }

  const api={ITEMS,GROUP_LABELS,createChallenge,buildAnswerSequence,buildRound,shuffled};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.VerbRunnerTimeCluesBank=api;
})(typeof window!=='undefined'?window:globalThis);
