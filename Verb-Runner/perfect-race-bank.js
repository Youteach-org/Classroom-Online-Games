(function(global){
  const GROUPS={
    "present-perfect-simple":{
      label:"Present Perfect Simple",
      focus:"RESULT / COMPLETED AMOUNT",
      rows:[
      ["She ___ three reports, and all three are ready for review now.","has written",["has been writing","had written"]],
      ["We ___ Oaxaca twice, and both trips are still among our favorite memories.","have visited",["have been visiting","had visited"]],
      ["The class ___ six chapters, and the teacher is ready to start chapter seven.","has completed",["has been completing","had completed"]],
      ["I ___ all my emails, so my inbox is empty now.","have answered",["have been answering","had answered"]],
      ["He ___ two awards, and both trophies are on his desk.","has won",["has been winning","had won"]],
      ["They ___ five new stores, and all five are operating now.","have opened",["have been opening","had opened"]],
      ["Maya ___ four books, and she can discuss all four in class.","has read",["has been reading","had read"]],
      ["The mechanic ___ three cars, and all three are ready for pickup.","has repaired",["has been repairing","had repaired"]],
      ["We ___ every item on the checklist, so the inspection can begin.","have checked",["have been checking","had checked"]],
      ["She ___ the final version, so the editor can review it now.","has submitted",["has been submitting","had submitted"]],
      ["I ___ that movie three times, so I know almost every scene.","have seen",["have been seeing","had seen"]],
      ["The team ___ all its goals, so the project can close successfully.","has reached",["has been reaching","had reached"]],
      ["He ___ ten kilometers, and his tracker shows 10.0 km.","has run",["has been running","had run"]],
      ["They ___ the kitchen completely, so it is ready to use now.","have cleaned",["have been cleaning","had cleaned"]],
      ["Our group ___ four experiments, and the results are ready to compare.","has finished",["has been finishing","had finished"]],
      ["She ___ every question correctly, so her score is 100%.","has answered",["has been answering","had answered"]],
      ["We ___ enough money for the trip, so we can book the tickets now.","have saved",["have been saving","had saved"]],
      ["The company ___ two new branches, and both are open now.","has launched",["has been launching","had launched"]],
      ["I ___ the entire article, so the translation is ready to submit.","have translated",["have been translating","had translated"]],
      ["The students ___ all ten exercises, so they can move to the next activity.","have solved",["have been solving","had solved"]],
      ["He ___ the same mistake twice, and both errors are marked in red.","has made",["has been making","had made"]],
      ["We ___ all the chairs, so the room is ready for the event.","have arranged",["have been arranging","had arranged"]],
      ["She ___ five patients, and all five charts are complete.","has examined",["has been examining","had examined"]],
      ["The lab ___ every sample, so the results are available now.","has tested",["has been testing","had tested"]],
      ["I ___ the whole presentation, so the final file is ready now.","have revised",["have been revising","had revised"]]
      ]
    },
    "present-perfect-continuous":{
      label:"Present Perfect Continuous",
      focus:"DURATION / ONGOING PROCESS",
      rows:[
      ["She ___ for two hours, and she is still writing.","has been writing",["has written","had been writing"]],
      ["It ___ for hours, and it is still raining.","has been raining",["has rained","had been raining"]],
      ["I ___ for the bus since 7:30, and I am still at the stop.","have been waiting",["have waited","had been waiting"]],
      ["They ___ the building since March, and the work is still in progress.","have been renovating",["have renovated","had been renovating"]],
      ["He ___ Spanish for three years, and he is still taking classes.","has been learning",["has learned","had been learning"]],
      ["We ___ on this project all week, and we are still working on it.","have been working",["have worked","had been working"]],
      ["She ___ since dawn, and she is still on the trail.","has been hiking",["has hiked","had been hiking"]],
      ["The baby ___ for twenty minutes and is still asleep.","has been sleeping",["has slept","had been sleeping"]],
      ["I ___ in the garden, and I am still covered in dirt.","have been working",["have worked","had been working"]],
      ["You ___ all afternoon, and you are still studying.","have been studying",["have studied","had been studying"]],
      ["He ___ the piano since breakfast, and he is still practicing.","has been playing",["has played","had been playing"]],
      ["They ___ for the exam for a month, and they are still preparing.","have been preparing",["have prepared","had been preparing"]],
      ["The children ___ outside for hours, and they are still playing.","have been playing",["have played","had been playing"]],
      ["I ___ to call you since lunch, and I still cannot reach you.","have been trying",["have tried","had been trying"]],
      ["She ___ the same chapter for an hour, and she is still reading it.","has been reading",["has read","had been reading"]],
      ["The workers ___ the road all day, and they are still working on it.","have been repairing",["have repaired","had been repairing"]],
      ["We ___ this issue since Monday, and the discussion is still going on.","have been discussing",["have discussed","had been discussing"]],
      ["He ___ for the marathon since January, and he is still training every day.","has been training",["has trained","had been training"]],
      ["The dog ___ at the door for several minutes and has not stopped.","has been scratching",["has scratched","had been scratching"]],
      ["I ___ these boxes since 9 a.m., and there are still many left to move.","have been moving",["have moved","had been moving"]],
      ["She ___ patients continuously since the clinic opened, and she is still seeing patients now.","has been seeing",["has seen","had been seeing"]],
      ["They ___ the software all week, and testing is still in progress.","have been testing",["have tested","had been testing"]],
      ["We ___ the house since early morning, and we are still cleaning it.","have been cleaning",["have cleaned","had been cleaning"]],
      ["He ___ questions for nearly an hour, and the interview is still going on.","has been answering",["has answered","had been answering"]],
      ["The scientists ___ the signal since midnight, and they are still monitoring it.","have been tracking",["have tracked","had been tracking"]]
      ]
    },
    "past-perfect-simple":{
      label:"Past Perfect Simple",
      focus:"COMPLETED BEFORE A PAST POINT",
      rows:[
      ["When I arrived, she ___ the report, so she was already free.","had finished",["had been finishing","has finished"]],
      ["When we entered the theater, the movie ___, so we missed the opening scene.","had started",["had been starting","has started"]],
      ["When the afternoon shift began, they ___ all the tickets, so none were left.","had sold",["had been selling","have sold"]],
      ["When the teacher came in, we ___ the activity and put our papers on the desk.","had completed",["had been completing","have completed"]],
      ["When dinner started, she ___ three chapters and was ready for chapter four.","had read",["had been reading","has read"]],
      ["When the doctor returned, the patient ___, so the room was empty.","had left",["had been leaving","has left"]],
      ["When the deadline passed, the team ___ every task on the list.","had completed",["had been completing","has completed"]],
      ["When the storm began, he ___ the door, so the house was secure.","had locked",["had been locking","has locked"]],
      ["When the interview started, she ___ all the required forms.","had submitted",["had been submitting","has submitted"]],
      ["When the market slowed down, they ___ five houses and completed the project.","had built",["had been building","have built"]],
      ["When my phone died, I ___ the message and the recipient already had it.","had sent",["had been sending","have sent"]],
      ["When the guests arrived, we ___ dinner and the table was ready.","had prepared",["had been preparing","have prepared"]],
      ["When her advisor arrived after lunch, she ___ two exams already.","had taken",["had been taking","has taken"]],
      ["When the audit began, the company ___ the new policy.","had approved",["had been approving","has approved"]],
      ["When the meeting started, we ___ all the evidence and were ready to discuss it.","had reviewed",["had been reviewing","have reviewed"]],
      ["When the referee ended the match, he ___ the final goal already.","had scored",["had been scoring","has scored"]],
      ["When the supervisor checked at 6 p.m., the lab ___ every sample.","had processed",["had been processing","has processed"]],
      ["When the power failed, I ___ the document, so the latest copy was safe.","had saved",["had been saving","have saved"]],
      ["When time ran out, the students ___ all twenty questions.","had answered",["had been answering","have answered"]],
      ["When the visitors arrived, she ___ the room and it looked spotless.","had cleaned",["had been cleaning","has cleaned"]],
      ["When the store closed, we ___ everything we needed.","had bought",["had been buying","have bought"]],
      ["When the meeting began, he ___ four calls and could focus on the discussion.","had made",["had been making","has made"]],
      ["When the taxi arrived for the airport, they ___ their bags already.","had packed",["had been packing","have packed"]],
      ["When the doctor checked the chart, the nurse ___ the medication.","had administered",["had been administering","has administered"]],
      ["When the bell rang, I ___ the last paragraph already.","had written",["had been writing","have written"]]
      ]
    },
    "past-perfect-continuous":{
      label:"Past Perfect Continuous",
      focus:"DURATION BEFORE A PAST POINT",
      rows:[
      ["When the bus finally arrived, we ___ for forty minutes and were still in line.","had been waiting",["had waited","have been waiting"]],
      ["When the exam began, she was exhausted because she ___ for hours.","had been studying",["had studied","has been studying"]],
      ["When the rain stopped, it ___ all morning.","had been raining",["had rained","has been raining"]],
      ["When the manager arrived, they ___ the problem for nearly an hour and were still talking.","had been discussing",["had discussed","have been discussing"]],
      ["Before dinner, his clothes were muddy because he ___ in the garden for hours.","had been working",["had worked","has been working"]],
      ["When the car broke down, we ___ for six hours without a long stop.","had been driving",["had driven","have been driving"]],
      ["When the coach ended practice, the team ___ since sunrise.","had been training",["had trained","has been training"]],
      ["Her eyes were sore because she ___ at the screen for hours before the meeting.","had been staring",["had stared","has been staring"]],
      ["When I called, he ___ on the same report all afternoon and was still working on it.","had been working",["had worked","has been working"]],
      ["When we went outside, the streets were flooded because it ___ since midnight.","had been raining",["had rained","has been raining"]],
      ["Before she changed jobs, she ___ there for seven years without a break.","had been working",["had worked","has been working"]],
      ["When the nurse checked again, the baby ___ for nearly an hour and was still asleep.","had been sleeping",["had slept","has been sleeping"]],
      ["They were out of breath because they ___ up the hill for several minutes.","had been running",["had run","have been running"]],
      ["When the lights came back, we ___ in the dark for twenty minutes.","had been sitting",["had sat","have been sitting"]],
      ["When the teacher entered, the students ___ about the answer for several minutes.","had been arguing",["had argued","have been arguing"]],
      ["His hands were shaking because he ___ the heavy machine all morning before the break.","had been operating",["had operated","has been operating"]],
      ["When the café closed, we ___ there since 6 p.m. and were still mid-conversation.","had been talking",["had talked","have been talking"]],
      ["When the storm hit, the workers ___ the roof since dawn.","had been repairing",["had repaired","have been repairing"]],
      ["She was frustrated because she ___ the same error for days and still had no solution.","had been investigating",["had investigated","has been investigating"]],
      ["When the doctor arrived, the family ___ anxiously for over an hour.","had been waiting",["had waited","has been waiting"]],
      ["When the whistle blew, the players ___ at full speed for several minutes.","had been running",["had run","have been running"]],
      ["The ground was dusty because the wind ___ strongly all afternoon before sunset.","had been blowing",["had blown","has been blowing"]],
      ["When he finally answered, I ___ his number again and again for ten minutes.","had been dialing",["had dialed","have been dialing"]],
      ["When the server crashed, the team ___ it continuously since early morning.","had been monitoring",["had monitored","has been monitoring"]],
      ["When the final session began, her voice was tired because she ___ presentations all day.","had been giving",["had given","has been giving"]]
      ]
    },
    "future-perfect-simple":{
      label:"Future Perfect Simple",
      focus:"COMPLETED BEFORE A FUTURE POINT",
      rows:[
      ["When the deadline arrives next Friday, I ___ the project.","will have finished",["will have been finishing","have finished"]],
      ["When the warehouse opens tomorrow afternoon, they ___ the shipment.","will have received",["will have been receiving","have received"]],
      ["When we meet next June, she ___ from college.","will have graduated",["will have been graduating","has graduated"]],
      ["When you arrive tomorrow, we ___ the first phase.","will have completed",["will have been completing","have completed"]],
      ["When the client calls at the end of next week, the team ___ the analysis.","will have finished",["will have been finishing","has finished"]],
      ["When 2030 begins, the city ___ the new hospital.","will have completed",["will have been completing","has completed"]],
      ["When the exam starts tomorrow, she ___ every chapter.","will have read",["will have been reading","has read"]],
      ["When I go to bed tonight, I ___ all my emails.","will have answered",["will have been answering","have answered"]],
      ["When the board meets next month, they ___ three new branches.","will have opened",["will have been opening","have opened"]],
      ["When the guests arrive tonight, we ___ dinner.","will have prepared",["will have been preparing","have prepared"]],
      ["When the supervisor checks at 5 p.m. tomorrow, the lab ___ all the samples.","will have processed",["will have been processing","has processed"]],
      ["When the semester ends next month, the class ___ ten units.","will have completed",["will have been completing","has completed"]],
      ["When the meeting begins tomorrow morning, he ___ the final report.","will have submitted",["will have been submitting","has submitted"]],
      ["When next year begins, she ___ enough money for the trip.","will have saved",["will have been saving","has saved"]],
      ["When the clock strikes midnight tonight, the team ___ every test.","will have run",["will have been running","has run"]],
      ["When the store closes tonight, we ___ everything on the list.","will have bought",["will have been buying","have bought"]],
      ["When the doctor returns this afternoon, the nurse ___ the medication.","will have administered",["will have been administering","has administered"]],
      ["When we meet tomorrow evening, I ___ the entire presentation.","will have revised",["will have been revising","have revised"]],
      ["When the deadline arrives tomorrow, they ___ all twenty forms.","will have submitted",["will have been submitting","have submitted"]],
      ["When the office closes later today, he ___ five interviews.","will have completed",["will have been completing","has completed"]],
      ["When the guests arrive next Saturday morning, we ___ the whole house.","will have painted",["will have been painting","have painted"]],
      ["When class begins tomorrow, she ___ all the exercises.","will have solved",["will have been solving","has solved"]],
      ["When the next quarter begins, the company ___ two new products.","will have launched",["will have been launching","has launched"]],
      ["When you call me at 8 p.m. tonight, I ___ the final chapter.","will have written",["will have been writing","have written"]],
      ["When the results are announced tomorrow, the judges ___ every entry.","will have reviewed",["will have been reviewing","have reviewed"]]
      ]
    },
    "future-perfect-continuous":{
      label:"Future Perfect Continuous",
      focus:"DURATION UP TO A FUTURE POINT",
      rows:[
      ["When next July begins, she ___ here for ten years and will still be teaching.","will have been teaching",["will have taught","has been teaching"]],
      ["At noon tomorrow, we ___ for three hours and will still be in line.","will have been waiting",["will have waited","have been waiting"]],
      ["When the concert starts next Saturday, he ___ this piece for six months and will still be practicing it.","will have been practicing",["will have practiced","has been practicing"]],
      ["At midnight tonight, I ___ for six hours and will still be studying.","will have been studying",["will have studied","have been studying"]],
      ["When next semester begins, Mr. Lee ___ this course for five years and will continue teaching it.","will have been teaching",["will have taught","has been teaching"]],
      ["Next Friday, we ___ this system for two weeks and the trial will still be running.","will have been using",["will have used","have been using"]],
      ["In 2030, they ___ in this city for twenty years and still plan to stay.","will have been living",["will have lived","have been living"]],
      ["When she reaches the finish line tomorrow, she ___ for nearly four hours.","will have been running",["will have run","has been running"]],
      ["When the airport reopens tomorrow afternoon, travelers ___ since early morning and many will still be waiting.","will have been waiting",["will have waited","have been waiting"]],
      ["Next month, the team ___ on the redesign for a full year and will still be refining it.","will have been working",["will have worked","has been working"]],
      ["At sunset tomorrow, the workers ___ the road for nine hours and the work will still be unfinished.","will have been repairing",["will have repaired","have been repairing"]],
      ["Next January, I ___ Spanish for three years and will still be taking classes.","will have been learning",["will have learned","have been learning"]],
      ["Tomorrow at noon, the scientists ___ the signal for twelve hours and will still be monitoring it.","will have been monitoring",["will have monitored","have been monitoring"]],
      ["At the end of tomorrow's shift, she ___ patients for eight hours and will still have patients waiting.","will have been seeing",["will have seen","has been seeing"]],
      ["Next spring, they ___ the bridge for eighteen months and construction will continue.","will have been building",["will have built","have been building"]],
      ["At 10 p.m. tomorrow, we ___ for the results for five hours and may still know nothing.","will have been waiting",["will have waited","have been waiting"]],
      ["When the tournament starts next month, he ___ every morning for six months and will keep training.","will have been training",["will have trained","has been training"]],
      ["Next week, I ___ from home for a month and the arrangement will continue.","will have been working",["will have worked","have been working"]],
      ["Tomorrow at dawn, it ___ for ten hours and the forecast says it will continue.","will have been raining",["will have rained","has been raining"]],
      ["At the end of next June, she ___ the same research question for two years and will continue.","will have been studying",["will have studied","has been studying"]],
      ["Tomorrow at 6 p.m., the technicians ___ the network for twelve hours and the upgrade will still be unfinished.","will have been testing",["will have tested","have been testing"]],
      ["Next Monday, we ___ in temporary offices for three weeks and will still be there.","will have been working",["will have worked","have been working"]],
      ["At the final rehearsal next month, they ___ together for four months and will still have more practice ahead.","will have been rehearsing",["will have rehearsed","have been rehearsing"]],
      ["At lunchtime tomorrow, he ___ calls since 7 a.m. and will still have more to make.","will have been making",["will have made","has been making"]],
      ["At the end of tomorrow night, the team ___ the system for sixteen hours and will continue watching it.","will have been monitoring",["will have monitored","has been monitoring"]]
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
