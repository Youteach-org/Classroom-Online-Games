import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const fw = join(root, "firmware", "aed-trainer");
const config = readFileSync(join(fw, "hardware-config.h"), "utf8");
const header = readFileSync(join(fw, "audio-player.h"), "utf8");
const cpp = readFileSync(join(fw, "audio-player.cpp"), "utf8");
const promptMap = readFileSync(join(fw, "prompt-map.h"), "utf8");
const script = JSON.parse(readFileSync(join(root, "audio", "prompt-script.json"), "utf8"));

test("audio uses the proven ESP_I2S path and bench pins", () => {
  assert.match(cpp, /#include\s*<ESP_I2S\.h>/);
  assert.doesNotMatch(cpp + header, /driver\/i2s\.h/);
  assert.match(config, /I2S_DOUT\s*=\s*25/);
  assert.match(config, /I2S_LRC\s*=\s*26/);
  assert.match(config, /I2S_BCLK\s*=\s*27/);
});

test("audio assets come from internal LittleFS, never SD", () => {
  assert.match(cpp, /LittleFS/);
  assert.doesNotMatch(cpp + header, /SD\.h|SD_MMC|microSD/i);
});

test("player exposes safe failure for missing or invalid clips", () => {
  assert.match(header, /bool\s+playPrompt\s*\(/);
  assert.match(cpp, /if\s*\(!path\)\s*return\s+false/);
  assert.match(cpp, /if\s*\(!file\)\s*return\s+false/);
  assert.match(cpp, /return\s+false/);
});

test("every prompt script ID is mapped to its local filename", () => {
  for (const row of script.prompts) {
    assert.ok(promptMap.includes('"' + row.id + '"'), row.id);
    assert.ok(promptMap.includes('"/audio/' + row.filename + '"'), row.filename);
  }
});

test("WAV playback supports mono PCM16 and compact IMA-ADPCM, then outputs stereo I2S", () => {
  assert.match(cpp, /audioFormat\s*==\s*1|audioFormat\s*!=\s*1/);
  assert.match(cpp, /0x11|17/);
  assert.match(cpp, /channels\s*!=\s*1/);
  assert.match(cpp, /imaAdpcmDecodeNibble/);
  assert.match(cpp, /stereo\[i\s*\*\s*2\]/);
  assert.match(cpp, /stereo\[i\s*\*\s*2\s*\+\s*1\]/);
});

test("audio player exposes a local CPR metronome click independent of voice files", () => {
  assert.match(header, /bool\s+playMetronomeClick\s*\(/);
  assert.match(cpp, /playMetronomeClick/);
  assert.match(cpp, /16000/);
});


test("audio mounts the named littlefs partition used by partitions.csv", () => {
  const partitions = readFileSync(join(fw, "partitions.csv"), "utf8");
  assert.match(partitions, /littlefs\s*,\s*data/);
  assert.match(cpp, /LittleFS\.begin\(false,\s*"\/littlefs",\s*10,\s*"littlefs"\)/);
});


test("startup speaker self-test is generated locally over I2S", () => {
  assert.match(header, /playStartupTone/);
  assert.match(cpp, /AudioPlayer::playStartupTone/);
  assert.match(cpp, /playSquare\(740,\s*90\)/);
  assert.match(cpp, /playSquare\(1040,\s*130\)/);
  assert.match(cpp, /kAmplitude\s*=\s*12000/);
});


test("voice playback applies bounded digital gain and louder local tones", () => {
  assert.match(cpp, /kVoiceGainNumerator\s*=\s*11/);
  assert.match(cpp, /kVoiceGainDenominator\s*=\s*10/);
  assert.match(cpp, /std::clamp<std::int32_t>/);
  assert.match(cpp, /kAmplitude\s*=\s*12000/);
});


test("classroom voice image is mastered before LittleFS packaging", () => {
  const workflow = readFileSync(join(root, "..", "..", ".github", "workflows", "aed-firmware-ci.yml"), "utf8");
  assert.match(workflow, /Prepare classroom voice pack/);
  assert.match(workflow, /highpass=f=140/);
  assert.match(workflow, /acompressor=/);
  assert.match(workflow, /loudnorm=I=-13:LRA=4:TP=-1\.0/);
  assert.match(workflow, /alimiter=limit=0\.95/);
  assert.match(workflow, /dist\/classroom-audio/);
});


test("V15 keeps CPR I2S open across beats and reports explicit lifecycle methods", () => {
  assert.match(header, /beginCprMetronome/);
  assert.match(header, /endCprMetronome/);
  assert.match(cpp, /cprMetronomeActive_/);
  assert.match(cpp, /if \(!cprMetronomeActive_ && !beginCprMetronome\(\)\)/);
  const metronomeBody = cpp.match(/bool AudioPlayer::playMetronomeClick\(\)[\s\S]*?\n}/)?.[0] ?? "";
  assert.doesNotMatch(metronomeBody, /stop\(\);\s*return true/);
});

test("V15 shock playback uses the approved LittleFS effect instead of synthetic embedded shock code", () => {
  assert.match(cpp, /findPromptPath\("FX_SHOCK_ELECTRIC"\)/);
  assert.doesNotMatch(cpp, /shock-sample\.h/);
  const workflow = readFileSync(join(root, "..", "..", ".github", "workflows", "aed-firmware-ci.yml"), "utf8");
  assert.match(workflow, /Preserve the approved shock waveform exactly as committed/);
  assert.doesNotMatch(workflow, /Electrical shock: sharp crack/);
});

test("V15 includes the two approved startup voice assets", () => {
  const responsePath=join(root,"audio","assets","aed-check-response.wav");
  const breathingPath=join(root,"audio","assets","aed-check-breathing.wav");
  assert.ok(readFileSync(responsePath).length > 1000);
  assert.ok(readFileSync(breathingPath).length > 1000);
  assert.match(promptMap,/AED_CHECK_RESPONSE/);
  assert.match(promptMap,/AED_CHECK_BREATHING/);
});
