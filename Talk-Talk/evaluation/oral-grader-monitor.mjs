const TERMINAL_STATUSES=new Set([
  "completed","review_required","failed_retryable","failed_terminal"
]);

function clone(value){
  return value==null ? value : JSON.parse(JSON.stringify(value));
}

export function applyOralGraderJobState(attempt,job){
  const source=clone(attempt)||{};
  const incoming=job&&typeof job==="object" ? job : {};
  const status=String(incoming.status||"");
  const jobId=String(incoming.jobId||source?.grading?.jobId||"");

  const out={
    ...source,
    grading:{
      ...(source.grading||{}),
      jobId,
      status,
      updatedAt:Date.now()
    }
  };

  if(
    (status==="completed" || status==="review_required") &&
    incoming.transcript &&
    Array.isArray(incoming.students)
  ){
    out.oralGraderResult=clone(incoming);
    out.transcript={
      status:"ready",
      heardText:String(incoming.transcript.heard_text??""),
      source:"oral-grader"
    };
  }

  if(status==="review_required" && !incoming.transcript){
    out.grading.reviewRequired=true;
  }
  if(status==="failed_retryable" || status==="failed_terminal"){
    out.grading.lastError={
      message:"Oral-Grader processing did not complete.",
      retryable:status==="failed_retryable"
    };
  }
  return out;
}

export async function monitorOralGraderJob({
  client,
  jobId,
  onUpdate=()=>{},
  sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),
  intervalMs=2000,
  maxPolls=180
}={}){
  if(!client || typeof client.getJob!=="function"){
    throw new TypeError("Oral Grader client.getJob is required");
  }
  const cleanId=String(jobId||"").trim();
  if(!cleanId) throw new TypeError("jobId is required");

  for(let index=0;index<maxPolls;index+=1){
    const job=await client.getJob(cleanId);
    await onUpdate(job);
    if(TERMINAL_STATUSES.has(job.status)) return job;
    if(index<maxPolls-1) await sleep(intervalMs);
  }
  const error=new Error("Oral-Grader job monitoring timed out.");
  error.retryable=true;
  throw error;
}

export const ORAL_GRADER_TERMINAL_STATUSES=Object.freeze([...TERMINAL_STATUSES]);
