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

  // Ten items per tense/form. Difficulty distribution per group:
  // 3 Easy + 4 Medium + 3 Hard = 10.
  // In Perfect forms, a second time reference is intentionally kept when it is
  // necessary to establish the past/future anchor; only redundant clues are removed.
  const SOURCE={
    "present-simple":[
      ["Maya drinks coffee ___.","every morning",["yesterday morning","right now","by tomorrow","since this morning"]],
      ["Leo plays soccer ___.","on Saturdays",["last Saturday","at the moment","by Saturday","since Saturday"]],
      ["We visit our grandparents ___.","twice a month",["two months ago","right now","next month","since last month"]],
      ["The clinic opens at seven ___.","on weekdays",["last Monday","at the moment","by next Monday","since Monday"]],
      ["Our team practices ___.","every other Friday",["last Friday evening","right now","by Friday evening","since Friday"]],
      ["I check my messages ___.","before breakfast every day",["before breakfast yesterday","right now","by breakfast tomorrow","since breakfast"]],
      ["The museum closes early ___.","on public holidays",["last holiday","at the moment","by the next holiday","since the holiday"]],
      ["The final train leaves ___.","at 10:30 tonight",["at 10:30 last night","since 10:30","by 10:30 yesterday","at the moment"]],
      ["Professor Lee holds office hours ___.","every Tuesday afternoon",["last Tuesday afternoon","this Tuesday right now","by Tuesday afternoon","since Tuesday"]],
      ["The pharmacy delivers medicine ___.","three times a week",["three weeks ago","right now","by next week","since last week"]]
    ],
    "past-simple":[
      ["I finished the report ___.","yesterday",["every day","right now","by tomorrow","since yesterday"]],
      ["They moved to Morelia ___.","last year",["every year","this year so far","by next year","since last year"]],
      ["She called me ___.","two hours ago",["for two hours","in two hours","every two hours","since two hours ago"]],
      ["I first met Ana ___.","when I was ten",["since I was ten","when I am ten","by the time I am ten","every year"]],
      ["We traveled across Mexico ___.","last summer",["this summer so far","every summer","by next summer","since last summer"]],
      ["The train departed ___.","at 6 yesterday morning",["at 6 tomorrow morning","every morning at 6","since 6 this morning","by 6 tomorrow"]],
      ["The library reopened ___.","in 2024",["since 2024","by 2027","every year","right now"]],
      ["Our school won the tournament ___.","last Saturday",["next Saturday","every Saturday","since Saturday","at the moment"]],
      ["She submitted the application ___.","three days ago",["for three days","in three days","every three days","since three days ago"]],
      ["I first saw the ocean ___.","when I was six",["since I was six","when I turn six","by the time I turn six","every summer"]]
    ],
    "future-will":[
      ["I will call you ___.","tomorrow morning",["yesterday morning","every morning","since this morning","right now"]],
      ["We will see the doctor ___.","next week",["last week","every week","since last week","right now"]],
      ["I will send the file ___.","as soon as I get home",["as soon as I got home yesterday","every time I get home","since I got home","while I was home"]],
      ["The results will be posted ___.","later tonight",["earlier last night","every night","since tonight began","last night"]],
      ["I will tell you the answer ___.","when I know more",["when I knew more yesterday","every time I know more","since I knew more","while I knew more"]],
      ["I think it will rain ___.","tomorrow afternoon",["yesterday afternoon","every afternoon","since this afternoon","right now"]],
      ["We will help you with the boxes ___.","after class today",["after class yesterday","every class","since class started","during yesterday's class"]],
      ["The committee will make its decision ___.","tomorrow",["yesterday","every day","since today","right now"]],
      ["I promise I will return the book ___.","on Monday",["last Monday","every Monday","since Monday","yesterday"]],
      ["The technician will call you ___.","within an hour",["an hour ago","every hour","since an hour ago","last hour"]]
    ],
    "present-continuous":[
      ["Dad is cooking dinner ___.","right now",["every night","last night","by tonight","yesterday"]],
      ["The students are taking a test ___.","at the moment",["every Monday","last Monday","by Monday","two days ago"]],
      ["They are repairing the road ___.","currently",["last month","every month","by next month","in 2024"]],
      ["My brother is working from home ___.","this week",["last week only","every week","by next week","three weeks ago"]],
      ["More students are using the new lab ___.","these days",["in those days years ago","every decade","by next decade","last decade"]],
      ["I am staying with my aunt ___.","this month",["last month","every month","by next month","since last year"]],
      ["The team is practicing in the gym ___.","today",["yesterday","every Friday","by tomorrow","last week"]],
      ["The city is expanding its bus routes ___.","this year",["in 2020","every year","by 2030","last year"]],
      ["I am reading a new novel ___.","at the moment",["last month","every evening","by next week","two years ago"]],
      ["The weather is getting colder ___.","this week",["last winter","every winter","by next winter","in 2022"]]
    ],
    "past-continuous":[
      ["I was studying ___.","at 8 p.m. last night",["at 8 p.m. tonight","every night at 8","since 8 p.m.","by 8 p.m. tomorrow"]],
      ["She was driving home ___.","when you called",["when you call tomorrow","every time you call","since you called","after you call tomorrow"]],
      ["We were having lunch ___.","when the lights went out",["when the lights go out tomorrow","since the lights went out","every time the lights go out","before the lights go out tomorrow"]],
      ["The children were playing outside ___.","while it was raining",["while it rains tomorrow","since it rained","every rainy day","by the time it rains tomorrow"]],
      ["The nurse was speaking to the patient ___.","when the alarm rang",["when the alarm rings tomorrow","since the alarm rang","every time the alarm rings","before the alarm rings tomorrow"]],
      ["I was walking home ___.","at sunset yesterday",["at sunset tomorrow","every sunset","since sunset","by sunset tomorrow"]],
      ["They were waiting for the bus ___.","when it finally arrived",["when it arrives tomorrow","since it arrived","every time it arrives","before it arrives tomorrow"]],
      ["He was sleeping ___.","while the storm was passing",["while the storm passes tomorrow","since the storm passed","every storm","by the time the storm passes"]],
      ["We were discussing the plan ___.","at noon yesterday",["at noon tomorrow","every day at noon","since noon today","by noon tomorrow"]],
      ["The team was still training ___.","when the coach arrived",["when the coach arrives tomorrow","since the coach arrived","every time the coach arrives","before the coach arrives tomorrow"]]
    ],
    "future-continuous":[
      ["We will be flying to Cancún ___.","this time tomorrow",["this time yesterday","every morning","since yesterday","last week"]],
      ["She will be working ___.","at 9 tomorrow morning",["at 9 yesterday morning","every morning at 9","since 9 this morning","last Monday"]],
      ["We will be staying in Mérida ___.","at this time next week",["at this time last week","every week","since last week","yesterday"]],
      ["She will be taking her exam ___.","at 10 tomorrow morning",["at 10 yesterday morning","every morning at 10","since 10 this morning","last Tuesday"]],
      ["The surgeons will be operating ___.","throughout tomorrow morning",["throughout yesterday morning","every morning","since last week","last month"]],
      ["We will be driving through the mountains ___.","at sunset tomorrow",["at sunset yesterday","every sunset","since sunset","last weekend"]],
      ["She will be presenting the proposal ___.","at 3 p.m. tomorrow",["at 3 p.m. yesterday","every day at 3","since 3 p.m. today","last Friday"]],
      ["I will be meeting clients ___.","this time next Monday",["this time last Monday","every Monday","since Monday","yesterday"]],
      ["They will be using the new laboratory ___.","all day tomorrow",["all day yesterday","every day","since yesterday","last week"]],
      ["The scientists will be monitoring the telescope ___.","at midnight tonight",["at midnight last night","every midnight","since midnight","two nights ago"]]
    ],
    "present-perfect":[
      ["She has lived here ___.","since 2022",["in 2022","next year","yesterday","two years ago"]],
      ["I have known him ___.","for five years",["five years ago","next five years","last year","in 2020 only"]],
      ["We haven't received the package ___.","yet",["yesterday","tomorrow","two days ago","last Friday"]],
      ["The class has completed six chapters ___.","so far",["last semester","next semester","three months ago","in 2021"]],
      ["I have seen her several times ___.","recently",["in 2018","next year","two weeks from now","last summer only"]],
      ["She has worked at the hospital ___.","since graduation",["at graduation","before graduation only","next semester","last summer"]],
      ["We have made three changes to the plan ___.","this week",["last week","next week","three weeks ago","in 2020"]],
      ["I haven't spoken to him ___.","since Monday",["on Monday only","next Monday","last year","yesterday at noon"]],
      ["They have visited Oaxaca twice ___.","this year",["last year","next year","in 2019","three years ago"]],
      ["She has already finished the first unit ___.","today",["yesterday","tomorrow","last month","two weeks ago"]]
    ],
    "past-perfect":[
      ["They had left ___.","before I arrived",["after I arrive tomorrow","every time I arrive","since I arrived","next week"]],
      ["The movie had started ___.","by the time we got there",["by the time we get there tomorrow","every time we go there","since we got there","next Saturday"]],
      ["The patient had left ___.","by the time the doctor returned",["by the time the doctor returns tomorrow","whenever the doctor returns","since the doctor returned","next month"]],
      ["We had never seen snow ___.","before that trip",["during next winter","since tomorrow","every trip","next month"]],
      ["She had submitted all the forms ___.","before the interview began",["after the interview begins tomorrow","every interview","since the interview began","next week"]],
      ["The computer had saved the file ___.","before it crashed",["after it crashes tomorrow","every time it crashes","since it crashed","next month"]],
      ["The students had finished the activity ___.","before the teacher arrived",["after the teacher arrives tomorrow","every time the teacher arrives","since the teacher arrived","next class"]],
      ["She had lived in Puebla ___.","for ten years before moving to Morelia",["ten years from now","every ten years","during next year","since next Monday"]],
      ["Before the company closed, he had worked there ___.","since 2018",["in 2018 only","next year","every year","tomorrow"]],
      ["By the time the concert began, we had waited ___.","for over an hour",["an hour from now","every hour","during next week","tomorrow morning"]]
    ],
    "future-perfect":[
      ["I will have finished the project ___.","by Friday",["last Friday","every Friday","since Friday","yesterday"]],
      ["They will have arrived ___.","by noon tomorrow",["at noon yesterday","every day at noon","since noon today","last week"]],
      ["She will have graduated from college ___.","by next June",["last June","every June","since June","in 2020"]],
      ["We will have completed the first phase ___.","before you arrive",["after you arrived yesterday","every time you arrive","since you arrived","last month"]],
      ["The team will have finished the analysis ___.","by the end of the week",["at the end of last week","every weekend","since the week began","yesterday"]],
      ["I will have written the report ___.","by the time you return",["by the time you returned yesterday","since you returned","last night","two days ago"]],
      ["She will have saved enough money ___.","before the trip begins",["after the trip began","since the trip began","last summer","yesterday"]],
      ["The company will have opened three new branches ___.","by the end of the year",["at the end of last year","every year","since January","two years ago"]],
      ["The city will have completed the new hospital ___.","by 2030",["in 2020","every year","since 2024","last decade"]],
      ["She will have read every chapter ___.","before the exam starts",["after the exam started yesterday","since the exam started","last semester","two weeks ago"]]
    ],
    "present-perfect-continuous":[
      ["He has been waiting ___.","since noon",["at noon yesterday","by noon tomorrow","every noon","two hours ago"]],
      ["It has been raining ___.","all morning",["yesterday morning","tomorrow morning","every morning","last week"]],
      ["I have been trying to reach you ___.","for the last two hours",["two hours ago","in two hours","every two hours","yesterday"]],
      ["She has been preparing for the exam ___.","for the past few weeks",["a few weeks ago","during next week","by last week","last semester"]],
      ["They have been renovating the building ___.","since early March",["in early March only","by early March next year","every March","last March only"]],
      ["My eyes hurt because I have been reading ___.","all afternoon",["yesterday afternoon","tomorrow afternoon","every afternoon","last week"]],
      ["We have been working on this project ___.","since Monday",["last Monday only","next Monday","every Monday","three weeks ago"]],
      ["She has been studying ___.","for three hours",["three hours ago","in three hours","every three hours","yesterday"]],
      ["He has been practicing the violin ___.","since January",["in January only","next January","every January","last year"]],
      ["It has been snowing ___.","since dawn",["at dawn yesterday","by dawn tomorrow","every dawn","last winter"]]
    ],
    "past-perfect-continuous":[
      ["When the power failed, she had been studying ___.","for three hours",["three hours from now","every three hours","during next week","tomorrow morning"]],
      ["Before they stopped, they had been driving ___.","for six hours",["six hours from now","every six hours","during next weekend","tomorrow"]],
      ["When the storm began, the workers had been repairing the bridge ___.","since dawn",["since dawn tomorrow","every dawn","by dawn next week","next morning"]],
      ["When the manager arrived, we had been waiting ___.","for forty minutes",["in forty minutes","every forty minutes","forty minutes from now","tomorrow"]],
      ["Before the championship began, the team had been training ___.","for months",["during next month","every month","months from now","next season"]],
      ["Before she moved away, she had been working there ___.","since 2019",["in 2019 only","next year","every year","tomorrow"]],
      ["When the nurse checked, the baby had been sleeping ___.","for twenty minutes",["in twenty minutes","every twenty minutes","twenty minutes from now","tomorrow"]],
      ["Before the rain stopped, it had been falling ___.","all morning",["tomorrow morning","every morning","next week","by tomorrow"]],
      ["When the café closed, they had been talking ___.","for over an hour",["an hour from now","every hour","during next week","tomorrow evening"]],
      ["When the bus finally came, people had been standing in line ___.","since 6 a.m.",["at 6 a.m. tomorrow","every day at 6","by 6 a.m. tomorrow","next week"]]
    ],
    "future-perfect-continuous":[
      ["By next July, she will have been teaching here ___.","for ten years",["ten years ago","during last year","every ten years","last summer"]],
      ["At noon, we will have been waiting ___.","for three hours",["three hours ago","every three hours","yesterday","last week"]],
      ["By the concert, he will have been practicing this piece ___.","for six months",["six months ago","during last month","every six months","last year"]],
      ["By the end of the month, the team will have been testing the system ___.","for three weeks",["three weeks ago","every three weeks","last month","yesterday"]],
      ["By 2030, we will have been living in this city ___.","for twenty years",["twenty years ago","every twenty years","last decade","yesterday"]],
      ["By midnight, I will have been studying ___.","for six hours",["six hours ago","every six hours","yesterday afternoon","last week"]],
      ["By next semester, Mr. Lee will have been teaching this course ___.","for five years",["five years ago","every five years","last semester","yesterday"]],
      ["At the finish line, she will have been running ___.","for nearly four hours",["four hours ago","every four hours","last weekend","yesterday"]],
      ["By Friday, we will have been using this system ___.","for two weeks",["two weeks ago","every two weeks","last month","yesterday"]],
      ["By the time the airport reopens, the travelers will have been waiting ___.","since early morning",["early yesterday morning","every morning","last week","two days ago"]]
    ],
    "going-to":[
      ["We are going to visit Oaxaca ___.","next weekend",["last weekend","every weekend","since the weekend","yesterday"]],
      ["She is going to start medical school ___.","next semester",["last semester","every semester","since last semester","three years ago"]],
      ["I am going to clean the garage ___.","tomorrow morning",["yesterday morning","every morning","since this morning","last week"]],
      ["They are going to watch the new movie ___.","tonight",["last night","every night","since last night","yesterday"]],
      ["We are going to meet the architect ___.","this afternoon",["yesterday afternoon","every afternoon","since noon yesterday","last week"]],
      ["The company is going to launch the service ___.","next month",["last month","every month","since last month","three months ago"]],
      ["She is going to move to Guadalajara ___.","in June",["last June","every June","since June","two years ago"]],
      ["I am going to talk to the teacher ___.","after class today",["after class yesterday","every class","since class began yesterday","last week"]],
      ["They are going to repaint the classroom ___.","during the holiday break",["during last year's break","every break","since the break ended","last semester"]],
      ["We are going to begin the new unit ___.","on Monday",["last Monday","every Monday","since Monday","yesterday"]]
    ]
  };

  const PREFIX={
    "present-simple":"ps",
    "past-simple":"pa",
    "future-will":"fw",
    "present-continuous":"pc",
    "past-continuous":"pac",
    "future-continuous":"fuc",
    "present-perfect":"pp",
    "past-perfect":"pap",
    "future-perfect":"fup",
    "present-perfect-continuous":"ppc",
    "past-perfect-continuous":"papc",
    "future-perfect-continuous":"fupc",
    "going-to":"gt"
  };

  function tierForIndex(index){
    if(index<3)return "easy";
    if(index<7)return "medium";
    return "hard";
  }

  const ITEMS=Object.entries(SOURCE).flatMap(([group,rows])=>
    rows.map(([text,correct,distractors],index)=>({
      id:(PREFIX[group]||"tc")+String(index+1).padStart(2,"0"),
      tier:tierForIndex(index),
      group,
      text,
      grammarLabel:GROUP_LABELS[group]||group,
      correctAnswers:[correct],
      distractors:[...distractors]
    }))
  );

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

  function createChallenge(template,{difficulty="medium",distractorCount=3,random=Math.random}={}){
    const correctAnswers=unique(template.correctAnswers);
    const wanted=Math.max(1,Math.floor(distractorCount||3));
    const distractors=shuffled(
      unique(template.distractors).filter(v=>!correctAnswers.some(c=>c.toLowerCase()===v.toLowerCase())),
      random
    ).slice(0,wanted);
    return {
      id:template.id,
      level:3,
      mode:"time-clues",
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

  // Balanced round: each tense/form appears once before any tense repeats.
  function buildRound(count=20,{difficulty="medium",distractorCount=3,random=Math.random}={}){
    const tier=["easy","medium","hard"].includes(difficulty)?difficulty:"medium";
    const groups=shuffled(Object.keys(GROUP_LABELS),random);
    const buckets=new Map(groups.map(group=>[
      group,
      shuffled(ITEMS.filter(item=>item.tier===tier&&item.group===group),random)
    ]));
    const selected=[];
    let pass=0;
    while(selected.length<count){
      let added=false;
      const order=pass%2===0?groups:[...groups].reverse();
      for(const group of order){
        const bucket=buckets.get(group);
        if(bucket?.length){
          selected.push(bucket.shift());
          added=true;
          if(selected.length>=count)break;
        }
      }
      if(!added)break;
      pass+=1;
    }
    return shuffled(selected,random).map(item=>
      createChallenge(item,{difficulty:tier,distractorCount,random})
    );
  }

  const api={ITEMS,GROUP_LABELS,SOURCE,createChallenge,buildAnswerSequence,buildRound,shuffled};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  global.VerbRunnerTimeCluesBank=api;
})(typeof window!=="undefined"?window:globalThis);
