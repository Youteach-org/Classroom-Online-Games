# Engineering Section Design

## Goal
Add an Engineering section inside Classroom Online Games, separate from English games, containing Control Systems Unit 1 with four study versions.

## Structure
- Classroom Online Games
  - English Games (existing games unchanged)
  - Engineering
    - Control Systems
      - Unit 1
        - Version 1
        - Version 2
        - Version 3
        - Version 4

## Study Game Requirements
- No lives mechanic.
- Compact header and minimal wasted vertical space.
- Four answer options remain fully visible without internal answer scrolling.
- Previous-question navigation is retained.
- Answers persist when moving backward/forward.
- After answering, every distractor can be clicked to explain why it is wrong.
- Keep points, streak, hints, and summary/review.
- Photographic/realistic images must be directly relevant to the question, not decorative.
- Question bank is grounded in the professor's Exam 1 study guide and expanded into four different versions rather than one version containing everything.
- Do not display “Connectivity 5” in the Engineering section or root menu labels.

## Integration Constraint
Do not alter the behavior or existing routes of OSASCOMP, Support Meter, 100 Students Said, or other existing English games. The new section is a separate navigation branch inside Classroom Online Games.
