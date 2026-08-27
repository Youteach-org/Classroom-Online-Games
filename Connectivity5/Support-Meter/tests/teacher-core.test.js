const test = require('node:test');
const assert = require('node:assert/strict');
const {toggleFocus, buildCsv} = require('../teacher-core.js');

test('clicking the focused student returns to the compact grid', () => {
  assert.equal(toggleFocus('student-a', 'student-a'), null);
});

test('clicking a different student switches focus', () => {
  assert.equal(toggleFocus('student-a', 'student-b'), 'student-b');
});

test('CSV escapes commas, quotes and formulas', () => {
  const csv = buildCsv([{student_name:'Doe, "A"', selected_expression:'=1+1'}]);
  assert.match(csv, /"Doe, ""A"""/);
  assert.match(csv, /"'=1\+1"/);
});
