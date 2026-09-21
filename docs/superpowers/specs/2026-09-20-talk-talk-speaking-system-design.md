# Talk Talk — Speaking and Pronunciation System Design

Date: 2026-09-20  
Status: Written spec approved by user on 2026-09-20  
Repository: `youteachtk/Classroom-Online-Games`\nCanonical YouTeach repository: `Youteach-org/YouTeach`  
Working product name: **Talk Talk** (name may change later without changing internal architecture)

## 1. Purpose

Talk Talk is a pronunciation-and-speaking system for English learners that works both as:

1. an autonomous A1–C1 speaking/pronunciation learning path; and
2. a teacher-controlled Classroom Online Games activity integrated with YouTeach.

The product must prioritize real oral production over multiple-choice practice. Every substantial learning sequence should move from perception and controlled production toward spontaneous communication.

Core learning cycle:

`Hear → Notice → Say → Use → React → Speak → Challenge → Results → Adapt`

The product should feel like entering communicative situations and solving them through speech, not like completing disconnected pronunciation drills.

## 2. Hard constraints

### 2.1 Zero operating cost

Talk Talk must be viable with **$0 mandatory operating cost**.

Essential functionality must not depend on paid APIs, token billing, per-minute speech billing, commercial TTS, or commercial LLM credits.

Preferred architecture:

- local/browser speech processing;
- open-source models and libraries with licenses suitable for redistribution/commercialization where possible;
- WebGPU when available;
- WASM/CPU fallbacks;
- browser/device TTS where sufficient;
- existing free hosting/data infrastructure only while it remains within free limits.

Commercial free tiers are not a valid dependency for essential product behavior.

### 2.2 Audio privacy

Ordinary speech audio is **local and ephemeral**.

Default behavior:

1. capture locally;
2. analyze locally;
3. persist only derived academic results required for progress/feedback;
4. delete ordinary audio after processing/synchronization.

Audio may be retained only when an Assessment explicitly requires preserved evidence or when an authorized user deliberately chooses to keep that specific attempt.

Talk Talk must not build a permanent voice-print database.

### 2.3 YouTeach remains authoritative

Talk Talk must not duplicate identity, groups, pair/team formation, attendance, or school-grade ownership already handled by YouTeach.

YouTeach is authoritative for:

- teacher identity;
- student identity;
- groups;
- current class/session;
- pair/trio/team membership;
- live launch context;
- whether an activity counts academically;
- final school-side result ownership.

Talk Talk is authoritative for:

- speaking/pronunciation activity content;
- speech capture and local analysis;
- communication flow;
- pronunciation/fluency/language/interaction evidence;
- student feedback;
- Personal Practice;
- Talk Talk-specific mastery data.

The existing Live COG ↔ YouTeach bridge specification remains the canonical secure launch/session boundary and must be reused rather than replaced.

## 3. Product modes

Talk Talk supports:

- individual pronunciation practice;
- individual guided speaking;
- conversation with a local AI-capable character when the device supports it;
- Pair/Group Speaking in person;
- Pair/Group Speaking remotely;
- teacher-led live sessions;
- Practice mode;
- Assessment mode;
- Personal Practice / Your Focus.

## 4. Learning model

### 4.1 Curriculum architecture

Talk Talk has one principal A1→C1 path rather than separate pronunciation, grammar, vocabulary, and speaking courses.

Each communicative unit contains five linked layers:

- **Situation**
- **Language**
- **Pronunciation**
- **Speaking skill**
- **Interaction**

Units are named by communicative purpose, not by grammar labels.

Example initial unit:

**Tell Me What Happened**

- CEFR slice: A2–B1
- communicative purpose: narrate/reconstruct an event;
- language: Past Simple;
- pronunciation: final `-ed` /t/, /d/, /ɪd/;
- speaking: sequencing, detail, narration;
- interaction: follow-up questions and clarification.

Skills can recur across levels with increasing complexity. Pronunciation targets are not permanently tied to one CEFR level.

### 4.2 CEFR progression

The system supports A1–C1 architecturally from the beginning.

Expected progression:

- **A1:** high scaffolding, models, visuals, short turns, simple questions;
- **A2:** connected ideas and common situations;
- **B1:** sustained conversation, narratives, reduced support;
- **B2:** negotiation, argumentation, less predictable situations;
- **C1:** nuance, reformulation, register, complex interaction, very low scaffolding.

