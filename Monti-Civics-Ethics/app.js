"use strict";
(function () {
  const DB = "https://youteach-d9a79-default-rtdb.firebaseio.com/";
  const ROOT = "classroomGames/supportMeter/montiCivics/rooms";
  const QUESTIONS = window.MONTI_QUESTIONS || [];
  const query = new URLSearchParams(location.search);
  const state = {
    role: query.get("teacher") === "1" ? "teacher" : "student",
    code: "", id: "", secret: "", room: null, busy: false,
    polling: false, timer: null, renderKey: "", lastError: "", selectedId: ""
  };
  const $ = (id) => document.getElementById(id);
  const clean = (s) => String(s == null ? "" : s).trim();
  const escape = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
  function roomPath(tail) { return ROOT + "/" + state.code + (tail ? "/" + tail : ""); }
  function randomHex(n) {
    return Array.from(crypto.getRandomValues(new Uint8Array(n)), (v) => v.toString(16).padStart(2,"0")).join("");
  }
  async function hash(value) {
    const bytes = await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
    return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2,"0")).join("");
  }
  async function request(p, method, body, match) {
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (match) headers["If-Match"] = match;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 13000);
    try {
      const result = await fetch(DB + p + ".json", {
        method: method || "GET", headers, cache: "no-store",
        body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal
      });
      if (result.status === 412) throw Error("Someone submitted this information first. Refresh and try again.");
      if (!result.ok) throw Error("Live connection error (" + result.status + ").");
      const raw = await result.text();
      return raw ? JSON.parse(raw) : null;
    } finally { clearTimeout(timeout); }
  }
  const read = (p) => request(p,"GET");
  const put = (p,v,match) => request(p,"PUT",v,match);
  const patch = (p,v) => request(p,"PATCH",v);
  function notice(text, isError) {
    const el = $("notice");
    el.hidden = !text;
    if (text) { el.textContent = text; el.style.borderColor = isError ? "#ae4141" : "#257d7c"; }
  }
  function canonicalBase() { return location.origin + "/Monti-Civics-Ethics/"; }
  function studentLink() { return canonicalBase() + "?room=" + state.code; }
  function teacherLink() {
    return canonicalBase() + "?teacher=1&room=" + state.code + "&host=" + encodeURIComponent(state.secret);
  }
  function setSessionUrl() {
    history.replaceState(null,"",state.role === "teacher" ? teacherLink() : studentLink());
  }
  function setBusy(yes) {
    state.busy = yes;
    ["createBtn","joinBtn","resumeTeacherBtn","submitBtn","startBtn","revealBtn","nextBtn","markGood","markRevise","closeBtn"].forEach(id => {
      const el = $(id); if (el) el.disabled = yes;
    });
  }
  async 
