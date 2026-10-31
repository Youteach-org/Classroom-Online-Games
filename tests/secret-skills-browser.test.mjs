import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,existsSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const GAME='https://classroom-online-games.pages.dev/Conditional-Pairs/Secret-Skills-Club/';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(f,timeout=20000){const start=Date.now();let last;while(Date.now()-start<timeout){try{const v=await f();if(v)return v;}catch(e){last=e;}await sleep(220);}throw Error('Timed out: '+String(last||''));}
function chromeBinary(){for(const bin of ['google-chrome','google-chrome-stable','chromium','chromium-browser'])try{return execFileSync('which',[bin],{encoding:'utf8'}).trim();}catch{}return null;}
class Page {
 constructor(ws){this.ws=new WebSocket(ws);this.seq=1;this.pending=new Map();this.ready=new Promise((resolve,reject)=>{this.ws.addEventListener('open',resolve,{once:true});this.ws.addEventListener('error',reject,{once:true});});this.ws.addEventListener('message',ev=>{const msg=JSON.parse(ev.data);if(!msg.id)return;const p=this.pending.get(msg.id);if(!p)return;this.pending.delete(msg.id);if(msg.error)p.reject(Error(msg.error.message));else p.resolve(msg.result);});}
 async send(method,params={}){await this.ready;const id=this.seq++;return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}));});}
 async eval(code){const r=await this.send('Runtime.evaluate',{expression:code,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text+' '+r.exceptionDetails.exception?.description);return r.result?.value;}
 close(){this.ws.close();}
}
test('real browser: teacher creates room and student submits 10 answers',{timeout:65000},async t=>{
 const binary=chromeBinary();if(!binary){t.skip('Chrome not installed in CI runner');return;}
 const dir=mkdtempSync(path.join(os.tmpdir(),'ssc-chrome-'));
 const child=spawn(binary,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+dir,'about:blank'],{stdio:'ignore'});
 let code='',teacher,student;
 try{
  const port=await until(()=>{const f=path.join(dir,'DevToolsActivePort');return existsSync(f)&&Number(readFileSync(f,'utf8').split('\n')[0]);},12000);
  async function open(url){const res=await fetch('http://127.0.0.1:'+port+'/json/new?'+encodeURIComponent(url),{method:'PUT'});assert.equal(res.status,200);const tab=await res.json();const page=new Page(tab.webSocketDebuggerUrl);await page.ready;await page.send('Runtime.enable');await page.send('Page.enable');return page;}
  teacher=await open(GAME+'teacher/');
  await until(()=>teacher.eval('document.readyState==="complete" && !!document.getElementById("createBtn")'),15000);
  await sleep(1700);
  await teacher.eval('document.getElementById("createBtn").click()');
  code=await until(()=>teacher.eval('document.getElementById("teacherCode")?.textContent?.match(/^[A-F0-9]{6}$/)?.[0]'),18000);
  assert.match(code,/^[A-F0-9]{6}$/);
  student=await open(GAME+'?code='+code);
  await until(()=>student.eval('document.readyState==="complete" && !!document.getElementById("joinBtn")'),15000);
  await sleep(1200);
  await student.eval('document.getElementById("studentName").value="Sample Investigator";document.getElementById("joinBtn").click()');
  await until(()=>student.eval('!document.getElementById("studentPanel").classList.contains("hidden") && !!document.getElementById("submitAnswers")'),14000);
  await student.eval('document.querySelectorAll(\'[data-answer="yes"]\').forEach(b=>b.click());document.getElementById("submitAnswers").click()');
  await until(()=>teacher.eval('document.getElementById("readyCount")?.textContent==="1"'),14000);
  const teacherUrl=await teacher.eval('document.getElementById("copyTeacher")!==null && document.getElementById("qr")?.src.includes("create-qr-code")');
  assert.equal(teacherUrl,true);
  const studentUrl=await teacher.eval('document.getElementById("shareLink")?.textContent');
  assert.ok(studentUrl.startsWith(GAME+'?code='+code),'Student QR points at wrong page: '+studentUrl);
 } finally{
   if(student)student.close();if(teacher)teacher.close();
   if(code){try{await fetch('https://youteach-d9a79-default-rtdb.firebaseio.com/classroomGames/supportMeter/secretSkills/rooms/'+code+'.json',{method:'DELETE',signal:AbortSignal.timeout(6500)});}catch{}}
   child.kill('SIGTERM');rmSync(dir,{recursive:true,force:true});
 }
});
