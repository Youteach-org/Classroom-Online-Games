import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const generator=readFileSync(join(root,'scripts','generate-pronunciation.py'),'utf8');
const index=readFileSync(join(root,'index.html'),'utf8');
const policy=readFileSync(join(root,'..','docs','superpowers','decisions','2026-09-15-verb-runner-pronunciation-policy.md'),'utf8');

test('ambiguous isolated verb homographs use explicit verb phonemes',()=>{
  assert.match(generator,/VERB_PHONEME_OVERRIDES\s*=\s*\{[\s\S]*['"]live['"]\s*:\s*['"]lˈɪv['"]/);
  assert.match(generator,/VERB_PHONEME_OVERRIDES\s*=\s*\{[\s\S]*['"]close['"]\s*:\s*['"]klˈOz['"]/);
  assert.match(generator,/VERB_PHONEME_OVERRIDES\s*=\s*\{[\s\S]*['"]use['"]\s*:\s*['"]jˈuz['"]/);
  assert.match(generator,/VERB_PHONEME_OVERRIDES\s*=\s*\{[\s\S]*['"]used['"]\s*:\s*['"]jˈuzd['"]/);
  assert.match(generator,/VERB_PHONEME_OVERRIDES\s*=\s*\{[\s\S]*['"]read::base['"]\s*:\s*['"]ɹˈid['"]/);
  assert.match(generator,/VERB_PHONEME_OVERRIDES\s*=\s*\{[\s\S]*['"]read::past['"]\s*:\s*['"]ɹˈɛd['"]/);
  assert.match(generator,/generate_from_tokens\(/);
});

test('pronunciation correction or override changes the generated asset filename',()=>{
  assert.match(generator,/pronunciation_signature/);
  assert.match(generator,/reviewed-correction/);
  assert.match(generator,/sha1\(pronunciation_signature\(key, corrections\)\.encode\('utf-8'\)\)/);
});

test('non-ambiguous answers keep their existing asset hashes',()=>{
  assert.match(generator,/return f'\{key\}\|\{phonemes\}' if phonemes else key/);
});

test('Verb Runner cache-busts pronunciation manifest changes',()=>{
  assert.match(index,/pronunciation-manifest\.js\?v=ambiguous-verbs-20260915-1/);
});

test('Kokoro Bella is the locked generation profile for corrections',()=>{
  assert.match(generator,/VOICE\s*=\s*['"]af_bella['"]/);
  assert.match(generator,/SPEED\s*=\s*0\.8/);
  assert.match(generator,/SAMPLE_RATE\s*=\s*24000/);
  assert.match(generator,/LEAD_SILENCE_SECONDS\s*=\s*0\.04/);
  assert.match(generator,/TAIL_SILENCE_SECONDS\s*=\s*0\.35/);
  assert.match(generator,/KPipeline\(lang_code=['"]a['"]\)/);
  assert.match(generator,/subtype=['"]PCM_16['"]/);
  assert.match(generator,/ALLOW_KOKORO_BELLA_GENERATION/);
  assert.match(generator,/Missing Kokoro Bella pronunciation asset/);
  assert.match(policy,/Kokoro Bella/i);
  assert.match(policy,/af_bella/);
  assert.doesNotMatch(policy,/official pronunciation voice.*Nichalia/i);
});

test('Nichalia clips are explicitly transitional rather than the correction policy',()=>{
  assert.match(generator,/TRANSITIONAL_EXTERNAL_AUDIO/);
  assert.match(policy,/Transitional Nichalia clips/);
  assert.match(policy,/not.*acoustic reference/i);
});

test('contextual pronunciation aliases stay in the generated manifest model',()=>{
  assert.match(generator,/CONTEXTUAL_KEYS\s*=\s*\{['"]read::base['"],\s*['"]read::past['"]\}/);
  assert.match(generator,/set\(answers\)\s*\|\s*CONTEXTUAL_KEYS/);
});

test('teacher-approved voice exceptions bypass Bella regeneration only for explicit sources',()=>{
  assert.match(generator,/approved_source_url/);
  assert.match(generator,/approved external voice exception/);
  assert.match(policy,/Approved voice exceptions/);
  assert.match(policy,/`build`[\s\S]*`fancy`/);
  assert.match(policy,/`washed`[\s\S]*`fancy`/);
});
