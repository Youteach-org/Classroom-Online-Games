const JOB_MODES=new Set(["practice","assessment","live_assessment"]);
const RESULT_STATUSES=new Set([
  "ready","recording","recorded","reviewing","uploading","submitted",
  "transcribing","analyzing","scoring","completed","review_required",
  "failed_retryable","failed_terminal"
]);
const RUBRIC_KEYS=[
  "fluency",
  "coherence_and_organization",
  "grammar_and_vocabulary",
  "pronunciation_and_intelligibility",
  "communicative_interaction"
];
const CONFIDENCE_VALUES=new Set(["low","medium","high"]);

function clone(value){
  return value==null ? value : JSON.parse(JSON.stringify(value));
}

function requireObject(value,label){
  if(!value || typeof value!=="object" || Array.isArray(value)){
    throw new TypeError(label+" must be an object");
  }
  return value;
}

function requireString(value,label){
  if(typeof value!=="string" || !value.trim()){
    throw new TypeError(label+" must be a non-empty string");
  }
  return value;
}

function normalizeStudentIdentity(raw,index){
  const row=requireObject(raw,"students["+index+"]");
  return {
    studentId:requireString(row.studentId,"studentId"),
    name:requireString(row.name,"student name")
  };
}

export function normalizeOralGraderJob(raw){
  const input=requireObject(raw,"Oral Grader job");
  const mode=requireString(input.mode,"mode");
  if(!JOB_MODES.has(mode)) throw new RangeError("mode is not supported");

  const students=input.students;
  if(!Array.isArray(students) || students.length===0){
    throw new TypeError("students must contain at least one student");
  }

  const audio=requireObject(input.audio,"audio");
  const promptContext=input.promptContext;
  if(
    typeof promptContext!=="string" &&
    (!promptContext || typeof promptContext!=="object" || Array.isArray(promptContext))
  ){
    throw new TypeError("promptContext must be a string or object");
  }

  const out={
    jobId:requireString(input.jobId,"jobId"),
    attemptId:requireString(input.attemptId,"attemptId"),
    sessionId:requireString(input.sessionId,"sessionId"),
    activityId:requireString(input.activityId,"activityId"),
    students:students.map(normalizeStudentIdentity),
    mode,
    rubricId:requireString(input.rubricId,"rubricId"),
    language:requireString(input.language,"language"),
    promptContext:clone(promptContext),
    audio:{
      mimeType:requireString(audio.mimeType,"audio.mimeType")
    },
    clientCreatedAt:requireString(input.clientCreatedAt,"clientCreatedAt"),
    idempotencyKey:requireString(input.idempotencyKey,"idempotencyKey")
  };

  if(input.groupId!=null && input.groupId!=="") out.groupId=requireString(input.groupId,"groupId");
  if(input.teamId!=null && input.teamId!=="") out.teamId=requireString(input.teamId,"teamId");
  if(audio.reference!=null && audio.reference!=="") out.audio.reference=requireString(audio.reference,"audio.reference");

  return out;
}

function normalizeRubricScores(raw){
  const scores=requireObject(raw,"rubric_scores");
  if(
    Object.keys(scores).length!==RUBRIC_KEYS.length ||
    RUBRIC_KEYS.some(key=>!Object.prototype.hasOwnProperty.call(scores,key))
  ){
    throw new TypeError("rubric_scores must contain exactly five Oral Grader criteria");
  }

  const out={};
  for(const key of RUBRIC_KEYS){
    const value=scores[key];
    if(!Number.isInteger(value) || value<0 || value>8){
      throw new RangeError(key+" must be an integer in 0..8");
    }
    out[key]=value;
  }
  return out;
}

function normalizeResultStudent(raw,index){
  const row=requireObject(raw,"students["+index+"]");
  const scores=normalizeRubricScores(row.rubric_scores);
  const expectedTotal=RUBRIC_KEYS.reduce((sum,key)=>sum+scores[key],0);
  if(!Number.isInteger(row.total) || row.total!==expectedTotal){
    throw new RangeError("total must equal the sum of the five rubric scores");
  }
  if(typeof row.review_required!=="boolean"){
    throw new TypeError("review_required must be boolean");
  }
  if(!CONFIDENCE_VALUES.has(row.confidence)){
    throw new RangeError("confidence must be low, medium, or high");
  }
  const comments=row.comments ?? [];
  if(!Array.isArray(comments) || comments.some(item=>typeof item!=="string")){
    throw new TypeError("comments must be an array of strings");
  }

  return {
    studentId:requireString(row.studentId,"studentId"),
    name:requireString(row.name,"student name"),
    rubric_scores:scores,
    total:row.total,
    comments:[...comments],
    confidence:row.confidence,
    review_required:row.review_required
  };
}

function normalizeTranscript(raw){
  const transcript=requireObject(raw,"transcript");
  if(typeof transcript.heard_text!=="string"){
    throw new TypeError("transcript.heard_text must be a string");
  }
  if(!Array.isArray(transcript.speakers)){
    throw new TypeError("transcript.speakers must be an array");
  }
  if(!Array.isArray(transcript.segments)){
    throw new TypeError("transcript.segments must be an array");
  }

  return {
    heard_text:transcript.heard_text,
    speakers:clone(transcript.speakers),
    segments:transcript.segments.map((segment,index)=>{
      const row=requireObject(segment,"transcript.segments["+index+"]");
      if(typeof row.heard_text!=="string"){
        throw new TypeError("segment heard_text must be a string");
      }
      return clone(row);
    })
  };
}

export function normalizeOralGraderResult(raw){
  const input=requireObject(raw,"Oral Grader result");
  const jobId=requireString(input.jobId,"jobId");
  const status=requireString(input.status,"status");
  if(!RESULT_STATUSES.has(status)) throw new RangeError("status is not supported");

  const out={jobId,status};

  if(status!=="completed" && status!=="review_required"){
    return out;
  }

  out.transcript=normalizeTranscript(input.transcript);
  out.analysis=clone(requireObject(input.analysis,"analysis"));

  if(!Array.isArray(input.students) || input.students.length===0){
    throw new TypeError("completed result must contain students");
  }
  out.students=input.students.map(normalizeResultStudent);
  out.report=clone(requireObject(input.report,"report"));

  return out;
}

export const ORAL_GRADER_RUBRIC_KEYS=Object.freeze([...RUBRIC_KEYS]);
export const ORAL_GRADER_RESULT_STATUSES=Object.freeze([...RESULT_STATUSES]);
