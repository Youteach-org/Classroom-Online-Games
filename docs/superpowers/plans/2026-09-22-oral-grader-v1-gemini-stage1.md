# Oral Grader V1 Gemini Stage-1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working Oral Grader (OG) Stage-1 pipeline that sends an original oral-exam recording to Gemini for literal/verbatim transcription with speaker diarization and word timestamps, then stores teacher-reviewable transcript artifacts on the OG branch.

**Architecture:** OG lives as a top-level `Oral-Grader/` project in `Youteach-org/Classroom-Online-Games`, independent of Talk Talk and YouTeach. A focused Python transcriber owns Gemini interaction and transcript rendering; a dedicated GitHub Actions workflow owns temporary audio download, credential validation, execution, output validation, and committing only transcript artifacts. Raw student audio is never committed.

**Tech Stack:** Python 3.12, `google-genai`, GitHub Actions, JSON/Markdown transcript artifacts.

**Spec:** `docs/superpowers/specs/2026-09-22-oral-grader-og-design.md`

## Global Constraints

- Canonical repository: `Youteach-org/Classroom-Online-Games`.
- Canonical branch: `feature/oral-grader-v1-20260922`.
- Implementation root: `Oral-Grader/`.
- Do not modify or place OG code inside `Talk-Talk/`.
- Use Gemini for canonical Stage 1; do not silently substitute another provider.
- Stage 1 is literal evidence: no grammar, vocabulary, or pronunciation correction.
- Preserve speaker labels and word timestamps from Gemini.
- Raw student audio must not be committed to Git history.
- `GEMINI_API_KEY` is read only from GitHub Actions secrets.
- Stage 2 and PDF generation do not run until the teacher accepts Stage 1.

## Review Focus

1. Gemini credential absent: workflow must fail explicitly before audio processing and never fall back to another engine.
2. Gemini returns no `word_info` annotations: validation must fail rather than commit an empty transcript.
3. Unknown or changing speaker labels: Stage 1 must preserve Gemini labels without guessing student identity.
4. Malformed or nonstandard recognized text: renderer must preserve the heard token exactly rather than normalize it.
5. Temporary audio transfer: workflow downloads to `/tmp`, verifies non-empty bytes, and never stages audio for commit.

---

### Task 1: OG Stage-1 transcriber and unit tests

**Files:**
- Create: `Oral-Grader/stage1/gemini-transcribe.py`
- Create: `Oral-Grader/tests/test-gemini-transcribe.py`

**Interfaces:**
- Consumes: local audio path plus `GEMINI_API_KEY`/optional `GOOGLE_API_KEY`.
- Produces: `<pair>-stage1.json` and `<pair>-stage1.md`; helper functions `build_generation_config()`, `extract_word_annotations()`, `group_speaker_turns()`, and `render_markdown()`.

- [ ] **Step 1: Write failing tests for canonical Stage-1 behavior**

Create `Oral-Grader/tests/test-gemini-transcribe.py` covering:
- exact verbatim/diarization/word-timestamp generation config;
- extraction of only `word_info` annotations;
- speaker-turn grouping without relabeling;
- preservation of malformed text such as `say me`;
- empty annotations returning an empty list so the workflow validator can reject it.

Representative assertion:

```python
def test_generation_config_is_verbatim_with_diarization_and_word_timestamps():
    assert mod.build_generation_config() == {
        "transcription_config": {
            "mode": {
                "type": "verbatim",
                "diarization_mode": "speaker",
                "timestamp_granularities": ["word"],
            }
        }
    }
```

- [ ] **Step 2: Run tests and verify they fail because the OG implementation does not yet exist**

Run:

```bash
python -m pytest -q Oral-Grader/tests/test-gemini-transcribe.py
```

Expected: FAIL during module load because `Oral-Grader/stage1/gemini-transcribe.py` is missing.

- [ ] **Step 3: Implement the focused transcriber**

Create `Oral-Grader/stage1/gemini-transcribe.py` by adapting the previously tested implementation with these OG-specific changes:
- model constant remains `gemini-3.5-transcribe`;
- no dependency on YouTeach paths;
- output metadata includes `project: "Oral-Grader"`;
- speaker values remain raw Gemini labels;
- live call reads credentials only from environment;
- no Stage-2 analysis is present.

Core configuration:

```python
MODEL = "gemini-3.5-transcribe"

def build_generation_config():
    return {
        "transcription_config": {
            "mode": {
                "type": "verbatim",
                "diarization_mode": "speaker",
                "timestamp_granularities": ["word"],
            }
        }
    }
```

Output record must include:

```python
{
    "project": "Oral-Grader",
    "stage": 1,
    "pair_slug": pair_slug,
    "model": MODEL,
    "mode": "verbatim",
    "speaker_diarization": True,
    "word_timestamps": True,
    "source_file": audio_path.name,
    "full_text": raw_output_text,
    "turns": turns,
    "words": words,
}
```

