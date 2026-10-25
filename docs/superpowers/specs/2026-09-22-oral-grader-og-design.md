# Oral Grader (OG) — Architecture and Evaluation Workflow

Date: 2026-09-22  
Repository: `Youteach-org/Classroom-Online-Games`  
Branch: `feature/oral-grader-v1-20260922`  
Status: active / canonical design  
Project root (implementation target): `Oral-Grader/`

## 1. Product identity

**Oral Grader (OG)** is an independent teacher tool for evaluating recorded oral English exams.

OG is **not part of Talk Talk** and must not be implemented under `Talk-Talk/`. Talk Talk keeps its own established architecture, local-speech rules, runtime, and feature roadmap.

OG also does **not belong to YouTeach's core application**. YouTeach remains focused on groups, assignments, exams, attendance, grades, and related academic administration.

OG may later exchange final grading results with YouTeach through an explicit integration contract, but YouTeach is not the owner of OG's audio-processing pipeline.

## 2. Repository and branch boundary

Canonical repository:

- `Youteach-org/Classroom-Online-Games`

Canonical development branch:

- `feature/oral-grader-v1-20260922`

Implementation must live in its own top-level project area:

- `Oral-Grader/`

Do not place OG implementation inside:

- `Talk-Talk/`
- `Verb-Runner/`
- `Support-Meter/`
- `100-Students-Said/`
- YouTeach application directories

The first dedicated workflow should be named consistently with OG, for example:

- `.github/workflows/oral-grader-v1.yml`

## 3. Core purpose

OG processes an original oral-exam recording and produces teacher-verifiable evidence for evaluation.

The required sequence is:

1. original audio;
2. Stage 1 literal transcription;
3. teacher review/acceptance of the literal transcript;
4. Stage 2 intended-word and pronunciation analysis;
5. oral-rubric evaluation;
6. Stage 3 evaluation PDF for the student pair.

The transcript must remain evidence-oriented rather than silently correcting what students said.

## 4. Stage 1 — literal transcription

Stage 1 starts from the original recording and must preserve what is actually heard.

Required behavior:

- use Gemini as the agreed transcription engine;
- prefer the Gemini transcription capability that supports verbatim transcription, speaker diarization, and timestamps;
- do not correct grammar;
- do not correct vocabulary;
- do not normalize malformed words;
- do not silently replace a mispronounced/heard token with the intended English word;
- preserve repetitions, false starts, fillers, fragments, hesitations, and audible self-corrections;
- separate speakers;
- include timestamps precise enough to return to the audio;
- mark genuinely unclear audio as unclear/inaudible instead of guessing.

The literal transcript is immutable evidence. Later analysis may add fields but must not overwrite the heard text.

## 5. Stage 2 — intended word and pronunciation

Only after Stage 1 is accepted:

- keep `heard` unchanged;
- infer `intended` separately only when context makes intent reasonably clear;
- classify pronunciation as `acceptable`, `incorrect`, or `uncertain`;
- keep grammar, vocabulary/word choice, malformed forms, and pronunciation as separate categories;
- never penalize pronunciation solely because transcription was uncertain;
- do not convert a grammar or vocabulary error into a pronunciation error unless the audio supports that conclusion.

## 6. Oral rubric

The established E6C oral rubric remains:

- Fluency — 8
- Coherence & Organization — 8
- Grammar & Vocabulary — 8
- Pronunciation & Intelligibility — 8
- Communicative Interaction — 8
- Total — 40

Existing teacher judgments remain valid unless the teacher explicitly changes them. OG adds defensible audio/transcription evidence; it does not automatically erase prior rubric decisions.

Teacher-intervention rules already established for the course must remain available to the evaluation stage, including the effect of repeated teacher reactivation on Fluency/Interaction.

## 7. Stage 3 — evaluation PDF

One final PDF per pair should contain:

- both student names;
- rubric scores;
- total /40 for each fully evaluated student;
- concise individual comments;
- pronunciation evidence grounded in the accepted literal transcript;
- meaningful `heard -> intended` items with timestamps;
- teacher interventions when relevant to Fluency/Interaction;
- only pronunciation items whose intended word is sufficiently clear.

Do not generate the final PDF before Stage 1 has been reviewed and Stage 2 is complete.

## 8. Gemini integration boundary

Gemini belongs to OG, not to Talk Talk.

Repository secret target:

- repository: `Youteach-org/Classroom-Online-Games`
- secret name: `GEMINI_API_KEY` (or compatible explicitly supported Google API secret)

The secret must never be committed to source control.

The OG workflow must fail explicitly when Gemini credentials are unavailable. It must not silently switch to another transcription provider.

## 9. Prohibited substitutions

For this canonical OG workflow, do not silently substitute:

- Creative Claw;
- ElevenLabs Scribe;
- Whisper;
- OpenPronounce;
- Wav2Vec2;
- the previous local-PC transcription experiments;
- prior normalized/cleaned transcripts.

Historical experiments may be retained only for audit/reference and must not seed or normalize Stage 1.

Creative Claw is not part of OG unless the user explicitly reauthorizes it in a later instruction.

## 10. Audio and privacy handling

- Use the original recording as the evidence source.
- Do not commit raw student audio to Git history.
- Prefer controlled temporary transfer from the user's authorized storage to the processing runner.
- Remove or avoid persisting temporary authenticated download URLs after use.
- Store transcript/evaluation artifacts separately from raw audio.

## 11. Relationship to Talk Talk

Talk Talk and OG are neighboring but independent projects.

Talk Talk:
- interactive speaking/practice application;
- retains its existing local-speech architecture and constraints;
- must not be modified merely to accommodate OG.

Oral Grader:
- teacher-side evaluation pipeline for recorded oral exams;
- may use Gemini;
- can evolve without changing Talk Talk's runtime contract.

Any future interoperability must be an explicit interface rather than shared internal implementation.

## 12. Relationship to YouTeach

YouTeach remains the academic-management system.

A future OG -> YouTeach integration may send:
- final rubric scores;
- total grade;
- teacher-approved comments;
- references to generated evaluation artifacts.

It should not make YouTeach responsible for OG transcription, diarization, pronunciation inference, or raw-audio processing.

## 13. Initial validation case

The first validation case remains the original Paul/Paulina oral-exam recording already identified and copied to authorized Google Drive storage.

For that recording:

1. run Stage 1 only;
2. inspect literal fidelity;
3. accept/correct speaker mapping only when supported by the audio/context;
4. proceed to Stage 2;
5. produce the pair PDF only after review.

## 14. Non-goals for V1

V1 does not require:

- integration into Talk Talk;
- changes to Talk Talk's local model policy;
- automatic synchronization into YouTeach;
- a student-facing OG application;
- a generalized speech-practice game;
- replacement of the teacher's final grading authority.

## 15. Canonical continuity rule

Material OG decisions must be recorded in this repository on the OG branch while the project is under development.

A future ChatGPT/Superpowers instance continuing this work must first read this spec and inspect the current OG branch before changing architecture or transcription/evaluation behavior.
