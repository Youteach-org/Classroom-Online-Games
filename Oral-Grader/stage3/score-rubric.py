#!/usr/bin/env python3
import argparse
import copy
import json
import os
from pathlib import Path

RUBRIC_KEYS = (
    "fluency",
    "coherence_and_organization",
    "grammar_and_vocabulary",
    "pronunciation_and_intelligibility",
    "communicative_interaction",
)
CONFIDENCE_VALUES = {"low", "medium", "high"}

STUDENT_SCHEMA = {
    "type": "object",
    "properties": {
        "student": {"type": "string"},
        "rubric_scores": {
            "type": "object",
            "properties": {
                key: {"type": "integer", "minimum": 0, "maximum": 8}
                for key in RUBRIC_KEYS
            },
            "required": list(RUBRIC_KEYS),
        },
        "total": {"type": "integer", "minimum": 0, "maximum": 40},
        "confidence": {"type": "string", "enum": sorted(CONFIDENCE_VALUES)},
        "review_required": {"type": "boolean"},
        "rationale": {
            "type": "object",
            "properties": {key: {"type": "string"} for key in RUBRIC_KEYS},
            "required": list(RUBRIC_KEYS),
        },
        "comments": {"type": "array", "items": {"type": "string"}},
        "evidence_refs": {"type": "array", "items": {"type": "string"}},
    },
    "required": [
        "student",
        "rubric_scores",
        "total",
        "confidence",
        "review_required",
        "rationale",
        "comments",
        "evidence_refs",
    ],
}

RUBRIC_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "students": {"type": "array", "items": STUDENT_SCHEMA},
    },
    "required": ["students"],
}


def _require_dict(value, message):
    if not isinstance(value, dict):
        raise ValueError(message)
    return value


def validate_rubric_preconditions(stage1, stage2, review):
    _require_dict(stage1, "invalid Stage-1 evidence")
    _require_dict(stage2, "invalid Stage-2 evidence")
    _require_dict(review, "invalid Stage-2 review")

    if stage1.get("project") != "Oral-Grader" or stage1.get("stage") != 1:
        raise ValueError("invalid Stage-1 evidence")
    if stage2.get("project") != "Oral-Grader" or stage2.get("stage") != 2:
        raise ValueError("invalid Stage-2 evidence")
    if not review.get("accepted_for_rubric"):
        raise ValueError("Stage 2 is not accepted for rubric scoring")

    pair_slug = stage1.get("pair_slug")
    if not pair_slug or stage2.get("pair_slug") != pair_slug:
        raise ValueError("Stage-1 and Stage-2 pair slugs do not match")
    if review.get("pair_slug") not in (None, pair_slug):
        raise ValueError("Stage-2 review pair slug does not match")

    students = stage2.get("students")
    if not isinstance(students, dict) or not students:
        raise ValueError("Stage 2 contains no student evidence")

    return set(students)


def validate_rubric_payload(payload, allowed_students):
    _require_dict(payload, "rubric model payload must be an object")
    rows = payload.get("students")
    if not isinstance(rows, list) or not rows:
        raise ValueError("rubric model payload must contain students")

    allowed = set(allowed_students)
    seen = set()
    normalized = {"students": []}

    for raw in rows:
        row = _require_dict(raw, "rubric student row must be an object")
        student = str(row.get("student", "")).strip()
        if student not in allowed:
            raise ValueError(f"unsupported student: {student}")
        if student in seen:
            raise ValueError(f"duplicate student: {student}")
        seen.add(student)

        scores = _require_dict(row.get("rubric_scores"), "rubric_scores must be an object")
        if set(scores) != set(RUBRIC_KEYS):
            raise ValueError("rubric_scores must contain exactly the five Oral Grader criteria")

        clean_scores = {}
        for key in RUBRIC_KEYS:
            value = scores[key]
            if isinstance(value, bool) or not isinstance(value, int) or value < 0 or value > 8:
                raise ValueError(f"{key} must be an integer in 0..8")
            clean_scores[key] = value

        total = row.get("total")
        expected_total = sum(clean_scores.values())
        if isinstance(total, bool) or not isinstance(total, int) or total != expected_total:
            raise ValueError(f"total must equal the sum of rubric scores ({expected_total})")

        confidence = row.get("confidence")
        if confidence not in CONFIDENCE_VALUES:
            raise ValueError("confidence must be low, medium, or high")

        review_required = row.get("review_required")
        if not isinstance(review_required, bool):
            raise ValueError("review_required must be boolean")

        rationale = _require_dict(row.get("rationale"), "rationale must be an object")
        if set(rationale) != set(RUBRIC_KEYS):
            raise ValueError("rationale must contain all five rubric criteria")
        clean_rationale = {}
        for key in RUBRIC_KEYS:
            value = rationale[key]
            if not isinstance(value, str) or not value.strip():
                raise ValueError(f"rationale for {key} must be non-empty")
            clean_rationale[key] = value.strip()

        comments = row.get("comments")
        if not isinstance(comments, list) or any(not isinstance(x, str) for x in comments):
            raise ValueError("comments must be an array of strings")

        evidence_refs = row.get("evidence_refs")
        if not isinstance(evidence_refs, list) or any(not isinstance(x, str) for x in evidence_refs):
            raise ValueError("evidence_refs must be an array of strings")

        normalized["students"].append(
            {
                "student": student,
                "rubric_scores": clean_scores,
                "total": total,
                "confidence": confidence,
                "review_required": review_required,
                "rationale": clean_rationale,
                "comments": [x.strip() for x in comments if x.strip()],
                "evidence_refs": [x.strip() for x in evidence_refs if x.strip()],
            }
        )

    if seen != allowed:
        missing = ", ".join(sorted(allowed - seen))
        raise ValueError(f"rubric model omitted student(s): {missing}")

    return normalized


