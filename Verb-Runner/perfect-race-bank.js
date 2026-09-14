(function(global){
  const GROUPS={
    "present-perfect-simple":{
      label:"Present Perfect Simple",
      focus:"RESULT / COMPLETED AMOUNT",
      rows:[
      ["She ___ three reports today.","has written",["has been writing","had written"]],
      ["We ___ Oaxaca twice this year.","have visited",["have been visiting","had visited"]],
      ["The class ___ six chapters so far.","has completed",["has been completing","had completed"]],
      ["I ___ all my emails so far today.","have answered",["have been answering","had answered"]],
      ["He ___ two awards so far this year.","has won",["has been winning","had won"]],
      ["They ___ five new stores so far this month.","have opened",["have been opening","had opened"]],
      ["Maya ___ four books so far this semester.","has read",["has been reading","had read"]],
      ["The mechanic ___ three cars so far today.","has repaired",["has been repairing","had repaired"]],
      ["We ___ every item on the checklist, so the inspection can begin.","have checked",["have been checking","had checked"]],
      ["She ___ the final version already.","has submitted",["has been submitting","had submitted"]],
      ["I ___ that movie three times so far.","have seen",["have been seeing","had seen"]],
      ["The team ___ all its goals this quarter.","has reached",["has been reaching","had reached"]],
      ["He ___ ten kilometers today.","has run",["has been running","had run"]],
      ["They ___ the kitchen completely, so it is ready now.","have cleaned",["have been cleaning","had cleaned"]],
      ["Our group ___ four experiments this week.","has finished",["has been finishing","had finished"]],
      ["She ___ every question correctly so far.","has answered",["has been answering","had answered"]],
      ["We ___ enough money for the trip, so we can book it now.","have saved",["have been saving","had saved"]],
      ["The company ___ two new branches this year.","has launched",["has been launching","had launched"]],
      ["I ___ the entire article today.","have translated",["have been translating","had translated"]],
      ["The students ___ all ten exercises.","have solved",["have been solving","had solved"]],
      ["He ___ the same mistake twice today.","has made",["has been making","had made"]],
      ["We ___ all the chairs for the event, so the room is ready now.","have arranged",["have been arranging","had arranged"]],
      ["She ___ five patients so far this morning.","has examined",["has been examining","had examined"]],
      ["The lab ___ every sample in the batch, so the results are ready now.","has tested",["has been testing","had tested"]],
      ["I ___ the whole presentation this afternoon, so it is ready now.","have revised",["have been revising","had revised"]]
      ]
    },
    "present-perfect-continuous":{
      label:"Present Perfect Continuous",
      focus:"DURATION / ONGOING PROCESS",
      rows:[
      ["She ___ for two hours and she is still at her desk.","has been writing",["has written","had been writing"]],
      ["It ___ all morning and the streets are still wet.","has been raining",["has rained","had been raining"]],
      ["I ___ for the bus since 7:30 and it still has not arrived.","have been waiting",["have waited","had been waiting"]],
      ["They ___ the building since March and the work is not finished.","have been renovating",["have renovated","had been renovating"]],
      ["He ___ Spanish for three years and still takes classes every week.","has been learning",["has learned","had been learning"]],
      ["We ___ on this project all week and we are not done yet.","have been working",["have worked","had been working"]],
      ["She ___ since dawn and her shoes are covered in mud.","has been hiking",["has hiked","had been hiking"]],
      ["The baby ___ for twenty minutes and is still asleep.","has been sleeping",["has slept","had been sleeping"]],
      ["My hands are dirty because I ___ in the garden.","have been working",["have worked","had been working"]],
      ["You look exhausted. You ___ all afternoon.","have been studying",["have studied","had been studying"]],
      ["He ___ the piano since breakfast and he is still practicing.","has been playing",["has played","had been playing"]],
      ["They ___ for the exam for the past month and continue every evening.","have been preparing",["have prepared","had been preparing"]],
      ["The children ___ outside for hours and they are still there.","have been playing",["have played","had been playing"]],
      ["I ___ to call you since lunch and I still cannot reach you.","have been trying",["have tried","had been trying"]],
      ["She ___ the same chapter for an hour and has not finished it.","has been reading",["has read","had been reading"]],
      ["The workers ___ the road all day and traffic is still blocked.","have been repairing",["have repaired","had been repairing"]],
      ["We ___ this issue since Monday and still need a solution.","have been discussing",["have discussed","had been discussing"]],
      ["He ___ for the marathon since January and continues to train daily.","has been training",["has trained","had been training"]],
      ["The dog ___ at the door for several minutes and has not stopped.","has been scratching",["has scratched","had been scratching"]],
      ["I ___ these boxes since 9 a.m. and there are still many left.","have been moving",["have moved","had been moving"]],
      ["She ___ patients continuously since the clinic opened this morning.","has been seeing",["has seen","had been seeing"]],
      ["They ___ the software all week and bugs are still appearing.","have been testing",["have tested","had been testing"]],
      ["We ___ the house since early morning and two rooms are still messy.","have been cleaning",["have cleaned","had been cleaning"]],
      ["He ___ questions for nearly an hour and the interview is still going on.","has been answering",["has answered","had been answering"]],
      ["The scientists ___ the signal since midnight and are still monitoring it.","have been tracking",["have tracked","had been tracking"]]
      ]
    },
    "past-perfect-simple":{
      label:"Past Perfect Simple",
      focus:"COMPLETED BEFORE A PAST POINT",
      rows:[
      ["When I arrived, she ___ the report already.","had finished",["had been finishing","will have finished"]],
      ["The movie ___ before we entered the theater.","had started",["had been starting","will have started"]],
      ["When the afternoon shift began, they ___ all the tickets.","had sold",["had been selling","will have sold"]],
      ["Before the teacher came in, we ___ the activity.","had completed",["had been completing","will have completed"]],
      ["When dinner started, she ___ three chapters.","had read",["had been reading","will have read"]],
      ["When the doctor returned, the patient ___ already.","had left",["had been leaving","will have left"]],
      ["The team ___ every task before the deadline passed.","had completed",["had been completing","will have completed"]],
      ["He ___ the door before the storm began.","had locked",["had been locking","will have locked"]],
      ["Before the interview, she ___ all the required forms.","had submitted",["had been submitting","will have submitted"]],
      ["They ___ five houses before the market slowed down.","had built",["had been building","will have built"]],
      ["I ___ the message before my phone died.","had sent",["had been sending","will have sent"]],
      ["The guests arrived after we ___ dinner.","had prepared",["had been preparing","will have prepared"]],
      ["When her advisor arrived after lunch, she ___ two exams already.","had taken",["had been taking","will have taken"]],
      ["The company ___ the new policy before the audit began.","had approved",["had been approving","will have approved"]],
      ["We ___ all the evidence before the meeting started.","had reviewed",["had been reviewing","will have reviewed"]],
      ["He ___ the final goal before the referee ended the match.","had scored",["had been scoring","will have scored"]],
      ["When the supervisor checked at 6 p.m., the lab ___ every sample.","had processed",["had been processing","will have processed"]],
      ["Before the power failed, I ___ the document.","had saved",["had been saving","will have saved"]],
      ["The students ___ all twenty questions before time ran out.","had answered",["had been answering","will have answered"]],
      ["She ___ the room before the visitors arrived.","had cleaned",["had been cleaning","will have cleaned"]],
      ["Before the store closed, we ___ everything we needed.","had bought",["had been buying","will have bought"]],
      ["He ___ four calls before the meeting began.","had made",["had been making","will have made"]],
      ["Before the flight, they ___ their bags.","had packed",["had been packing","will have packed"]],
      ["The nurse ___ the medication before the doctor checked the chart.","had administered",["had been administering","will have administered"]],
      ["When the bell rang, I ___ the last paragraph already.","had written",["had been writing","will have written"]]
      ]
    },
    "past-perfect-continuous":{
      label:"Past Perfect Continuous",
      focus:"DURATION BEFORE A PAST POINT",
      rows:[
      ["When the bus finally arrived, we ___ for forty minutes and were still in line.","had been waiting",["had waited","will have been waiting"]],
      ["She was exhausted because she ___ for hours before the exam.","had been studying",["had studied","will have been studying"]],
      ["Before the rain stopped, it ___ all morning.","had been raining",["had rained","will have been raining"]],
      ["When the manager arrived, they ___ the problem for nearly an hour.","had been discussing",["had discussed","will have been discussing"]],
      ["His clothes were muddy because he ___ in the garden before dinner.","had been working",["had worked","will have been working"]],
      ["When the car broke down, we ___ for six hours without a long stop.","had been driving",["had driven","will have been driving"]],
      ["Before the coach ended practice, the team ___ since sunrise.","had been training",["had trained","will have been training"]],
      ["Her eyes were sore because she ___ the screen for hours.","had been staring at",["had stared at","will have been staring at"]],
      ["When I called, he ___ on the same report all afternoon.","had been working",["had worked","will have been working"]],
      ["The streets were flooded because it ___ since midnight.","had been raining",["had rained","will have been raining"]],
      ["Before she changed jobs, she ___ there for seven years without a break.","had been working",["had worked","will have been working"]],
      ["When the nurse checked again, the baby ___ for nearly an hour.","had been sleeping",["had slept","will have been sleeping"]],
      ["They were out of breath because they ___ up the hill.","had been running",["had run","will have been running"]],
      ["Before the lights came back, we ___ in the dark for twenty minutes.","had been sitting",["had sat","will have been sitting"]],
      ["When the teacher entered, the students ___ about the answer for several minutes.","had been arguing",["had argued","will have been arguing"]],
      ["His hands were shaking because he ___ the heavy machine all morning.","had been operating",["had operated","will have been operating"]],
      ["Before the café closed, we ___ there since 6 p.m.","had been talking",["had talked","will have been talking"]],
      ["When the storm hit, the workers ___ the roof since dawn.","had been repairing",["had repaired","will have been repairing"]],
      ["She was frustrated because she ___ the same error for days.","had been investigating",["had investigated","will have been investigating"]],
      ["Before the doctor arrived, the family ___ anxiously for over an hour.","had been waiting",["had waited","will have been waiting"]],
      ["When the whistle blew, the players ___ at full speed for several minutes.","had been running",["had run","will have been running"]],
      ["The ground was dusty because the wind ___ strongly all afternoon.","had been blowing",["had blown","will have been blowing"]],
      ["Before he finally answered, I ___ his number again and again for ten minutes.","had been dialing",["had dialed","will have been dialing"]],
      ["When the server crashed, the team ___ it continuously since early morning.","had been monitoring",["had monitored","will have been monitoring"]],
      ["Her voice was tired because she ___ presentations all day before the final session.","had been giving",["had given","will have been giving"]]
      ]
    },
    "future-perfect-simple":{
      label:"Future Perfect Simple",
      focus:"COMPLETED BY A FUTURE DEADLINE",
      rows:[
      ["Next Friday is the deadline; I ___ the project before then.","will have finished",["will have been finishing","had finished"]],
      ["When the warehouse opens tomorrow afternoon, they ___ the shipment already.","will have received",["will have been receiving","had received"]],
      ["When we meet next June, she ___ from college already.","will have graduated",["will have been graduating","had graduated"]],
      ["Before you arrive tomorrow, we ___ the first phase.","will have completed",["will have been completing","had completed"]],
      ["When the client calls at the end of next week, the team ___ the analysis already.","will have finished",["will have been finishing","had finished"]],
      ["When 2030 begins, the city ___ the new hospital.","will have completed",["will have been completing","had completed"]],
      ["Before the exam starts tomorrow, she ___ every chapter.","will have read",["will have been reading","had read"]],
      ["Tonight, I ___ all my emails before I go to bed.","will have answered",["will have been answering","had answered"]],
      ["When the board meets next month, they ___ three new branches already.","will have opened",["will have been opening","had opened"]],
      ["Before the guests arrive tonight, we ___ dinner.","will have prepared",["will have been preparing","had prepared"]],
      ["When the supervisor checks at 5 p.m. tomorrow, the lab ___ all the samples already.","will have processed",["will have been processing","had processed"]],
      ["When the semester ends next month, the class ___ ten units already.","will have completed",["will have been completing","had completed"]],
      ["Before the meeting begins tomorrow morning, he ___ the final report.","will have submitted",["will have been submitting","had submitted"]],
      ["When next year begins, she ___ enough money for the trip.","will have saved",["will have been saving","had saved"]],
      ["When the clock strikes midnight tonight, the team ___ every test already.","will have run",["will have been running","had run"]],
      ["Before the store closes tonight, we ___ everything on the list.","will have bought",["will have been buying","had bought"]],
      ["Before the doctor returns this afternoon, the nurse ___ the medication.","will have administered",["will have been administering","had administered"]],
      ["When we meet tomorrow evening, I ___ the entire presentation already.","will have revised",["will have been revising","had revised"]],
      ["Before the deadline tomorrow, they ___ all twenty forms.","will have submitted",["will have been submitting","had submitted"]],
      ["When the office closes later today, he ___ five interviews already.","will have completed",["will have been completing","had completed"]],
      ["When the guests arrive next Saturday morning, we ___ the whole house already.","will have painted",["will have been painting","had painted"]],
      ["Before class begins tomorrow, she ___ all the exercises.","will have solved",["will have been solving","had solved"]],
      ["When the next quarter begins, the company ___ two new products already.","will have launched",["will have been launching","had launched"]],
      ["When you call me at 8 p.m. tonight, I ___ the final chapter already.","will have written",["will have been writing","had written"]],
      ["Before the results are announced tomorrow, the judges ___ every entry.","will have reviewed",["will have been reviewing","had reviewed"]]
      ]
    },
    "future-perfect-continuous":{
      label:"Future Perfect Continuous",
      focus:"DURATION UP TO A FUTURE POINT",
      rows:[
      ["Next July, she ___ here for ten years and will still be teaching.","will have been teaching",["will have taught","had been teaching"]],
      ["At noon tomorrow, we ___ for three hours and may still be in line.","will have been waiting",["will have waited","had been waiting"]],
      ["At the concert next Saturday, he ___ this piece for six months and will keep practicing.","will have been practicing",["will have practiced","had been practicing"]],
      ["At midnight tonight, I ___ for six hours and will still have one chapter left.","will have been studying",["will have studied","had been studying"]],
      ["Next semester, Mr. Lee ___ this course for five years and will continue.","will have been teaching",["will have taught","had been teaching"]],
      ["Next Friday, we ___ this system for two weeks and the trial will still be active.","will have been using",["will have used","had been using"]],
      ["In 2030, they ___ in this city for twenty years and still plan to stay.","will have been living",["will have lived","had been living"]],
      ["When she reaches the finish line tomorrow, she ___ for nearly four hours.","will have been running",["will have run","had been running"]],
      ["When the airport reopens tomorrow afternoon, travelers ___ since early morning.","will have been waiting",["will have waited","had been waiting"]],
      ["Next month, the team ___ on the redesign for a full year and will still be refining it.","will have been working",["will have worked","had been working"]],
      ["At sunset tomorrow, the workers ___ the road for nine hours and will not be finished yet.","will have been repairing",["will have repaired","had been repairing"]],
      ["Next January, I ___ Spanish for three years and will still attend weekly classes.","will have been learning",["will have learned","had been learning"]],
      ["Tomorrow at noon, the scientists ___ the signal for twelve hours continuously.","will have been monitoring",["will have monitored","had been monitoring"]],
      ["At the end of tomorrow's shift, she ___ patients for eight hours with almost no break.","will have been seeing",["will have seen","had been seeing"]],
      ["Next spring, they ___ the bridge for eighteen months and construction will continue.","will have been building",["will have built","had been building"]],
      ["At 10 p.m. tomorrow, we ___ for the results for five hours and may still know nothing.","will have been waiting",["will have waited","had been waiting"]],
      ["When the tournament starts next month, he ___ every morning for six months and will keep training.","will have been training",["will have trained","had been training"]],
      ["Next week, I ___ from home for a month and the arrangement will continue.","will have been working",["will have worked","had been working"]],
      ["Tomorrow at dawn, it ___ for ten hours and the forecast says it will continue.","will have been raining",["will have rained","had been raining"]],
      ["At the end of next June, she ___ the same research question for two years and will continue.","will have been studying",["will have studied","had been studying"]],
      ["Tomorrow at 6 p.m., the technicians ___ the network for twelve hours without finishing the upgrade.","will have been testing",["will have tested","had been testing"]],
      ["Next Monday, we ___ in temporary offices for three weeks and will still be there.","will have been working",["will have worked","had been working"]],
      ["At the final rehearsal next month, they ___ together for four months and still have more practice planned.","will have been rehearsing",["will have rehearsed","had been rehearsing"]],
      ["At lunchtime tomorrow, he ___ calls since 7 a.m. and will still have more to make.","will have been making",["will have made","had been making"]],
      ["At the end of tomorrow night, the team ___ the system continuously for sixteen hours and will keep watching it.","will have been monitoring",["will have monitored","had been monitoring"]]
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
      mode:'perfect-race',
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
  global.VerbRunnerPerfectRaceBank=api;
})(typeof window!=='undefined'?window:globalThis);
