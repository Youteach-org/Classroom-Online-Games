# Oral Grader Stage 2 Audio Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and live-validate Oral Grader Stage 2 so the original Paul/Paulina audio is analyzed for pronunciation and language evidence without altering the accepted Stage-1 transcript.

**Architecture:** Stage 2 is a separate audio-first Python analyzer under `Oral-Grader/stage2/`. It uploads the original audio to Gemini, asks for schema-constrained evidence, validates the response locally, then overlays teacher-confirmed evidence with higher authority before rendering JSON/Markdown. A separate GitHub Actions workflow downloads the temporary audio, verifies Stage-1 acceptance and the configured model, runs tests, executes Stage 2, validates immutability and output invariants, and commits only analysis artifacts.

**Tech Stack:** Python 3.12, `google-genai` 2.x, Pydantic 2.x, Gemini Files API / Interactions API, GitHub Actions, JSON/Markdown.

**Spec:** `docs/superpowers/specs/2026-09-22-oral-grader-stage2-audio-analysis-design.md`

## Global Constraints

- Canonical repository: `Youteach-org/Classroom-Online-Games`.
- Canonical branch: `feature/oral-grader-v1-20260922`.
- Stage 2 implementation lives under `Oral-Grader/`; do not modify Talk Talk or YouTeach.
- Original audio is the primary evidence source.
- Stage-1 transcript is immutable and may only be read.
- Teacher-confirmed listening evidence outranks model output.
- `uncertain` evidence never counts toward a pronunciation penalty.
- Grammar, vocabulary, malformed-form, transcription, fluency, and pronunciation evidence remain separate.
- Raw student audio and temporary authenticated URLs must never be committed.
- No alternate provider or silent model fallback is allowed.
- Stage 2 does not assign final 0–8 rubric scores and does not generate the final PDF.
- Initial configured Stage-2 model: `gemini-3.8-flash`, because current official Gemini audio examples use it; the workflow must still validate model availability at runtime before analysis.
- Repository secret `GEMINI_API_KEY` remains the only required Gemini credential; `ORAL_GRADER_AUDIO_URL` remains a temporary runtime audio source.

## File Structure

- Create `Oral-Grader/stage2/analyze-audio.py`: schemas, prompt construction, Gemini audio call, validation, teacher-evidence overlay, summaries, Markdown rendering, CLI.
- Create `Oral-Grader/tests/test-stage2-audio-analysis.py`: unit tests for every Stage-2 invariant.
- Create `.github/workflows/oral-grader-stage2.yml`: isolated Stage-2 CI/live workflow.
- Create `Oral-Grader/stage2-run-request.json`: non-secret trigger containing only `pair_slug`.
- Generated at runtime: `Oral-Grader/analysis/paul-paulina-stage2.json`.
- Generated at runtime: `Oral-Grader/analysis/paul-paulina-stage2.md`.

## Review Focus

1. **Teacher evidence with no timestamp:** preserve `fires -> fathers` with null offsets and never invent a location; any potentially conflicting model evidence must not supersede it.
2. **Model returns an `uncertain` item marked as countable:** local normalization must force `counts_toward_pronunciation=false`.
3. **Grammar-only or vocabulary-only item comes back as pronunciation error:** local validation must downgrade it to `not_scored` unless the item independently contains audio-supported pronunciation evidence.
4. **Stage-1 files change during the workflow:** SHA-256 hashes taken before analysis must match after analysis; mismatch fails the job before commit.
5. **Gemini returns valid JSON shape but invalid semantics:** unsupported speaker, bad verdict, absent intended word for a countable pronunciation error, or malformed evidence source must be rejected before artifacts are committed.

---

### Task 1: Stage-2 evidence model, validation, and teacher overlay

**Files:**
- Create: `Oral-Grader/tests/test-stage2-audio-analysis.py`
- Create: `Oral-Grader/stage2/analyze-audio.py`

