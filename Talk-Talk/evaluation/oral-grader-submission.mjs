function clone(value){
  return value==null ? value : JSON.parse(JSON.stringify(value));
}

function requireString(value,name){
  const out=String(value??"").trim();
  if(!out) throw new TypeError(name+" is required");
  return out;
}

function gradingKey(attempt){
  return requireString(attempt?.attemptId,"attemptId")+":grade";
}

export function buildOralGraderSubmission(attempt,audioBlob,{
  sessionId="talk-talk-standalone",
  activityId="tell-me-what-happened",
  rubricId="talk-talk-oral-v1",
  language="en",
  groupId="",
  teamId=""
}={}){
  if(!(audioBlob instanceof Blob) || audioBlob.size<=0){
    throw new TypeError("A recorded audio Blob is required");
  }
  const source=attempt&&typeof attempt==="object" ? attempt : {};
  const studentId=requireString(source.studentKey,"studentKey");
  const studentName=requireString(source.studentName,"studentName");
  const idempotencyKey=gradingKey(source);

  const metadata={
    attemptId:requireString(source.attemptId,"attemptId"),
    sessionId:requireString(sessionId,"sessionId"),
    activityId:requireString(activityId,"activityId"),
    students:[{studentId,name:studentName}],
    mode:["practice","assessment","live_assessment"].includes(source.mode)
      ? source.mode
      : "practice",
    rubricId:requireString(rubricId,"rubricId"),
    language:requireString(language,"language"),
    promptContext:{
      activityTitle:String(source.activityTitle||""),
      partnerName:String(source.partnerName||""),
      durationMs:Number(source.durationMs||0)
    },
    audio:{mimeType:audioBlob.type||"application/octet-stream"},
    clientCreatedAt:new Date(Number(source.createdAt)||Date.now()).toISOString(),
    idempotencyKey
  };

  if(String(groupId||"").trim()) metadata.groupId=String(groupId).trim();
  if(String(teamId||"").trim()) metadata.teamId=String(teamId).trim();

  return {metadata,idempotencyKey};
}

export function markAttemptUploading(attempt,{now=Date.now}={}){
  const source=clone(attempt)||{};
  const idempotencyKey=source?.grading?.idempotencyKey || gradingKey(source);
  return {
    ...source,
    grading:{
      ...(source.grading||{}),
      idempotencyKey,
      status:"uploading",
      jobId:String(source?.grading?.jobId||""),
      lastError:null,
      updatedAt:Number(now())
    }
  };
}

export function markAttemptSubmitted(attempt,{jobId,status="submitted"}={},{
  now=Date.now
}={}){
  const source=clone(attempt)||{};
  return {
    ...source,
    grading:{
      ...(source.grading||{}),
      idempotencyKey:source?.grading?.idempotencyKey || gradingKey(source),
      jobId:requireString(jobId,"jobId"),
      status:String(status||"submitted"),
      lastError:null,
      acknowledgedAt:Number(now()),
      updatedAt:Number(now())
    }
  };
}

export function markAttemptSubmissionError(attempt,error={},{
  now=Date.now
}={}){
  const source=clone(attempt)||{};
  const retryable=error?.retryable!==false;
  return {
    ...source,
    grading:{
      ...(source.grading||{}),
      idempotencyKey:source?.grading?.idempotencyKey || gradingKey(source),
      jobId:String(source?.grading?.jobId||""),
      status:retryable ? "failed_retryable" : "failed_terminal",
      lastError:{
        message:String(error?.message||"Online grading submission failed."),
        retryable
      },
      updatedAt:Number(now())
    }
  };
}
