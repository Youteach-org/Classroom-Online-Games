import { AED_SCENARIOS } from "./aed-scenarios.js";
import { SCENE_TWISTS } from "./scene-twists.js";
import { CLINICAL_CASES } from "./clinical-cases.js";
import { PROMPTS } from "./prompt-catalog.js";
import { createSession } from "./trainer-engine.js";
import { createBleClient } from "./ble-client.js";

const byId = (id) => document.getElementById(id);

const ui = {
  connectTrainer: byId("connectTrainer"),
  connectionStatus: byId("connectionStatus"),
  bleDiagnostic: byId("bleDiagnostic"),
  browserBleStatus: byId("browserBleStatus"),
  braveHelp: byId("braveHelp"),
  braveFlag: byId("braveFlag"),
  copyBraveFlag: byId("copyBraveFlag"),
  baseScenario: byId("baseScenario"),
  sceneTwist: byId("sceneTwist"),
  clinicalCondition: byId("clinicalCondition"),
  caseSummary: byId("caseSummary"),
  startCase: byId("startCase"),
  giveHint: byId("giveHint"),
  hintsUsed: byId("hintsUsed"),
  forceShock: byId("forceShock"),
  forceNoShock: byId("forceNoShock"),
  triggerRefib: byId("triggerRefib"),
  padFault: byId("padFault"),
  clearPadFault: byId("clearPadFault"),
  movement: byId("movement"),
  clearMovement: byId("clearMovement"),
  standClearViolation: byId("standClearViolation"),
  clearStandClearViolation: byId("clearStandClearViolation"),
  pauseCase: byId("pauseCase"),
  resumeCase: byId("resumeCase"),
  restartCase: byId("restartCase"),
  endCase: byId("endCase"),
  trainerState: byId("trainerState"),
  deviceId: byId("deviceId"),
  batteryLevel: byId("batteryLevel"),
  movementStatus: byId("movementStatus"),
  eventTimeline: byId("eventTimeline"),
  lastCommand: byId("lastCommand")
};

const remoteButtons = [
  ui.startCase, ui.giveHint, ui.forceShock, ui.forceNoShock, ui.triggerRefib,
  ui.padFault, ui.clearPadFault, ui.movement, ui.clearMovement,
  ui.standClearViolation, ui.clearStandClearViolation,
  ui.pauseCase, ui.resumeCase, ui.restartCase, ui.endCase
];

const BRAVE_BLUETOOTH_FLAG = "brave://flags/#brave-web-bluetooth-api";

let bleClient = null;
let bleReady = false;
let braveBrowser = false;
let commandSeq = 1;
let activeCase = null;
let hintsUsed = 0;
let caseActive = false;
let movementActive = false;
const INACTIVE_TRAINER_STATES = new Set(["OFF", "IDLE", "ENDED", "COMPLETE"]);

function fillSelect(select, entries) {
  select.replaceChildren();
  for (const entry of entries) {
    const option = document.createElement("option");
    option.value = entry.id;
    option.textContent = `${entry.id} — ${entry.label}`;
    select.append(option);
  }
}

function currentSelection() {
  return {
    scenarioId: ui.baseScenario.value,
    twistId: ui.sceneTwist.value,
    clinicalId: ui.clinicalCondition.value
  };
}

function hintCapacity() {
  const twist = SCENE_TWISTS.find((x) => x.id === ui.sceneTwist.value);
  const clinical = CLINICAL_CASES.find((x) => x.id === ui.clinicalCondition.value);
  const specificHints = new Set([
    ...(twist?.hintPromptIds ?? []),
    ...(clinical?.hintPromptIds ?? [])
  ]);

  // T0/C0 still has one approved general paramedic hint in firmware V15+.
  return specificHints.size > 0 ? specificHints.size : 1;
}

function updateHintControl() {
  const capacity = hintCapacity();
  ui.hintsUsed.textContent = String(hintsUsed);
  ui.giveHint.disabled = !bleReady || !caseActive || hintsUsed >= capacity;
  ui.giveHint.title = `Pistas usadas: ${hintsUsed} de ${capacity}`;
}

function setBuilderLocked(locked) {
  ui.baseScenario.disabled = locked;
  ui.sceneTwist.disabled = locked;
  ui.clinicalCondition.disabled = locked;
}

function updateMovementControl() {
  ui.movementStatus.textContent = movementActive ? "MOVIMIENTO: ACTIVO" : "MOVIMIENTO: NO";
  ui.movementStatus.dataset.state = movementActive ? "active" : "clear";
  ui.movement.disabled = !bleReady || !caseActive || movementActive;
  ui.clearMovement.disabled = !bleReady || !caseActive || !movementActive;
}

