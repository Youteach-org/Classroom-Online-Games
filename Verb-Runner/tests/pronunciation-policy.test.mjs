import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const generator=readFileSync(join(root,'scripts','generate-pronunciation.py'),'utf8');
const index=readFileSync(join(root,'index.html'),'utf8');
const manifest=readFileSync(join(root,'pronunciation-manifest.js'),'utf8');

test('ambiguous isolated verb homographs use explicit verb phonemes',()=>{
  assert.match(generator,/VERB_PHONEME_OVERRIDES\s*=\s*\{[\s\S]*['"]live['"]\s*:\s*['"]lˈɪv['"]/);
  assert.match(generator,/VERB_PHONEME_OVERRIDES\s*=\s*\{[\s\S]*['"]close['"]\s*:\s*['"]klˈOz['"]/);
  assert.match(generator,/VERB_PHONEME_OVERRIDES\s*=\s*\{[\s\S]*['"]use['"]\s*:\s*['"]jˈuz['"]/);
  assert.match(generator,/VERB_PHONEME_OVERRIDES\s*=\s*\{[\s\S]*['"]used['"]\s*:\s*['"]jˈuzd['"]/);
  assert.match(generator,/VERB_PHONEME_OVERRIDES\s*=\s*\{[\s\S]*['"]read::base['"]\s*:\s*['"]ɹˈid['"]/);
  assert.match(generator,/VERB_PHONEME_OVERRIDES\s*=\s*\{[\s\S]*['"]read::past['"]\s*:\s*['"]ɹˈɛd['"]/);
  assert.match(generator,/generate_from_tokens\(/);
});

test('pronunciation override changes the generated asset filename',()=>{
  assert.match(generator,/pronunciation_signature/);
  assert.match(generator,/sha1\(pronunciation_signature\(key\)\.encode\('utf-8'\)\)/);
});

test('non-ambiguous answers keep their existing asset hashes',()=>{
  assert.match(generator,/return f'\{key\}\|\{phonemes\}' if phonemes else key/);
});

test('Verb Runner cache-busts pronunciation manifest changes',()=>{
  assert.match(index,/pronunciation-manifest\.js\?v=ambiguous-verbs-20260915-1/);
});

test('Nichalia is the locked pronunciation voice for all protected ambiguous forms',()=>{
  assert.match(generator,/APPROVED_VOICE_NAME\s*=\s*['"]Nichalia['"]/);
  assert.match(generator,/APPROVED_VOICE_ID\s*=\s*['"]XfNU2rGpBa01ckF309OY['"]/);
  assert.match(generator,/Missing approved Nichalia asset/);
  assert.match(generator,/APPROVED_AUDIO_OVERRIDES/);

  for(const key of ['live','close','use','used','read::base','read::past']){
    const escaped=key.replace(/[.*+?^$()|[\]{}\\]/g,'\\$&');
    assert.match(generator,new RegExp("['\"]"+escaped+"['\"]\\s*:\\s*['\"]https:\\/\\/cdn\\.creativeclaw\\.co\\/"));
    assert.match(manifest,new RegExp('"'+escaped+'"\\s*:\\s*"https:\\/\\/cdn\\.creativeclaw\\.co\\/'));
  }
});

test('manifest generation includes approved aliases that are not literal game answers',()=>{
  assert.match(generator,/set\(answers\)\s*\|\s*set\(APPROVED_AUDIO_OVERRIDES\)/);
});