async function createRoom() {
  if (state.role !== "teacher" || state.busy) return;
  setBusy(true); notice("Creating live room…");
  try {
    const teacherName = clean($("teacherName").value).slice(0,30) || "Teacher";
    const secret = randomHex(24);
    const teacherKey = await hash(secret);
    let success = false;
    for (let i=0; i<10; i++) {
      state.code = randomHex(3).toUpperCase();
      const data = {teacherKey, teacherName, createdAt:Date.now(),status:"lobby",
        phase:"answer",index:0, students:{},answers:{},grades:{}};
      try { await put(roomPath(),data,"null_etag"); success = true; break; }
      catch (e) { if (!/submitted|first/i.test(e.message)) throw e; }
    }
    if (!success) throw Error("Could not reserve a room code. Try again.");
    state.secret = secret;
    localStorage.setItem("monti:teacher:" + state.code,secret);
    localStorage.setItem("monti:lastTeacherRoom",state.code);
    sessionStorage.setItem("monti:teacher:" + state.code,secret);
    setSessionUrl(); notice(""); showSession(); await pollAfterAction(); beginPolling();
  } catch(e) { notice(e.message,true); } finally { setBusy(false); }
}
function members(room) {
  const all = Object.assign({},room?.students || {});
  if (room?.student?.id && !all[room.student.id]) all[room.student.id] = room.student;
  return all;
}
function myAnswer(room,studentId,index) {
  return room?.answers?.[studentId]?.[index]
    || (room?.student?.id === studentId ? room?.studentAnswers?.[index] : null) || null;
}
function myGrade(room,studentId,index) {
  return room?.grades?.[studentId]?.[index]
    || (room?.student?.id === studentId && typeof room?.grades?.[index] === "object" ? room.grades[index] : null) || null;
}
async function joinRoom() {
  if (state.role !== "student" || state.busy) return;
  setBusy(true); notice("Connecting to classroom…");
  try {
    const code = clean($("roomCode").value).toUpperCase();
    const name = clean($("studentName").value).slice(0,30);
    if (!/^[0-9A-F]{6}$/.test(code)) throw Error("Enter the six-character room code.");
    if (name.length < 2) throw Error("Please enter your name or nickname.");
    state.code = code;
    const room = await read(roomPath());
    if (!room) throw Error("Room not found. Check the code.");
    if (room.status === "closed" || room.status === "finished") throw Error("This room has ended.");
    const remembered = localStorage.getItem("monti:student:" + code) || "";
    const all = members(room);
    if (remembered && all[remembered]) {
      state.id = remembered;
    } else {
      if (Object.keys(all).length >= 60) throw Error("This room is full.");
      const id = randomHex(12);
      await put(roomPath("students/" + id),{id,name,joinedAt:Date.now()},"null_etag");
      state.id = id;
      localStorage.setItem("monti:student:" + code,id);
    }
    setSessionUrl(); notice(""); showSession(); await pollAfterAction(); beginPolling();
  } catch(e) { notice(e.message,true); } finally { setBusy(false); }
}
async function resume() {
  const explicit = clean(query.get("room")).toUpperCase();
  const saved = state.role === "teacher" ? clean(localStorage.getItem("monti:lastTeacherRoom")).toUpperCase() : "";
  const code = explicit || (!query.get("new") ? saved : "");
  if (!/^[0-9A-F]{6}$/.test(code)) return;
  state.code = code;
  if ($("roomCode")) $("roomCode").value = code;
  try {
    const room = await read(roomPath());
    if (!room) { notice("Previous room not found. You can create another.",true); return; }
    if (state.role === "teacher") {
      const secret = clean(query.get("host")) ||
        clean(localStorage.getItem("monti:teacher:" + code)) ||
        clean(sessionStorage.getItem("monti:teacher:" + code));
      if (!secret || await hash(secret) !== room.teacherKey) {
        notice("Teacher access unavailable on this browser. Use your private Teacher Monitor link.",true); return;
      }
      state.secret = secret;
      localStorage.setItem("monti:teacher:" + code,secret);
      localStorage.setItem("monti:lastTeacherRoom",code);
    } else {
      const remembered = localStorage.getItem("monti:student:" + code) || "";
      if (!remembered || !members(room)[remembered]) return;
      state.id = remembered;
    }
    setSessionUrl(); showSession(); await pollAfterAction(); beginPolling();
  } catch(e) { notice("Could not resume: " + e.message,true); }
}

  function showSession() {
    $("landing").hidden = true; $("session").hidden = false;
    $("roleTag").textContent = state.role === "teacher" ? "TEACHER MONITOR" : "STUDENT";
    $("teacherShare").hidden = state.role !== "teacher";
    $("teacherControls").hidden = state.role !== "teacher";
    $("teacherRoster").hidden = state.role !== "teacher";
    $("sessionType").textContent = state.role === "teacher" ? "TEACHER MONITOR · LIVE" : "STUDENT · LIVE";
    if (state.role === "teacher") {
      $("studentLinkText").textContent = studentLink();
    }
  }
  function startPolling() {
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(poll,1800);
  }
  function beginPolling() { startPolling(); }
  async function poll() {
    if (!state.code || state.polling || state.busy) return;
    state.polling = true;
    try {
      const room = await read(roomPath());
      if (!room) throw Error("Room no longer exists.");
      if (state.role === "student" && !members(room)[state.id]) {
        throw Error("Participant session not found. Rejoin with your room code.");
      }
      if (state.role === "teacher" && await hash(state.secret) !== room.teacherKey) {
        throw Error("Teacher access is no longer valid.");
      }
      state.room = room;
      if (state.lastError) { state.lastError = ""; notice(""); }
      render();
    } catch (e) {
      const message = "Connection issue: " + e.message;
      if (message !== state.lastError) { state.lastError = message; notice(message,true); }
    } finally { state.polling = false; }
  }
  
