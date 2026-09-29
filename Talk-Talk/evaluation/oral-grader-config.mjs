export const ORAL_GRADER_ENDPOINTS=Object.freeze({
  login:"https://us-central1-youteach-d9a79.cloudfunctions.net/talk_talk_preview_login",
  submit:"https://us-central1-youteach-d9a79.cloudfunctions.net/oral_grader_submit",
  status:"https://us-central1-youteach-d9a79.cloudfunctions.net/oral_grader_job_status",
  list:"https://us-central1-youteach-d9a79.cloudfunctions.net/oral_grader_job_list",
  audio:"https://us-central1-youteach-d9a79.cloudfunctions.net/oral_grader_audio",
  review:"https://us-central1-youteach-d9a79.cloudfunctions.net/oral_grader_teacher_review"
});

export const TALK_TALK_ONLINE_DEFAULTS=Object.freeze({
  sessionId:"talk-talk-standalone",
  activityId:"tell-me-what-happened",
  rubricId:"talk-talk-oral-v1",
  language:"en"
});