**Interfaces:**
- Consumes: parsed Stage-1 JSON, parsed Stage-1 review JSON, raw model analysis dict.
- Produces:
  - `validate_stage1_preconditions(stage1, review) -> dict[str, str]`
  - `normalize_evidence_item(item, allowed_students) -> dict`
  - `apply_teacher_evidence(model_evidence, review) -> list[dict]`
  - `build_student_summaries(evidence, speaker_mapping) -> dict`
  - `render_markdown(result) -> str`

- [ ] **Step 1: Write failing tests for Stage-1 acceptance and speaker mapping**

Add these tests first:

```python
def test_stage2_requires_accepted_stage1():
    stage1 = {"project": "Oral-Grader", "stage": 1, "pair_slug": "paul-paulina"}
    review = {
        "accepted_for_stage2": False,
        "speaker_mapping": {"spk:0": "Teacher", "spk:1": "Paul", "spk:2": "Paulina"},
    }
    with pytest.raises(ValueError, match="accepted"):
        mod.validate_stage1_preconditions(stage1, review)


def test_stage2_returns_accepted_speaker_mapping():
    stage1 = {"project": "Oral-Grader", "stage": 1, "pair_slug": "paul-paulina"}
    review = {
        "accepted_for_stage2": True,
        "speaker_mapping": {"spk:0": "Teacher", "spk:1": "Paul", "spk:2": "Paulina"},
    }
    assert mod.validate_stage1_preconditions(stage1, review) == {
        "spk:0": "Teacher",
        "spk:1": "Paul",
        "spk:2": "Paulina",
    }
```

Also test that missing `spk:0`, `spk:1`, or `spk:2` raises `ValueError("speaker mapping")`.

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
python -m pytest -q Oral-Grader/tests/test-stage2-audio-analysis.py
```

Expected: collection/import failure because `Oral-Grader/stage2/analyze-audio.py` does not yet exist.

- [ ] **Step 3: Implement only Stage-1 precondition validation**

Add:

```python
def validate_stage1_preconditions(stage1, review):
    if stage1.get("project") != "Oral-Grader" or stage1.get("stage") != 1:
        raise ValueError("invalid Stage-1 source")
    if not review.get("accepted_for_stage2"):
        raise ValueError("Stage 1 has not been accepted for Stage 2")
    mapping = review.get("speaker_mapping") or {}
    required = {"spk:0", "spk:1", "spk:2"}
    if not required.issubset(mapping):
        raise ValueError("speaker mapping is incomplete")
    if mapping["spk:0"] != "Teacher":
        raise ValueError("speaker mapping must identify spk:0 as Teacher")
    return dict(mapping)
```

Run the two precondition tests. Expected: PASS.

- [ ] **Step 4: Add failing tests for semantic normalization**

Add:

```python
def test_uncertain_never_counts_toward_pronunciation():
    item = sample_item(
        speaker="Paul",
        pronunciation="uncertain",
        counts_toward_pronunciation=True,
        intended="fathers",
    )
    normalized = mod.normalize_evidence_item(item, {"Paul", "Paulina"})
    assert normalized["counts_toward_pronunciation"] is False


def test_grammar_only_item_is_not_scored_for_pronunciation():
    item = sample_item(
        speaker="Paul",
        pronunciation="incorrect",
        counts_toward_pronunciation=True,
        intended=None,
        pronunciation_note=None,
        grammar_note="Subject-verb agreement: when you was.",
    )
    normalized = mod.normalize_evidence_item(item, {"Paul", "Paulina"})
    assert normalized["pronunciation"] == "not_scored"
    assert normalized["counts_toward_pronunciation"] is False


def test_unknown_student_is_rejected():
    with pytest.raises(ValueError, match="speaker"):
        mod.normalize_evidence_item(
            sample_item(speaker="Unknown Student"),
            {"Paul", "Paulina"},
        )
