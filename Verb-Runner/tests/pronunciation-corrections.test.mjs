import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const corrections=JSON.parse(readFileSync(join(root,'pronunciation-corrections.json'),'utf8'));
const generator=readFileSync(join(root,'scripts','generate-pronunciation.py'),'utf8');

test('reviewed correction batch contains 44 validated replacements',()=>{
  assert.equal(corrections.status,'VALIDATED_FOR_GENERATION');
  const entries=Object.entries(corrections.items||{});
  assert.equal(entries.length,44);
  for(const [key,spec] of entries){
    assert.ok(spec.observed_issue?.trim(),key+' missing observed issue');
    assert.ok(spec.decision?.trim(),key+' missing validation decision');
    assert.ok(spec.target_text?.trim(),key+' missing target text');
    assert.match(spec.ipa_goal||'',/^\/.+\/$/,key+' missing IPA goal');
    assert.ok(spec.correction_goal?.trim(),key+' missing correction goal');
    assert.ok(['g2p_tokens','raw_phonemes','external-approved-voice','approved-review-candidate'].includes(spec.method),key+' invalid method');
  }
});

test('question notes are validated rather than treated as synthesis commands',()=>{
  assert.equal(corrections.excluded_as_correct.blew.decision,'KEEP_EXISTING');
  assert.match(corrections.excluded_as_correct.blew.reason,/homophones/i);
  assert.equal(corrections.items.blew,undefined);

  assert.equal(corrections.items.close.decision,'question-resolved-voice-fix');
  assert.match(corrections.items.close.correction_goal,/Verb pronunciation is \/kloʊz\//);

  assert.equal(corrections.items.dug.decision,'question-resolved-needs-fix');
  assert.match(corrections.items.dug.correction_goal,/distinct from dog/i);
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

test('generator gives reviewed corrections local assets or explicit approved external sources',()=>{
  assert.match(generator,/load_corrections/);
  assert.match(generator,/reviewed-correction/);
  assert.match(generator,/correction_phonemes/);
  assert.match(generator,/if canonical in corrections:/);
  assert.match(generator,/approved_source/);
  assert.match(generator,/generate_from_tokens/);
});

test('correction goals preserve the observed teacher problems without copying them as targets',()=>{
  assert.match(corrections.items.ask.observed_issue,/nask/i);
  assert.match(corrections.items.ask.correction_goal,/No consonant before \/æ\//i);

  assert.match(corrections.items.bend.observed_issue,/igual que bent/i);
  assert.match(corrections.items.bend.correction_goal,/distinct from bent/i);

  assert.match(corrections.items.build.observed_issue,/No suena nada/i);
  assert.match(corrections.items.build.latest_report_text,/No suena nada/i);
  assert.match(corrections.items.build.correction_goal,/distinct from built/i);
  assert.equal(corrections.items.build.voice,'fancy');
  assert.match(corrections.items.build.approved_source_url,/storage\.googleapis\.com\/.*\.mp3/);
  assert.match(corrections.items.build.previous_approved_source_url,/f9342d092faa4ce5ad46c32504d68c02/);

  assert.match(corrections.items.wrote.observed_issue,/Route/i);
  assert.match(corrections.items.wrote.correction_goal,/route pronunciations/i);
});

test('asked uses a second-pass explicit phoneme correction after teacher re-review',()=>{
  assert.equal(corrections.items.asked.method,'raw_phonemes');
  assert.equal(corrections.items.asked.kokoro_phonemes,'ˈæskt');
  assert.equal(corrections.items.asked.speed,1.05);
  assert.match(corrections.items.asked.decision,/second-pass/);
  assert.match(generator,/correction_speed = float\(correction\.get\('speed'\) or SPEED\)/);
});

test('second-pass reports use explicit phonemes and washed is cached locally',()=>{
  for(const key of ['change','eat','eaten','follow','forbade','stop','stopped','watched']){
    assert.equal(corrections.items[key].method,'raw_phonemes',key);
    assert.ok(corrections.items[key].kokoro_phonemes,key);
  }
  assert.equal(corrections.items.washed.voice,'fancy');
  assert.match(corrections.items.washed.approved_source,/^\.\/audio\/pronunciation\/external\//);
});

test('external pronunciation cache validates binary audio instead of file size alone',()=>{
  const cache=readFileSync(join(root,'scripts','cache-approved-external-pronunciation.py'),'utf8');
  assert.match(cache,/def is_probably_audio\(data: bytes\)/);
  assert.match(cache,/<!doctype html/);
  assert.match(cache,/ID3/);
  assert.match(cache,/Downloaded external pronunciation asset is not recognized audio/);
});
