"use strict";
(function () {
  const DB = "https://youteach-d9a79-default-rtdb.firebaseio.com/";
  const ROOT = "classroomGames/supportMeter/montiCivics/rooms";
  const QUESTIONS = window.MONTI_QUESTIONS || [];
  const query = new URLSearchParams(location.search);
  const state = {
    role: query.get("teacher") === "1" ? "teacher" : "student",
    code: "", id: "", secret: "", room: null, busy: false,
    polling: false, timer: null, renderKey: "", lastError: ""
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
    ["createBtn","joinBtn","submitBtn","startBtn","revealBtn","nextBtn","markGood","markRevise","closeBtn"].forEach(id => {
      const el = $(id); if (el) el.disabled = yes;
    });
  }
  async function createRoom() {
    if (state.role !== "teacher" || state.busy) return;
    setBusy(true); notice("Creating live room…");
    try {
      const teacherName = clean($("teacherName").value).slice(0,30) || "Teacher";
      const secret = randomHex(24);
      const teacherKey = await hash(secret);
      let success = false;
      for (let i=0;i<10;i++) {
        state.code = randomHex(3).toUpperCase();
        const data = {teacherKey, teacherName, createdAt:Date.now(),status:"lobby",
          phase:"answer",index:0,student:null,studentAnswers:{},grades:{}};
        try { await put(roomPath(),data,"null_etag"); success = true; break; }
        catch (e) { if (!/submitted|first/i.test(e.message)) throw e; }
      }
      if (!success) throw Error("Could not reserve a room code. Try again.");
      state.secret = secret;
      sessionStorage.setItem("monti:teacher:" + state.code,secret);
      setSessionUrl(); notice(""); showSession(); await poll(); beginPolling();
    } catch (e) { notice(e.message,true); } finally { setBusy(false); }
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
      if (room.student) {
        if (room.student.id !== remembered) throw Error("This room already has its student.");
        state.id = remembered;
      } else {
        if (room.status !== "lobby") throw Error("The session has already started.");
        const id = randomHex(12);
        await put(roomPath("student"),{id,name,joinedAt:Date.now()},"null_etag");
        state.id = id; localStorage.setItem("monti:student:" + code,id);
      }
      setSessionUrl(); notice(""); showSession(); await poll(); beginPolling();
    } catch (e) { notice(e.message,true); } finally { setBusy(false); }
  }
  async function resume() {
    const code = clean(query.get("room")).toUpperCase();
    if (!/^[0-9A-F]{6}$/.test(code)) return;
    state.code = code;
    if ($("roomCode")) $("roomCode").value = code;
    try {
      const room = await read(roomPath());
      if (!room) { notice("Room not found.",true); return; }
      if (state.role === "teacher") {
        const secret = clean(query.get("host")) || sessionStorage.getItem("monti:teacher:" + code) || "";
        if (!secret || await hash(secret) !== room.teacherKey) {
          notice("Use the original teacher monitor link to resume this session.",true); return;
        }
        state.secret = secret;
      } else {
        const remembered = localStorage.getItem("monti:student:" + code) || "";
        if (!room.student || room.student.id !== remembered) return;
        state.id = remembered;
      }
      setSessionUrl(); showSession(); await poll(); beginPolling();
    } catch (e) { notice("Could not resume: " + e.message,true); }
  }
  function showSession() {
    $("landing").hidden = true; $("session").hidden = false;
    $("roleTag").textContent = state.role === "teacher" ? "TEACHER MONITOR" : "STUDENT";
    $("teacherShare").hidden = state.role !== "teacher";
    $("teacherControls").hidden = state.role !== "teacher";
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
      if (state.role === "student" && (!room.student || room.student.id !== state.id)) {
        throw Error("Student session was replaced. Ask your teacher for a new code.");
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
  function score(room) {
    const entries = room.studentAnswers || {};
    return QUESTIONS.reduce((sum,q,i) => sum + (q.type === "choice" && entries[i] && Number(entries[i].answer) === q.answer ? 1 : 0), 0);
  }
  function submittedCount(room) { return Object.keys(room.studentAnswers || {}).length; }
  function render() {
    const room = state.room;
    if (!room) return;
    $("sessionTitle").textContent = "Room " + state.code;
    const answered = submittedCount(room);
    $("progressNumber").textContent = answered + " / " + QUESTIONS.length;
    $("scoreNumber").textContent = score(room) + " / " + QUESTIONS.filter(q=>q.type==="choice").length;
    $("progressFill").style.width = (100 * answered / QUESTIONS.length) + "%";
    const student = room.student ? room.student.name : "No student yet";
    $("sessionSub").textContent = state.role === "teacher" ? "Student: " + student : "Teacher: " + (room.teacherName || "Teacher");
    if (room.status === "lobby") {
      $("waiting").hidden = false; $("questionArea").hidden = true; $("finish").hidden = true;
      $("waiting").innerHTML = state.role === "teacher"
        ? "<h2>Waiting for your student</h2><p>" + escape(room.student ? room.student.name + " has joined. You can begin." : "Share the code with Monti to join from another device.") + "</p><button class='btn primary' id='startBtn'" + (!room.student ? " disabled" : "") + ">START SESSION →</button>"
        : "<h2>You're in!</h2><p>Wait for your teacher to start the first challenge.</p>";
      return;
    }
    $("waiting").hidden = true;
    if (room.status === "finished" || room.status === "closed") {
      $("questionArea").hidden = true; $("finish").hidden = false;
      const review = QUESTIONS.filter((q,i) => q.type === "write" && room.grades && room.grades[i]);
      $("finish").innerHTML = "<div class='stamp' style='margin:auto'>WELL<br>DONE</div><h2>" +
        (room.status === "closed" ? "Session closed" : "Challenge completed!") +
        "</h2><p>Automatically scored questions</p><strong>" + score(room) + " / 12</strong>" +
        "<p>Written answers reviewed: " + review.length + " / 4</p>" +
        (state.role === "teacher" ? "<button class='btn outline' id='copyResults'>COPY SESSION SUMMARY</button>" : "<p>Discuss your written answers with your teacher.</p>");
      return;
    }
    $("finish").hidden = true; $("questionArea").hidden = false;
    const q = QUESTIONS[room.index];
    if (!q) { notice("Question not found.",true); return; }
    const response = (room.studentAnswers || {})[room.index];
    const grade = (room.grades || {})[room.index];
    const key = [room.index,room.phase,state.role,response ? JSON.stringify(response) : "",grade ? JSON.stringify(grade) : ""].join("|");
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
        area.innerHTML = "<div class='submitted'>Your answer: " + escape(q.type === "choice" ? q.options[response.answer] : response.answer) + "</div>";
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
        ? "<div class='choices'>" + q.options.map((opt,i) => "<div class='choice'><strong>" + "ABC"[i] + "</strong><span>" + escape(opt) + "</span></div>").join("") + "</div>"
        : "<p>Ask your student to write a short answer. Review it in your Teacher Monitor.</p>";
    }
    $("sidebarTitle").textContent = state.role === "teacher" ? "Teacher Monitor" : "Discuss your choice.";
    $("sidebarText").textContent = state.role === "teacher"
      ? (response ? "Student has submitted an answer." : "Waiting for Monti to answer.")
      : (room.phase === "revealed" ? "Your teacher has revealed the review notes." : "Read carefully before submitting.");
    const submitted = $("submittedAnswer");
    submitted.textContent = state.role === "teacher" && response
      ? "Monti's answer: " + (q.type === "choice" ? q.options[response.answer] : response.answer) : "";
    const gradeBlock = $("teacherGrade");
    gradeBlock.hidden = !(state.role === "teacher" && q.type === "write" && response && !grade);
    if (grade) gradeBlock.hidden = true;
    $("revealBtn").hidden = room.phase !== "answer";
    $("nextBtn").hidden = room.phase !== "revealed";
    $("nextBtn").textContent = room.index === QUESTIONS.length - 1 ? "FINISH CHALLENGE →" : "NEXT CHALLENGE →";
    const note = $("revealed");
    note.hidden = room.phase !== "revealed";
    if (room.phase === "revealed") {
      note.textContent = q.type === "choice"
        ? "Correct answer: " + q.options[q.answer] + ". " + q.explain
        : "Teacher's guide: " + q.guide + (grade ? " | Review: " + (grade.accepted ? "Accepted" : "Needs revision") : "");
    }
  }
  async function teacherAction(action) {
    if (state.role !== "teacher" || state.busy) return;
    setBusy(true);
    try {
      const room = await read(roomPath());
      if (!room || await hash(state.secret) !== room.teacherKey) throw Error("Teacher access invalid.");
      if (action === "start") {
        if (room.status !== "lobby" || !room.student) throw Error("Wait for a student to join.");
        await patch(roomPath(),{status:"playing",phase:"answer",index:0});
      } else if (action === "reveal") {
        if (room.status !== "playing" || room.phase !== "answer") throw Error("The question cannot be revealed.");
        await patch(roomPath(),{phase:"revealed"});
      } else if (action === "next") {
        if (room.status !== "playing" || room.phase !== "revealed") throw Error("Reveal the answer first.");
        if (room.index >= QUESTIONS.length-1) await patch(roomPath(),{status:"finished"});
        else await patch(roomPath(),{index:room.index+1,phase:"answer"});
      } else if (action === "close") {
        if (!confirm("End this classroom session?")) return;
        await patch(roomPath(),{status:"closed"});
      }
      await pollAfterAction();
    } catch (e) { notice(e.message,true); } finally { setBusy(false); }
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
      if (!chosen) { $("studentFeedback").textContent = "Choose an answer first."; $("studentFeedback").className="feedback error"; return; }
      answer = Number(chosen.value);
    } else {
      answer = clean($("writtenAnswer")?.value).slice(0,400);
      if (answer.length < 10) { $("studentFeedback").textContent = "Write at least one complete sentence."; $("studentFeedback").className="feedback error"; return; }
    }
    setBusy(true);
    try {
      const fresh = await read(roomPath());
      if (!fresh || fresh.status !== "playing" || fresh.phase !== "answer" || fresh.index !== room.index) throw Error("This question has ended.");
      if (!fresh.student || fresh.student.id !== state.id) throw Error("Your student session is invalid.");
      await put(roomPath("studentAnswers/" + room.index),{answer,at:Date.now()},"null_etag");
      await pollAfterAction();
    } catch (e) { notice("Could not submit: " + e.message,true); } finally { setBusy(false); }
  }
  async function grade(accepted) {
    if (state.role !== "teacher" || state.busy || !state.room) return;
    setBusy(true);
    try {
      const fresh = await read(roomPath());
      const i = fresh.index;
      if (!fresh.studentAnswers || !fresh.studentAnswers[i] || QUESTIONS[i].type !== "write") throw Error("No written answer available.");
      if (await hash(state.secret) !== fresh.teacherKey) throw Error("Teacher access invalid.");
      await put(roomPath("grades/" + i),{accepted,at:Date.now()},"null_etag");
      await pollAfterAction();
    } catch (e) { notice(e.message,true); } finally { setBusy(false); }
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
    if (id === "copyResults") {
      const r = state.room;
      copyText("Monti - Civics & Ethics\nStudent: " + (r.student?.name || "-") +
        "\nRoom: " + state.code + "\nObjective questions: " + score(r) + "/12" +
        "\nWritten answers reviewed: " + QUESTIONS.filter((q,i) => q.type==="write" && r.grades?.[i]).length + "/4");
    }
  });
  if (state.role === "teacher") {
    $("joinPanel").hidden = true; $("hostPanel").hidden = false;
    $("roleTag").textContent="TEACHER MONITOR";
  }
  resume();
})();
