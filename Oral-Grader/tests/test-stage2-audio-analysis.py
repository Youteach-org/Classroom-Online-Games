import copy
import importlib.util
import json
from pathlib import Path

import pytest

MODULE_PATH = Path(__file__).parents[1] / "stage2" / "analyze-audio.py"
spec = importlib.util.spec_from_file_location("og_stage2", MODULE_PATH)
mod = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(mod)


def sample_item(**overrides):
    item = {
        "speaker": "Paul",
        "start_offset": "1.000s",
        "end_offset": "1.500s",
        "stage1_heard": "sample",
        "reviewed_heard": "sample",
        "intended": "sample",
        "intent_confidence": "high",
        "pronunciation": "acceptable",
        "counts_toward_pronunciation": False,
        "pronunciation_note": "Audio supports an acceptable production.",
        "grammar_note": None,
        "vocabulary_note": None,
        "malformed_form_note": None,
        "transcription_note": None,
        "evidence_source": ["audio"],
        "model_origin": True,
    }
    item.update(overrides)
    return item


def teacher_review():
    return {
        "accepted_for_stage2": True,
        "speaker_mapping": {"spk:0": "Teacher", "spk:1": "Paul", "spk:2": "Paulina"},
        "teacher_confirmed_pronunciation_evidence": [
            {
                "heard": "fires",
                "intended": "fathers",
                "speaker": "Paul",
                "timestamp": None,
                "status": "teacher-confirmed-from-audio",
                "note": "Confirmed by teacher listening.",
            }
        ],
    }


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
    review = teacher_review()
    assert mod.validate_stage1_preconditions(stage1, review) == {
        "spk:0": "Teacher",
        "spk:1": "Paul",
        "spk:2": "Paulina",
    }


@pytest.mark.parametrize("missing", ["spk:0", "spk:1", "spk:2"])
def test_stage2_requires_complete_speaker_mapping(missing):
    stage1 = {"project": "Oral-Grader", "stage": 1, "pair_slug": "paul-paulina"}
    review = teacher_review()
    review["speaker_mapping"].pop(missing)
    with pytest.raises(ValueError, match="speaker mapping"):
        mod.validate_stage1_preconditions(stage1, review)


def test_uncertain_never_counts_toward_pronunciation():
    item = sample_item(
        pronunciation="uncertain",
        counts_toward_pronunciation=True,
        intended="fathers",
    )
    normalized = mod.normalize_evidence_item(item, {"Paul", "Paulina"})
    assert normalized["counts_toward_pronunciation"] is False