```

The `sample_item` helper must return all required evidence fields with neutral defaults so each test changes only the behavior under test.

- [ ] **Step 5: Run new tests and verify RED**

Expected: FAIL because `normalize_evidence_item` does not exist.

- [ ] **Step 6: Implement semantic normalization**

Use these allowed values:

```python
PRONUNCIATION_VALUES = {"acceptable", "incorrect", "uncertain", "not_scored"}
INTENT_CONFIDENCE_VALUES = {"high", "medium", "low", "uncertain"}
```

Implement:

```python
def normalize_evidence_item(item, allowed_students):
    result = dict(item)
    speaker = result.get("speaker")
    if speaker not in allowed_students and speaker != "Teacher":
        raise ValueError(f"unsupported speaker: {speaker}")

    verdict = result.get("pronunciation")
    if verdict not in PRONUNCIATION_VALUES:
        raise ValueError(f"unsupported pronunciation verdict: {verdict}")

    if result.get("intent_confidence") not in INTENT_CONFIDENCE_VALUES:
        raise ValueError("unsupported intent confidence")

    if verdict in {"uncertain", "not_scored"}:
        result["counts_toward_pronunciation"] = False

    has_pronunciation_basis = bool(result.get("pronunciation_note"))
    has_nonpronunciation_error = any(
        result.get(key)
        for key in (
            "grammar_note",
            "vocabulary_note",
            "malformed_form_note",
            "transcription_note",
        )
    )
    if verdict == "incorrect" and not has_pronunciation_basis and has_nonpronunciation_error:
        result["pronunciation"] = "not_scored"
        result["counts_toward_pronunciation"] = False

    if result["pronunciation"] == "incorrect" and result.get("counts_toward_pronunciation"):
        if not result.get("intended"):
            raise ValueError("countable pronunciation error requires intended form")

    return result
```

Run the semantic tests. Expected: PASS.

- [ ] **Step 7: Add failing tests for teacher authority and null timestamps**

Add:

```python
def test_teacher_confirmed_evidence_is_preserved_with_null_timestamp():
    review = {
        "speaker_mapping": {"spk:0": "Teacher", "spk:1": "Paul", "spk:2": "Paulina"},
        "teacher_confirmed_pronunciation_evidence": [{
            "heard": "fires",
            "intended": "fathers",
            "speaker": "Paul",
            "timestamp": None,
            "status": "teacher-confirmed-from-audio",
            "note": "Confirmed by teacher listening.",
        }],
    }
    merged = mod.apply_teacher_evidence([], review)
    item = merged[0]
    assert item["reviewed_heard"] == "fires"
    assert item["intended"] == "fathers"
    assert item["start_offset"] is None
    assert item["end_offset"] is None
    assert item["pronunciation"] == "incorrect"
    assert item["counts_toward_pronunciation"] is True
    assert item["evidence_source"] == ["teacher-confirmed", "audio"]


def test_teacher_evidence_suppresses_conflicting_model_penalty_for_same_student_and_intended():
    model_items = [
        sample_item(
            speaker="Paul",
            reviewed_heard="father",
            intended="fathers",
            pronunciation="acceptable",
            counts_toward_pronunciation=False,
        )
    ]
    merged = mod.apply_teacher_evidence(model_items, teacher_review())
    assert any(i["reviewed_heard"] == "fires" and i["pronunciation"] == "incorrect" for i in merged)
    model_item = next(i for i in merged if i.get("model_origin") is True)
    assert model_item["counts_toward_pronunciation"] is False
    assert model_item["superseded_by_teacher_evidence"] is True