function score(room,studentId) {
  return QUESTIONS.reduce((sum,q,i) => sum +
    (q.type === "choice" && myAnswer(room,studentId,i) &&
      Number(myAnswer(room,studentId,i).answer) === q.answer ? 1 : 0), 0);
}
function submittedCount(room,studentId) {
  return QUESTIONS.filter((q,i) => !!myAnswer(room,studentId,i)).length;
}
function reviewedCount(room,studentId) {
  return QUESTIONS.filter((q,i) => q.type === "write" && !!myGrade(room,studentId,i)).length;
}
function renderRoster(room,all) {
  const ids = Object.keys(all);
  if (!ids.includes(state.selectedId)) state.selectedId = ids[0] || "";
  const select = $("studentSelect");
  select.innerHTML = ids.map(id => "<option value='" + escape(id) + "'" +
    (id === state.selectedId ? " selected" : "") + ">" + escape(all[id].name || "Student") +
    " — " + submittedCount(room,id) + "/16</option>").join("");
  $("rosterList").innerHTML = ids.length
    ? ids.map(id => "<div class='roster-person'><strong>" + escape(all[id].name || "Student") +
      "</strong><span>" + submittedCount(room,id) + "/16 answered · " +
      score(room,id) + "/12 correct</span></div>").join("")
    : "<p>No participants yet. Share your student link.</p>";
}
function render() {
  const room = state.room;
  if (!room) return;
  const all = members(room), ids = Object.keys(all);
  if (state.role === "teacher") renderRoster(room,all);
  const personId = state.role === "teacher" ? state.selectedId : state.id;
  const answered = personId ? submittedCount(room,personId) : 0;
  $("sessionTitle").textContent = "Room " + state.code;
  $("progressNumber").textContent = answered + " / " + QUESTIONS.length;
  $("scoreNumber").textContent = (personId ? score(room,personId) : 0) + " / 12";
  $("progressFill").style.width = (100 * answered / QUESTIONS.length) + "%";
  $("sessionSub").textContent = state.role === "teacher"
    ? ids.length + " participant(s) connected · viewing: " + (all[personId]?.name || "Nobody yet")
    : "Teacher: " + (room.teacherName || "Teacher");
  if (room.status === "lobby") {
    $("waiting").hidden = false; $("questionArea").hidden = true; $("finish").hidden = true;
    $("waiting").innerHTML = state.role === "teacher"
      ? "<h2>Waiting for participants</h2><p>" + escape(ids.length + " participant(s) joined. You can start when everyone is ready.") +
        "</p><button class='btn primary' id='startBtn'" + (ids.length ? "" : " disabled") + ">START SESSION →</button>"
      : "<h2>You're in!</h2><p>Wait for your teacher to start the first challenge.</p>";
    return;
  }
  $("waiting").hidden = true;
  if (room.status === "finished" || room.status === "closed") {
    $("questionArea").hidden = true; $("finish").hidden = false;
    const scores = ids.map(id => "<div class='roster-person'><strong>" + escape(all[id].name || "Student") + "</strong><span>" +
      score(room,id) + "/12 correct · " + reviewedCount(room,id) + "/4 written reviewed</span></div>").join("");
    $("finish").innerHTML = "<div class='stamp' style='margin:auto'>WELL<br>DONE</div><h2>" +
      (room.status === "closed" ? "Session closed" : "Challenge completed!") +
      "</h2><p>" + (state.role === "teacher" ? "Group results" : "Your results") + "</p>" +
      (state.role === "teacher" ? scores :
       "<strong>" + score(room,state.id) + " / 12</strong><p>Written answers reviewed: " + reviewedCount(room,state.id) + " / 4</p>") +
      (state.role === "teacher" ? "<button class='btn outline' id='copyResults'>COPY GROUP RESULTS</button>" : "") +
      (state.role === "teacher" ? "<button class='btn outline' id='newRoomBtn'>CREATE NEW ROOM</button>" : "");
    return;
  }
  $("finish").hidden = true; $("questionArea").hidden = false;
  const q = QUESTIONS[room.index];
  if (!q) { notice("Question not found.",true); return; }
  const response = myAnswer(room,personId,room.index);
  const grade = myGrade(room,personId,room.index);
  const key = [room.index,room.phase,state.role,personId,
    JSON.stringify(room.students||{}),JSON.stringify(room.answers?.[personId]?.[room.index]||null),
    JSON.stringify(response),JSON.stringify(grade)].join("|");
  if (key === state.renderKey) return;
  state.renderKey = key;
  $("topicLabel").textContent = q.unit;
  $("questionNumber").textContent = String(room.index+1).padStart(2,"0") + " / " + QUESTIONS.length;
  $("questionText").textContent = q.prompt;
  $("promptLabel").textContent = q.type === "choice" ? "CHOOSE THE BEST ANSWER" : "WRITE IN ENGLISH";
  const area = $("answerArea");
  const feedback = $("studentFeedback");
  feedback.textContent = ""; feedback.className = "feedback";
  if (state.role === "student") {
    $("studentActions").hidden = !!response || room.phase !== "answer";
    if (response) {
      area.innerHTML = "<div class='submitted'>Your answer: " +
        escape(q.type === "choice" ? q.options[response.answer] : response.answer) + "</div>";
      feedback.textContent = room.phase === "revealed" ? "Review the answer with your teacher." : "Submitted. Wait for your teacher.";
    } else if (room.phase === "revealed") {
      area.innerHTML = "<div class='submitted'>This question has been revealed. Wait for the next one.</div>";
    } else if (q.type === "choice") {
      area.innerHTML = "<div class='choices'>" + q.options.map((opt,i) =>
        "<label class='choice'><input type='radio' name='answer' value='" + i + "'><strong>" +
        "ABC"[i] + "</strong><span>" + escape(opt) + "</span></label>").join("") + "</div>";
    } else {
      area.innerHTML = "<label for='writtenAnswer'>YOUR RESPONSE</label><textarea id='writtenAnswer' maxlength='400' placeholder='Write two or three sentences in English…'></textarea>";
    }
  } else {
    $("studentActions").hidden = true;
    area.innerHTML = q.type === "choice"
      ? "<div class='choices'>" + q.options.map((opt,i) => "<div class='choice'><strong>" +
        "ABC"[i] + "</strong><span>" + escape(opt) + "</span></div>").join("") + "</div>"
      : "<p>Ask participants to write a short answer. Review each response in your Teacher Monitor.</p>";
  }
  $("sidebarTitle").textContent = state.role === "teacher" ? "Teacher Monitor" : "Discuss your choice.";
  $("sidebarText").textContent = state.role === "teacher"
    ? (response ? "Selected participant submitted an answer." : "Waiting for the selected participant.")
    : (room.phase === "revealed" ? "Your teacher has revealed the review notes." : "Read carefully before submitting.");
  const submitted = $("submittedAnswer");
  submitted.textContent = state.role === "teacher" && response
    ? (all[personId]?.name || "Student") + "'s answer: " +
      (q.type === "choice" ? q.options[response.answer] : response.answer) : "";
  const gradeBlock = $("teacherGrade");
  gradeBlock.hidden = !(state.role === "teacher" && q.type === "write" && !!response && !grade);
  $("revealBtn").hidden = room.phase !== "answer";
  $("nextBtn").hidden = room.phase !== "revealed";
  $("nextBtn").textContent = room.index === QUESTIONS.length - 1 ? "FINISH CHALLENGE →" : "NEXT CHALLENGE →";
  const note = $("revealed");
  note.hidden = room.phase !== "revealed";
  if (room.phase === "revealed") {
    note.textContent = q.type === "choice" ? "Correct answer: " + q.options[q.answer] + ". " + q.explain
      : "Teacher's guide: " + q.guide +
      (grade ? " | Review: " + (grade.accepted ? "Accepted" : "Needs revision") : "");
  }
}

  
async function teacherAction(action) {
  if (state.role !== "teacher" || state.busy) return;
  setBusy(true);
  try {
    const room = await read(roomPath());
    if (!room || await hash(state.secret) !== room.teacherKey) throw Error("Teacher access invalid.");
    if (action === "start") {
      if (room.status !== "lobby" || !Object.keys(members(room)).length) throw Error("Wait for a participant to join.");
      await patch(roomPath(),{status:"playing",phase:"answer",index:0});
    } else if (action === "reveal") {
      if (room.status !== "playing" || room.phase !== "answer") throw Error("The question cannot be revealed.");
      await patch(roomPath(),{phase:"revealed"});
    } else if (action === "next") {
      if (room.status !== "playing" || room.phase !== "revealed") throw Error("Reveal the answer first.");
      if (room.index >= QUESTIONS.length-1) await patch(roomPath(),{status:"finished"});
      else await patch(roomPath(),{index:room.index+1,phase:"answer"});
    } else if (action === "close") {
      if (!confirm("End this classroom session for everyone?")) return;
      await patch(roomPath(),{status:"closed"});
    }
    await pollAfterAction();
  } catch(e) { notice(e.message,true); } finally { setBusy(false); }
}

  async function pollAfterAction() {
    const room = await read(roomPath()); state.room=room; state.renderKey=""; render();
  }
  