def build_rubric_prompt(stage1, stage2, review, calibration):
    allowed = validate_rubric_preconditions(stage1, stage2, review)
    context = {
        "pair_slug": stage1["pair_slug"],
        "students": sorted(allowed),
        "stage1_turns": copy.deepcopy(stage1.get("turns") or []),
        "stage2_students": copy.deepcopy(stage2.get("students") or {}),
        "stage2_evidence": copy.deepcopy(stage2.get("evidence") or []),
        "fluency_observations": copy.deepcopy(stage2.get("fluency_observations") or []),
        "teacher_interventions": copy.deepcopy(stage2.get("teacher_interventions") or []),
        "stage2_review": copy.deepcopy(review),
    }

    return f"""You are Oral Grader Stage 3, the summative oral-rubric scorer.

Score each student independently using the established five 8-point criteria:
- Fluency
- Coherence & Organization
- Grammar & Vocabulary
- Pronunciation & Intelligibility
- Communicative Interaction
Maximum: 40 points per student.

The accepted Stage-1 literal transcript is immutable evidence. Never rewrite or correct heard text.
Stage-2 evidence is analytical evidence, not a mechanical deduction table.
Teacher-confirmed evidence is authoritative when it conflicts with model inference.
Uncertain pronunciation/transcription evidence must not be converted into a confident penalty.
Do not use an error-count formula.
Do not force scores toward 32/40. 32/40 is a passing threshold, not a target.
Apply the course calibration exactly, including the rule that unelicited Unit 4 forms are not penalized.
Use evidence from the whole performance, not one isolated error.
If evidence is insufficient for a defensible dimension, choose the best-supported score but set review_required=true and confidence=low.
Return all five integer scores from 0 through 8, their exact sum out of 40, concise evidence-grounded rationale, comments, and useful evidence references.
Do not assign a score merely because a historical example had that score.

COURSE CALIBRATION:
{calibration}

ACCEPTED EVIDENCE CONTEXT:
{json.dumps(context, ensure_ascii=False, separators=(",", ":"))}
"""


def parse_model_payload(text):
    try:
        payload = json.loads(text)
    except (TypeError, json.JSONDecodeError) as exc:
        raise ValueError("Stage-3 model returned invalid JSON") from exc
    if not isinstance(payload, dict):
        raise ValueError("Stage-3 model returned invalid JSON object")
    return payload


def validate_model_available(client, model_name):
    expected = model_name.removeprefix("models/")
    for model in client.models.list():
        actual = str(getattr(model, "name", "")).removeprefix("models/")
        if actual != expected:
            continue
        actions = set(getattr(model, "supported_actions", []) or [])
        if "generateContent" not in actions:
            raise RuntimeError(
                f"Configured Stage-3 model {model_name} does not support generateContent"
            )
        return
    raise RuntimeError(f"Configured Stage-3 model {model_name} is not available")


def build_stage3_result(
    *,
    pair_slug,
    model_name,
    stage1,
    stage2,
    review,
    calibration,
    model_payload,
):
    allowed_students = validate_rubric_preconditions(stage1, stage2, review)
    if pair_slug != stage1.get("pair_slug"):
        raise ValueError("pair slug does not match accepted evidence")
    normalized = validate_rubric_payload(model_payload, allowed_students)

    return {
        "project": "Oral-Grader",
        "stage": 3,
        "pair_slug": pair_slug,
        "model": model_name,
        "rubric": {
            "criterion_maximum": 8,
            "maximum": 40,
            "criteria": list(RUBRIC_KEYS),
        },
        "scoring_status": "automatic_rubric_complete",
        "students": normalized["students"],
        "source_status": {
            "stage1_immutable": True,
            "stage2_accepted_for_rubric": True,
        },
    }


