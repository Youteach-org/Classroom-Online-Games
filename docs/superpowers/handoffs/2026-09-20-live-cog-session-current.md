# Handoff — Live COG Session Bridge

Updated: 2026-09-23

## Current integration branches

- YouTeach: `Youteach-org/YouTeach`
  - branch: `live-cog-20260922`
  - verified implementation checkpoint: `832c389dbd95422f511552a3f1c931f13609c281`
  - verification: run `35828301309` — 230/230 tests GREEN, server/client syntax GREEN, Pages build GREEN
  - browser E2E: run `35828301497` — GREEN
- Classroom Online Games: `Youteach-org/Classroom-Online-Games`
  - branch: `live-cog-20260922`
  - verified implementation checkpoint: `a3f2d9e24d948c305346397b86460bbb34e05e71`
  - verification: run `35828254105` — runner-probe, syntax, shared-bridge, Verb Runner, 100 Students Said, Support Meter, OSASCOMP and build all GREEN
  - preview deploy: run `35828254080` — GREEN

## Canonical architecture

- YouTeach live state remains Firebase Realtime Database.
- Do not restore the abandoned KV/private session-store design.
- Teacher live launch originates from a `COG` assignment in the shared YouTeach Assignments flow after the working group/Smart Teams context is established.
- Opening a COG game/monitor alone does not publish a live activity; native teacher start does.
- Canonical live game IDs:
  - `verb-runner`
  - `support-meter`
  - `100-students-said`
  - `osascomp`
- `100-students-said` remains Student-Buzzer-native and has no external student JOIN GAME route.
- Teacher/student presence is heartbeat-based; stale threshold is 90 seconds.
- Expiration is explicit teacher end OR 60 continuous minutes with zero teacher/student presence.
- Student eligibility honors YouTeach multi-group membership; the active Buzzer group may be a secondary membership.
- The signed bridge carries the active group and canonical student identity; it does not overwrite the student's primary group.
- Verified results are stored in YouTeach at:
  `assignmentSubmissions/{assignmentId}/{studentKey}/cogResults/{resultId}`
- Result retries are idempotent by result id.
- Result receipts are game results/history, not PDF submissions and not automatic grades.

## Browser verification

YouTeach Actions run `35828301497` passed the complete Verb Runner cross-repository story:

1. teacher login;
2. FANTASMA active working group;
3. Smart Teams from all 20 existing Ghost memberships;
4. COG assignment creation and signed teacher launch;
5. Verb Runner session registration;
6. GHOST20/FAKE-20 login through Student Buzzer;
7. dynamic JOIN GAME after live start;
8. canonical signed student identity in COG;
9. heartbeat;
10. one accepted result receipt;
11. retry of the same result returns duplicate/idempotent behavior;
12. Teacher Assignments shows the result/history rather than PDF or automatic grade;
13. END ACTIVITY closes the live session.

Support Meter, OSASCOMP, and 100 Students Said are covered by their dedicated automated suites and the shared bridge contract. Expiry behavior is covered by automated policy tests.

## Preview rule

For cross-repository preview E2E, use the same short branch name in both repositories. Verified pair:

- `https://live-cog-20260922.youteach.pages.dev`
- `https://live-cog-20260922.classroom-online-games.pages.dev`

Long branch names can be truncated/disambiguated differently by Cloudflare and must not be relied on for paired preview origin derivation.

## Task status

- Task 15 — contract verification: COMPLETE.
- Task 16 — browser E2E: COMPLETE.
- Task 17 — final docs / PR / merge / production deploy verification: READY.

## Next action

Create PRs from `live-cog-20260922` to `main` in both repositories. Confirm checks on the exact PR heads, merge only after GREEN, then verify production Cloudflare deploys for the resulting `main` commits.

## Project rules

- GitHub is the source of truth.
- Never create duplicate Ghost students.
- Preserve standalone/free modes in each game.
- Do not modify native game behavior unnecessarily to add bridge integration.
- Keep YouTeach and COG as separate repositories with an explicit signed contract.