CEFR changes expected communicative autonomy and complexity, not just vocabulary difficulty.

### 4.3 Lesson length

Typical lessons target roughly 7–10 minutes but may shorten or extend adaptively.

Every unit must ultimately include original oral production rather than only repetition.

## 5. Evaluation architecture

No single model or provider is allowed to produce an opaque final score.

Evaluation is layered.

### 5.1 Signal layer

Local/open components may provide:

- speech-to-text;
- word timestamps;
- phoneme recognition/alignment;
- pauses;
- duration;
- speech rate;
- pitch;
- energy;
- basic prosodic information;
- diarization/speaker embeddings for in-person group capture.

Likely implementation candidates include local/open technologies such as Whisper-family browser inference, Wav2Vec2/phoneme models, Web Audio processing, and compatible diarization/speaker-identification models. Exact models must be validated for license, browser performance, and quality before implementation.

### 5.2 Evaluation dimensions

The engine supports:

- Pronunciation
- Fluency
- Grammar & Vocabulary
- Interaction
- Task Completion
- Prosody where evidence is sufficiently reliable

Weights are activity-specific. A pronunciation drill and a B1 conversation must not use the same formula.

### 5.3 Pronunciation

Pronunciation prioritizes intelligibility and acceptable phonetic production, not imitation of a native accent.

American and British target models may be supported. Valid dialect differences must not be treated as errors merely for being different.

When a locale/model cannot reliably provide a particular phonetic detail, Talk Talk must omit or reweight that dimension rather than invent data.

### 5.4 Grammar and vocabulary

Grammar/Vocabulary must be evaluated separately from the phonetic engine.

The system stores evidence such as detected tense selection, agreement, word order, auxiliary use, lexical adequacy, and task-specific targets.

The product should not ask an LLM for an unexplained “0–100 grammar score” and treat that as authoritative.

### 5.5 Fluency

Fluency is not just words per minute.

Relevant evidence may include:

- pause frequency/duration;
- restarts;
- repetitions;
- self-corrections;
- continuity;
- appropriate response length;
- breakdowns versus reasonable thinking pauses.

### 5.6 Interaction

Interaction is derived from the sequence of turns and includes behaviors such as:

- responding meaningfully;
- follow-up questions;
- turn-taking;
- clarification;
- repair;
- reaction to partner content;
- helping sustain the exchange.

Group results may include shared conversational evidence, but language performance remains individual.

One learner must not be penalized for a partner’s pronunciation or grammar.

### 5.7 Confidence

Every evaluated component has a confidence state.

Low-confidence technical evidence must never become a learner penalty.

Possible handling:

- High confidence → normal evaluation;
- Medium confidence → usable feedback, limited assessment authority;
- Low confidence → technical retry / not reliably assessed.

Assessment mode applies stricter confidence requirements.

### 5.8 Teacher override

Teachers may override automated evaluation for formal review.

The system preserves:

- automated result;
- teacher-reviewed result;
- reason/comment when provided;
- audit history.

## 6. Feedback model

Talk Talk must avoid useless feedback such as “Pronunciation: 71%. Practice more.”

Results should provide:

1. one clear strength;
2. one primary improvement priority;
3. a concrete next action.

Detailed phonetic information is available on demand through a deeper view such as `Show me why`.

Conversation Replay allows a learner to inspect individual turns, compare what was understood, see the relevant issue, and retry a specific turn.

## 7. Personal Practice and learning memory

Talk Talk maintains a skill-based memory, not a word-by-word mistake list.

An isolated error does not create a permanent weakness.

Pattern lifecycle:

- **Observed** — detected, insufficient evidence;
- **Recurring** — repeated evidence, targeted practice appropriate;
- **Mastered** — later evidence shows reliable control.

A recurring pattern requires repeated evidence or evidence across multiple contexts.

Examples:

- final -ed /t/;
- /θ/ production;
- question word order;
- past-simple irregulars;
- follow-up questions;
- excessive within-phrase pauses.

### 7.1 Your Focus

The student sees only one primary current priority, occasionally two.

The product uses **Your Focus**, not **Your Mistakes**.

### 7.2 Side missions

Examples:

- Past -ed Clinic
- TH Sounds
- Word Stress
- Fluency Boost
- Follow-up Questions

A side mission is short, usually 2–5 minutes, and follows:

`Notice → Hear → Compare → Say → Use → Transfer`

Completing a drill does not automatically close a pattern. Mastery requires later transfer in a new utterance/conversation.

### 7.3 Spaced reinforcement

Reinforcement is adaptive rather than a rigid fixed calendar.

Natural future use can count as spaced-repetition evidence. Old errors lose weight when later evidence is consistently successful.

Mastery may decrease again only after repeated contrary evidence, not after one accidental failure.

## 8. Pair/Group Speaking

### 8.1 YouTeach owns team formation

YouTeach forms pairs, trios, and teams, including its existing logic intended to reduce repeated pairings.

Talk Talk must not include an independent permanent team generator.

The Talk Talk session receives the already-formed roster.

Each student sees the team assignment on their own phone and confirms presence. No redundant code-entry flow is required merely to rebuild a team that YouTeach already knows.

### 8.2 Group activity types

Initial reusable modes:

- Role Play
- Information Gap
- Problem Solving
- Open Discussion

Later extensions may include debate, collaborative storytelling, interviews, and negotiation.

Activities may provide participant-specific private information so learners must communicate rather than copy the same prompt.

### 8.3 Mission structure

Conversation should have an objective rather than a memorized script.

Recommended structure:

`Briefing → Private Role → Ready → Conversation → Twist → Wrap-up → Feedback`

A Twist introduces new information or a changed condition that requires spontaneous response.

## 9. In-person group capture

### 9.1 Single host recorder

In-person pairs/trios/teams may use one phone as **Host Recorder**, preferably the best-capability device.

YouTeach already knows the team. Students merely confirm they are present in that team.

Talk Talk performs a capability check and may recommend a host device. The teacher can override the recommendation.

### 9.2 Passive capture

Once the conversation starts, the host device should act like a passive recorder on the table.

Participants should not have to:

- press “My Turn”;
- look at the recorder;
- identify speakers during the conversation;
- remember at the end who said a particular sentence.

Natural conversation takes priority.

### 9.3 Speaker identification

Before recording, Talk Talk may obtain short temporary voice references for the known members of the team.

During capture it combines:

- diarization;
- temporary speaker embeddings;
- known YouTeach roster;
- turn continuity/context.

Speaker attribution must be confidence-gated.

If a segment cannot be assigned reliably, it becomes **Unassigned** and is excluded from individual scoring.

Overlapping speech is not used for individual pronunciation scoring unless separation is reliable.

No end-of-conversation “Who said this?” cleanup workflow is permitted.

Temporary voice references are deleted after the session once required results are synchronized.

### 9.4 Secondary phones

Non-host student phones may still display:

- private role;
- secret information;
- a Twist;
- personal objective;
- post-conversation individual results.

They must not require constant attention during conversation.

## 10. Remote Pair/Group Speaking

In remote mode every learner uses their own device and microphone.

Each device captures only its own learner, so identity is known from the authenticated YouTeach session.

Talk Talk does not need to own the videoconference in V1.

The conversation may occur through another call platform while Talk Talk locally captures/analyzes each learner’s microphone.

Derived turn data are synchronized by:

- Talk Talk/YouTeach session id;
- student identity;
- timestamps;
- turn metadata.

A common logical conversation timeline is reconstructed without requiring the raw audio to be centrally uploaded.

Remote group analysis therefore uses the same result schema as in-person groups even though capture is distributed.

## 11. Local AI

AI is an enhancement layer, not the product’s authority.

Possible local AI roles:

- generate activity variants;
- generate contextual follow-ups;
- generate twists;
- adapt scaffolding;
- assist Creator Mode;
- turn structured evaluation evidence into useful feedback;
- construct Personal Practice;
- act as a conversation character on capable devices.

The AI must operate on top of the curriculum map, Evaluation Engine, and Student Memory.

It does not directly invent official grades.

### 11.1 Capability profiles

Talk Talk is one product. “Lite” and “Full” are internal technical profiles.

At runtime it checks capabilities such as WebGPU, memory/performance, microphone condition, and storage.

Possible internal profiles:

- Basic
- Standard
- Enhanced

Essential learning must remain available on Basic.