function setRemoteAvailability() {
  for (const button of remoteButtons) button.disabled = !bleReady;
  if (!caseActive) {
    for (const button of remoteButtons.filter((button) => button !== ui.startCase)) button.disabled = true;
  }
  ui.startCase.disabled = !bleReady || caseActive;
  updateMovementControl();
  updateHintControl();
}

function renderCaseSummary() {
  const scenario = AED_SCENARIOS.find((x) => x.id === ui.baseScenario.value);
  const twist = SCENE_TWISTS.find((x) => x.id === ui.sceneTwist.value);
  const clinical = CLINICAL_CASES.find((x) => x.id === ui.clinicalCondition.value);
  const notes = [];
  if (twist?.contextPromptId && PROMPTS[twist.contextPromptId]) {
    notes.push(PROMPTS[twist.contextPromptId].text);
  }
  if (clinical?.contextPromptId && PROMPTS[clinical.contextPromptId]) {
    notes.push(PROMPTS[clinical.contextPromptId].text);
  }
  ui.caseSummary.innerHTML = "";
  const title = document.createElement("strong");
  title.textContent = `${scenario?.id ?? "—"} · ${twist?.id ?? "—"} · ${clinical?.id ?? "—"}`;
  ui.caseSummary.append(title);
  const detail = document.createElement("div");
  detail.textContent = notes.length
    ? notes.join(" ")
    : "Caso base sin información adicional del compañero paramédico.";
  ui.caseSummary.append(detail);
  updateHintControl();
}

function appendTimeline(text, kind = "info") {
  const item = document.createElement("li");
  item.className = `timeline-item ${kind}`;
  const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  item.textContent = `${stamp} · ${text}`;
  ui.eventTimeline.prepend(item);
  while (ui.eventTimeline.children.length > 80) ui.eventTimeline.lastElementChild.remove();
}

function connectionLabel(state) {
  return {
    disconnected: "DESCONECTADO",
    connecting: "CONECTANDO…",
    syncing: "SINCRONIZANDO…",
    ready: "BLE LISTO",
    incompatible: "PROTOCOLO INCOMPATIBLE"
  }[state] ?? String(state).toUpperCase();
}

function onBleEvent(event) {
  if (event.kind === "connection") {
    const state = event.message.state;
    bleReady = state === "ready";
    ui.connectionStatus.textContent = connectionLabel(state);
    ui.connectionStatus.dataset.state = state;
    if (state === "disconnected") appendTimeline("Se perdió la conexión Bluetooth.", "warn");
    if (state === "syncing") appendTimeline("Resincronizando estado autoritativo del DEA…");
    if (state === "ready") appendTimeline("DEA sincronizado y listo.", "good");
    if (state === "incompatible") appendTimeline("Versión de protocolo BLE incompatible.", "bad");
    setRemoteAvailability();
    return;
  }

  if (event.kind === "diagnostic") {
    const labels = {
      selected: `SELECCIONADO: ${event.message.device}`,
      gatt: `CONECTANDO GATT: ${event.message.device}`,
      service: `BUSCANDO SERVICIO DEL DEA · INTENTO ${event.message.attempt ?? 1}`,
      retry: `REINTENTO BLE ${event.message.attempt ?? 1}: ${event.message.error ?? "reconectando"}`
    };
    ui.bleDiagnostic.textContent = labels[event.message.stage] ?? `BLE: ${event.message.stage}`;
    return;
  }

  if (event.kind === "status") {
    ui.deviceId.textContent = event.message.device ?? "—";
    ui.batteryLevel.textContent = event.message.battery ? `${event.message.battery}%` : "—";
    return;
  }

  if (event.kind === "state") {
    ui.trainerState.textContent = event.message.state ?? "—";
    caseActive = !INACTIVE_TRAINER_STATES.has(event.message.state);
    setBuilderLocked(caseActive);
    hintsUsed = Number.parseInt(event.message.hints ?? "0", 10) || 0;
    if (event.message.movement === "0" || event.message.movement === "1") {
      movementActive = event.message.movement === "1";
    }
    setRemoteAvailability();
    appendTimeline(
      `Estado: ${event.message.state} · análisis ${event.message.analysis} · shock ${event.message.shock === "1" ? "habilitado" : "bloqueado"}`
    );
    return;
  }

  if (event.kind === "event") {
    const label = event.message.event ?? "EVENT";
    const accepted = event.message.result !== "REJECT";
    appendTimeline(`DEA: ${label}`, accepted ? "device" : "bad");
    if (event.message.hints) {
      hintsUsed = Number.parseInt(event.message.hints, 10) || hintsUsed;
      updateHintControl();
    }
    if (event.message.ack) {
      ui.lastCommand.textContent = `ACK ${event.message.ack}`;
    }
  }
}

