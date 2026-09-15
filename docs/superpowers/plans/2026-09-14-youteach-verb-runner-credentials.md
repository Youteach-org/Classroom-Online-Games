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
7. Teacher Monitor displays YouTeach nickname/name. Free Mode contains identified YouTeach students who are not currently attached to a teacher-created Verb Runner session.
8. A direct anonymous COG launch may still run locally for compatibility, but it is not treated as a YouTeach credentialed Free Mode identity.

## TDD
- Add failing YouTeach launch-token tests and wire them into YouTeach deploy CI.
- Add failing COG token-resolution / stable-identity tests.
- Implement YouTeach launcher.
- Implement atomic token claim and identity resolution in COG.
- Route presence through stable YouTeach identity.
- Verify both repositories' CI/deploy workflows are green.
