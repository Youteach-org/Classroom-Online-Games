# COG ↔ YouTeach evaluable assignments — Phase 1 implementation plan

Date: 2026-09-16
Status: implementation started from confirmed architecture decisions only.

## Goal

Implement the stable, backend-independent policy layer that both products can rely on before wiring the final secure server endpoints and teacher/student UI.

## Scope in this phase

1. Shared COG assignment contract
   - validate normalized 0–100 results
   - validate compact attempt summaries
   - validate immutable published gameplay configuration shape
   - evaluate optional minimum-performance gate
   - calculate six-month QR/receipt verification expiry from receipt creation

2. YouTeach assignment policy helpers
   - proportional assignment-point conversion
   - submission vs resubmission labels
   - Undo Submission eligibility/state
   - deadline/on-time recalculation
   - one-month trash expiry
   - restored assignment draft defaults

3. Tests
   - pure Node tests for all above rules
   - no production Firebase/Drive/backend migration in this phase

## Explicitly deferred

- final public COG auth provider wiring
- server-authoritative launch-token endpoint
- signed/server-verified attempt endpoint
- receipt persistence API
- Turso schema
- Activity COG teacher UI
- student Send to teacher UI
- deletion/trash UI
- long-term grade/archive policy beyond the confirmed provisional rules

These deferred items require either more implementation context or remaining product decisions; this phase must not invent them.
