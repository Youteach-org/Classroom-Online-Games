(function(global){
  const GROUPS={
    "present-perfect-simple":{
      label:"Present Perfect Simple",
      focus:"RESULT / COMPLETED AMOUNT",
      rows:[
      ["She ___ three reports today.","has written",["has been writing","wrote"]],
      ["We ___ Oaxaca twice this year.","have visited",["have been visiting","visited"]],
      ["The class ___ six chapters so far.","has completed",["has been completing","completed"]],
      ["I ___ all my emails today.","have answered",["have been answering","answered"]],
      ["He ___ two awards this year.","has won",["has been winning","won"]],
      ["They ___ five new stores this month.","have opened",["have been opening","opened"]],
      ["Maya ___ four books this semester.","has read",["has been reading","read"]],
      ["The mechanic ___ three cars today.","has repaired",["has been repairing","repaired"]],
      ["We ___ every item on the checklist.","have checked",["have been checking","checked"]],
      ["She ___ the final version already.","has submitted",["has been submitting","submitted"]],
      ["I ___ that movie three times.","have seen",["have been seeing","saw"]],
      ["The team ___ all its goals this quarter.","has reached",["has been reaching","reached"]],
      ["He ___ ten kilometers today.","has run",["has been running","ran"]],
      ["They ___ the kitchen completely.","have cleaned",["have been cleaning","cleaned"]],
      ["Our group ___ four experiments this week.","has finished",["has been finishing","finished"]],
      ["She ___ every question correctly so far.","has answered",["has been answering","answered"]],
      ["We ___ enough money for the trip.","have saved",["have been saving","saved"]],
      ["The company ___ two new branches this year.","has launched",["has been launching","launched"]],
      ["I ___ the entire article today.","have translated",["have been translating","translated"]],
      ["The students ___ all ten exercises.","have solved",["have been solving","solved"]],
      ["He ___ the same mistake twice today.","has made",["has been making","made"]],
      ["We ___ all the chairs for the event.","have arranged",["have been arranging","arranged"]],
      ["She ___ five patients this morning.","has examined",["has been examining","examined"]],
      ["The lab ___ every sample in the batch.","has tested",["has been testing","tested"]],
      ["I ___ the whole presentation this afternoon.","have revised",["have been revising","revised"]]
      ]
    },
    "present-perfect-continuous":{
      label:"Present Perfect Continuous",
      focus:"DURATION / ONGOING PROCESS",
      rows:[
      ["She ___ for two hours and she is still at her desk.","has been writing",["has written","wrote"]],
      ["It ___ all morning and the streets are still wet.","has been raining",["has rained","rained"]],
      ["I ___ for the bus since 7:30 and it still has not arrived.","have been waiting",["have waited","waited"]],
      ["They ___ the building since March and the work is not finished.","have been renovating",["have renovated","renovated"]],
      ["He ___ Spanish for three years and still takes classes every week.","has been learning",["has learned","learned"]],
      ["We ___ on this project all week and we are not done yet.","have been working",["have worked","worked"]],
      ["She ___ since dawn and her shoes are covered in mud.","has been hiking",["has hiked","hiked"]],
      ["The baby ___ for twenty minutes and is still asleep.","has been sleeping",["has slept","slept"]],
      ["My hands are dirty because I ___ in the garden.","have been working",["have worked","worked"]],
      ["You look exhausted. You ___ all afternoon.","have been studying",["have studied","studied"]],
      ["He ___ the piano since breakfast and he is still practicing.","has been playing",["has played","played"]],
      ["They ___ for the exam for the past month and continue every evening.","have been preparing",["have prepared","prepared"]],
      ["The children ___ outside for hours and they are still there.","have been playing",["have played","played"]],
      ["I ___ to call you since lunch and I still cannot reach you.","have been trying",["have tried","tried"]],
      ["She ___ the same chapter for an hour and has not finished it.","has been reading",["has read","read"]],
      ["The workers ___ the road all day and traffic is still blocked.","have been repairing",["have repaired","repaired"]],
      ["We ___ this issue since Monday and still need a solution.","have been discussing",["have discussed","discussed"]],
      ["He ___ for the marathon since January and continues to train daily.","has been training",["has trained","trained"]],
      ["The dog ___ at the door for several minutes and has not stopped.","has been scratching",["has scratched","scratched"]],
      ["I ___ these boxes since 9 a.m. and there are still many left.","have been moving",["have moved","moved"]],
      ["She ___ patients continuously since the clinic opened this morning.","has been seeing",["has seen","saw"]],
      ["They ___ the software all week and bugs are still appearing.","have been testing",["have tested","tested"]],
      ["We ___ the house since early morning and two rooms are still messy.","have been cleaning",["have cleaned","cleaned"]],
      ["He ___ questions for nearly an hour and the interview is still going on.","has been answering",["has answered","answered"]],
      ["The scientists ___ the signal since midnight and are still monitoring it.","have been tracking",["have tracked","tracked"]]
      ]
    },
    "past-perfect-simple":{
      label:"Past Perfect Simple",
      focus:"COMPLETED BEFORE A PAST POINT",
      rows:[
      ["By the time I arrived, she ___ the report.","had finished",["had been finishing","finished"]],
      ["The movie ___ before we entered the theater.","had started",["had been starting","started"]],
      ["They ___ all the tickets before noon.","had sold",["had been selling","sold"]],
      ["Before the teacher came in, we ___ the activity.","had completed",["had been completing","completed"]],
      ["She ___ three chapters before dinner.","had read",["had been reading","read"]],
      ["By the time the doctor returned, the patient ___.","had left",["had been leaving","left"]],
      ["The team ___ every task before the deadline passed.","had completed",["had been completing","completed"]],
      ["He ___ the door before the storm began.","had locked",["had been locking","locked"]],
      ["Before the interview, she ___ all the required forms.","had submitted",["had been submitting","submitted"]],
      ["They ___ five houses before the market slowed down.","had built",["had been building","built"]],
      ["I ___ the message before my phone died.","had sent",["had been sending","sent"]],
      ["By the time the guests arrived, we ___ dinner.","had prepared",["had been preparing","prepared"]],
      ["She ___ two exams before lunch.","had taken",["had been taking","took"]],
      ["The company ___ the new policy before the audit began.","had approved",["had been approving","approved"]],
      ["We ___ all the evidence before the meeting started.","had reviewed",["had been reviewing","reviewed"]],
      ["He ___ the final goal before the referee ended the match.","had scored",["had been scoring","scored"]],
      ["By 6 p.m., the lab ___ every sample.","had processed",["had been processing","processed"]],
      ["Before the power failed, I ___ the document.","had saved",["had been saving","saved"]],
      ["The students ___ all twenty questions before time ran out.","had answered",["had been answering","answered"]],
      ["She ___ the room before the visitors arrived.","had cleaned",["had been cleaning","cleaned"]],
      ["By the time the store closed, we ___ everything we needed.","had bought",["had been buying","bought"]],
      ["He ___ four calls before the meeting began.","had made",["had been making","made"]],
      ["Before the flight, they ___ their bags.","had packed",["had been packing","packed"]],
      ["The nurse ___ the medication before the doctor checked the chart.","had administered",["had been administering","administered"]],
      ["By the time the bell rang, I ___ the last paragraph.","had written",["had been writing","wrote"]]
      ]
    },
    "past-perfect-continuous":{
      label:"Past Perfect Continuous",
      focus:"DURATION BEFORE A PAST POINT",
      rows:[
      ["When the bus finally arrived, we ___ for forty minutes and were still in line.","had been waiting",["had waited","waited"]],
      ["She was exhausted because she ___ for hours before the exam.","had been studying",["had studied","studied"]],
      ["Before the rain stopped, it ___ all morning.","had been raining",["had rained","rained"]],
      ["When the manager arrived, they ___ the problem for nearly an hour.","had been discussing",["had discussed","discussed"]],
      ["His clothes were muddy because he ___ in the garden before dinner.","had been working",["had worked","worked"]],
      ["When the car broke down, we ___ for six hours without a long stop.","had been driving",["had driven","drove"]],
      ["Before the coach ended practice, the team ___ since sunrise.","had been training",["had trained","trained"]],
      ["Her eyes hurt because she ___ the screen for hours.","had been staring at",["had stared at","stared at"]],
      ["When I called, he ___ on the same report all afternoon.","had been working",["had worked","worked"]],
      ["The streets were flooded because it ___ since midnight.","had been raining",["had rained","rained"]],
      ["Before she changed jobs, she ___ there for seven years without a break.","had been working",["had worked","worked"]],
      ["When the nurse checked again, the baby ___ for nearly an hour.","had been sleeping",["had slept","slept"]],
      ["They were out of breath because they ___ up the hill.","had been running",["had run","ran"]],
      ["Before the lights came back, we ___ in the dark for twenty minutes.","had been sitting",["had sat","sat"]],
      ["When the teacher entered, the students ___ about the answer for several minutes.","had been arguing",["had argued","argued"]],
      ["His hands were shaking because he ___ the heavy machine all morning.","had been operating",["had operated","operated"]],
      ["Before the café closed, we ___ there since 6 p.m.","had been talking",["had talked","talked"]],
      ["When the storm hit, the workers ___ the roof since dawn.","had been repairing",["had repaired","repaired"]],
      ["She was frustrated because she ___ the same error for days.","had been investigating",["had investigated","investigated"]],
      ["Before the doctor arrived, the family ___ anxiously for over an hour.","had been waiting",["had waited","waited"]],
      ["When the whistle blew, the players ___ at full speed for several minutes.","had been running",["had run","ran"]],
      ["The ground was dusty because the wind ___ strongly all afternoon.","had been blowing",["had blown","blew"]],
      ["Before he finally answered, I ___ his number again and again for ten minutes.","had been dialing",["had dialed","dialed"]],
      ["When the server crashed, the team ___ it continuously since early morning.","had been monitoring",["had monitored","monitored"]],
      ["Her voice was tired because she ___ presentations all day before the final session.","had been giving",["had given","gave"]]
      ]
    },
    "future-perfect-simple":{
      label:"Future Perfect Simple",
      focus:"COMPLETED BY A FUTURE DEADLINE",
      rows:[
      ["By Friday, I ___ the project.","will have finished",["will have been finishing","will finish"]],
      ["By noon tomorrow, they ___ the shipment.","will have received",["will have been receiving","will receive"]],
      ["By next June, she ___ from college.","will have graduated",["will have been graduating","will graduate"]],
      ["Before you arrive, we ___ the first phase.","will have completed",["will have been completing","will complete"]],
      ["By the end of the week, the team ___ the analysis.","will have finished",["will have been finishing","will finish"]],
      ["By 2030, the city ___ the new hospital.","will have completed",["will have been completing","will complete"]],
      ["Before the exam starts, she ___ every chapter.","will have read",["will have been reading","will read"]],
      ["By tonight, I ___ all my emails.","will have answered",["will have been answering","will answer"]],
      ["By next month, they ___ three new branches.","will have opened",["will have been opening","will open"]],
      ["Before the guests arrive, we ___ dinner.","will have prepared",["will have been preparing","will prepare"]],
      ["By 5 p.m., the lab ___ all the samples.","will have processed",["will have been processing","will process"]],
      ["By the end of the semester, the class ___ ten units.","will have completed",["will have been completing","will complete"]],
      ["Before the meeting begins, he ___ the final report.","will have submitted",["will have been submitting","will submit"]],
      ["By next year, she ___ enough money for the trip.","will have saved",["will have been saving","will save"]],
      ["By midnight, the team ___ every test.","will have run",["will have been running","will run"]],
      ["Before the store closes, we ___ everything on the list.","will have bought",["will have been buying","will buy"]],
      ["By the time the doctor returns, the nurse ___ the medication.","will have administered",["will have been administering","will administer"]],
      ["By tomorrow evening, I ___ the entire presentation.","will have revised",["will have been revising","will revise"]],
      ["Before the deadline, they ___ all twenty forms.","will have submitted",["will have been submitting","will submit"]],
      ["By the end of the day, he ___ five interviews.","will have completed",["will have been completing","will complete"]],
      ["By Saturday, we ___ the whole house.","will have painted",["will have been painting","will paint"]],
      ["Before class begins, she ___ all the exercises.","will have solved",["will have been solving","will solve"]],
      ["By next quarter, the company ___ two new products.","will have launched",["will have been launching","will launch"]],
      ["By 8 p.m., I ___ the final chapter.","will have written",["will have been writing","will write"]],
      ["Before the results are announced, the judges ___ every entry.","will have reviewed",["will have been reviewing","will review"]]
      ]
    },
    "future-perfect-continuous":{
      label:"Future Perfect Continuous",
      focus:"DURATION UP TO A FUTURE POINT",
      rows:[
      ["By next July, she ___ here for ten years and will still be teaching.","will have been teaching",["will have taught","will teach"]],
      ["At noon, we ___ for three hours and may still be in line.","will have been waiting",["will have waited","will wait"]],
      ["By the concert, he ___ this piece for six months and will keep practicing.","will have been practicing",["will have practiced","will practice"]],
      ["By midnight, I ___ for six hours and will still have one chapter left.","will have been studying",["will have studied","will study"]],
      ["By next semester, Mr. Lee ___ this course for five years and will continue.","will have been teaching",["will have taught","will teach"]],
      ["By Friday, we ___ this system for two weeks and the trial will still be active.","will have been using",["will have used","will use"]],
      ["By 2030, they ___ in this city for twenty years and still plan to stay.","will have been living",["will have lived","will live"]],
      ["At the finish line, she ___ for nearly four hours.","will have been running",["will have run","will run"]],
      ["By the time the airport reopens, travelers ___ since early morning.","will have been waiting",["will have waited","will wait"]],
      ["By next month, the team ___ on the redesign for a full year and will still be refining it.","will have been working",["will have worked","will work"]],
      ["By sunset, the workers ___ the road for nine hours and will not be finished yet.","will have been repairing",["will have repaired","will repair"]],
      ["By January, I ___ Spanish for three years and will still attend weekly classes.","will have been learning",["will have learned","will learn"]],
      ["By noon tomorrow, the scientists ___ the signal for twelve hours continuously.","will have been monitoring",["will have monitored","will monitor"]],
      ["By the end of the shift, she ___ patients for eight hours with almost no break.","will have been seeing",["will have seen","will see"]],
      ["By next spring, they ___ the bridge for eighteen months and construction will continue.","will have been building",["will have built","will build"]],
      ["By 10 p.m., we ___ for the results for five hours and may still know nothing.","will have been waiting",["will have waited","will wait"]],
      ["By the tournament, he ___ every morning for six months and will keep training.","will have been training",["will have trained","will train"]],
      ["By next week, I ___ from home for a month and the arrangement will continue.","will have been working",["will have worked","will work"]],
      ["By dawn, it ___ for ten hours and the forecast says it will continue.","will have been raining",["will have rained","will rain"]],
      ["By the end of June, she ___ the same research question for two years and will continue.","will have been studying",["will have studied","will study"]],
      ["By 6 p.m., the technicians ___ the network for twelve hours without finishing the upgrade.","will have been testing",["will have tested","will test"]],
      ["By next Monday, we ___ in temporary offices for three weeks and will still be there.","will have been working",["will have worked","will work"]],
      ["By the final rehearsal, they ___ together for four months and still have more practice planned.","will have been rehearsing",["will have rehearsed","will rehearse"]],
      ["By lunchtime, he ___ calls since 7 a.m. and will still have more to make.","will have been making",["will have made","will make"]],
      ["By the end of the night, the team ___ the system continuously for sixteen hours and will keep watching it.","will have been monitoring",["will have monitored","will monitor"]]
      ]
    }
  };

  const PREFIX={
  "present-perfect-simple": "pps",
  "present-perfect-continuous": "ppc",
  "past-perfect-simple": "pas",
  "past-perfect-continuous": "pac",
  "future-perfect-simple": "fps",
  "future-perfect-continuous": "fpc"
};

  function tierForIndex(index){
    if(index<8)return 'easy';
    if(index<17)return 'medium';
    return 'hard';
  }

  const ITEMS=Object.entries(GROUPS).flatMap(([group,cfg])=>
    cfg.rows.map(([text,correct,distractors],index)=>({
      id:(PREFIX[group]||'pr')+String(index+1).padStart(2,'0'),
      tier:tierForIndex(index),
      group,
      grammarLabel:cfg.label,
      focus:cfg.focus,
      text,
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

  function createChallenge(template,{difficulty='medium',distractorCount=2,random=Math.random}={}){
    const correctAnswers=unique(template.correctAnswers);
    const distractors=shuffled(
      unique(template.distractors).filter(v=>!correctAnswers.some(c=>c.toLowerCase()===v.toLowerCase())),
      random
    ).slice(0,Math.max(1,Math.floor(distractorCount||2)));
    return {
      id:template.id,
      level:4,
      mode:'perfect-run',
      tier:template.tier,
      group:template.group,
      grammarLabel:template.grammarLabel,
      focus:template.focus,
      text:template.text,
      timeExpressions:[],
      cue:template.focus,
      correctAnswer:correctAnswers[0],
      correctAnswers,
      distractors,
      difficulty
    };
  }

  function buildAnswerSequence(challenge,{random=Math.random,distractorCount=2}={}){
    const amount=Math.max(1,Math.min(challenge.distractors.length,Math.floor(distractorCount||2)));
    return shuffled([
      ...challenge.distractors.slice(0,amount).map(value=>({value,correct:false})),
      ...challenge.correctAnswers.map(value=>({value,correct:true}))
    ],random);
  }

  // Balance each 20-question run across all six Perfect forms before repeating.
  function buildRound(count=20,{difficulty='medium',distractorCount=2,random=Math.random}={}){
    const tier=['easy','medium','hard'].includes(difficulty)?difficulty:'medium';
    const groupNames=shuffled(Object.keys(GROUPS),random);
    const buckets=new Map(groupNames.map(group=>[
      group,
      shuffled(ITEMS.filter(item=>item.tier===tier&&item.group===group),random)
    ]));
    const selected=[];
    let pass=0;
    while(selected.length<count){
      let added=false;
      const order=pass%2===0?groupNames:[...groupNames].reverse();
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

  const api={ITEMS,GROUPS,createChallenge,buildAnswerSequence,buildRound,shuffled};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.VerbRunnerPerfectRunBank=api;
})(typeof window!=='undefined'?window:globalThis);
