(function(global){
  const timeZone='America/Mexico_City';
  function formatDateTime(timestamp){
    const parts=new Intl.DateTimeFormat('en-US',{timeZone,month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true}).formatToParts(new Date(Number(timestamp)));
    const value=type=>parts.find(part=>part.type===type)?.value||'';
    return `${value('month')} ${value('day')}, ${value('year')} · ${value('hour')}:${value('minute')} ${value('dayPeriod')}`;
  }
  function buildResultData(input){
    const id=String(input.runId||'RESULT').replace(/[^a-z0-9]/gi,'').slice(-7).toUpperCase().padStart(7,'0');
    return {studentName:String(input.studentName||'Student'),setLabel:`Set ${Number(input.setNumber)||1}`,supportMeter:`${Math.round(Math.max(0,Math.min(100,Number(input.supportMeter)||0)))}%`,streak:String(Number(input.streak)||0),completedLabel:formatDateTime(input.completedAt),recordCode:`SM-${id}`};
  }
  function fileName(data){return `${data.studentName.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'Student'}-Support-Meter-Result.png`;}
  function rounded(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
  function text(ctx,value,x,y,size,color,weight='400',align='left'){ctx.font=`${weight} ${size}px Arial, sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(value,x,y);}
  function drawResult(canvas,data){
    canvas.width=1200;canvas.height=720;const ctx=canvas.getContext('2d'),gradient=ctx.createLinearGradient(70,55,1130,665);gradient.addColorStop(0,'#071d68');gradient.addColorStop(.62,'#0c42a5');gradient.addColorStop(1,'#0879c1');
    ctx.fillStyle='#eef5ff';ctx.fillRect(0,0,1200,720);ctx.shadowColor='#06184d66';ctx.shadowBlur=28;ctx.shadowOffsetY=18;rounded(ctx,70,55,1060,610,38,gradient,'#58c7ff');ctx.shadowColor='transparent';
    ctx.strokeStyle='#8de4ff77';ctx.beginPath();ctx.moveTo(70,145);ctx.lineTo(1130,145);ctx.stroke();
    text(ctx,'SUPPORT',112,116,40,'#fff','900');text(ctx,'METER',300,116,40,'#ffd735','900');rounded(ctx,835,86,245,42,21,'#25c76f');text(ctx,'✓  ACTIVITY COMPLETED',957,113,16,'#042c24','900','center');
    text(ctx,'FINAL RESULT',600,195,18,'#9ee8ff','900','center');text(ctx,data.studentName,600,250,48,'#fff','900','center');text(ctx,`Connectivity 5  ·  ${data.setLabel}  ·  8 of 8 stories completed`,600,286,19,'#d5ebff','400','center');
    const boxes=[{x:190,symbol:'★',value:data.supportMeter,label:'SUPPORT METER'},{x:620,symbol:'▲',value:data.streak,label:'FINAL STREAK'}];
    boxes.forEach(box=>{rounded(ctx,box.x,326,390,157,22,'#ffffff16','#a6e6ffaa');text(ctx,box.symbol,box.x+195,375,34,box.label==='FINAL STREAK'?'#ffad3d':'#ffd735','700','center');text(ctx,box.value,box.x+195,426,43,'#ffd735','900','center');text(ctx,box.label,box.x+195,458,15,'#d8efff','900','center');});
    rounded(ctx,118,510,964,65,17,'#03165099');text(ctx,`Completed:  ${data.completedLabel}`,145,550,18,'#e4f4ff','700');text(ctx,`Record:  ${data.recordCode}`,1050,550,18,'#e4f4ff','700','right');
    ctx.fillStyle='#03144caa';ctx.fillRect(70,606,1060,59);text(ctx,'Generated from the verified Support Meter activity record',112,642,14,'#aee8ff');text(ctx,'★',1080,646,30,'#ffd735','700','right');return canvas;
  }
  global.SupportMeterResult={formatDateTime,buildResultData,fileName,drawResult};
})(typeof window!=='undefined'?window:globalThis);