```

- [ ] **Step 8: Run teacher-authority tests and verify RED**

Expected: FAIL because `apply_teacher_evidence` does not exist.

- [ ] **Step 9: Implement teacher-evidence overlay**

Create each teacher-confirmed pronunciation record with:
- `start_offset=None`, `end_offset=None` when no timestamp is confirmed;
- `stage1_heard=None`;
- `reviewed_heard=<teacher heard>`;
- `intended=<teacher intended>`;
- `intent_confidence="high"`;
- `pronunciation="incorrect"`;
- `counts_toward_pronunciation=True`;
- `evidence_source=["teacher-confirmed", "audio"]`;
- `teacher_override=True`.

Before appending it, mark model-origin records with the same student and case-insensitive intended form as `superseded_by_teacher_evidence=True` and force their `counts_toward_pronunciation=False`. Do **not** assign the teacher record any timestamp unless the review already contains one.

- [ ] **Step 10: Add and pass student-summary tests**

Test that Paul/Paulina summaries:
- count only `incorrect` + `counts_toward_pronunciation=True` as pronunciation errors;
- count `uncertain` separately;
- retain representative grammar/vocabulary notes;
- omit Teacher from `students`.

Representative assertion:

```python
summaries = mod.build_student_summaries(evidence, mapping)
assert summaries["Paul"]["incorrect_pronunciation_count"] == 1
assert summaries["Paul"]["uncertain_count"] == 1
assert "Teacher" not in summaries
```

- [ ] **Step 11: Add Markdown rendering and immutable input behavior**

`render_markdown(result)` must contain:
- separate Paul and Paulina headings;
- a pronunciation evidence table containing only countable/uncertain pronunciation evidence;
- separate grammar/vocabulary observations;
- `fires → fathers` when present;
- no rubric score.

Add a test that deep-copies `stage1` and `review`, runs all local Stage-2 post-processing functions, and asserts both inputs remain byte-equivalent to the originals.

- [ ] **Step 12: Run the complete Stage-2 unit suite**

Run:

```bash
python -m pytest -q Oral-Grader/tests/test-stage2-audio-analysis.py
```

Expected: all Stage-2 tests PASS.

- [ ] **Step 13: Commit Task 1**

Commit:

```text
feat(og): add Stage-2 evidence validation and teacher overlay
```

---

### Task 2: Gemini audio analysis client with structured output

**Files:**
- Modify: `Oral-Grader/stage2/analyze-audio.py`
- Modify: `Oral-Grader/tests/test-stage2-audio-analysis.py`

**Interfaces:**
- Consumes: audio path, accepted Stage-1 JSON, accepted review JSON, `GEMINI_API_KEY`, `ORAL_GRADER_STAGE2_MODEL`.
- Produces:
  - `build_analysis_prompt(stage1, review) -> str`
  - `validate_model_available(client, model_name) -> None`
  - `parse_model_payload(text) -> dict`
  - `analyze_audio(...) -> dict`
  - output JSON/Markdown files.

- [ ] **Step 1: Add failing prompt tests**

The prompt test must assert these literal requirements are present:

```python
prompt = mod.build_analysis_prompt(stage1, review)
assert "Do not rewrite Stage 1" in prompt
assert "Original audio is primary evidence" in prompt
assert "uncertain" in prompt
assert "not_scored" in prompt
assert "grammar_note" in prompt
assert "vocabulary_note" in prompt
assert "Paul" in prompt
assert "Paulina" in prompt
```

Also assert that the prompt includes the accepted Stage-1 turns and the teacher-confirmed `fires -> fathers` note as **context**, while explicitly instructing Gemini not to override teacher-confirmed evidence.

- [ ] **Step 2: Run prompt tests and verify RED**

Expected: FAIL because `build_analysis_prompt` does not exist.

- [ ] **Step 3: Implement the prompt builder**

The prompt must instruct Gemini to return only evidence that is useful for later evaluation, not an exhaustive phonetic transcript.

It must explicitly state:

```text
Original audio is primary evidence.
Do not rewrite Stage 1.
Do not silently normalize heard forms.
Do not penalize an item solely because transcription is uncertain.
Use pronunciation=incorrect only when intended meaning is sufficiently clear
and the audio supports a pronunciation mismatch.
Grammar, vocabulary, malformed forms, and pronunciation are separate.
Rapid low-value exchanges may be omitted unless they affect pronunciation,
speaker attribution, Fluency, Interaction, or intended-word inference.
Teacher-confirmed evidence is authoritative and must not be contradicted.
```

Then append compact JSON context containing `speaker_mapping`, `turns`, and teacher-confirmed evidence.

- [ ] **Step 4: Add failing model-availability tests using a fake client**

Create a minimal fake model object with `name` and `supported_actions`.

Tests:

```python
def test_configured_model_must_exist():
    client = FakeClient(models=[FakeModel("models/gemini-other", ["generateContent"])])
    with pytest.raises(RuntimeError, match="not available"):
        mod.validate_model_available(client, "gemini-3.8-flash")


