import test from "node:test";
import assert from "node:assert/strict";

import {
  AED_PROTOCOL_VERSION,
  AED_SERVICE_UUID,
  DEVICE_STATUS_UUID,
  TRAINER_STATE_UUID,
  INSTRUCTOR_COMMAND_UUID,
  EVENT_STREAM_UUID,
  ECG_STREAM_UUID,
  encodeCommand,
  decodeMessage,
  validateStateMessage
} from "../ble-protocol.js";

test("protocol v1 UUIDs are frozen", () => {
  assert.equal(AED_PROTOCOL_VERSION, 1);
  assert.equal(AED_SERVICE_UUID, "7e57a000-6f73-4f67-9a2c-0b8d1f2e3a40");
  assert.equal(DEVICE_STATUS_UUID, "7e57a001-6f73-4f67-9a2c-0b8d1f2e3a40");
  assert.equal(TRAINER_STATE_UUID, "7e57a002-6f73-4f67-9a2c-0b8d1f2e3a40");
  assert.equal(INSTRUCTOR_COMMAND_UUID, "7e57a003-6f73-4f67-9a2c-0b8d1f2e3a40");
  assert.equal(EVENT_STREAM_UUID, "7e57a004-6f73-4f67-9a2c-0b8d1f2e3a40");
  assert.equal(ECG_STREAM_UUID, "7e57a005-6f73-4f67-9a2c-0b8d1f2e3a40");
});

test("case-load, live-event, hint and lifecycle commands round-trip", () => {
  const samples = [
    { seq: 12, cmd: "load", scenario: "A1", twist: "T2", clinical: "C1" },
    { seq: 13, cmd: "event", event: "MOVEMENT" },
    { seq: 14, cmd: "hint" },
    { seq: 15, cmd: "pause" },
    { seq: 16, cmd: "resume" },
    { seq: 17, cmd: "end" }
  ];
  for (const sample of samples) {
    const bytes = encodeCommand(sample);
    const decoded = decodeMessage(bytes);
    assert.equal(decoded.v, 1);
    assert.equal(decoded.type, "cmd");
    assert.equal(decoded.seq, sample.seq);
    for (const [key, value] of Object.entries(sample)) {
      assert.equal(decoded[key], value);
    }
    assert.ok(bytes.byteLength < 180);
  }
});

test("decoder rejects duplicate keys, illegal token characters and wrong versions", () => {
  assert.throws(() => decodeMessage("v=1;type=state;seq=1;seq=2"), /duplicate/i);
  assert.throws(() => decodeMessage("v=1;type=state;seq=1;state=WAIT ING"), /token/i);
  assert.throws(() => decodeMessage("type=state;seq=1;state=CPR"), /version/i);
  assert.throws(() => decodeMessage("v=2;type=state;seq=1;state=CPR"), /version/i);
});

test("encoder rejects missing sequence IDs and unsafe values", () => {
  assert.throws(() => encodeCommand({ cmd: "pause" }), /seq/i);
  assert.throws(() => encodeCommand({ seq: 1, cmd: "event", event: "MOVEMENT;DROP" }), /token/i);
});

test("state validator accepts required fields and rejects malformed state", () => {
  const good = decodeMessage("v=1;type=state;seq=5;device=DEA01;state=CPR;scenario=A1;twist=T0;clinical=C0;analysis=1;shock=0;pads=1;hints=0");
  assert.equal(validateStateMessage(good), true);
  assert.equal(validateStateMessage({ ...good, type: "event" }), false);
  assert.equal(validateStateMessage({ ...good, state: "" }), false);
  const { device, ...withoutDevice } = good;
  assert.equal(validateStateMessage(withoutDevice), false);
});

test("representative full command payload stays under the v1 size budget", () => {
  const bytes = encodeCommand({
    seq: 999999,
    cmd: "load",
    scenario: "A8",
    twist: "T8",
    clinical: "C16",
    device: "AED_TRAINER_001"
  });
  assert.ok(bytes.byteLength < 180, bytes.byteLength);
});
