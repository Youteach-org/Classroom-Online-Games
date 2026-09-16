import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const corrections=JSON.parse(readFileSync(join(root,'pronunciation-corrections.json'),'utf8'));
const generator=readFileSync(join(root,'scripts','generate-pronunciation.py'),'utf8');

test('reviewed correction batch contains all 43 marked audios with clear instructions',()=>{
  const entries=Object.entries(corrections.items||{});
  assert.equal(entries.length,43);
  for(const [key,spec] of entries){
    assert.ok(spec.note?.trim(),key+' missing original note');
    assert.ok(spec.target_text?.trim(),key+' missing target text');
    assert.match(spec.ipa_goal||'',/^\/.+\/$/,key+' missing IPA goal');
    assert.ok(spec.instruction?.trim(),key+' missing correction instruction');
    assert.ok(['g2p_tokens','raw_phonemes'].includes(spec.method),key+' invalid method');
  }
});

test('reviewed replacements retain the locked Kokoro Bella production profile',()=>{
  assert.equal(corrections.profile.engine,'Kokoro');
  assert.equal(corrections.profile.lang_code,'a');
  assert.equal(corrections.profile.voice,'af_bella');
  assert.equal(corrections.profile.speed,0.8);
  assert.equal(corrections.profile.sample_rate,24000);
  assert.equal(corrections.profile.lead_silence_seconds,0.04);
  assert.equal(corrections.profile.tail_silence_seconds,0.35);
  assert.equal(corrections.profile.subtype,'PCM_16');
});

test('ambiguous corrected verbs have explicit Kokoro phonemes',()=>{
  const expected={
    live:'lˈɪv',
    close:'klˈOz',
    use:'jˈuz',
    used:'jˈuzd',
    'read::base':'ɹˈid',
    'read::past':'ɹˈɛd'
  };
  for(const [key,phones] of Object.entries(expected)){
    assert.equal(corrections.items[key].method,'raw_phonemes');
    assert.equal(corrections.items[key].kokoro_phonemes,phones);
  }
});

test('generator gives reviewed corrections local assets and unique correction signatures',()=>{
  assert.match(generator,/load_corrections/);
  assert.match(generator,/reviewed-correction/);
  assert.match(generator,/correction_phonemes/);
  assert.match(generator,/if canonical in corrections:/);
  assert.match(generator,/generate_from_tokens/);
});

test('human correction goals preserve the teacher review intent',()=>{
  assert.match(corrections.items.ask.instruction,/no \/n\//i);
  assert.match(corrections.items.bend.instruction,/distinguish from “bent”/i);
  assert.match(corrections.items.blew.instruction,/homophonous with “blue”/i);
  assert.match(corrections.items.build.instruction,/distinguish from “built”/i);
  assert.match(corrections.items.dug.instruction,/distinguish from “dog”/i);
  assert.match(corrections.items.close.instruction,/VERB pronunciation/i);
  assert.match(corrections.items.wrote.instruction,/distinguish from “route”/i);
});