def render_markdown(result):
    lines = [
        f"# Oral Grader Stage 3 — {result['pair_slug']}",
        "",
        f"Model: `{result.get('model', 'unknown')}`",
        "",
        "Automatic rubric result. Teacher review may override scores/comments but never literal transcript evidence.",
        "",
    ]
    for row in result.get("students", []):
        lines.extend(
            [
                f"## {row['student']}",
                "",
                "| Criterion | Score |",
                "| --- | ---: |",
                f"| Fluency | {row['rubric_scores']['fluency']}/8 |",
                f"| Coherence & Organization | {row['rubric_scores']['coherence_and_organization']}/8 |",
                f"| Grammar & Vocabulary | {row['rubric_scores']['grammar_and_vocabulary']}/8 |",
                f"| Pronunciation & Intelligibility | {row['rubric_scores']['pronunciation_and_intelligibility']}/8 |",
                f"| Communicative Interaction | {row['rubric_scores']['communicative_interaction']}/8 |",
                f"| **Total** | **{row['total']}/40** |",
                "",
                f"Confidence: **{row['confidence']}**",
                f"Review required: **{'yes' if row['review_required'] else 'no'}**",
                "",
                "### Rationale",
                "",
            ]
        )
        for key in RUBRIC_KEYS:
            lines.append(f"- **{key.replace('_', ' ').title()}:** {row['rationale'][key]}")
        lines.extend(["", "### Comments", ""])
        lines.extend([f"- {item}" for item in row.get("comments", [])] or ["- None."])
        lines.append("")
    return "\n".join(lines)


def score_rubric(
    *,
    pair_slug,
    stage1_path,
    stage2_path,
    review_path,
    calibration_path,
    output_json,
    output_md,
):
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY or GOOGLE_API_KEY is required")
    model_name = os.environ.get("ORAL_GRADER_RUBRIC_MODEL")
    if not model_name:
        raise RuntimeError("ORAL_GRADER_RUBRIC_MODEL is required")

    stage1 = json.loads(Path(stage1_path).read_text(encoding="utf-8"))
    stage2 = json.loads(Path(stage2_path).read_text(encoding="utf-8"))
    review = json.loads(Path(review_path).read_text(encoding="utf-8"))
    calibration = Path(calibration_path).read_text(encoding="utf-8")
    validate_rubric_preconditions(stage1, stage2, review)

    from google import genai  # type: ignore

    client = genai.Client(api_key=api_key)
    validate_model_available(client, model_name)
    interaction = client.interactions.create(
        model=model_name,
        input=build_rubric_prompt(stage1, stage2, review, calibration),
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": RUBRIC_RESPONSE_SCHEMA,
        },
    )
    output_text = getattr(interaction, "output_text", "") or ""
    if not output_text.strip():
        raise ValueError("Stage-3 model returned empty output")

    payload = parse_model_payload(output_text)
    result = build_stage3_result(
        pair_slug=pair_slug,
        model_name=model_name,
        stage1=stage1,
        stage2=stage2,
        review=review,
        calibration=calibration,
        model_payload=payload,
    )

    output_json = Path(output_json)
    output_md = Path(output_md)
    output_json.parent.mkdir(parents=True, exist_ok=True)
    output_md.parent.mkdir(parents=True, exist_ok=True)
    output_json.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    output_md.write_text(render_markdown(result), encoding="utf-8")
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pair-slug", required=True)
    parser.add_argument("--stage1", type=Path, required=True)
    parser.add_argument("--stage2", type=Path, required=True)
    parser.add_argument("--review", type=Path, required=True)
    parser.add_argument("--calibration", type=Path, required=True)
    parser.add_argument("--output-json", type=Path, required=True)
    parser.add_argument("--output-md", type=Path, required=True)
    args = parser.parse_args()

    if not args.pair_slug.replace("-", "").isalnum():
        raise SystemExit("pair_slug must contain only letters, numbers, and hyphens")

    score_rubric(
        pair_slug=args.pair_slug,
        stage1_path=args.stage1,
        stage2_path=args.stage2,
        review_path=args.review,
        calibration_path=args.calibration,
        output_json=args.output_json,
        output_md=args.output_md,
    )


if __name__ == "__main__":
    main()