def test_configured_model_must_support_generate_content():
    client = FakeClient(models=[FakeModel("models/gemini-3.8-flash", ["embedContent"])])
    with pytest.raises(RuntimeError, match="generateContent"):
        mod.validate_model_available(client, "gemini-3.8-flash")
```

- [ ] **Step 5: Implement authenticated model validation**

Use the current SDK model list:

```python
def validate_model_available(client, model_name):
    expected = model_name.removeprefix("models/")
    for model in client.models.list():
        actual = str(model.name).removeprefix("models/")
        if actual != expected:
            continue
        actions = set(getattr(model, "supported_actions", []) or [])
        if "generateContent" not in actions:
            raise RuntimeError(
                f"Configured Stage-2 model {model_name} does not support generateContent"
            )
        return
    raise RuntimeError(f"Configured Stage-2 model {model_name} is not available")
```

This check is an availability gate, not a claim that audio analysis will succeed; the live request remains the definitive capability test.

- [ ] **Step 6: Add failing structured-payload validation tests**

Test:
- malformed JSON raises `ValueError("Stage-2 model returned invalid JSON")`;
- top-level missing `evidence` raises;
- evidence is not an array raises;
- unsupported verdict fails semantic normalization.

- [ ] **Step 7: Implement structured response schema and parser**

Define a JSON Schema dict accepted by Gemini structured output with top-level:

```python
{
    "type": "object",
    "properties": {
        "evidence": {"type": "array", "items": EVIDENCE_SCHEMA},
        "fluency_observations": {"type": "array", "items": {"type": "string"}},
        "teacher_interventions": {"type": "array", "items": INTERVENTION_SCHEMA},
    },
    "required": ["evidence", "fluency_observations", "teacher_interventions"],
}
```

`EVIDENCE_SCHEMA` must require:
`speaker`, `start_offset`, `end_offset`, `stage1_heard`, `reviewed_heard`, `intended`, `intent_confidence`, `pronunciation`, `counts_toward_pronunciation`, all five note fields, and `evidence_source`.

Nullable text fields use JSON Schema type `["string", "null"]`.

- [ ] **Step 8: Implement the live Gemini call**

Use the current `google-genai` Files API plus Interactions API:

```python
client = genai.Client(api_key=api_key)
validate_model_available(client, model_name)
audio_file = client.files.upload(file=str(audio_path))

interaction = client.interactions.create(
    model=model_name,
    input=[
        {
            "type": "audio",
            "uri": audio_file.uri,
            "mime_type": audio_file.mime_type,
        },
        {"type": "text", "text": prompt},
    ],
    response_format={
        "type": "text",
        "mime_type": "application/json",
        "schema": STAGE2_RESPONSE_SCHEMA,
    },
)
```

Extract text from `interaction.output_text`. Parse JSON, normalize every model evidence item, mark each model item `model_origin=True`, then apply teacher evidence.

If `interaction.output_text` is empty or invalid, fail explicitly.

- [ ] **Step 9: Build final Stage-2 result**

Output:

```python
result = {
    "project": "Oral-Grader",
    "stage": 2,
    "pair_slug": pair_slug,
    "model": model_name,
    "stage1_source": str(stage1_path),
    "stage1_review": str(review_path),
    "speaker_mapping": mapping,
    "students": build_student_summaries(evidence, mapping),
    "evidence": evidence,
    "fluency_observations": payload["fluency_observations"],
    "teacher_interventions": payload["teacher_interventions"],
    "scoring_status": "evidence_only_not_final_rubric",
}
```

Write it to JSON and Markdown without changing either input file.

- [ ] **Step 10: Add CLI**

Required CLI:

```text
python Oral-Grader/stage2/analyze-audio.py AUDIO \
  --pair-slug paul-paulina \
  --stage1 Oral-Grader/transcripts/paul-paulina-stage1.json \
  --review Oral-Grader/reviews/paul-paulina-stage1-review.json \
  --output-json Oral-Grader/analysis/paul-paulina-stage2.json \
  --output-md Oral-Grader/analysis/paul-paulina-stage2.md
