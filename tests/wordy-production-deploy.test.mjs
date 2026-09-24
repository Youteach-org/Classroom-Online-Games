import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const productionWorkflows=[
  '../.github/workflows/cloudflare-pages-main.yml',
  '../.github/workflows/deploy-cloudflare-pages.yml'
];

test('every main production deploy packages Wordy in the game bundle',()=>{
  for(const relative of productionWorkflows){
    const workflow=readFileSync(new URL(relative,import.meta.url),'utf8');
    assert.match(workflow,/branches:[\s\S]*?- main/,`${relative} must deploy main`);
    assert.match(workflow,/pages deploy dist --project-name=classroom-online-games/,`${relative} must deploy the production Pages project`);
    const gameBundleCopies=(workflow.match(/cp -R[^\n]*/g)??[])
      .filter(command=>/\b100-Students-Said\b/.test(command));
    assert.ok(gameBundleCopies.length>0,`${relative} must copy the game bundle into dist`);
    assert.ok(
      gameBundleCopies.every(command=>/\bWordy\b/.test(command)),
      `${relative} must include Wordy in every production game-bundle copy command`
    );
  }
});
