(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SupportMeterCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const INITIAL_STATE = Object.freeze({meter: 0, score: 0, streak: 0, storyIndex: 0, attempt: 1});
  const allExpressions = ["I'm at my wits' end.", "I've had it.", 'I give up.', 'That must be tough.', 'I hear you.', 'Hang in there.', "Don't give up.", 'Stick with it.'];
  const expressionCategory = {"I'm at my wits' end.":'Frustration', "I've had it.":'Frustration', 'I give up.':'Frustration', 'That must be tough.':'Empathy', 'I hear you.':'Empathy', 'Hang in there.':'Encouragement', "Don't give up.":'Encouragement', 'Stick with it.':'Encouragement'};
  const reviewedOptions = {
    "I'm at my wits' end.":["I'm at my wits' end.",'I hear you.','Hang in there.'],
    "I've had it.":["I've had it.",'That must be tough.','Stick with it.'],
    'I give up.':['I give up.','I hear you.',"Don't give up."],
    'That must be tough.':['That must be tough.',"I've had it.",'Stick with it.'],
    'I hear you.':['I hear you.','I give up.',"Don't give up."],
    'Hang in there.':['Hang in there.',"I'm at my wits' end.","I've had it."],
    "Don't give up.":["Don't give up.",'I give up.','That must be tough.'],
    'Stick with it.':['Stick with it.',"I've had it.",'I hear you.']
  };

  function make(setId,id,name,targetName,targetPronoun,feeling,expression,frames,speechPosition) {
    const options = reviewedOptions[expression];
    const shift = (setId + id) % options.length;
    return {setId,id,name,targetName,targetPronoun,feeling,expression,frames,speechPosition,options:[...options.slice(shift),...options.slice(0,shift)]};
  }

  const storySets = [
    [
      make(1,1,"Maya's Science Project",'Maya','she','Frustration',"I'm at my wits' end.",['Maya finishes her science project.','She tries the experiment again.','Nothing works after several attempts.'],'bottom-right'),
      make(1,2,"Ethan's Broken Laptop",'Ethan','he','Frustration',"I've had it.",['Ethan works on his presentation.','The laptop freezes and restarts again.','The same problem happens one more time.'],'bottom-right'),
      make(1,3,"Sofia's Model Airplane",'Sofia','she','Frustration','I give up.',['Sofia starts building a model airplane.','The wings keep falling off.','The airplane comes apart again.'],'bottom-right'),
      make(1,4,'Leo Misses the Soccer Final','Sofia','she','Empathy','That must be tough.',['Leo hurts his ankle during soccer practice.','He learns that he cannot play in the final.','Leo tells Sofia how disappointed he feels.'],'bottom-left'),
      make(1,5,"Ava's Audition",'Maya','she','Empathy','I hear you.',['Ava practices for her audition.','She forgets part of the song on stage.','Ava tells Maya what happened.'],'bottom-right'),
      make(1,6,"Ethan's Driving Test",'Leo','he','Encouragement','Hang in there.',['Ethan takes his driving test.','He makes a mistake and fails the test.','Leo talks with Ethan afterward.'],'bottom-left'),
      make(1,7,"Maya's Running Practice",'Ava','she','Encouragement',"Don't give up.",['Maya practices on the school track.','She becomes exhausted during practice.','Ava returns to talk with Maya.'],'bottom-left'),
      make(1,8,'Leo Learns the Guitar','Ethan','he','Encouragement','Stick with it.',['Leo starts learning the guitar.','He struggles after many attempts.','Ethan joins Leo during practice.'],'bottom-right')
    ],
    [
      make(2,1,"Ethan's Robot",'Ethan','he','Frustration',"I'm at my wits' end.",['Ethan builds a small robot.','The robot fails after another repair.','Ethan faces another pile of broken parts.'],'bottom-right'),
      make(2,2,"Ava's Photography Project",'Ava','she','Frustration',"I've had it.",['Ava prepares her photography project.','Her camera creates another bad result.','The problem happens again.'],'bottom-left'),
      make(2,3,"Leo's Cake",'Leo','he','Frustration','I give up.',['Leo starts baking a cake.','Another cake turns out badly.','The kitchen shows several failed attempts.'],'bottom-right'),
      make(2,4,'Sofia Misses the School Trip','Maya','she','Empathy','That must be tough.',['Sofia packs for a school trip.','She becomes sick and misses the trip.','Sofia tells Maya how disappointed she is.'],'bottom-right'),
      make(2,5,"Maya's Debate",'Ethan','he','Empathy','I hear you.',['Maya practices for a debate.','She forgets her argument.','Maya tells Ethan about the mistake.'],'bottom-left'),
      make(2,6,'Ava Learns to Skateboard','Sofia','she','Encouragement','Hang in there.',['Ava begins learning to skateboard.','She struggles after many attempts.','Sofia talks with Ava at the skate park.'],'bottom-left'),
      make(2,7,"Sofia's Chemistry Test",'Ava','she','Encouragement',"Don't give up.",['Sofia studies for chemistry.','A practice test shows many errors.','Ava joins Sofia at the study table.'],'bottom-left'),
      make(2,8,"Ethan's Basketball Practice",'Leo','he','Encouragement','Stick with it.',['Ethan practices basketball.','He misses several shots.','Leo joins Ethan on the court.'],'bottom-left')
    ],
    [
      make(3,1,"Maya's Jammed Printer",'Maya','she','Frustration',"I'm at my wits' end.",['Maya prints her assignment.','She clears the jam, but paper sticks again.','The printer jams after another attempt.'],'bottom-right'),
      make(3,2,"Sofia's Lost Presentation",'Sofia','she','Frustration',"I've had it.",['Sofia looks for her presentation.','She checks every folder and her USB drive.','The presentation is still missing.'],'bottom-right'),
      make(3,3,"Ava's Costume Project",'Ava','she','Frustration','I give up.',['Ava sews a costume for the school play.','The seam tears while she repairs it.','The costume tears again.'],'bottom-right'),
      make(3,4,'Ethan Misses the Concert','Leo','he','Empathy','That must be tough.',['Ethan gets ready for a concert.','A long delay makes him miss it.','Ethan tells Leo how disappointed he feels.'],'bottom-left'),
      make(3,5,"Leo's Missed Bus",'Maya','she','Empathy','I hear you.',['Leo hurries toward the bus stop.','The bus leaves before he can board.','Leo tells Maya why he is upset.'],'bottom-left'),
      make(3,6,"Maya's Piano Practice",'Sofia','she','Encouragement','Hang in there.',['Maya practices a difficult piano piece.','Repeated mistakes discourage her.','Sofia joins Maya at the piano.'],'bottom-left'),
      make(3,7,"Ethan's Chess Practice",'Ava','she','Encouragement',"Don't give up.",['Ethan practices chess carefully.','Another loss leaves him discouraged.','Ava joins Ethan at the chessboard.'],'bottom-left'),
      make(3,8,"Sofia's Community Garden",'Leo','he','Encouragement','Stick with it.',['Sofia plants a community garden.','Bad weather damages the young plants.','Leo joins Sofia in the garden.'],'bottom-left')
    ]
  ];

  function shuffleStories(items, random = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function buildRun({setNumber, assigned = false, random = Math.random}) {
    const set = storySets[Math.max(1, Math.min(3, Number(setNumber) || 1)) - 1];
    return assigned ? [...set] : shuffleStories(set, random);
  }
  function parseJoinToken(search) {
    const token = new URLSearchParams(search || '').get('join');
    return token && /^[A-Za-z0-9_-]{20,160}$/.test(token) ? token : null;
  }
  function shouldWarnBeforeExit(state) { return Boolean(state && state.started && !state.completed); }

  return {INITIAL_STATE, allExpressions, expressionCategory, storySets, buildRun, parseJoinToken, shouldWarnBeforeExit};
});