async function detectBrave() {
  try {
    braveBrowser = Boolean(await globalThis.navigator?.brave?.isBrave?.());
  } catch (_) {
    braveBrowser = false;
  }
  return braveBrowser;
}

function setBraveHelp(visible) {
  if (ui.braveHelp) ui.braveHelp.hidden = !visible;
}

async function ensureBleClient() {
  if (bleClient) return bleClient;
  if (!globalThis.isSecureContext) {
    throw new Error("SECURE_CONTEXT_REQUIRED: abra el monitor desde HTTPS.");
  }

  const isBrave = braveBrowser || await detectBrave();
  if (!globalThis.navigator?.bluetooth) {
    if (isBrave) {
      setBraveHelp(true);
      throw new Error(`BRAVE_WEB_BLUETOOTH_DISABLED: active Web Bluetooth API en ${BRAVE_BLUETOOTH_FLAG} y reinicie Brave.`);
    }
    throw new Error("WEB_BLUETOOTH_UNAVAILABLE: use un navegador con Web Bluetooth habilitado.");
  }

  setBraveHelp(false);
  bleClient = createBleClient({ bluetooth: navigator.bluetooth });
  bleClient.subscribe(onBleEvent);
  return bleClient;
}

async function sendCommand(command) {
  const client = await ensureBleClient();
  const payload = { seq: commandSeq++, ...command };
  const description = [payload.cmd, payload.event].filter(Boolean).join(":");
  ui.lastCommand.textContent = `#${payload.seq} ${description} · enviando`;
  try {
    await client.sendCommand(payload);
    appendTimeline(`TX #${payload.seq}: ${description}`, "tx");
    ui.lastCommand.textContent = `#${payload.seq} ${description} · enviado`;
    return payload.seq;
  } catch (error) {
    ui.lastCommand.textContent = `#${payload.seq} · ERROR`;
    appendTimeline(`No se pudo enviar ${description}: ${error.message}`, "bad");
    throw error;
  }
}

async function connectTrainer() {
  ui.connectTrainer.disabled = true;
  try {
    const client = await ensureBleClient();
    await client.scanAndConnect();
  } catch (error) {
    let message = String(error?.message ?? error);
    if (/Web Bluetooth API globally disabled|BRAVE_WEB_BLUETOOTH_DISABLED/i.test(message)) {
      setBraveHelp(true);
      message = `BRAVE: active Web Bluetooth API en ${BRAVE_BLUETOOTH_FLAG}, reinicie Brave y vuelva a conectar.`;
    }
    ui.connectionStatus.textContent = "ERROR BLE";
    ui.connectionStatus.dataset.state = "incompatible";
    ui.bleDiagnostic.textContent = message;
    appendTimeline(message, "bad");
  } finally {
    ui.connectTrainer.disabled = false;
    setRemoteAvailability();
  }
}

async function startCase() {
  if (caseActive) {
    appendTimeline("Inicio ignorado: ya hay un caso activo.", "warn");
    setRemoteAvailability();
    return;
  }

  caseActive = true;
  ui.startCase.disabled = true;
  setBuilderLocked(true);

  activeCase = createSession(currentSelection());
  hintsUsed = 0;
  try {
    await sendCommand({
    cmd: "load",
    scenario: activeCase.scenarioId,
    twist: activeCase.twistId,
    clinical: activeCase.clinicalId
  });
    await sendCommand({ cmd: "start" });
    appendTimeline(`Caso iniciado: ${activeCase.scenarioId} + ${activeCase.twistId} + ${activeCase.clinicalId}`, "good");
  } catch (error) {
    caseActive = false;
    setBuilderLocked(false);
    throw error;
  } finally {
    setRemoteAvailability();
  }
}

async function endCase() {
  await sendCommand({ cmd: "end" });
  caseActive = false;
  setBuilderLocked(false);
  appendTimeline("Caso finalizado por el instructor.", "warn");
  setRemoteAvailability();
}

async function restartCase() {
  await sendCommand({ cmd: "restart" });
  hintsUsed = 0;
  appendTimeline("Caso reiniciado.", "warn");
  updateHintControl();
}

function bindCommand(button, commandFactory) {
  button.addEventListener("click", async () => {
    button.disabled = true;
    try { await sendCommand(commandFactory()); }
    catch (_) {}
    finally { setRemoteAvailability(); }
  });
}

