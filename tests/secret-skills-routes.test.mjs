import test from 'node:test';
import assert from 'node:assert/strict';

const origin='https://classroom-online-games.pages.dev';
const cases=[
 ['/Conditional-Pairs/Secret-Skills-Club/','text/html','SECRET SKILLS'],
 ['/Conditional-Pairs/Secret-Skills-Club/teacher/','text/html','TEACHER MONITOR'],
 ['/Conditional-Pairs/Secret-Skills-Club/app.js','javascript','function renderTeacher']
];
for(const [path,type,expected] of cases) {
 test('production game route responds: '+path,{timeout:18000},async()=>{
  const res=await fetch(origin+path,{redirect:'follow',signal:AbortSignal.timeout(15000),headers:{'user-agent':'Classroom-Games-SmokeTest/1.0'}});
  const body=await res.text();
  assert.equal(res.status,200,'GET '+path+': HTTP '+res.status+' '+body.slice(0,200));
  assert.ok((res.headers.get('content-type')||'').includes(type),'Unexpected content type for '+path+': '+res.headers.get('content-type'));
  assert.ok(body.includes(expected),'Unexpected body for '+path+': '+body.slice(0,150));
 });
}
