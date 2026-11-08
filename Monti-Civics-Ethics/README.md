# Monti's Civics Challenge · COG

New COG game (not deployed while this branch is unmerged).

- Student entrypoint: `/Monti-Civics-Ethics/`
- Teacher entrypoint: `/Monti-Civics-Ethics/teacher/`
- Four topics taken from the themes in the nine workbook photos: identity and self-care; respect and diversity; adolescence and stereotypes; human rights and solidarity.
- Six-character room code. One teacher and one student on separate devices.
- 12 automatically checked multiple-choice questions and four written answers reviewed by the teacher.
- Teacher controls session start, answer reveal, question progression, written-response acceptance, and session ending.
- Works via the same Firebase Realtime Database root as existing COG live activities; this module stores room nicknames, answer choices, and brief written responses. Do not enter personal or sensitive details.
- Does not modify existing COG games or the root homepage.

## Manual browser acceptance tests

1. Open teacher entry on one device, create a room, copy the code.
2. Open student entry on a second device, enter code and nickname, join.
3. Check that teacher sees the student and can start the session.
4. Submit a choice answer; verify it appears in the monitor, reveal the key, then advance.
5. At question 4, submit a written answer; verify teacher sees it and can accept it or mark for revision.
6. Refresh both browsers: each should recover its own session from the room link and browser storage.
7. Complete the questions and verify scores and reviewed-answer totals.
8. Verify that joining a room with an already occupied student seat fails.
9. Verify that a student cannot see Teacher Monitor actions.
10. Verify it is legible on a mobile screen.

This proof-of-concept uses the existing public live-room storage pattern. It is not a private assessment system; no sensitive student information should be entered. Do not merge/deploy until browser tests and approval.