async function clearLegacyOfflineSupport() {
  try {
    if (globalThis.navigator?.serviceWorker?.getRegistrations) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        if (registration.scope.includes("/Medicine/AED-Trainer/")) {
          await registration.unregister();
        }
      }
    }

    if (globalThis.caches?.keys) {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("aed-teacher-monitor-"))
          .map((name) => caches.delete(name))
      );
    }
  } catch (error) {
    appendTimeline(`Limpieza de caché previa: ${error.message}`, "warn");
  }
}

async function updateBrowserBleStatus() {
  const isBrave = await detectBrave();

  if (!globalThis.isSecureContext) {
    ui.browserBleStatus.textContent = "NAVEGADOR BLE: REQUIERE HTTPS";
    setBraveHelp(false);
    return;
  }

  if (!globalThis.navigator?.bluetooth) {
    if (isBrave) {
      ui.browserBleStatus.textContent = "BRAVE BLE: ACTIVE WEB BLUETOOTH";
      setBraveHelp(true);
    } else {
      ui.browserBleStatus.textContent = "NAVEGADOR BLE: NO DISPONIBLE";
      setBraveHelp(false);
    }
    return;
  }

  ui.browserBleStatus.textContent = isBrave ? "BRAVE BLE: LISTO" : "NAVEGADOR BLE: LISTO";
  setBraveHelp(false);
}

fillSelect(ui.baseScenario, AED_SCENARIOS);
fillSelect(ui.sceneTwist, SCENE_TWISTS);
fillSelect(ui.clinicalCondition, CLINICAL_CASES);

for (const select of [ui.baseScenario, ui.sceneTwist, ui.clinicalCondition]) {
  select.addEventListener("change", renderCaseSummary);
}

ui.connectTrainer.addEventListener("click", connectTrainer);

ui.copyBraveFlag?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(BRAVE_BLUETOOTH_FLAG);
    ui.copyBraveFlag.textContent = "COPIADO";
    setTimeout(() => { ui.copyBraveFlag.textContent = "COPIAR DIRECCIÓN"; }, 1400);
  } catch (_) {
    ui.bleDiagnostic.textContent = BRAVE_BLUETOOTH_FLAG;
  }
});
ui.startCase.addEventListener("click", async () => {
  if (ui.startCase.disabled || caseActive) return;
  ui.startCase.disabled = true;
  try { await startCase(); } catch (_) {}
  finally { setRemoteAvailability(); }
});
ui.giveHint.addEventListener("click", async () => {
  try { await sendCommand({ cmd: "hint" }); } catch (_) {}
  setRemoteAvailability();
});

bindCommand(ui.forceShock, () => ({ cmd: "event", event: "FORCE_SHOCK" }));
bindCommand(ui.forceNoShock, () => ({ cmd: "event", event: "FORCE_NO_SHOCK" }));
bindCommand(ui.triggerRefib, () => ({ cmd: "event", event: "REFIBRILLATION" }));
bindCommand(ui.padFault, () => ({ cmd: "event", event: "PAD_FAULT" }));
bindCommand(ui.clearPadFault, () => ({ cmd: "event", event: "CLEAR_PAD_FAULT" }));

ui.movement.addEventListener("click", async () => {
  ui.movement.disabled = true;
  try {
    await sendCommand({ cmd: "event", event: "MOVEMENT" });
    movementActive = true;
    appendTimeline("Movimiento / artefacto ACTIVADO: el análisis queda bloqueado.", "warn");
  } catch (_) {}
  finally { setRemoteAvailability(); }
});

ui.clearMovement.addEventListener("click", async () => {
  ui.clearMovement.disabled = true;
  try {
    await sendCommand({ cmd: "event", event: "CLEAR_MOVEMENT" });
    movementActive = false;
    appendTimeline("Movimiento retirado: el DEA puede reanudar el análisis.", "good");
  } catch (_) {}
  finally { setRemoteAvailability(); }
});
bindCommand(ui.standClearViolation, () => ({ cmd: "event", event: "STAND_CLEAR_VIOLATION" }));
bindCommand(ui.clearStandClearViolation, () => ({ cmd: "event", event: "CLEAR_STAND_CLEAR_VIOLATION" }));
bindCommand(ui.pauseCase, () => ({ cmd: "pause" }));
bindCommand(ui.resumeCase, () => ({ cmd: "resume" }));
ui.restartCase.addEventListener("click", async () => { try { await restartCase(); } catch (_) {} });
ui.endCase.addEventListener("click", async () => { try { await endCase(); } catch (_) {} });

renderCaseSummary();
setRemoteAvailability();
clearLegacyOfflineSupport();
updateBrowserBleStatus();
appendTimeline("Teacher Monitor preparado. Encienda el DEA y pulse CONECTAR / RECONECTAR DEA.");
