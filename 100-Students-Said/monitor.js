import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getDatabase, ref, onValue, update, get } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
import {
  loadTeacherContext,
  registerLiveGameSession,
  endLiveGameSession,
  heartbeatTeacher
} from '../shared/youteach-live-bridge.mjs';

const cfg = window.HUNDRED_SS_CONFIG;
const db = getDatabase(initializeApp(cfg.firebase));
const $ = id => document.getElementById(id);
const gameRef = ref(db, cfg.gamePath);

let state = HundredSSCore.normalize();
let yt = null;
let liveTeacherContext = null;
let teacherHeartbeatBusy = false;

const seed = [
  {
    prompt: 'Maya said, “I am studying for the exam.”',
    answer: 'Maya said (that) she was studying for the exam.',
    guide: 'Statement · say · pronoun and tense backshift',
    points: 10
  },
  {
    prompt: 'Leo told me, “I finished the project.”',
    answer: 'Leo told me (that) he had finished the project.',
    guide: 'Statement · tell + object · past perfect',
    points: 10
  },
  {
    prompt: 'Ana asked, “Where do you live?”',
    answer: 'Ana asked where I lived.',
    guide: 'Wh-question · statement word order',
    points: 10
  },
  {
    prompt: 'The coach warned us, “Do not give up.”',
    answer: 'The coach warned us not to give up.',
    guide: 'Reporting verb · warn + object + not to',
    points: 10
  }
];

async function patch(value) {
  await update(gameRef, value);
}

function teams() {
  return Object.keys(yt?.activityScores || {}).slice(0, 2);
}

