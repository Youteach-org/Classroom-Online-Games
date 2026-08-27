const test = require('node:test');
const assert = require('node:assert/strict');
const {toggleFocus, buildCsv, mergeManagedSessions} = require('../teacher-core.js');

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

test('active sessions are recovered while local session secrets are preserved', () => {
  const local=[{assignmentId:'a',joinToken:'join-a',manageToken:'manage-a',setNumber:1,createdAt:'2026-08-27T10:00:00Z'}];
  const active=[
    {assignment_id:'a',set_number:1,created_at:'2026-08-27T10:00:00Z',student_count:2},
    {assignment_id:'b',set_number:2,created_at:'2026-08-27T11:00:00Z',student_count:4}
  ];
  const merged=mergeManagedSessions(local,active);
  assert.equal(merged.length,2);
  assert.equal(merged.find(item=>item.assignmentId==='a').manageToken,'manage-a');
  assert.equal(merged.find(item=>item.assignmentId==='a').studentCount,2);
  assert.equal(merged.find(item=>item.assignmentId==='b').recovered,true);
  assert.equal(merged.find(item=>item.assignmentId==='b').manageToken,undefined);
});
