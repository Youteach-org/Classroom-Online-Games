(function(global){
  const COMBOS={
  "easy":[
    {id:"ec01",tier:"easy",text:"Every Monday, the lab ___ its safety equipment before opening.",correctAnswers:["checks"],distractors:["checked","is checking"],focus:"ROUTINE + SCHEDULE",finalCategory:'combo'},
    {id:"ec02",tier:"easy",text:"At 8 last night, I ___ for the exam.",correctAnswers:["was studying"],distractors:["studied","have studied"],focus:"PAST ACTION IN PROGRESS",finalCategory:'combo'},
    {id:"ec03",tier:"easy",text:"I promise I ___ you as soon as I arrive.",correctAnswers:["will call"],distractors:["call","called"],focus:"PROMISE + FUTURE CLAUSE",finalCategory:'combo'},
    {id:"ec04",tier:"easy",text:"She ___ four chapters so far today.",correctAnswers:["has read"],distractors:["has been reading","read"],focus:"COMPLETED AMOUNT + NOW",finalCategory:'combo'},
    {id:"ec05",tier:"easy",text:"He ___ since noon and is still in the waiting room.",correctAnswers:["has been waiting"],distractors:["has waited","waited"],focus:"DURATION + STILL CONTINUING",finalCategory:'combo'},
    {id:"ec06",tier:"easy",text:"By the time the teacher arrived, we ___ the activity.",correctAnswers:["had finished"],distractors:["had been finishing","finished"],focus:"COMPLETED BEFORE A PAST POINT",finalCategory:'combo'},
    {id:"ec07",tier:"easy",text:"When the rain stopped, it ___ for three hours.",correctAnswers:["had been raining"],distractors:["had rained","rained"],focus:"DURATION BEFORE A PAST EVENT",finalCategory:'combo'},
    {id:"ec08",tier:"easy",text:"By Friday, they ___ all ten reports.",correctAnswers:["will have submitted"],distractors:["will have been submitting","submitted"],focus:"COMPLETED BY A FUTURE DEADLINE",finalCategory:'combo'},
    {id:"ec09",tier:"easy",text:"By noon, we ___ for four hours and may still be waiting.",correctAnswers:["will have been waiting"],distractors:["will have waited","will wait"],focus:"DURATION UP TO A FUTURE POINT",finalCategory:'combo'},
    {id:"ec10",tier:"easy",text:"Look at those dark clouds. It ___.",correctAnswers:["is going to rain"],distractors:["rains","rained"],focus:"EVIDENCE-BASED PREDICTION",finalCategory:'combo'},
    {id:"ec11",tier:"easy",text:"You must submit the form ___.",correctAnswers:["by Friday"],distractors:["last Friday","since Friday"],focus:"OBLIGATION + DEADLINE",finalCategory:'combo'},
    {id:"ec12",tier:"easy",text:"Turn off the lights ___.",correctAnswers:["before you leave"],distractors:["after you left yesterday","since you left"],focus:"COMMAND + TIME CLAUSE",finalCategory:'combo'},
    {id:"ec13",tier:"easy",text:"We have lived here ___.",correctAnswers:["since 2021"],distractors:["in 2021","two years ago"],focus:"PAST-TO-NOW STARTING POINT",finalCategory:'combo'},
    {id:"ec14",tier:"easy",text:"She called me ___.",correctAnswers:["two hours ago"],distractors:["for two hours","in two hours"],focus:"FINISHED PAST TIME",finalCategory:'combo'},
    {id:"ec15",tier:"easy",text:"This time tomorrow, we ___ to Mérida.",correctAnswers:["will be flying"],distractors:["flew","have flown"],focus:"ACTION IN PROGRESS IN THE FUTURE",finalCategory:'combo'},
    {id:"ec16",tier:"easy",text:"The team ___ the new system this week.",correctAnswers:["is testing"],distractors:["tests","tested"],focus:"TEMPORARY CURRENT PERIOD",finalCategory:'combo'},
    {id:"ec17",tier:"easy",text:"Maya ___ all twelve chairs, so the room is ready.",correctAnswers:["has arranged"],distractors:["has been arranging","arranged"],focus:"COMPLETED RESULT",finalCategory:'combo'},
    {id:"ec18",tier:"easy",text:"Her hands are dirty because she ___ in the garden all morning.",correctAnswers:["has been working"],distractors:["has worked","worked"],focus:"RECENT ACTIVITY + EVIDENCE",finalCategory:'combo'},
    {id:"ec19",tier:"easy",text:"Before the flight, they ___ their bags.",correctAnswers:["had packed"],distractors:["had been packing","packed"],focus:"RESULT BEFORE A PAST POINT",finalCategory:'combo'},
    {id:"ec20",tier:"easy",text:"By next month, I ___ this course for a year and will continue.",correctAnswers:["will have been taking"],distractors:["will have taken","will take"],focus:"DURATION + FUTURE REFERENCE",finalCategory:'combo'}
  ],
  "medium":[
    {id:"mc01",tier:"medium",text:"I can't answer the door; I ___ dinner at the moment.",correctAnswers:["am cooking"],distractors:["cook","cooked"],focus:"CURRENT ACTION",finalCategory:'combo'},
    {id:"mc02",tier:"medium",text:"When the alarm rang, the technicians ___ the server.",correctAnswers:["were checking"],distractors:["checked","have checked"],focus:"INTERRUPTED PAST ACTION",finalCategory:'combo'},
    {id:"mc03",tier:"medium",text:"The results are in. The team ___ every sample.",correctAnswers:["has tested"],distractors:["has been testing","tested"],focus:"COMPLETED RESULT",finalCategory:'combo'},
    {id:"mc04",tier:"medium",text:"The server is still slow because the team ___ it all morning.",correctAnswers:["has been testing"],distractors:["has tested","tested"],focus:"ONGOING PROCESS + CURRENT EFFECT",finalCategory:'combo'},
    {id:"mc05",tier:"medium",text:"She knew the route because she ___ there many times before.",correctAnswers:["had driven"],distractors:["had been driving","drove"],focus:"REPEATED COMPLETED EXPERIENCE BEFORE PAST",finalCategory:'combo'},
    {id:"mc06",tier:"medium",text:"Her eyes were tired because she ___ the screen for hours before the break.",correctAnswers:["had been watching"],distractors:["had watched","watched"],focus:"DURATION + PAST EVIDENCE",finalCategory:'combo'},
    {id:"mc07",tier:"medium",text:"By the time you get here, I ___ the draft.",correctAnswers:["will have finished"],distractors:["will have been finishing","finished"],focus:"RESULT BY FUTURE POINT",finalCategory:'combo'},
    {id:"mc08",tier:"medium",text:"By the time you get here, I ___ on the draft for six hours.",correctAnswers:["will have been working"],distractors:["will have worked","will work"],focus:"DURATION UP TO FUTURE POINT",finalCategory:'combo'},
    {id:"mc09",tier:"medium",text:"We ___ the museum last Saturday, but we haven't returned since.",correctAnswers:["visited"],distractors:["have visited","were visiting"],focus:"FINISHED PAST + LATER PRESENT REFERENCE",finalCategory:'combo'},
    {id:"mc10",tier:"medium",text:"I ___ the file when I get home.",correctAnswers:["will send"],distractors:["send","sent"],focus:"FUTURE MAIN CLAUSE + PRESENT TIME CLAUSE",finalCategory:'combo'},
    {id:"mc11",tier:"medium",text:"You should stretch ___.",correctAnswers:["before exercising"],distractors:["yesterday morning","since breakfast"],focus:"ADVICE + TIME RELATIONSHIP",finalCategory:'combo'},
    {id:"mc12",tier:"medium",text:"Don't open the package ___.",correctAnswers:["until the teacher tells you"],distractors:["until the teacher told you yesterday","since the teacher told you"],focus:"NEGATIVE COMMAND + FUTURE LIMIT",finalCategory:'combo'},
    {id:"mc13",tier:"medium",text:"The final train leaves ___.",correctAnswers:["at 10:30 tonight"],distractors:["at 10:30 last night","since 10:30"],focus:"SCHEDULE + FUTURE TIME",finalCategory:'combo'},
    {id:"mc14",tier:"medium",text:"She has completed three internships ___.",correctAnswers:["so far"],distractors:["last year","next year"],focus:"ACHIEVEMENT UP TO NOW",finalCategory:'combo'},
    {id:"mc15",tier:"medium",text:"By 6 yesterday, the lab ___ every sample.",correctAnswers:["had processed"],distractors:["had been processing","processed"],focus:"COMPLETED BY PAST DEADLINE",finalCategory:'combo'},
    {id:"mc16",tier:"medium",text:"The room smells like paint because they ___ the walls.",correctAnswers:["have been painting"],distractors:["have painted","painted"],focus:"RECENT PROCESS + PRESENT EVIDENCE",finalCategory:'combo'},
    {id:"mc17",tier:"medium",text:"They ___ five walls already.",correctAnswers:["have painted"],distractors:["have been painting","painted"],focus:"COUNTABLE COMPLETED RESULT",finalCategory:'combo'},
    {id:"mc18",tier:"medium",text:"At 10 tomorrow, the surgeon ___.",correctAnswers:["will be operating"],distractors:["operated","has operated"],focus:"FUTURE ACTION IN PROGRESS",finalCategory:'combo'},
    {id:"mc19",tier:"medium",text:"When I arrived, the meeting ___ already.",correctAnswers:["had started"],distractors:["was starting","started"],focus:"EARLIER PAST COMPLETION",finalCategory:'combo'},
    {id:"mc20",tier:"medium",text:"They are going to launch the service ___.",correctAnswers:["next month"],distractors:["last month","since last month"],focus:"PLANNED FUTURE + TIME",finalCategory:'combo'}
  ],
  "hard":[
    {id:"hc01",tier:"hard",text:"The committee ___ three proposals this morning, and all three are now approved.",correctAnswers:["has reviewed"],distractors:["has been reviewing","reviewed"],focus:"RESULT / QUANTITY",finalCategory:'combo'},
    {id:"hc02",tier:"hard",text:"The committee ___ proposals since 8 a.m.; they still have seven left.",correctAnswers:["has been reviewing"],distractors:["has reviewed","reviewed"],focus:"DURATION / UNFINISHED WORK",finalCategory:'combo'},
    {id:"hc03",tier:"hard",text:"Before the outage, the technicians ___ every backup successfully.",correctAnswers:["had tested"],distractors:["had been testing","tested"],focus:"COMPLETED RESULT BEFORE PAST",finalCategory:'combo'},
    {id:"hc04",tier:"hard",text:"When the system failed, the technicians ___ backups for hours.",correctAnswers:["had been testing"],distractors:["had tested","tested"],focus:"PROCESS BEFORE PAST EVENT",finalCategory:'combo'},
    {id:"hc05",tier:"hard",text:"By release day, the team ___ all critical bugs.",correctAnswers:["will have fixed"],distractors:["will have been fixing","will fix"],focus:"COMPLETED FUTURE RESULT",finalCategory:'combo'},
    {id:"hc06",tier:"hard",text:"By release day, the team ___ the new build for six weeks and will keep monitoring it.",correctAnswers:["will have been testing"],distractors:["will have tested","will test"],focus:"DURATION TO FUTURE POINT",finalCategory:'combo'},
    {id:"hc07",tier:"hard",text:"I didn't recognize the street because the city ___ it completely before I returned.",correctAnswers:["had redesigned"],distractors:["had been redesigning","redesigned"],focus:"COMPLETED CHANGE BEFORE PAST",finalCategory:'combo'},
    {id:"hc08",tier:"hard",text:"Traffic finally returned to normal after the city ___ the avenue for months.",correctAnswers:["had been rebuilding"],distractors:["had rebuilt","rebuilt"],focus:"EXTENDED PROCESS BEFORE PAST RESULT",finalCategory:'combo'},
    {id:"hc09",tier:"hard",text:"She ___ in four different departments since joining the hospital.",correctAnswers:["has worked"],distractors:["has been working","worked"],focus:"COUNTABLE EXPERIENCE TO NOW",finalCategory:'combo'},
    {id:"hc10",tier:"hard",text:"She ___ in cardiology since January and is still there.",correctAnswers:["has been working"],distractors:["has worked","worked"],focus:"ONGOING DURATION TO NOW",finalCategory:'combo'},
    {id:"hc11",tier:"hard",text:"When you call at noon, I ___ with clients.",correctAnswers:["will be meeting"],distractors:["met","have met"],focus:"ACTION IN PROGRESS AT FUTURE TIME",finalCategory:'combo'},
    {id:"hc12",tier:"hard",text:"I ___ you the figures once accounting confirms them.",correctAnswers:["will send"],distractors:["sent","have sent"],focus:"FUTURE RESULT AFTER PRESENT CLAUSE",finalCategory:'combo'},
    {id:"hc13",tier:"hard",text:"You may use the lab ___.",correctAnswers:["during supervised hours"],distractors:["last night","since yesterday"],focus:"PERMISSION + VALID TIME WINDOW",finalCategory:'combo'},
    {id:"hc14",tier:"hard",text:"Do not disconnect the device ___.",correctAnswers:["until the update is complete"],distractors:["until the update was complete yesterday","since the update completed"],focus:"COMMAND + FUTURE CONDITION",finalCategory:'combo'},
    {id:"hc15",tier:"hard",text:"The final bus leaves ___.",correctAnswers:["at 11 tonight"],distractors:["at 11 last night","since 11"],focus:"FUTURE SCHEDULE EXPRESSED IN PRESENT",finalCategory:'combo'},
    {id:"hc16",tier:"hard",text:"No one has solved the issue ___.",correctAnswers:["yet"],distractors:["yesterday","next week"],focus:"UNFINISHED PRESENT PERFECT",finalCategory:'combo'},
    {id:"hc17",tier:"hard",text:"The patient had left ___.",correctAnswers:["by the time the doctor returned"],distractors:["by the time the doctor returns tomorrow","every time the doctor returns"],focus:"EARLIER PAST RELATIONSHIP",finalCategory:'combo'},
    {id:"hc18",tier:"hard",text:"By next July, she will have been teaching here ___.",correctAnswers:["for ten years"],distractors:["ten years ago","every ten years"],focus:"DURATION TO FUTURE POINT",finalCategory:'combo'},
    {id:"hc19",tier:"hard",text:"The report was ready because she ___ it before the meeting.",correctAnswers:["had completed"],distractors:["had been completing","completed"],focus:"RESULT BEFORE PAST REFERENCE",finalCategory:'combo'},
    {id:"hc20",tier:"hard",text:"Her notes were everywhere because she ___ the report all night.",correctAnswers:["had been writing"],distractors:["had written","wrote"],focus:"PROCESS + PAST EVIDENCE",finalCategory:'combo'}
  ]
  };

  function shuffled(values,random=Math.random){
    const copy=[...values];
    for(let i=copy.length-1;i>0;i--){
      const j=Math.max(0,Math.min(i,Math.floor(random()*(i+1))));
      [copy[i],copy[j]]=[copy[j],copy[i]];
    }
    return copy;
  }

  function createChallenge(template,{difficulty='medium',random=Math.random}={}){
    const distractors=shuffled([...template.distractors],random).slice(0,2);
    return {
      ...template,
      level:5,
      mode:'final-race',
      grammarLabel:'Mixed grammar',
      cue:template.focus,
      correctAnswer:template.correctAnswers[0],
      distractors,
      difficulty
    };
  }

  function buildComboRound(count=18,{difficulty='medium',random=Math.random}={}){
    const tier=['easy','medium','hard'].includes(difficulty)?difficulty:'medium';
    return shuffled(COMBOS[tier],random).slice(0,count).map(item=>
      createChallenge(item,{difficulty:tier,random})
    );
  }

  function buildAnswerSequence(challenge,{random=Math.random}={}){
    return shuffled([
      ...challenge.distractors.slice(0,2).map(value=>({value,correct:false})),
      ...challenge.correctAnswers.map(value=>({value,correct:true}))
    ],random);
  }

  const api={COMBOS,createChallenge,buildComboRound,buildAnswerSequence,shuffled};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.VerbRunnerFinalRaceBank=api;
})(typeof window!=='undefined'?window:globalThis);
