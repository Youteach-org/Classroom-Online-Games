import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCoastalSceneSvg } from '../coastal-scene-config.mjs';

test('coastal SVG matches the approved composition', () => {
  const svg = buildCoastalSceneSvg();
  assert.match(svg, /La Tiendita/);
  assert.match(svg, /Café Vida/);
  assert.match(svg, /Frutas/);
  assert.match(svg, /mountain/);
  assert.match(svg, /promenade/);
  assert.match(svg, /viewBox="0 0 1920 720"/);
});
