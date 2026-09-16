# YouTeach credentials → Verb Runner implementation plan

## Goal
Use YouTeach's existing student identity as the stable identity for Verb Runner without putting student PII or the Firebase student key in the launch URL.

## Flow
1. A logged-in student clicks **Verb Runner** inside YouTeach.
2. YouTeach generates a cryptographically random, short-lived launch token and writes it to `classroomGames/verbRunnerV2/launchTokens/<token>` with the student's Firebase key, creation time, expiry time, game id, and `used:false`.
3. YouTeach opens COG at `/Verb-Runner/?launch=<token>`.
4. Verb Runner atomically claims the token, rejects expired/already-used tokens, reads `students/<studentKey>`, and derives the canonical identity.
5. Verb Runner stores the resolved identity locally on the COG origin so later classroom-session URLs on the same device can retain identity without another name prompt.
6. Firebase presence uses a stable YouTeach-derived runner id and writes `studentKey`, `nickname`, `fullName`, `groupName`, and `studentNumber` as metadata. Robot/color remains presentation only.
7. Teacher Monitor displays YouTeach nickname/name when available. **Free Mode is a presence grouping, not a credential tier:** every Verb Runner player who is not attached to a teacher-created class session must be reported under Free Mode.
8. A direct/local COG launch remains visible in Teacher Monitor Free Mode using its stable local runner id and `identitySource:'local'`. It is not treated as a YouTeach credentialed identity. A YouTeach launch uses the stable YouTeach-derived runner id and `identitySource:'youteach'`.
9. Presence routing is therefore invariant: **with `session` → that classroom session; without `session` → Free Mode**, regardless of whether YouTeach identity metadata is available.

## TDD
- Add failing YouTeach launch-token tests and wire them into YouTeach deploy CI.
- Add failing COG token-resolution / stable-identity tests.
- Implement YouTeach launcher.
- Implement atomic token claim and identity resolution in COG.
- Route presence through stable YouTeach identity.
- Verify both repositories' CI/deploy workflows are green.


## Regression decision — 2026-09-15

A credentials change temporarily gated Free Mode Firebase writes behind the presence of a resolved YouTeach identity. This made direct/local players invisible to Teacher Monitor even though they were actively using Verb Runner.

The regression rule is now explicit and test-protected:

- Missing classroom session code must never disable Teacher Monitor presence.
- Local/direct players write to `classroomGames/verbRunnerV2/freeMode/students/<runnerId>`.
- YouTeach-identified players use the same Free Mode collection when no classroom session exists, while retaining their canonical YouTeach metadata.
- Credential status changes identity quality and labeling; it does **not** determine whether a runner is visible.
