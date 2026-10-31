import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
test('existing Firebase RTDB live path supports temporary room state', {timeout:18000},async()=>{
 const id='smoke_'+randomUUID().replaceAll('-','');
 const base='https://youteach-d9a79-default-rtdb.firebaseio.com/classroomGames/supportMeter/secretSkills/diagnostics/'+id+'.json';
 const fetchJson=async(method,body)=>{
   const res=await fetch(base,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(9000)});
   const text=await res.text();assert.equal(res.status,200,'Firebase '+method+': '+text.slice(0,300));
   return text?JSON.parse(text):null;
 };
 try{
   assert.deepEqual(await fetchJson('PUT',{kind:'secret-skills-check',value:true}),{kind:'secret-skills-check',value:true});
   const data=await fetchJson('GET'); assert.equal(data?.value,true);
 }finally{await fetchJson('DELETE');}
});