function createLiveSessionId() {
  return `HSS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function integrationMatchesTeacherContext(
  integration = state?.integration,
  teacherContext = liveTeacherContext
) {
  const liveContext = teacherContext?.liveContext || {};
  return Boolean(
    integration?.active === true &&
    teacherContext &&
    integration.source === 'youteach-buzzer' &&
    String(integration.youTeachSessionId || '') === String(liveContext.youTeachSessionId || '') &&
    String(integration.groupName || '') === String(liveContext.groupName || '') &&
    String(integration.assignmentId || '') === String(liveContext.assignmentId || '')
  );
}

function renderLiveControls() {
  const start = $('startLiveActivity');
  const end = $('endLiveActivity');
  const status = $('liveActivityStatus');
  if (!start || !end || !status) return;

  const integration = state?.integration || null;
  const matching = integrationMatchesTeacherContext(integration);
  const foreignActive = Boolean(integration?.active && !matching);

  if (matching) {
    start.disabled = true;
    start.textContent = 'LIVE ACTIVITY ACTIVE';
    end.hidden = false;
    end.disabled = false;
    status.textContent = `Live for ${liveTeacherContext.liveContext.groupName} · ${integration.cogSessionId}`;
    return;
  }

  end.hidden = true;
  start.textContent = 'START LIVE ACTIVITY';

  if (foreignActive) {
    start.disabled = true;
    status.textContent = 'Another YouTeach live activity is using this 100 Students Said monitor.';
    return;
  }

  if (!liveTeacherContext) {
    start.disabled = true;
    status.textContent = 'Open this monitor from an authenticated YouTeach COG activity to start live.';
    return;
  }

  start.disabled = false;
  status.textContent = `Ready for YouTeach group ${liveTeacherContext.liveContext.groupName}`;
}

function render() {
  const t = teams();
  $('connection').textContent = yt?.active ? 'YouTeach connected' : 'YouTeach session required';
  $('roundBank').textContent = state.roundBank;
  $('time').textContent = state.answerSeconds + 's';
  $('score1').textContent = state.teamScores['Team 1'];
  $('score2').textContent = state.teamScores['Team 2'];
  $('strikeLimit').value = state.strikeLimit;
  $('phase').value = state.phase;

  const item = state.content[state.questionIndex] || {};
  $('guide').textContent =
    `Prompt: ${item.prompt || '—'} · Model: ${item.answer || '—'} · ${item.guide || 'Alternatives accepted by teacher'}`;
  $('questionList').innerHTML = state.content
    .map((q, i) => `<div class="${i === state.questionIndex ? 'current-q' : ''}">${i + 1}. ${q.prompt}</div>`)
    .join('');

  const buzz = yt?.buzzer?.currentBuzz;
  $('buzz').textContent = buzz ? `${buzz.name} · ${buzz.team}` : 'No buzz yet';
  $('turn').textContent = state.turnStudentName || 'Waiting for face-off leader';
  renderLiveControls();
}

function initializeLiveActivity() {
  liveTeacherContext = loadTeacherContext();
  renderLiveControls();
}

async function sendTeacherHeartbeat() {
  if (
    teacherHeartbeatBusy ||
    !integrationMatchesTeacherContext() ||
    !state?.integration?.cogSessionId
  ) {
    return;
  }

  teacherHeartbeatBusy = true;
  try {
    await heartbeatTeacher({
      teacherContext: liveTeacherContext,
      cogSessionId: state.integration.cogSessionId
    });
  } catch (error) {
    console.error('100 Students Said teacher heartbeat failed', error);
    if (Number(error?.status) === 410) {
      await patch({
        integration: {
          ...state.integration,
          active: false,
          expiredAt: Date.now()
        }
      }).catch(() => {});
    }
  } finally {
    teacherHeartbeatBusy = false;
  }
}

async function startLiveActivity() {
  const teacherContext = liveTeacherContext || loadTeacherContext();
  liveTeacherContext = teacherContext;

  if (!teacherContext) {
    $('liveActivityStatus').textContent = 'Reopen Classroom Online Games from YouTeach before starting live.';
    renderLiveControls();
    return;
  }

  if (integrationMatchesTeacherContext(state.integration, teacherContext)) {
    await sendTeacherHeartbeat();
    return;
  }

  if (state?.integration?.active) {
    $('liveActivityStatus').textContent = 'Another live 100 Students Said activity is already active.';
    renderLiveControls();
    return;
  }

  const cogSessionId = createLiveSessionId();
  const integration = {
    source: 'youteach-buzzer',
    active: true,
    gameId: '100-students-said',
    gameName: '100 Students Said',
    cogSessionId,
    youTeachSessionId: String(teacherContext.liveContext.youTeachSessionId || ''),
    groupName: String(teacherContext.liveContext.groupName || ''),
    assignmentId: String(teacherContext.liveContext.assignmentId || ''),
    startedAt: Date.now()
  };

  $('startLiveActivity').disabled = true;
  $('liveActivityStatus').textContent = 'Starting live activity…';

  await patch({ integration });
  state = HundredSSCore.normalize({ ...state, integration });
  renderLiveControls();

  try {
    await registerLiveGameSession({
      teacherContext,
      gameId: '100-students-said',
      gameName: '100 Students Said',
      cogSessionId
    });
    await heartbeatTeacher({ teacherContext, cogSessionId });
    $('liveActivityStatus').textContent =
      `Live for ${teacherContext.liveContext.groupName} · ${cogSessionId}`;
  } catch (error) {
    console.error('Could not register 100 Students Said live activity', error);
    const rolledBack = {
      ...integration,
      active: false,
      registrationFailedAt: Date.now()
    };
    await patch({ integration: rolledBack }).catch(() => {});
    state = HundredSSCore.normalize({ ...state, integration: rolledBack });
    $('liveActivityStatus').textContent =
      error?.message || 'Could not start the YouTeach live activity.';
  }

  renderLiveControls();
}

async function endLiveActivity() {
  if (!integrationMatchesTeacherContext()) return;

  const confirmed = confirm(
    'End this activity for the group? Students will no longer be able to participate.'
  );
  if (!confirmed) return;

  const cogSessionId = String(state.integration.cogSessionId || '');
  $('endLiveActivity').disabled = true;
  $('liveActivityStatus').textContent = 'Ending live activity…';

  try {
    await endLiveGameSession({
      teacherContext: liveTeacherContext,
      cogSessionId
    });

    const endedIntegration = {
      ...state.integration,
      active: false,
      endedAt: Date.now()
    };
    await patch({ integration: endedIntegration });
    state = HundredSSCore.normalize({ ...state, integration: endedIntegration });
    $('liveActivityStatus').textContent = 'Live activity ended.';
  } catch (error) {
    console.error('Could not end 100 Students Said live activity', error);
    $('liveActivityStatus').textContent =
      error?.message || 'Could not end the live activity.';
  }

  renderLiveControls();
}

onValue(gameRef, snapshot => {
  state = HundredSSCore.normalize(snapshot.val() || {});
  if (!state.content.length) patch({ content: seed });
  render();
});

onValue(ref(db, cfg.youTeachSessionPath), snapshot => {
  yt = snapshot.val();
  if (yt?.activityScores) {
    const t = teams();
    patch({
      teamScores: {
        'Team 1': Number(yt.activityScores[t[0]] || 0),
        'Team 2': Number(yt.activityScores[t[1]] || 0)
      }
    });
  }
  render();
});

$('startLiveActivity').onclick = () => {
  startLiveActivity().catch(error => {
    console.error(error);
    $('liveActivityStatus').textContent = error?.message || 'Could not start live activity.';
    renderLiveControls();
  });
};

$('endLiveActivity').onclick = () => {
  endLiveActivity().catch(error => {
    console.error(error);
    $('liveActivityStatus').textContent = error?.message || 'Could not end live activity.';
    renderLiveControls();
  });
};

$('openBoard').onclick = () => window.open('board.html', '100ss-board');
$('reveal').onclick = () => patch({ revealed: !state.revealed });
$('nextQuestion').onclick = () => patch(HundredSSCore.nextQuestion(state));
$('phase').onchange = event => patch({ phase: event.target.value });
$('strikeLimit').onchange = event => patch({ strikeLimit: Number(event.target.value) });
$('startTimer').onclick = () => patch({ timerRunning: true, timerStartedAt: Date.now() });

document.querySelectorAll('[data-time]').forEach(button => {
  button.onclick = () => patch({
    answerSeconds: Math.max(1, state.answerSeconds + Number(button.dataset.time))
  });
});

document.querySelectorAll('[data-bank]').forEach(button => {
  button.onclick = () => patch({
    roundBank: Math.max(0, state.roundBank + Number(button.dataset.bank))
  });
});

$('correct').onclick = async () => {
  const actual = yt?.buzzer?.currentBuzz?.team || state.activeTeam;
  const logical = teams().indexOf(actual) === 1 ? 'Team 2' : 'Team 1';
  const next = HundredSSCore.validate(
    { ...state, activeTeam: logical, phase: 'control' },
    true,
    logical
  );
  await patch(next);
  await update(ref(db, `${cfg.youTeachSessionPath}/buzzer`), {
    roundOpen: false,
    currentBuzz: null,
    queue: [],
    lockedOutTeams: {}
  });
};

$('wrong').onclick = async () => {
  const actual = yt?.buzzer?.currentBuzz?.team || state.activeTeam;
  const logical = teams().indexOf(actual) === 1 ? 'Team 2' : 'Team 1';
  await patch(HundredSSCore.validate(state, false, logical));
  await update(ref(db, `${cfg.youTeachSessionPath}/buzzer`), {
    roundOpen: true,
    currentBuzz: null,
    queue: []
  });
};

$('openSteal').onclick = async () => {
  await patch({ phase: 'steal', turnStudentKey: '', turnStudentName: '' });
  await update(ref(db, `${cfg.youTeachSessionPath}/buzzer`), {
    roundOpen: true,
    currentBuzz: null,
    queue: []
  });
};

$('changeControl').onclick = () => patch({
  activeTeam: state.activeTeam === 'Team 1' ? 'Team 2' : 'Team 1',
  phase: 'control'
});

$('nextTurn').onclick = async () => {
  const assignments = yt?.assignments || {};
  const used = state.usedStudents || {};
  const actualTeam = teams()[state.activeTeam === 'Team 2' ? 1 : 0];
  const candidate = Object.keys(assignments).find(
    key => !used[key] && (!actualTeam || assignments[key] === actualTeam)
  );

  if (!candidate) return;

  const snapshot = await get(ref(db, `students/${candidate}`));
  const student = snapshot.val() || {};
  await patch({
    turnStudentKey: candidate,
    turnStudentName: student.nickname || student.fullName || student.name || 'Student'
  });
  await update(ref(db, `${cfg.youTeachSessionPath}/buzzer`), {
    roundOpen: true,
    currentBuzz: null,
    queue: [],
    lockedOutTeams: {}
  });
};

document.querySelectorAll('[data-award]').forEach(button => {
  button.onclick = async () => {
    const logical = button.dataset.award;
    const t = teams();
    const actual = t[logical === 'Team 1' ? 0 : 1] || logical;
    const next = HundredSSCore.awardBank(state, logical);
    await patch(next);
    if (yt?.active) {
      await update(ref(db, `${cfg.youTeachSessionPath}/activityScores`), {
        [actual]: next.teamScores[logical]
      });
    }
  };
});

$('uploadBtn').onclick = () => $('csv').click();
$('csv').onchange = async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  const content = HundredSSCore.parseCsv(text);
  if (content.length) {
    await patch({
      content,
      questionIndex: 0,
      revealed: false
    });
  }
};

initializeLiveActivity();
setInterval(() => {
  sendTeacherHeartbeat().catch(() => {});
}, 25000);
