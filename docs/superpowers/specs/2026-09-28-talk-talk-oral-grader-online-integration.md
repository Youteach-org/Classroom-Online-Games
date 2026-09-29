# Talk Talk + Oral Grader Online Integration Specification

Date: 2026-09-28  
Status: approved architecture  
Repository: `Youteach-org/Classroom-Online-Games`

## 1. Goal

Turn the working Talk Talk recording UI into an online oral-assessment product that submits accepted audio to Oral Grader and receives a complete automatic oral-evaluation result.

## 2. Source projects

Talk Talk current working branch:
- `talk-talk-standalone-preview`

Oral Grader canonical implementation branch:
- `feature/oral-grader-v1-20260922`

Prior integration branch:
- `feature/talk-talk-oral-grader-integration-20260923`

Prior integration plan:
- `docs/superpowers/plans/2026-09-23-talk-talk-oral-grader-integration.md`

## 3. Student lifecycle

### Recording
- Browser captures real microphone audio.
- Audio may be held temporarily on device while recording.
- Student can stop.
- Student can review the just-recorded audio.
- Student can record again.
- Student can accept the take.

### Submission
The accepted take must have a final online action:
- label may be `Califica`, `Submit for grading`, or approved equivalent;
- it sends the accepted audio and metadata to the online Oral Grader job;
- it shows upload/submission progress;
- it prevents duplicate grading jobs for the same accepted attempt;
- a retry after a network failure is idempotent;
- the local copy is retained until server acknowledgement;
- successful acknowledgement allows local cleanup according to recovery policy.

### Processing states
Required visible states:
- ready
- recording
- recorded
- reviewing
- uploading
- submitted
- transcribing
- analyzing
- scoring
- completed
- review_required
- failed_retryable
- failed_terminal

The UI must never show a fabricated score while processing.

## 4. Evaluation job contract

Talk Talk submits:
- `jobId`
- `attemptId`
- `sessionId`
- `activityId`
- `groupId` when available
- `teamId` when available
- student identities
- partner/team identities
- activity mode: `practice | assessment | live_assessment`
- rubric id/version
- language
- prompt/context
- audio MIME type
- audio payload/reference
- client-created timestamp
- retry/idempotency key

The online bridge returns immediately:
- `jobId`
- accepted/rejected state
- server timestamp

## 5. Oral Grader processing contract

Oral Grader must process the original audio.

### Stage 1
Produces immutable literal evidence:
- `heard_text`
- speakers
- turns/segments
- timestamps
- uncertainty/inaudible markers

No grammar cleanup or silent normalization.

### Stage 2
Produces evidence:
- intended text when justified
- pronunciation evidence
- grammar evidence
- vocabulary evidence
- fluency evidence
- coherence evidence
- interaction evidence
- teacher-intervention evidence if present
- confidence/uncertainty

Stage 2 must not mutate Stage 1.

### Rubric scoring stage
Must return, per student:
- `fluency: 0..8`
- `coherence_and_organization: 0..8`
- `grammar_and_vocabulary: 0..8`
- `pronunciation_and_intelligibility: 0..8`
- `communicative_interaction: 0..8`
- `total: 0..40`
- concise evidence-grounded comments
- confidence/review-required state

The scoring stage consumes Oral Grader evidence; it is not Talk Talk's local prosody score.

## 6. Result payload

Required result shape:

```json
{
  "jobId": "...",
  "status": "completed",
  "transcript": {
    "heard_text": "...",
    "speakers": [],
    "segments": []
  },
  "analysis": {
    "intended_text": [],
    "pronunciation": [],
    "grammar": [],
    "vocabulary": [],
    "fluency": [],
    "coherence": [],
    "interaction": [],
    "evidence": []
  },
  "students": [
    {
      "studentId": "...",
      "name": "...",
      "rubric_scores": {
        "fluency": 0,
        "coherence_and_organization": 0,
        "grammar_and_vocabulary": 0,
        "pronunciation_and_intelligibility": 0,
        "communicative_interaction": 0
      },
      "total": 0,
      "comments": [],
      "review_required": false
    }
  ],
  "report": {}
}
```

## 7. Teacher Monitor

Teacher Monitor must use shared online state, not local browser storage.

Teacher can:
- see submitted jobs by team/student;
- see processing state;
- play submitted audio if retention policy allows;
- inspect literal transcript;
- inspect evidence;
- inspect automatic rubric scores;
- inspect total /40;
- inspect comments;
- override scores/comments;
- publish final result;
- never overwrite the literal transcript.

Teacher override must be stored separately from automatic output.

## 8. Practice vs assessment

### Practice
- full evidence may be generated;
- numeric score may be hidden from student;
- student receives actionable feedback;
- teacher can still inspect score/evidence if configured.

### Assessment
- full rubric scores and total /40 are generated;
- teacher receives full review UI;
- final publish workflow is enabled.

### Live Assessment
- recording/session can be monitored live;
- full Oral Grader processing starts after the accepted recording closes.

## 9. Persistence

Local device:
- temporary recording and recovery only.

Online:
- authoritative job state;
- authoritative Oral Grader result;
- teacher review/override;
- final publish state.

Do not require student and teacher to share a device/browser.

## 10. Security/privacy

- raw audio never enters Git history;
- Gemini/API secrets remain server-side;
- browser never receives repository/Gemini secrets;
- uploads use authenticated or short-lived server-mediated access;
- job IDs are unguessable;
- retries are idempotent;
- temporary raw audio has an explicit retention/deletion policy.

## 11. Current Oral Grader status discovered 2026-09-28

Implemented and committed:
- Stage 1 Gemini transcription script/workflow;
- Stage 2 Gemini audio analysis script/workflow;
- tests for Stage 1 and Stage 2;
- real Stage-1/Stage-2 artifacts;
- accepted Stage-2 review;
- final scores/report artifacts.

Not found as a dedicated committed executable in the OG tree:
- final automatic rubric-scoring/Stage-3 runner.

This is a discovery item for integration, not permission to replace Oral Grader with Talk Talk local scoring.

## 12. Acceptance criteria for production grading

Talk Talk may be called fully auto-grading only when:
- an accepted browser recording is uploaded online;
- a real Oral Grader job is created;
- job state survives device/account changes;
- Stage 1 literal transcript is returned;
- Stage 2 evidence is returned;
- all five rubric dimensions are returned automatically;
- total /40 is returned automatically;
- Teacher Monitor renders those real results;
- retry/idempotency is tested;
- low-confidence cases become review-required;
- no fake/demo transcript or score appears;
- raw audio is not committed to Git;
- end-to-end test passes from a different student and teacher device/session.

## 13. Non-negotiable implementation rule

Do not label local prosody/duration scoring as Oral Grader.

Do not create a second competing oral-grading engine inside Talk Talk.

Talk Talk consumes Oral Grader.