- [ ] **Step 4: Run the Stage-1 unit tests**

Run:

```bash
python -m pytest -q Oral-Grader/tests/test-gemini-transcribe.py
```

Expected: all tests PASS.

- [ ] **Step 5: Commit Task 1**

Commit message:

```text
feat(og): add Gemini literal Stage-1 transcriber
```

### Task 2: Dedicated OG GitHub Actions workflow

**Files:**
- Create: `.github/workflows/oral-grader-v1.yml`

**Interfaces:**
- Consumes: `GEMINI_API_KEY` repository secret, temporary `audio_url`, `pair_slug`.
- Produces: validated transcript JSON/Markdown under `Oral-Grader/transcripts/`.

- [ ] **Step 1: Define a branch-isolated workflow**

Workflow requirements:
- name: `Oral Grader V1 - Gemini Stage 1`;
- manual `workflow_dispatch` inputs: `audio_url`, `pair_slug`;
- optional automated push trigger only on `feature/oral-grader-v1-20260922` and only for the OG request mechanism if needed;
- permissions limited to `contents: write`;
- Python 3.12;
- install `google-genai`;
- fail if both `GEMINI_API_KEY` and `GOOGLE_API_KEY` are empty;
- download source audio to `/tmp/oral-grader-source.ogg`;
- verify file is non-empty;
- run `Oral-Grader/stage1/gemini-transcribe.py`;
- validate non-empty `words` and `turns`;
- commit only `Oral-Grader/transcripts/<pair>-stage1.{json,md}`.

Credential check:

```bash
if [ -z "$GEMINI_API_KEY" ] && [ -z "$GOOGLE_API_KEY" ]; then
  echo "Gemini API key secret is not configured." >&2
  exit 2
fi
```

Artifact validation:

```python
assert data["project"] == "Oral-Grader"
assert data["stage"] == 1
assert data["mode"] == "verbatim"
assert data["speaker_diarization"] is True
assert data["word_timestamps"] is True
assert data["words"], "Gemini returned no word annotations"
assert data["turns"], "Gemini returned no speaker turns"
```

- [ ] **Step 2: Validate workflow syntax without invoking Gemini**

Run a YAML parse in a Python environment with PyYAML available:

```bash
python - <<'PY'
import yaml
with open(".github/workflows/oral-grader-v1.yml", encoding="utf-8") as f:
    yaml.safe_load(f)
print("oral-grader-workflow-yaml-ok")
PY
```

Expected: `oral-grader-workflow-yaml-ok`.

- [ ] **Step 3: Re-run OG unit tests**

Run:

```bash
python -m pytest -q Oral-Grader/tests/test-gemini-transcribe.py
```

Expected: all tests PASS.

- [ ] **Step 4: Commit Task 2**

Commit message:

```text
ci(og): add isolated Gemini Stage-1 workflow
```

### Task 3: First live Paul/Paulina Stage-1 validation

**Files:**
- Runtime-only input: original Paul/Paulina OGG from authorized Google Drive storage.
- Expected generated files:
  - `Oral-Grader/transcripts/paul-paulina-stage1.json`
  - `Oral-Grader/transcripts/paul-paulina-stage1.md`

**Interfaces:**
- Consumes: original OGG and the configured `GEMINI_API_KEY`.
- Produces: live Stage-1 transcript only.

- [ ] **Step 1: Obtain a fresh temporary authenticated audio URL**

Use the authorized Google Drive copy of the original Paul/Paulina OGG. Do not use any prior normalized transcript or historical local-PC output as input.

- [ ] **Step 2: Trigger the OG workflow without committing raw audio**

Preferred execution is `workflow_dispatch` with the temporary audio URL and `pair_slug=paul-paulina`.

If the current GitHub connector cannot dispatch workflows directly, stop before introducing a privacy-regressing workaround. Use an explicit user-approved trigger path rather than committing raw audio or a long-lived credential.

- [ ] **Step 3: Verify the GitHub Actions run**

Inspect:
- workflow run conclusion;
- job steps;
- logs for credential detection without printing the secret;
- audio byte count;
- Gemini live-call result;
- transcript validation counts.

Expected: job conclusion `success`; no fallback engine invoked.

- [ ] **Step 4: Inspect generated Stage-1 transcript**

Verify:
- both JSON and Markdown exist;
- raw speaker labels are preserved;
- transcript text is not normalized by OG code;
- timestamps are present;
- no Stage-2 `intended` corrections appear.

- [ ] **Step 5: Stop at teacher-review gate**

Do not run pronunciation analysis or generate a PDF yet. Present the Stage-1 transcript to the teacher for fidelity review.

- [ ] **Step 6: Commit execution-state documentation if the live API reveals a material integration requirement**

Only document verified behavior or errors; do not claim live Gemini compatibility until the run succeeds.

