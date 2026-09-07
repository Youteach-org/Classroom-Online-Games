(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.SupportMeterTeacherCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const columns=['student_name','set_number','story_id','story_title','selected_feeling','selected_expression','feeling_correct','expression_correct','resolved','attempt','support_meter','streak','created_at'];
  function toggleFocus(current,id){return current===id?null:id;}
  function mergeManagedSessions(local,active){
    const localById=new Map((local||[]).map(item=>[item.assignmentId,item]));
    return (active||[]).map(row=>{const assignmentId=row.assignment_id||row.assignmentId,known=localById.get(assignmentId)||{};return {...known,assignmentId,setNumber:row.set_number??known.setNumber,createdAt:row.created_at||known.createdAt,studentCount:Number(row.student_count||0),recovered:!known.manageToken};});
  }
  function buildSessionCatalog(local,rows){
    const localById=new Map((local||[]).map(item=>[item.assignmentId,item]));
    return (rows||[]).map(row=>{
      const type=row.session_type||row.sessionType||'assigned';
      const assignmentId=row.assignment_id||row.assignmentId||null;
      const known=assignmentId?localById.get(assignmentId)||{}:{};
      const studentCount=Number(row.student_count||0);
      const sessionKey=row.session_key||row.sessionKey||(type==='free'?'free':`assignment:${assignmentId}`);
      return {...known,sessionKey,sessionType:type,assignmentId,setNumber:row.set_number??known.setNumber??null,createdAt:row.created_at||known.createdAt,lastActivity:row.last_activity||null,studentCount,label:type==='free'?`Free Mode · ${studentCount} student${studentCount===1?'':'s'}`:`Set ${row.set_number??known.setNumber} · ${studentCount} student${studentCount===1?'':'s'} · ${new Date(row.created_at||known.createdAt).toLocaleString()}`,recovered:Boolean(assignmentId&&!known.manageToken)};
    });
  }
  function visibleStudents(students,sessionKey,hideOffline,now=Date.now()){
    if(!sessionKey)return [];
    const hour=60*60*1000;
    return (students||[]).filter(student=>{
      const seen=new Date(student.last_seen??student.lastSeen??0).getTime();
      if(!Number.isFinite(seen)||now-seen>=hour)return false;
      return !hideOffline||student.status==='online';
    });
  }
  function csvCell(value){let text=value==null?'':String(value);if(/^[=+\-@]/.test(text))text=`'${text}`;return `"${text.replace(/"/g,'""')}"`;}
  function buildCsv(rows){return [columns.map(csvCell).join(','),...(rows||[]).map(row=>columns.map(key=>csvCell(row[key])).join(','))].join('\r\n');}
  return {toggleFocus,buildCsv,mergeManagedSessions,buildSessionCatalog,visibleStudents};
});