def test_grammar_only_item_is_not_scored_for_pronunciation():
    item = sample_item(
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


def test_teacher_confirmed_evidence_is_preserved_with_null_timestamp():
    merged = mod.apply_teacher_evidence([], teacher_review())
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


def test_student_summaries_keep_categories_separate_and_omit_teacher():
    mapping = {"spk:0": "Teacher", "spk:1": "Paul", "spk:2": "Paulina"}
    evidence = [
        sample_item(pronunciation="incorrect", counts_toward_pronunciation=True, intended="fathers"),
        sample_item(pronunciation="uncertain", counts_toward_pronunciation=False),
        sample_item(pronunciation="not_scored", pronunciation_note=None, grammar_note="when you was"),
        sample_item(speaker="Paulina", pronunciation="acceptable", counts_toward_pronunciation=False),
        sample_item(speaker="Paulina", pronunciation="not_scored", pronunciation_note=None, vocabulary_note="word choice"),
        sample_item(speaker="Teacher", pronunciation="not_scored", pronunciation_note=None),
    ]
    summaries = mod.build_student_summaries(evidence, mapping)
    assert summaries["Paul"]["incorrect_pronunciation_count"] == 1
    assert summaries["Paul"]["uncertain_count"] == 1
    assert summaries["Paul"]["grammar_patterns"] == ["when you was"]
    assert summaries["Paulina"]["acceptable_sample_count"] == 1
    assert summaries["Paulina"]["vocabulary_patterns"] == ["word choice"]
    assert "Teacher" not in summaries


def test_markdown_separates_students_and_has_no_rubric_score():
    result = {
        "pair_slug": "paul-paulina",
        "model": "gemini-test",
        "students": {
            "Paul": {"grammar_patterns": ["when you was"], "vocabulary_patterns": [], "fluency_observations": []},
            "Paulina": {"grammar_patterns": [], "vocabulary_patterns": ["word choice"], "fluency_observations": []},
        },
        "evidence": mod.apply_teacher_evidence([], teacher_review()) + [
            sample_item(speaker="Paulina", pronunciation="uncertain", counts_toward_pronunciation=False)
        ],
        "teacher_interventions": [],
        "fluency_observations": [],
    }
    md = mod.render_markdown(result)
    assert "## Paul" in md
    assert "## Paulina" in md
    assert "fires → fathers" in md
    assert "Grammar observations" in md
    assert "Vocabulary observations" in md
    assert "rubric score" not in md.lower()


def test_local_processing_does_not_mutate_stage1_or_review():
    stage1 = {
        "project": "Oral-Grader",
        "stage": 1,
        "pair_slug": "paul-paulina",
        "turns": [{"speaker": "spk:1", "heard": "when you was"}],
    }
    review = teacher_review()
    stage1_before = json.dumps(stage1, sort_keys=True)
    review_before = json.dumps(review, sort_keys=True)

    mapping = mod.validate_stage1_preconditions(stage1, review)
    item = mod.normalize_evidence_item(sample_item(grammar_note="when you was"), {"Paul", "Paulina"})
    evidence = mod.apply_teacher_evidence([item], review)
    mod.build_student_summaries(evidence, mapping)

    assert json.dumps(stage1, sort_keys=True) == stage1_before
    assert json.dumps(review, sort_keys=True) == review_before


class FakeModel:
    def __init__(self, name, supported_actions):
        self.name = name
        self.supported_actions = supported_actions


class FakeModels:
    def __init__(self, models):
        self._models = models

    def list(self):
        return list(self._models)


class FakeClient:
    def __init__(self, models):
        self.models = FakeModels(models)


def stage1_context():
    return {
        "project": "Oral-Grader",
        "stage": 1,
        "pair_slug": "paul-paulina",
        "turns": [
            {"speaker": "spk:1", "start_offset": "23.200s", "end_offset": "29.600s", "heard": "Who helped you when you was staying a difficult moment?"},
            {"speaker": "spk:2", "start_offset": "31.400s", "end_offset": "42.800s", "heard": "When I was a difficult moment I when I You."},
        ],
    }


def test_analysis_prompt_contains_audio_first_and_category_rules():
    prompt = mod.build_analysis_prompt(stage1_context(), teacher_review())
    assert "Do not rewrite Stage 1" in prompt
    assert "Original audio is primary evidence" in prompt
    assert "uncertain" in prompt
    assert "not_scored" in prompt
    assert "grammar_note" in prompt
    assert "vocabulary_note" in prompt
    assert "Paul" in prompt
    assert "Paulina" in prompt
    assert "Who helped you when you was staying a difficult moment?" in prompt
    assert "fires" in prompt
    assert "fathers" in prompt
    assert "Teacher-confirmed evidence is authoritative" in prompt


def test_configured_model_must_exist():
    client = FakeClient(models=[FakeModel("models/gemini-other", ["generateContent"])])
    with pytest.raises(RuntimeError, match="not available"):
        mod.validate_model_available(client, "gemini-3.8-flash")


def test_configured_model_must_support_generate_content():
    client = FakeClient(models=[FakeModel("models/gemini-3.8-flash", ["embedContent"])])
    with pytest.raises(RuntimeError, match="generateContent"):
        mod.validate_model_available(client, "gemini-3.8-flash")


def test_configured_model_is_accepted_when_generate_content_supported():
    client = FakeClient(models=[FakeModel("models/gemini-3.8-flash", ["generateContent"])])
    mod.validate_model_available(client, "gemini-3.8-flash")


def test_parse_model_payload_rejects_invalid_json():
    with pytest.raises(ValueError, match="Stage-2 model returned invalid JSON"):
        mod.parse_model_payload("{not-json")


def test_parse_model_payload_requires_evidence_array():
    with pytest.raises(ValueError, match="evidence"):
        mod.parse_model_payload(json.dumps({"fluency_observations": [], "teacher_interventions": []}))
    with pytest.raises(ValueError, match="evidence"):
        mod.parse_model_payload(json.dumps({"evidence": {}, "fluency_observations": [], "teacher_interventions": []}))


def test_parse_model_payload_requires_fluency_and_interventions_arrays():
    with pytest.raises(ValueError, match="fluency_observations"):
        mod.parse_model_payload(json.dumps({"evidence": [], "teacher_interventions": []}))
    with pytest.raises(ValueError, match="teacher_interventions"):
        mod.parse_model_payload(json.dumps({"evidence": [], "fluency_observations": []}))


def test_unsupported_verdict_is_rejected_by_normalization():
    with pytest.raises(ValueError, match="unsupported pronunciation verdict"):
        mod.normalize_evidence_item(sample_item(pronunciation="bad"), {"Paul", "Paulina"})


def test_invalid_evidence_source_is_rejected():
    with pytest.raises(ValueError, match="evidence source"):
        mod.normalize_evidence_item(
            sample_item(evidence_source=["invented-source"]),
            {"Paul", "Paulina"},
        )


def test_countable_incorrect_pronunciation_requires_intended_form():
    with pytest.raises(ValueError, match="intended form"):
        mod.normalize_evidence_item(
            sample_item(
                pronunciation="incorrect",
                counts_toward_pronunciation=True,
                intended=None,
                pronunciation_note="Audio supports a mismatch.",
            ),
            {"Paul", "Paulina"},
        )


class FakeHttpError(RuntimeError):
    def __init__(self, status_code):
        super().__init__(f"HTTP {status_code}")
        self.status_code = status_code


def test_interaction_retry_retries_one_transient_503_then_succeeds():
    calls = []
    sleeps = []

    def create(**kwargs):
        calls.append(kwargs)
        if len(calls) == 1:
            raise FakeHttpError(503)
        return "ok"

    result = mod.create_interaction_with_retry(
        create,
        {"model": "gemini-3.8-flash", "input": []},
        attempts=2,
        delay_seconds=0.25,
        sleep_fn=sleeps.append,
    )

    assert result == "ok"
    assert len(calls) == 2
    assert sleeps == [0.25]


def test_interaction_retry_does_not_retry_permanent_error():
    calls = []

    def create(**kwargs):
        calls.append(kwargs)
        raise FakeHttpError(400)

    with pytest.raises(FakeHttpError):
        mod.create_interaction_with_retry(
            create,
            {"model": "gemini-3.8-flash", "input": []},
            attempts=2,
            delay_seconds=0,
            sleep_fn=lambda _: None,
        )

    assert len(calls) == 1


def test_interaction_retry_stops_after_configured_attempts():
    calls = []

    def create(**kwargs):
        calls.append(kwargs)
        raise FakeHttpError(503)

    with pytest.raises(FakeHttpError):
        mod.create_interaction_with_retry(
            create,
            {"model": "gemini-3.8-flash", "input": []},
            attempts=2,
            delay_seconds=0,
            sleep_fn=lambda _: None,
        )

    assert len(calls) == 2


class FakeCompatRateLimitError(RuntimeError):
    pass


def test_interaction_retry_recognizes_sdk_429_from_error_message():
    calls = []
    sleeps = []

    def create(**kwargs):
        calls.append(kwargs)
        if len(calls) == 1:
            raise FakeCompatRateLimitError(
                "Error code: 429 - {'error': {'message': 'Rate limit exceeded', "
                "'code': 'too_many_requests'}}"
            )
        return "ok"

    result = mod.create_interaction_with_retry(
        create,
        {"model": "gemini-3.5-flash-lite", "input": []},
        attempts=2,
        delay_seconds=0.1,
        sleep_fn=sleeps.append,
    )

    assert result == "ok"
    assert len(calls) == 2
    assert sleeps == [0.1]