```

Read:
- API key from `GEMINI_API_KEY` then `GOOGLE_API_KEY`;
- model from `ORAL_GRADER_STAGE2_MODEL`, with **no code-level fallback**. Missing model env raises `RuntimeError("ORAL_GRADER_STAGE2_MODEL is required")`.

- [ ] **Step 11: Run complete Stage-2 unit suite**

Run:

```bash
python -m pytest -q Oral-Grader/tests/test-stage2-audio-analysis.py
```

Expected: all tests PASS without network access.

- [ ] **Step 12: Re-run Stage-1 regression suite**

Run:

```bash
python -m pytest -q \
  Oral-Grader/tests/test-gemini-transcribe.py \
  Oral-Grader/tests/test-stage2-audio-analysis.py
```

Expected: all OG tests PASS.

- [ ] **Step 13: Commit Task 2**

Commit:

```text
feat(og): add Gemini audio-first Stage-2 analyzer
```

---

### Task 3: Isolated Stage-2 GitHub Actions workflow

**Files:**
- Create: `.github/workflows/oral-grader-stage2.yml`

**Interfaces:**
- Consumes: `Oral-Grader/stage2-run-request.json`, `GEMINI_API_KEY`, `ORAL_GRADER_AUDIO_URL`.
- Configures: `ORAL_GRADER_STAGE2_MODEL=gemini-3.8-flash`.
- Produces: committed `Oral-Grader/analysis/<pair>-stage2.{json,md}`.

- [ ] **Step 1: Create the Stage-2 workflow**

Workflow header:

```yaml
name: Oral Grader V1 - Gemini Stage 2

on:
  push:
    branches:
      - feature/oral-grader-v1-20260922
    paths:
      - Oral-Grader/stage2-run-request.json
  workflow_dispatch:
    inputs:
      pair_slug:
        description: Pair slug, for example paul-paulina
        required: true
        type: string

permissions:
  contents: write

env:
  ORAL_GRADER_STAGE2_MODEL: gemini-3.8-flash
```

The workflow must:
1. checkout with `fetch-depth: 0`;
2. set up Python 3.12;
3. install `pytest google-genai pydantic`;
4. run both OG test files;
5. resolve `pair_slug` from dispatch or request file;
6. assert Stage-1 transcript and review files exist;
7. verify `accepted_for_stage2=true`;
8. verify `GEMINI_API_KEY` exists;
9. verify `ORAL_GRADER_AUDIO_URL` exists;
10. hash both Stage-1 files before the live call;
11. download original audio to `/tmp/oral-grader-stage2.ogg`;
12. run `analyze-audio.py`;
13. re-hash Stage-1 files and fail on any difference;
14. validate Stage-2 JSON semantics;
15. commit only the two Stage-2 analysis files.

Do not add the audio file or the temporary URL to Git.

- [ ] **Step 2: Add explicit Stage-2 output validation**

The validation step must assert:

```python
assert data["project"] == "Oral-Grader"
assert data["stage"] == 2
assert data["pair_slug"] == pair_slug
assert data["speaker_mapping"]["spk:1"] == "Paul"
assert data["speaker_mapping"]["spk:2"] == "Paulina"
assert data["scoring_status"] == "evidence_only_not_final_rubric"
assert "Paul" in data["students"]
assert "Paulina" in data["students"]
for item in data["evidence"]:
    if item["pronunciation"] in {"uncertain", "not_scored"}:
        assert item["counts_toward_pronunciation"] is False
```

Additionally require at least one teacher-confirmed `fires -> fathers` item for Paul with:
- `pronunciation == "incorrect"`;
- `counts_toward_pronunciation == true`;
- `teacher_override == true`.

Do not require a timestamp for that item.

- [ ] **Step 3: Validate YAML syntax**

Run:

```bash
python - <<'PY'
import yaml
with open(".github/workflows/oral-grader-stage2.yml", encoding="utf-8") as f:
    yaml.safe_load(f)