### 11.2 Talk Engine Lite

For devices that cannot run a useful local LLM, Talk Talk uses a structured conversation engine based on:

- goals;
- states;
- intents;
- required information;
- multiple valid formulations;
- contextual follow-ups;
- twists.

This is not a visible button-tree.

### 11.3 Enhanced local AI

Capable devices may run an open local model in-browser for freer conversation.

If local AI fails, runs out of memory, or becomes too slow, Talk Talk falls back automatically to Talk Engine Lite.

No learner is blocked because their phone is less powerful.

## 12. Student experience

Primary navigation:

- Path
- Practice
- Speak
- Missions
- Profile

A highlighted **Join Class** appears when a YouTeach live activity is available.

### 12.1 Home

The home screen prioritizes one recommended next action rather than many competing controls.

### 12.2 Path

Path uses Talk Talk’s own situation/scenario identity rather than copying Duolingo’s visual map.

The main title is communicative, with smaller secondary language targets.

### 12.3 Practice

Practice shows current **Your Focus** and relevant personal missions, not a huge generic exercise library.

### 12.4 Speak

Speak provides direct access to relevant oral modes:

- AI/local character conversation;
- Pair/Group Speaking;
- Quick Challenge.

### 12.5 Results

Results answer:

- what went well;
- what is the single main priority;
- what to do next.

Deep phonetic details are optional.

### 12.6 Visual tone

Talk Talk should be youthful but not childish.

It should have a distinct Classroom Online Games identity and must not visually imitate Duolingo.

A scenario/door/conversation motif is acceptable, but branding is replaceable and must not be hard-coded into data structures.

## 13. Teacher experience

### 13.1 Launch

From YouTeach:

`Group → activity → teams if needed → Start Talk Talk`

YouTeach provides authenticated group/session context through the existing secure COG launch bridge.

### 13.2 Live modes

Teacher can launch:

- Individual
- Pair/Group
- Whole-class Challenge

Pair/Group chooses in-person or remote capture.

### 13.3 Teacher Monitor

Reuse existing Classroom Online Games Teacher Monitor patterns.

For group speaking, the main live view is team-centric.

Typical states:

- Ready
- Speaking
- Finished
- Offline
- Technical Problem

During the conversation, the monitor prioritizes operational state rather than fluctuating language scores.

After completion, a team opens into:

- group summary;
- participation summary;
- individual learner results;
- each learner’s current focus;
- technical-confidence issues.

### 13.4 Teacher interventions

Teacher may:

- send a Twist;
- send a brief prompt;
- advance a finished group;
- review individual evidence after completion;
- override automated evaluation;
- reorganize teams in YouTeach for a later round.

A team reorganization must not interrupt an utterance already in progress; it applies to the next round/challenge.

## 14. Practice vs Assessment

Every activity is explicitly Practice or Assessment.

### Practice

May allow:

- immediate feedback;
- retries;
- hints;
- corrective micro-practice;
- Personal Practice generation.

### Assessment

Must use:

- no mid-task corrective feedback;
- no learning hints;
- stricter confidence rules;
- final results after completion;
- optional explicit audio retention as evidence;
- Teacher Override.

Talk Talk does not automatically decide whether an assessment becomes a school grade. YouTeach/teacher owns that decision.

## 15. Creator Mode

Initial Creator Mode supports:

- create from scratch;
- duplicate existing activity;
- edit a template;
- generate a draft with local AI where available;
- Test as Student.

Editable fields include:

- level;
- situation;
- objective;
- instructions;
- roles;
- private information;
- questions/prompts;
- Twist;
- pronunciation targets;
- language targets;
- interaction targets;
- duration;
- Practice/Assessment mode.

Generated content is never published without teacher review.

## 16. Data model principles

Persist structured academic evidence, not unnecessary raw media.

Expected persistent categories include:

- learner id;
- session/activity id;
- unit/skill ids;
- mastery state;
- evidence counts;
- confidence;
- recurring-pattern metadata;
- transcription/derived textual evidence when required;
- timestamps;
- trend direction;
- teacher override data;
- technical retry states.

Ordinary raw audio and temporary voice embeddings are excluded from persistent storage by default.

Skill identifiers should be stable and reusable across units, creator activities, Personal Practice, and reports.

