export const AED_PROTOCOL_VERSION = 1;

export const AED_SERVICE_UUID = "7e57a000-6f73-4f67-9a2c-0b8d1f2e3a40";
export const DEVICE_STATUS_UUID = "7e57a001-6f73-4f67-9a2c-0b8d1f2e3a40";
export const TRAINER_STATE_UUID = "7e57a002-6f73-4f67-9a2c-0b8d1f2e3a40";
export const INSTRUCTOR_COMMAND_UUID = "7e57a003-6f73-4f67-9a2c-0b8d1f2e3a40";
export const EVENT_STREAM_UUID = "7e57a004-6f73-4f67-9a2c-0b8d1f2e3a40";
export const ECG_STREAM_UUID = "7e57a005-6f73-4f67-9a2c-0b8d1f2e3a40";

const TOKEN_RE = /^[A-Za-z0-9_.:-]+$/;

function assertToken(name, value) {
  const token = String(value);
  if (!TOKEN_RE.test(token)) throw new Error(`Invalid token for ${name}`);
  return token;
}

function toText(input) {
  if (typeof input === "string") return input;
  if (input instanceof DataView) {
    return new TextDecoder().decode(new Uint8Array(input.buffer, input.byteOffset, input.byteLength));
  }
  if (input instanceof ArrayBuffer) return new TextDecoder().decode(new Uint8Array(input));
  if (ArrayBuffer.isView(input)) {
    return new TextDecoder().decode(new Uint8Array(input.buffer, input.byteOffset, input.byteLength));
  }
  throw new Error("Unsupported BLE message input");
}

export function encodeCommand(command) {
  if (!command || !Number.isInteger(command.seq) || command.seq < 0) {
    throw new Error("Command seq is required and must be a non-negative integer");
  }
  if (!command.cmd) throw new Error("Command cmd is required");

  const fields = [
    ["v", AED_PROTOCOL_VERSION],
    ["type", "cmd"],
    ["seq", command.seq]
  ];

  for (const [key, value] of Object.entries(command)) {
    if (key === "v" || key === "type" || key === "seq") continue;
    fields.push([key, value]);
  }

  const text = fields
    .map(([key, value]) => `${assertToken("key", key)}=${assertToken(key, value)}`)
    .join(";");

  const bytes = new TextEncoder().encode(text);
  if (bytes.byteLength >= 180) throw new Error("BLE command exceeds v1 payload budget");
  return bytes;
}

export function decodeMessage(input) {
  const text = toText(input).trim();
  if (!text) throw new Error("Empty BLE message");

  const message = {};
  for (const part of text.split(";")) {
    const index = part.indexOf("=");
    if (index <= 0) throw new Error("Malformed BLE field");
    const key = part.slice(0, index);
    const value = part.slice(index + 1);
    assertToken("key", key);
    assertToken(key, value);
    if (Object.prototype.hasOwnProperty.call(message, key)) {
      throw new Error(`Duplicate BLE key: ${key}`);
    }
    message[key] = value;
  }

  if (!Object.prototype.hasOwnProperty.call(message, "v")) {
    throw new Error("Missing protocol version");
  }
  const version = Number(message.v);
  if (version !== AED_PROTOCOL_VERSION) throw new Error("Unsupported protocol version");
  message.v = version;

  if (Object.prototype.hasOwnProperty.call(message, "seq")) {
    if (!/^\d+$/.test(message.seq)) throw new Error("Invalid sequence ID");
    message.seq = Number(message.seq);
  }

  return message;
}

export function validateStateMessage(message) {
  if (!message || message.v !== AED_PROTOCOL_VERSION || message.type !== "state") return false;
  if (!Number.isInteger(message.seq) || message.seq < 0) return false;

  for (const key of ["device", "state", "scenario", "twist", "clinical"]) {
    if (typeof message[key] !== "string" || !TOKEN_RE.test(message[key])) return false;
  }

  if (!/^\d+$/.test(String(message.analysis ?? ""))) return false;
  if (!/^[01]$/.test(String(message.shock ?? ""))) return false;
  if (!/^[01]$/.test(String(message.pads ?? ""))) return false;
  if (message.movement !== undefined && !/^[01]$/.test(String(message.movement))) return false;
  if (!/^\d+$/.test(String(message.hints ?? ""))) return false;
  return true;
}