print("oral-grader-stage2-workflow-yaml-ok")
PY
```

Expected: `oral-grader-stage2-workflow-yaml-ok`.

- [ ] **Step 4: Run both OG unit suites again**

Run:

```bash
python -m pytest -q \
  Oral-Grader/tests/test-gemini-transcribe.py \
  Oral-Grader/tests/test-stage2-audio-analysis.py
```

Expected: all tests PASS.

- [ ] **Step 5: Commit Task 3**

Commit:

```text
ci(og): add isolated Gemini Stage-2 workflow
```

---

### Task 4: Paul/Paulina live Stage-2 validation

**Files:**
- Create: `Oral-Grader/stage2-run-request.json`
- Generated by workflow:
  - `Oral-Grader/analysis/paul-paulina-stage2.json`
  - `Oral-Grader/analysis/paul-paulina-stage2.md`

**Interfaces:**
- Consumes: original Paul/Paulina OGG, accepted Stage-1 transcript/review, configured Gemini model.
- Produces: teacher-reviewable Stage-2 evidence only.

- [ ] **Step 1: Refresh the temporary audio secret if necessary**

The existing `ORAL_GRADER_AUDIO_URL` is temporary. Before triggering, obtain a fresh authenticated URL from the authorized Google Drive copy if the current URL has expired.

Because the GitHub connector cannot write repository secrets, the human partner must update only the secret value when a refresh is required.

Never commit the URL.

- [ ] **Step 2: Create the non-secret trigger**

Create:

```json
{
  "pair_slug": "paul-paulina"
}
```

at `Oral-Grader/stage2-run-request.json` on `feature/oral-grader-v1-20260922`.

Commit:

```text
chore(og): trigger Paul-Paulina Stage-2 analysis
```

- [ ] **Step 3: Verify the live workflow run step-by-step**

Inspect the GitHub Actions run and require success for:
- unit tests;
- Stage-1 acceptance check;
- Gemini credential check;
- audio download;
- configured model validation;
- Gemini audio analysis;
- Stage-1 immutability check;
- Stage-2 semantic validation;
- artifact commit.

If the model is unavailable, stop and update only `ORAL_GRADER_STAGE2_MODEL` based on the authenticated model list; do not fall back to another provider.

- [ ] **Step 4: Inspect the generated evidence**

Verify the JSON and Markdown satisfy:
- Paul = `spk:1`;
- Paulina = `spk:2`;
- `fires -> fathers` is present as teacher-confirmed evidence;
- uncertain items do not count;
- grammar/vocabulary observations are separate from pronunciation;
- no final rubric scores appear;
- no Stage-1 file changed.

- [ ] **Step 5: Present Stage 2 for teacher review and stop**

Present the Markdown analysis and summarize:
- clearly supported pronunciation items per student;
- uncertain items;
- representative grammar/vocabulary observations;
- teacher interventions;
- any model/audio disagreements.

Do **not** calculate final rubric scores or generate the PDF until the teacher explicitly accepts or corrects Stage 2.

---

## Self-review checklist result

- Spec coverage: every requirement in Sections 1–19 maps to Tasks 1–4.
- Placeholder scan: no implementation placeholders are permitted; all error and validation behavior is explicit.
- Type consistency: `pronunciation`, `intent_confidence`, `counts_toward_pronunciation`, speaker mapping, and teacher-overlay fields use the same names across tests, implementation, workflow, and output.
- Review Focus coverage:
  - teacher evidence with null timestamp → Task 1 tests;
  - uncertain countability → Task 1 + Task 3 validation;
  - grammar-only false pronunciation error → Task 1 tests;
  - Stage-1 mutation → Task 1 immutability test + Task 3 hashes;
  - semantically invalid structured output → Task 2 parser/normalizer tests + Task 3 validator.
- Scope: Stage 2 remains evidence-only; rubric scoring and PDF generation remain outside this plan.
