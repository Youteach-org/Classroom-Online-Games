import { normalizeOralGraderJob } from "./oral-grader-schema.mjs";
import { mapOralGraderResultToTalkTalk } from "./oral-grader-mapper.mjs";

export function createOralGraderAdapter({transport}={}){
  if(!transport || typeof transport.getJob!=="function"){
    throw new TypeError("Oral Grader transport.getJob is required");
  }

  return {
    normalizeJob(job){
      return normalizeOralGraderJob(job);
    },

    async getResult(jobId){
      if(typeof jobId!=="string" || !jobId.trim()){
        throw new TypeError("jobId is required");
      }
      const raw=await transport.getJob(jobId);
      return mapOralGraderResultToTalkTalk(raw);
    }
  };
}
