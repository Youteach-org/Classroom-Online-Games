import {
  normalizeOralGraderJob,
  normalizeOralGraderResult
} from "./oral-grader-schema.mjs";

export class OralGraderHttpError extends Error {
  constructor(message,{status=0,payload=null}={}){
    super(message);
    this.name="OralGraderHttpError";
    this.status=Number(status)||0;
    this.payload=payload;
    this.retryable=
      this.status===0 ||
      this.status===408 ||
      this.status===429 ||
      this.status>=500;
  }
}

function requireUrl(value,name){
  const clean=String(value||"").trim();
  if(!clean) throw new TypeError(name+" URL is required");
  return clean;
}

async function parseJson(response){
  return response.json().catch(()=>({}));
}

async function ensureOk(response){
  const payload=await parseJson(response);
  if(!response.ok || payload?.ok!==true){
    throw new OralGraderHttpError(
      payload?.error || "Oral Grader request failed.",
      {status:response.status,payload}
    );
  }
  return payload;
}

export function createOralGraderClient({
  endpoints,
  token="",
  fetchImpl=globalThis.fetch
}={}){
  if(typeof fetchImpl!=="function") throw new TypeError("fetch is required");
  const urls={
    login:requireUrl(endpoints?.login,"login"),
    submit:requireUrl(endpoints?.submit,"submit"),
    status:requireUrl(endpoints?.status,"status")
  };
  let sessionToken=String(token||"").trim();

  function authHeaders(){
    if(!sessionToken) throw new OralGraderHttpError("Oral Grader session token is required.",{status:401});
    return {Authorization:"Bearer "+sessionToken};
  }

  return Object.freeze({
    getToken(){
      return sessionToken;
    },

    setToken(value){
      sessionToken=String(value||"").trim();
      return sessionToken;
    },

    async loginPreview(username,password){
      const response=await fetchImpl(urls.login,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          username:String(username||""),
          password:String(password||"")
        })
      });
      const payload=await ensureOk(response);
      if(typeof payload.token!=="string" || !payload.token.trim()){
        throw new OralGraderHttpError("Preview login returned no session token.",{status:502,payload});
      }
      sessionToken=payload.token.trim();
      return {
        token:sessionToken,
        role:String(payload.role||""),
        subject:String(payload.subject||"")
      };
    },

    async submitAttempt(audioBlob,metadata,idempotencyKey){
      if(!(audioBlob instanceof Blob) || audioBlob.size<=0){
        throw new TypeError("A recorded audio Blob is required.");
      }
      const cleanKey=String(idempotencyKey||"").trim();
      if(!cleanKey) throw new TypeError("idempotencyKey is required");

      const normalized=normalizeOralGraderJob({
        ...(metadata||{}),
        idempotencyKey:cleanKey,
        audio:{
          ...((metadata||{}).audio||{}),
          mimeType:audioBlob.type || (metadata||{})?.audio?.mimeType || "application/octet-stream"
        }
      });

      const form=new FormData();
      form.append("metadata",JSON.stringify(normalized));
      form.append("audio",audioBlob,"talk-talk-attempt");

      const response=await fetchImpl(urls.submit,{
        method:"POST",
        headers:authHeaders(),
        body:form
      });
      const payload=await ensureOk(response);
      return {
        jobId:String(payload.jobId||""),
        status:String(payload.status||"")
      };
    },

    async getJob(jobId){
      const cleanId=String(jobId||"").trim();
      if(!cleanId) throw new TypeError("jobId is required");
      const response=await fetchImpl(
        urls.status+"?jobId="+encodeURIComponent(cleanId),
        {method:"GET",headers:authHeaders()}
      );
      const payload=await ensureOk(response);
      const job=payload.job;
      if(!job || typeof job!=="object"){
        throw new OralGraderHttpError("Oral Grader status returned no job.",{status:502,payload});
      }
      if(
        (job.status==="completed" || job.status==="review_required") &&
        job.result &&
        typeof job.result==="object"
      ){
        return normalizeOralGraderResult(job.result);
      }
      return normalizeOralGraderResult({
        jobId:String(job.jobId||cleanId),
        status:String(job.status||"")
      });
    }
  });
}
