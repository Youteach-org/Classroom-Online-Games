import {
  AED_SERVICE_UUID,
  DEVICE_STATUS_UUID,
  TRAINER_STATE_UUID,
  INSTRUCTOR_COMMAND_UUID,
  EVENT_STREAM_UUID,
  encodeCommand,
  decodeMessage,
  validateStateMessage
} from "./ble-protocol.js";

export function createBleClient({ bluetooth }) {
  if (!bluetooth || typeof bluetooth.requestDevice !== "function") {
    throw new Error("Web Bluetooth is unavailable");
  }

  let connectionState = "disconnected";
  let device = null;
  let boundDevice = null;
  let characteristics = null;
  const listeners = new Set();
  const seenEventSeqs = new Set();
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function emit(kind, message) {
    for (const listener of listeners) {
      try { listener({ kind, message }); } catch (_) {}
    }
  }

  function setConnectionState(next) {
    connectionState = next;
    emit("connection", { state: next });
  }

  function handleDisconnect() {
    characteristics = null;
    setConnectionState("disconnected");
  }

  function bindDevice(nextDevice) {
    device = nextDevice;
    if (boundDevice !== nextDevice) {
      nextDevice.addEventListener?.("gattserverdisconnected", handleDisconnect);
      boundDevice = nextDevice;
    }
  }

  function handleStateNotification(event) {
    const message = decodeMessage(event.target.value);
    if (!validateStateMessage(message)) return;
    emit("state", message);
  }

  function handleEventNotification(event) {
    const message = decodeMessage(event.target.value);
    if (message.type !== "event" || !Number.isInteger(message.seq)) return;
    if (seenEventSeqs.has(message.seq)) return;
    seenEventSeqs.add(message.seq);
    emit("event", message);
  }

  async function resolveCharacteristics(service) {
    // Android's Web Bluetooth stack is sensitive to overlapping GATT operations.
    // Resolve and subscribe strictly one operation at a time.
    const status = await service.getCharacteristic(DEVICE_STATUS_UUID);
    await sleep(40);
    const state = await service.getCharacteristic(TRAINER_STATE_UUID);
    await sleep(40);
    const command = await service.getCharacteristic(INSTRUCTOR_COMMAND_UUID);
    await sleep(40);
    const events = await service.getCharacteristic(EVENT_STREAM_UUID);
    characteristics = { status, state, command, events };

    await sleep(80);
    await state.startNotifications();
    state.addEventListener("characteristicvaluechanged", handleStateNotification);

    await sleep(120);
    await events.startNotifications();
    events.addEventListener("characteristicvaluechanged", handleEventNotification);
    await sleep(120);
  }

  async function readAuthoritativeState() {
    if (!characteristics) throw new Error("BLE characteristics are not ready");

    setConnectionState("syncing");

    // Keep reads serialized as well. Parallel reads are a common source of
    // "GATT operation failed for unknown reason" on Chromium/Android.
    const statusValue = await characteristics.status.readValue();
    await sleep(80);
    const stateValue = await characteristics.state.readValue();

    const statusMessage = decodeMessage(statusValue);
    if (statusMessage.type !== "status" || !statusMessage.device) {
      throw new Error("Invalid device status");
    }

    const stateMessage = decodeMessage(stateValue);
    if (!validateStateMessage(stateMessage)) {
      throw new Error("Invalid trainer state");
    }

    // A physical trainer reboot restarts its event sequence counter. Once the
    // authoritative status/state pair has been reread, begin a fresh event
    // namespace so valid post-reboot events are not mistaken for old duplicates.
    seenEventSeqs.clear();

    emit("status", statusMessage);
    emit("state", stateMessage);
    setConnectionState("ready");
    return { status: statusMessage, state: stateMessage };
  }

  async function connectSelected(selected) {
    bindDevice(selected);
    const label = selected.name || selected.id || "Dispositivo sin nombre";
    emit("diagnostic", { stage: "selected", device: label });

    let lastError = null;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        characteristics = null;

        emit("diagnostic", {
          stage: "gatt",
          device: label,
          attempt
        });

        if (selected.gatt?.connected) {
          selected.gatt.disconnect();
          await sleep(350);
        }

        const server = await selected.gatt.connect();
        // Android often reports the transport connected before service
        // discovery is actually ready.
        await sleep(550);

        emit("diagnostic", {
          stage: "service",
          device: label,
          attempt
        });

        const service = await server.getPrimaryService(AED_SERVICE_UUID);
        await sleep(120);
        await resolveCharacteristics(service);
        return await readAuthoritativeState();
      } catch (error) {
        lastError = error;
        emit("diagnostic", {
          stage: "retry",
          device: label,
          attempt,
          error: String(error?.message ?? error)
        });

        try {
          if (selected.gatt?.connected) selected.gatt.disconnect();
        } catch (_) {}

        if (attempt < 3) {
          await sleep(attempt === 1 ? 900 : 1500);
        }
      }
    }

    throw new Error(
      `BLE_CONNECT_FAILED: ${String(lastError?.message ?? lastError ?? "sin detalle")}. ` +
      "Apague cualquier otro Teacher Monitor conectado al DEA, reinicie el DEA y vuelva a intentar."
    );
  }

  async function scanAndConnect() {
    setConnectionState("connecting");
    try {
      const selected = await bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [AED_SERVICE_UUID]
      });
      return await connectSelected(selected);
    } catch (error) {
      if (/protocol version/i.test(String(error?.message ?? error))) {
        setConnectionState("incompatible");
        return null;
      }
      setConnectionState("disconnected");
      throw error;
    }
  }

  async function sendCommand(command) {
    if (connectionState !== "ready" || !characteristics?.command) {
      throw new Error("BLE client is not ready");
    }
    const bytes = encodeCommand(command);
    if (typeof characteristics.command.writeValueWithResponse === "function") {
      await characteristics.command.writeValueWithResponse(bytes);
    } else if (typeof characteristics.command.writeValue === "function") {
      await characteristics.command.writeValue(bytes);
    } else if (typeof characteristics.command.writeValueWithoutResponse === "function") {
      await characteristics.command.writeValueWithoutResponse(bytes);
    } else {
      throw new Error("BLE command characteristic is not writable");
    }
  }

  function disconnect() {
    if (device?.gatt?.connected && typeof device.gatt.disconnect === "function") {
      device.gatt.disconnect();
    }
    characteristics = null;
    setConnectionState("disconnected");
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getConnectionState() {
    return connectionState;
  }

  return {
    scanAndConnect,
    disconnect,
    sendCommand,
    readAuthoritativeState,
    subscribe,
    getConnectionState
  };
}
