import test from "node:test";
import assert from "node:assert/strict";

import {
  AED_SERVICE_UUID,
  DEVICE_STATUS_UUID,
  TRAINER_STATE_UUID,
  INSTRUCTOR_COMMAND_UUID,
  EVENT_STREAM_UUID
} from "../ble-protocol.js";
import { createBleClient } from "../ble-client.js";

const enc = new TextEncoder();

class FakeCharacteristic {
  constructor(text = "") {
    this.text = text;
    this.listeners = new Map();
    this.writes = [];
    this.readImpl = null;
  }
  async readValue() {
    if (this.readImpl) return this.readImpl();
    const bytes = enc.encode(this.text);
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }
  async startNotifications() { return this; }
  addEventListener(name, handler) { this.listeners.set(name, handler); }
  async writeValueWithResponse(bytes) { this.writes.push(new Uint8Array(bytes)); }
  emit(text) {
    const bytes = enc.encode(text);
    const value = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.listeners.get("characteristicvaluechanged")?.({ target: { value } });
  }
}

function makeRig({ statusText, stateText } = {}) {
  const chars = new Map([
    [DEVICE_STATUS_UUID, new FakeCharacteristic(statusText ?? "v=1;type=status;seq=1;device=DEA01;firmware=0.1.0;battery=90")],
    [TRAINER_STATE_UUID, new FakeCharacteristic(stateText ?? "v=1;type=state;seq=2;device=DEA01;state=CPR;scenario=A1;twist=T0;clinical=C0;analysis=1;shock=0;pads=1;hints=0")],
    [INSTRUCTOR_COMMAND_UUID, new FakeCharacteristic()],
    [EVENT_STREAM_UUID, new FakeCharacteristic()]
  ]);
  const service = { getCharacteristic: async (uuid) => chars.get(uuid) };
  const server = { getPrimaryService: async (uuid) => { assert.equal(uuid, AED_SERVICE_UUID); return service; } };
  const deviceListeners = new Map();
  const device = {
    id: "fake-device",
    name: "AED Trainer 01",
    addEventListener: (name, handler) => deviceListeners.set(name, handler),
    gatt: {
      connected: false,
      connect: async () => { device.gatt.connected = true; return server; }
    },
    disconnectNow() {
      device.gatt.connected = false;
      deviceListeners.get("gattserverdisconnected")?.({ target: device });
    }
  };
  const bluetooth = {
    requests: [],
    async requestDevice(options) {
      this.requests.push(options);
      return device;
    }
  };
  return { bluetooth, device, chars };
}

test("scan finds AED Trainer by advertised name, requests service access, syncs and becomes ready", async () => {
  const rig = makeRig();
  const client = createBleClient({ bluetooth: rig.bluetooth });
  const events = [];
  client.subscribe((event) => events.push(event));
  await client.scanAndConnect();

  assert.deepEqual(rig.bluetooth.requests[0].filters, [{ namePrefix: "AED Trainer" }]);
  assert.deepEqual(rig.bluetooth.requests[0].optionalServices, [AED_SERVICE_UUID]);
  assert.equal(client.getConnectionState(), "ready");
  assert.ok(events.some((e) => e.kind === "status" && e.message.device === "DEA01"));
  assert.ok(events.some((e) => e.kind === "state" && e.message.state === "CPR"));
});

test("sendCommand writes encoded data only while ready", async () => {
  const rig = makeRig();
  const client = createBleClient({ bluetooth: rig.bluetooth });
  await assert.rejects(() => client.sendCommand({ seq: 1, cmd: "pause" }), /ready/i);
  await client.scanAndConnect();
  await client.sendCommand({ seq: 3, cmd: "pause" });
  const writes = rig.chars.get(INSTRUCTOR_COMMAND_UUID).writes;
  assert.equal(writes.length, 1);
  assert.match(new TextDecoder().decode(writes[0]), /cmd=pause/);
});

test("disconnect marks client disconnected", async () => {
  const rig = makeRig();
  const client = createBleClient({ bluetooth: rig.bluetooth });
  await client.scanAndConnect();
  rig.device.disconnectNow();
  assert.equal(client.getConnectionState(), "disconnected");
});

test("reconnect remains syncing until authoritative reads complete", async () => {
  const rig = makeRig();
  const client = createBleClient({ bluetooth: rig.bluetooth });
  await client.scanAndConnect();
  rig.device.disconnectNow();

  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const statusChar = rig.chars.get(DEVICE_STATUS_UUID);
  statusChar.readImpl = async () => {
    await gate;
    const bytes = enc.encode(statusChar.text);
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  };

  const pending = client.scanAndConnect();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(client.getConnectionState(), "syncing");
  release();
  await pending;
  assert.equal(client.getConnectionState(), "ready");
});

test("incompatible protocol blocks remote commands", async () => {
  const rig = makeRig({ statusText: "v=2;type=status;seq=1;device=DEA01;firmware=2.0;battery=90" });
  const client = createBleClient({ bluetooth: rig.bluetooth });
  await client.scanAndConnect();
  assert.equal(client.getConnectionState(), "incompatible");
  await assert.rejects(() => client.sendCommand({ seq: 2, cmd: "pause" }), /ready/i);
});

test("duplicate event sequence IDs do not emit duplicate timeline events", async () => {
  const rig = makeRig();
  const client = createBleClient({ bluetooth: rig.bluetooth });
  const events = [];
  client.subscribe((event) => events.push(event));
  await client.scanAndConnect();

  const eventChar = rig.chars.get(EVENT_STREAM_UUID);
  eventChar.emit("v=1;type=event;seq=44;event=SHOCK_PRESS");
  eventChar.emit("v=1;type=event;seq=44;event=SHOCK_PRESS");

  assert.equal(events.filter((e) => e.kind === "event" && e.message.seq === 44).length, 1);
});

test("event sequence namespace is reset after authoritative reconnect", async () => {
  const rig = makeRig();
  const client = createBleClient({ bluetooth: rig.bluetooth });
  const events = [];
  client.subscribe((event) => events.push(event));
  await client.scanAndConnect();

  const eventChar = rig.chars.get(EVENT_STREAM_UUID);
  eventChar.emit("v=1;type=event;seq=1;event=BEFORE_REBOOT");
  rig.device.disconnectNow();

  await client.scanAndConnect();
  eventChar.emit("v=1;type=event;seq=1;event=AFTER_REBOOT");

  assert.equal(events.filter((e) => e.kind === "event" && e.message.seq === 1).length, 2);
  assert.ok(events.some((e) => e.kind === "event" && e.message.event === "AFTER_REBOOT"));
});
