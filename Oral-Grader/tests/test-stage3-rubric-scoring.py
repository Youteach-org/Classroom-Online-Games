import copy
import importlib.util
import json
from pathlib import Path

import pytest

ROOT = Path(__file__).parents[1]
MODULE_PATH = ROOT / "stage3" / "score-rubric.py"
STAGE1_FIXTURE = ROOT / "transcripts" / "paul-paulina-stage1.json"
STAGE2_FIXTURE = ROOT / "analysis" / "paul-paulina-stage2.json"
STAGE2_REVIEW = ROOT / "reviews" / "paul-paulina-stage2-review.json"
CALIBRATION = ROOT / "rubrics" / "units-1-4-scoring-calibration.md"
KNOWN_RUBRIC = ROOT / "rubrics" / "paul-paulina-rubric-draft.json"


def load_module():
    assert MODULE_PATH.is_file(), "Stage-3 rubric scorer must be implemented under Oral-Grader/stage3/"
    spec = importlib.util.spec_from_file_location("og_stage3", MODULE_PATH)
    mod = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(mod)
    return mod


def valid_payload():
    return {
        "students": [
            {
                "student": "Paul",
                "rubric_scores": {
                    "fluency": 7,
                    "coherence_and_organization": 6,
                    "grammar_and_vocabulary": 6,
                    "pronunciation_and_intelligibility": 7,
                    "communicative_interaction": 7,
                },
                "total": 33,
                "confidence": "high",
                "review_required": False,
                "rationale": {
                    "fluency": "Sustains extended turns.",
                    "coherence_and_organization": "Ideas are generally followable.",
                    "grammar_and_vocabulary": "Functional control of taught Units 1-4 language.",
                    "pronunciation_and_intelligibility": "Generally intelligible.",
                    "communicative_interaction": "Keeps the exchange active.",
                },
                "comments": ["Functional communication with clear improvement targets."],
                "evidence_refs": ["stage2:Paul"],
            },
            {
                "student": "Paulina",
                "rubric_scores": {
                    "fluency": 7,
                    "coherence_and_organization": 5,
                    "grammar_and_vocabulary": 6,
                    "pronunciation_and_intelligibility": 7,
                    "communicative_interaction": 7,
                },
                "total": 32,
                "confidence": "high",
                "review_required": False,
                "rationale": {
                    "fluency": "Sustains long turns.",
                    "coherence_and_organization": "Some responses need clarification.",
                    "grammar_and_vocabulary": "Functional use of taught language with recurring errors.",
                    "pronunciation_and_intelligibility": "No countable pronunciation problem is strongly confirmed.",
                    "communicative_interaction": "Remains engaged in the exchange.",
                },
                "comments": ["Communication is sustained despite language-form problems."],
                "evidence_refs": ["stage2:Paulina"],
            },
        ]
    }


def test_stage3_file_exists_and_exposes_five_dimension_contract():
    mod = load_module()
    normalized = mod.validate_rubric_payload(valid_payload(), {"Paul", "Paulina"})
    assert set(normalized["students"][0]["rubric_scores"]) == {
        "fluency",
        "coherence_and_organization",
        "grammar_and_vocabulary",
        "pronunciation_and_intelligibility",
        "communicative_interaction",
    }


def test_stage3_rejects_score_outside_zero_to_eight():
    mod = load_module()
    payload = valid_payload()
    payload["students"][0]["rubric_scores"]["fluency"] = 9
    with pytest.raises(ValueError, match="0..8"):
        mod.validate_rubric_payload(payload, {"Paul", "Paulina"})


def test_stage3_rejects_total_that_is_not_sum_of_five_scores():
    mod = load_module()
    payload = valid_payload()
    payload["students"][0]["total"] = 40
    with pytest.raises(ValueError, match="total"):
        mod.validate_rubric_payload(payload, {"Paul", "Paulina"})


def test_stage3_requires_stage2_acceptance_for_rubric():
    mod = load_module()
    stage1 = json.loads(STAGE1_FIXTURE.read_text(encoding="utf-8"))
    stage2 = json.loads(STAGE2_FIXTURE.read_text(encoding="utf-8"))
    review = json.loads(STAGE2_REVIEW.read_text(encoding="utf-8"))
    review["accepted_for_rubric"] = False
    with pytest.raises(ValueError, match="accepted"):
        mod.validate_rubric_preconditions(stage1, stage2, review)


def test_stage3_known_paul_paulina_rubric_fits_canonical_contract():
    mod = load_module()
    known = json.loads(KNOWN_RUBRIC.read_text(encoding="utf-8"))
    payload = {
        "students": [
            {
                "student": student,
                "rubric_scores": data["scores"],
                "total": data["total"],
                "confidence": "high",
                "review_required": False,
                "rationale": data["rationale"],
                "comments": [],
                "evidence_refs": data["key_evidence"],
            }
            for student, data in known["students"].items()
        ]
    }
    normalized = mod.validate_rubric_payload(payload, {"Paul", "Paulina"})
    by_student = {row["student"]: row for row in normalized["students"]}
    assert by_student["Paul"]["total"] == 33
    assert by_student["Paulina"]["total"] == 32


def test_stage3_prompt_uses_course_calibration_and_forbids_error_count_formula():
    mod = load_module()
    stage1 = json.loads(STAGE1_FIXTURE.read_text(encoding="utf-8"))
    stage2 = json.loads(STAGE2_FIXTURE.read_text(encoding="utf-8"))
    review = json.loads(STAGE2_REVIEW.read_text(encoding="utf-8"))
    calibration = CALIBRATION.read_text(encoding="utf-8")
    prompt = mod.build_rubric_prompt(stage1, stage2, review, calibration)
    assert "five 8-point criteria" in prompt
    assert "Do not use an error-count formula" in prompt
    assert "Units 1–4" in prompt
    assert "32/40" in prompt
    assert "teacher-confirmed" in prompt.lower()
    assert "uncertain" in prompt.lower()


def test_stage3_scoring_never_mutates_stage1_or_stage2_evidence():
    mod = load_module()
    stage1 = json.loads(STAGE1_FIXTURE.read_text(encoding="utf-8"))
    stage2 = json.loads(STAGE2_FIXTURE.read_text(encoding="utf-8"))
    review = json.loads(STAGE2_REVIEW.read_text(encoding="utf-8"))
    calibration = CALIBRATION.read_text(encoding="utf-8")
    before1 = copy.deepcopy(stage1)
    before2 = copy.deepcopy(stage2)

    result = mod.build_stage3_result(
        pair_slug="paul-paulina",
        model_name="gemini-test",
        stage1=stage1,
        stage2=stage2,
        review=review,
        calibration=calibration,
        model_payload=valid_payload(),
    )

    assert stage1 == before1
    assert stage2 == before2
    assert result["stage"] == 3
    assert result["scoring_status"] == "automatic_rubric_complete"
    assert result["students"][0]["rubric_scores"]["fluency"] == 7
