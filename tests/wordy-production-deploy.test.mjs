import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const productionWorkflows=[
  '../.github/workflows/cloudflare-pages-main.yml',
  '../.github/workflows/deploy-cloudflare-pages.yml'
];

test('every main production deploy packages Wordy',()=>{
  for(const relative of productionWorkflows){
    const workflow=readFileSync(new URL(relative,import.meta.url),'utf8');
    assert.match(workflow,/branches:[\s\S]*?- main/,`${relative} must deploy main`);
    assert.match(workflow,/pages deploy dist --project-name=classroom-online-games/,`${relative} must deploy the production Pages project`);
    const copyCommands=workflow.match(/cp -R[^\n]*/g)??[];
    assert.ok(copyCommands.length>0,`${relative} must build dist with cp -R`);
    assert.ok(
      copyCommands.every(command=>/\bWordy\b/.test(command)),
      `${relative} must include Wordy in every production dist copy command`
    );
  }
});