async function submit() {
  if (state.role !== "student" || state.busy || !state.room) return;
  const room = state.room, q = QUESTIONS[room.index];
  let answer;
  if (q.type === "choice") {
    const chosen = document.querySelector('input[name="answer"]:checked');
    if (!chosen) {
      $("studentFeedback").textContent = "Choose an answer first.";
      $("studentFeedback").className = "feedback error"; return;
    }
    answer = Number(chosen.value);
  } else {
    answer = clean($("writtenAnswer")?.value).slice(0,400);
    if (answer.length < 10) {
      $("studentFeedback").textContent = "Write at least one complete sentence.";
      $("studentFeedback").className = "feedback error"; return;
    }
  }
  setBusy(true);
  try {
    const fresh = await read(roomPath());
    if (!fresh || fresh.status !== "playing" || fresh.phase !== "answer" || fresh.index !== room.index)
      throw Error("This question has ended.");
    if (!members(fresh)[state.id]) throw Error("Your participant session is invalid.");
    if (myAnswer(fresh,state.id,room.index)) throw Error("Your answer was already submitted.");
    await put(roomPath("answers/" + state.id + "/" + room.index),{answer,at:Date.now()},"null_etag");
    await pollAfterAction();
  } catch(e) { notice("Could not submit: " + e.message,true); } finally { setBusy(false); }
}
async function grade(accepted) {
  if (state.role !== "teacher" || state.busy || !state.room || !state.selectedId) return;
  setBusy(true);
  try {
    const fresh = await read(roomPath());
    const i = fresh.index, id = state.selectedId;
    if (!myAnswer(fresh,id,i) || QUESTIONS[i].type !== "write") throw Error("No written answer available.");
    if (await hash(state.secret) !== fresh.teacherKey) throw Error("Teacher access invalid.");
    await put(roomPath("grades/" + id + "/" + i),{accepted,at:Date.now()});
    await pollAfterAction();
  } catch(e) { notice(e.message,true); } finally { setBusy(false); }
}

  async function copyText(v) {
    try { await navigator.clipboard.writeText(v); notice("Copied."); }
    catch (_) { notice("Copy manually: " + v); }
  }
  document.addEventListener("click",function(e) {
    const id = e.target.closest("button")?.id;
    if (!id) return;
    if (id === "createBtn") createRoom();
    if (id === "joinBtn") joinRoom();
    if (id === "startBtn") teacherAction("start");
    if (id === "revealBtn") teacherAction("reveal");
    if (id === "nextBtn") teacherAction("next");
    if (id === "closeBtn") teacherAction("close");
    if (id === "submitBtn") submit();
    if (id === "markGood") grade(true);
    if (id === "markRevise") grade(false);
    if (id === "copyCode") copyText(state.code);
    if (id === "copyLink") copyText(studentLink());
    if (id === "copyTeacherLink") copyText(teacherLink());
    if (id === "joinAsPlayer") window.open(studentLink(), "_blank", "noopener,noreferrer");
    if (id === "resumeTeacherBtn") resume();
    if (id === "newRoomBtn") location.href = canonicalBase() + "?teacher=1&new=1";
    
if (id === "copyResults") {
  const room = state.room, all = members(room);
  const report = ["Monti - Civics & Ethics", "Room: " + state.code,
    "Participants: " + Object.keys(all).length, ""];
  for (const [id,person] of Object.entries(all)) {
    report.push((person.name || "Student") + ": " + score(room,id) +
      "/12 correct; " + submittedCount(room,id) + "/16 answered; " +
      reviewedCount(room,id) + "/4 written reviewed");
  }
  copyText(report.join("\n"));
}

  
  });
  if (state.role === "teacher") {
    $("joinPanel").hidden = true; $("hostPanel").hidden = false;
    $("roleTag").textContent="TEACHER MONITOR";
    const previous = localStorage.getItem("monti:lastTeacherRoom");
    $("resumeTeacherBox").hidden = !previous;
    if (previous) $("resumeTeacherBtn").textContent = "REOPEN ROOM " + previous;
  }
  $("studentSelect").addEventListener("change", () => {
    state.selectedId = $("studentSelect").value;
    state.renderKey = "";
    render();
  });
  resume();
})();
