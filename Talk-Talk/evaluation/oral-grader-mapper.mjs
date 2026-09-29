import { normalizeOralGraderResult } from "./oral-grader-schema.mjs";

const RUBRIC_ROWS=Object.freeze([
  ["fluency","Fluency"],
  ["coherence_and_organization","Coherence & Organization"],
  ["grammar_and_vocabulary","Grammar & Vocabulary"],
  ["pronunciation_and_intelligibility","Pronunciation & Intelligibility"],
  ["communicative_interaction","Communicative Interaction"]
]);

function clone(value){
  return value==null ? value : JSON.parse(JSON.stringify(value));
}

export function mapOralGraderResultToTalkTalk(raw){
  const result=normalizeOralGraderResult(raw);
  const mapped={
    jobId:result.jobId,
    status:result.status
  };

  if(result.status!=="completed" && result.status!=="review_required"){
    return mapped;
  }

  mapped.transcript={
    heardText:result.transcript.heard_text,
    speakers:clone(result.transcript.speakers),
    segments:result.transcript.segments.map(segment=>({
      ...clone(segment),
      heardText:segment.heard_text
    }))
  };

  mapped.analysis=clone(result.analysis);
  mapped.students=result.students.map(student=>({
    studentId:student.studentId,
    name:student.name,
    rubric:RUBRIC_ROWS.map(([key,label])=>({
      key,
      label,
      score:student.rubric_scores[key],
      max:8
    })),
    rubricScores:clone(student.rubric_scores),
    total:student.total,
    maxTotal:40,
    comments:[...student.comments],
    confidence:student.confidence,
    reviewRequired:student.review_required
  }));
  mapped.report=clone(result.report);
  return mapped;
}

export const TALK_TALK_ORAL_RUBRIC_ROWS=RUBRIC_ROWS;