## 17. Integration with the existing COG live bridge

Talk Talk must comply with the existing specification:

`docs/superpowers/specs/2026-09-20-live-cog-session-bridge.md`

This means:

- teacher launch is YouTeach-controlled;
- student launch is group-scoped;
- verified YouTeach identity follows the learner;
- live results return automatically;
- retries/reconnects are idempotent;
- permanent student-side direct launch links are not introduced;
- live-session lifetime behavior is reused;
- Talk Talk does not invent parallel authentication.

Talk Talk-specific group membership data are passed as activity/session context on top of this bridge.

## 18. First vertical slice

The first functional version is a real architectural slice, not a disposable mockup.

### 18.1 Initial unit

**Tell Me What Happened**

Targets:

- A2–B1;
- Past Simple;
- final -ed /t/, /d/, /ɪd/;
- sequencing;
- narration;
- follow-up questions;
- clarification.

### 18.2 Required V1 cycle

The slice must demonstrate:

1. launch through YouTeach;
2. individual controlled pronunciation practice;
3. local capture and analysis;
4. useful pronunciation feedback;
5. individual speaking;
6. in-person Pair/Group Speaking using one Host Recorder;
7. remote Pair/Group Speaking using one device per learner;
8. individual results from a shared conversation;
9. recurring-pattern detection;
10. Past -ed Clinic Personal Practice;
11. later transfer check;
12. Teacher Monitor;
13. Teacher Override;
14. result return to YouTeach.

### 18.3 V1 evaluation

V1 must support at least:

- Pronunciation;
- Fluency;
- Grammar & Vocabulary;
- Interaction;
- Task Completion evidence;
- confidence state.

### 18.4 V1 AI

V1 must have an AI-ready interface boundary.

Talk Engine Lite is required.

A local LLM is optional at runtime and must not be required for successful completion on modest devices.

### 18.5 V1 Creator Mode

V1 Creator Mode may be deliberately limited to duplicating/editing the initial activity schema rather than implementing a full A1–C1 generator.

## 19. Explicit non-goals for V1

Do not build yet:

- the full A1–C1 content library;
- an internal videoconference system;
- public leaderboards;
- a complex rewards store;
- mandatory large local LLMs;
- permanent voice prints;
- default raw-audio retention;
- large institutional report suites;
- a second independent user/group system inside Talk Talk.

## 20. Acceptance criteria for the vertical slice

The first vertical slice is accepted when a real teacher and real student accounts can complete the full workflow without paid APIs:

1. Teacher starts Talk Talk from YouTeach with verified group/session identity.
2. Existing YouTeach team formation is reused.
3. Students confirm their already-known team membership rather than rebuilding it.
4. Individual pronunciation practice works locally.
5. Feedback identifies a concrete pronunciation priority.
6. In-person teams can select/recommend one Host Recorder and converse without touching it during the conversation.
7. Speaker attribution is automatic and confidence-gated.
8. Uncertain speaker segments are excluded rather than guessed.
9. Remote teams capture one learner per device and reconstruct a shared logical timeline.
10. Ordinary raw audio stays on-device and is deleted after processing.
11. Each learner receives individual feedback from a shared group conversation.
12. Interaction is evaluated from conversation behavior, not merely talk duration.
13. Technical uncertainty never lowers a learner’s academic result.
14. A recurring final--ed issue creates a Personal Practice mission.
15. Later spontaneous use can provide transfer/mastery evidence.
16. Teacher Monitor shows operational state during live speaking and individual results afterward.
17. Teacher can override automated evaluation with an audit trail.
18. Structured results return automatically to YouTeach.
19. The workflow remains usable on a modest device through fallback behavior.
20. No essential functionality incurs mandatory per-use cost.

## 21. Architecture rule

The core product rule is:

> **Talk Talk degrades computational sophistication, never the learning objective.**

A high-capability device may provide richer local AI and deeper analysis. A modest device may use lighter models and Talk Engine Lite. Both must still allow the learner to complete the same communicative objective and receive useful feedback.

## 22. Naming

**Talk Talk** is the current working project/product name.

The implementation must keep product branding replaceable. Names, database keys, protocol names, and internal engine boundaries should not unnecessarily depend on the public brand.

If the commercial name changes later, core architecture and persisted learner data should not require a major migration.
