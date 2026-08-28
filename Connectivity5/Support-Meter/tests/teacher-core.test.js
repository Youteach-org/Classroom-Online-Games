const test = require('node:test');
const assert = require('node:assert/strict');
const {toggleFocus, buildCsv, mergeManagedSessions, buildSessionCatalog, visibleStudents} = require('../teacher-core.js');

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

test('session catalog includes Free Mode without selecting a session', () => {
  const catalog=buildSessionCatalog([], [
    {session_key:'free',session_type:'free',student_count:3,last_activity:'2026-08-28T12:00:00Z'},
    {session_key:'assignment:a',session_type:'assigned',assignment_id:'a',set_number:2,student_count:4,created_at:'2026-08-28T11:00:00Z'}
  ]);
  assert.equal(catalog.length,2);
  assert.equal(catalog[0].sessionKey,'free');
  assert.equal(catalog[0].label,'Free Mode · 3 students');
  assert.equal(catalog[1].assignmentId,'a');
});

test('students stay hidden until a monitor session is selected', () => {
  const now=Date.now(),students=[{id:'one',lastSeen:now},{id:'two',lastSeen:now}];
  assert.deepEqual(visibleStudents(students, null, false),[]);
  assert.equal(visibleStudents(students, 'free', false).length,2);
});

test('offline students older than one hour are hidden but not deleted', () => {
  const now=Date.parse('2026-08-28T13:00:00Z');
  const students=[
    {id:'recent',last_seen:'2026-08-28T12:30:00Z'},
    {id:'old',last_seen:'2026-08-28T11:59:59Z'}
  ];
  assert.deepEqual(visibleStudents(students,'free',false,now).map(s=>s.id),['recent']);
});
