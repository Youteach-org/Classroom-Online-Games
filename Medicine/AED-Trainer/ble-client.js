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
    const [status, state, command, events] = await Promise.all([
      service.getCharacteristic(DEVICE_STATUS_UUID),
      service.getCharacteristic(TRAINER_STATE_UUID),
      service.getCharacteristic(INSTRUCTOR_COMMAND_UUID),
      service.getCharacteristic(EVENT_STREAM_UUID)
    ]);
    characteristics = { status, state, command, events };

    await state.startNotifications();
    state.addEventListener("characteristicvaluechanged", handleStateNotification);
    await events.startNotifications();
    events.addEventListener("characteristicvaluechanged", handleEventNotification);
  }

  async function readAuthoritativeState() {
    if (!characteristics) throw new Error("BLE characteristics are not ready");

    setConnectionState("syncing");
    const [statusValue, stateValue] = await Promise.all([
      characteristics.status.readValue(),
      characteristics.state.readValue()
    ]);

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

  async function scanAndConnect() {
    setConnectionState("connecting");
    try {
      const selected = await bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [AED_SERVICE_UUID]
      });
      emit("diagnostic", {
        stage: "selected",
        device: selected.name || selected.id || "Dispositivo sin nombre"
      });
      bindDevice(selected);

      let server;
      try {
        emit("diagnostic", { stage: "gatt", device: selected.name || selected.id || "—" });
        server = await selected.gatt.connect();
      } catch (error) {
        throw new Error(`GATT_CONNECT_FAILED: ${error?.message ?? error}`);
      }

      let service;
      try {
        emit("diagnostic", { stage: "service", device: selected.name || selected.id || "—" });
        service = await server.getPrimaryService(AED_SERVICE_UUID);
      } catch (error) {
        throw new Error(`AED_SERVICE_NOT_FOUND: ${error?.message ?? error}`);
      }

      try {
        await resolveCharacteristics(service);
      } catch (error) {
        throw new Error(`AED_CHARACTERISTICS_FAILED: ${error?.message ?? error}`);
      }

      return await readAuthoritativeState();
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
