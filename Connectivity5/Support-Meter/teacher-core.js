(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.SupportMeterTeacherCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const columns=['student_name','set_number','story_id','story_title','selected_feeling','selected_expression','feeling_correct','expression_correct','resolved','attempt','score','support_meter','created_at'];
  function toggleFocus(current,id){return current===id?null:id;}
  function csvCell(value){let text=value==null?'':String(value);if(/^[=+\-@]/.test(text))text=`'${text}`;return `"${text.replace(/"/g,'""')}"`;}
  function buildCsv(rows){return [columns.map(csvCell).join(','),...(rows||[]).map(row=>columns.map(key=>csvCell(row[key])).join(','))].join('\r\n');}
  return {toggleFocus,buildCsv};
});
