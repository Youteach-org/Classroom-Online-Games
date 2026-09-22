#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import time
from pathlib import Path
from typing import Any

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


PRONUNCIATION_VALUES = {"acceptable", "incorrect", "uncertain", "not_scored"}
INTENT_CONFIDENCE_VALUES = {"high", "medium", "low", "uncertain"}
EVIDENCE_SOURCES = {"audio", "stage1", "context", "model", "teacher-confirmed"}

EVIDENCE_SCHEMA = {
    "type": "object",
    "properties": {
        "speaker": {"type": "string"},
        "start_offset": {"type": ["string", "null"]},
        "end_offset": {"type": ["string", "null"]},
        "stage1_heard": {"type": ["string", "null"]},
        "reviewed_heard": {"type": ["string", "null"]},
        "intended": {"type": ["string", "null"]},
        "intent_confidence": {"type": "string", "enum": sorted(INTENT_CONFIDENCE_VALUES)},
        "pronunciation": {"type": "string", "enum": sorted(PRONUNCIATION_VALUES)},
        "counts_toward_pronunciation": {"type": "boolean"},
        "pronunciation_note": {"type": ["string", "null"]},
        "grammar_note": {"type": ["string", "null"]},
        "vocabulary_note": {"type": ["string", "null"]},
        "malformed_form_note": {"type": ["string", "null"]},
        "transcription_note": {"type": ["string", "null"]},
        "evidence_source": {
            "type": "array",
            "items": {"type": "string", "enum": ["audio", "stage1", "context", "model"]},
        },
    },
    "required": [
        "speaker", "start_offset", "end_offset", "stage1_heard", "reviewed_heard",
        "intended", "intent_confidence", "pronunciation",
        "counts_toward_pronunciation", "pronunciation_note", "grammar_note",
        "vocabulary_note", "malformed_form_note", "transcription_note",
        "evidence_source",
    ],
}

INTERVENTION_SCHEMA = {
    "type": "object",
    "properties": {
        "student": {"type": ["string", "null"]},
        "start_offset": {"type": ["string", "null"]},
        "end_offset": {"type": ["string", "null"]},
        "kind": {
            "type": "string",
            "enum": ["clarification", "word_supply", "reactivation", "other"],
        },
        "description": {"type": "string"},
    },
    "required": ["student", "start_offset", "end_offset", "kind", "description"],
}

STAGE2_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "evidence": {"type": "array", "items": EVIDENCE_SCHEMA},
        "fluency_observations": {"type": "array", "items": {"type": "string"}},
        "teacher_interventions": {"type": "array", "items": INTERVENTION_SCHEMA},
    },
    "required": ["evidence", "fluency_observations", "teacher_interventions"],
}


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

    sources = result.get("evidence_source")
    if not isinstance(sources, list) or any(source not in EVIDENCE_SOURCES for source in sources):
        raise ValueError("unsupported evidence source")
    result["evidence_source"] = list(sources)

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


def apply_teacher_evidence(model_evidence, review):
    merged = []
    for item in model_evidence:
        copied = dict(item)
        if isinstance(copied.get("evidence_source"), list):
            copied["evidence_source"] = list(copied["evidence_source"])
        merged.append(copied)

    for teacher_item in review.get("teacher_confirmed_pronunciation_evidence", []) or []:
        speaker = teacher_item.get("speaker")
        intended = teacher_item.get("intended")
        intended_key = str(intended or "").casefold()
        for item in merged:
            if (
                item.get("model_origin") is True
                and item.get("speaker") == speaker
                and str(item.get("intended") or "").casefold() == intended_key
            ):
                item["superseded_by_teacher_evidence"] = True
                item["counts_toward_pronunciation"] = False

        timestamp = teacher_item.get("timestamp")
        start_offset = None
        end_offset = None
        if isinstance(timestamp, dict):
            start_offset = timestamp.get("start_offset")
            end_offset = timestamp.get("end_offset")

        merged.append(
            {
                "speaker": speaker,
                "start_offset": start_offset,
                "end_offset": end_offset,
                "stage1_heard": None,
                "reviewed_heard": teacher_item.get("heard"),
                "intended": intended,
                "intent_confidence": "high",
                "pronunciation": "incorrect",
                "counts_toward_pronunciation": True,
                "pronunciation_note": teacher_item.get("note") or "Teacher-confirmed pronunciation mismatch.",
                "grammar_note": None,
                "vocabulary_note": None,
                "malformed_form_note": None,
                "transcription_note": "Teacher-confirmed audio evidence overrides conflicting model/transcript normalization.",
                "evidence_source": ["teacher-confirmed", "audio"],
                "teacher_override": True,
                "model_origin": False,
                "teacher_status": teacher_item.get("status"),
            }
        )
    return merged


def _unique_nonempty(values):
    seen = set()
    out = []
    for value in values:
        if not value:
            continue
        key = str(value).strip()
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(key)
    return out


def build_student_summaries(evidence, speaker_mapping):
    students = [name for name in speaker_mapping.values() if name != "Teacher"]
    summaries = {}
    for student in students:
        rows = [item for item in evidence if item.get("speaker") == student]
        summaries[student] = {
            "incorrect_pronunciation_count": sum(
                1
                for item in rows
                if item.get("pronunciation") == "incorrect"
                and item.get("counts_toward_pronunciation") is True
            ),
            "acceptable_sample_count": sum(
                1 for item in rows if item.get("pronunciation") == "acceptable"
            ),
            "uncertain_count": sum(
                1 for item in rows if item.get("pronunciation") == "uncertain"
            ),
            "grammar_patterns": _unique_nonempty(item.get("grammar_note") for item in rows),
            "vocabulary_patterns": _unique_nonempty(item.get("vocabulary_note") for item in rows),
            "malformed_form_patterns": _unique_nonempty(item.get("malformed_form_note") for item in rows),
            "transcription_notes": _unique_nonempty(item.get("transcription_note") for item in rows),
            "fluency_observations": [],
            "teacher_interventions": [],
            "notes_for_rubric": [],
        }
    return summaries


def render_markdown(result):
    lines = [
        f"# Oral Grader Stage 2 — {result['pair_slug']}",
        "",
        f"Model: `{result.get('model', 'unknown')}`",
        "",
        "> Evidence layer only. Stage 1 remains unchanged; no final scoring is assigned here.",
        "",
    ]

    for student, summary in result.get("students", {}).items():
        lines.extend([f"## {student}", "", "### Pronunciation evidence", ""])
        rows = [
            item
            for item in result.get("evidence", [])
            if item.get("speaker") == student
            and (
                item.get("counts_toward_pronunciation") is True
                or item.get("pronunciation") == "uncertain"
            )
        ]
        if rows:
            lines.extend([
                "| Time | Heard | Intended | Verdict | Source |",
                "| --- | --- | --- | --- | --- |",
            ])
            for item in rows:
                start = item.get("start_offset") or "?"
                end = item.get("end_offset") or "?"
                when = f"{start}–{end}" if start != "?" or end != "?" else "?"
                heard = item.get("reviewed_heard") or item.get("stage1_heard") or "—"
                intended = item.get("intended") or "—"
                source = ", ".join(item.get("evidence_source") or []) or "—"
                lines.append(
                    f"| {when} | {heard} | {intended} | {item.get('pronunciation', '—')} | {source} |"
                )
                if item.get("teacher_override"):
                    lines.append(f"\nTeacher-confirmed: **{heard} → {intended}**.\n")
        else:
            lines.append("No countable or uncertain pronunciation evidence recorded.")

        lines.extend(["", "### Grammar observations", ""])
        grammar = summary.get("grammar_patterns") or []
        lines.extend([f"- {x}" for x in grammar] or ["- None recorded."])

        lines.extend(["", "### Vocabulary observations", ""])
        vocab = summary.get("vocabulary_patterns") or []
        lines.extend([f"- {x}" for x in vocab] or ["- None recorded."])

        lines.extend(["", "### Fluency / discourse observations", ""])
        fluency = summary.get("fluency_observations") or []
        lines.extend([f"- {x}" for x in fluency] or ["- None recorded."])
        lines.append("")

    if result.get("teacher_interventions"):
        lines.extend(["## Teacher interventions", ""])
        for intervention in result["teacher_interventions"]:
            if isinstance(intervention, dict):
                student = intervention.get("student") or "unspecified student"
                when = intervention.get("start_offset") or "?"
                lines.append(
                    f"- {when} · {student} · {intervention.get('kind')}: {intervention.get('description')}"
                )
            else:
                lines.append(f"- {intervention}")
        lines.append("")

    return "\n".join(lines)



def _attach_observations(summaries, fluency_observations, teacher_interventions):
    for observation in fluency_observations:
        for student in summaries:
            if observation.casefold().startswith(student.casefold() + ":"):
                summaries[student]["fluency_observations"].append(observation)
    for intervention in teacher_interventions:
        student = intervention.get("student") if isinstance(intervention, dict) else None
        if student in summaries:
            summaries[student]["teacher_interventions"].append(dict(intervention))


def build_analysis_prompt(stage1, review):
    context = {
        "speaker_mapping": review.get("speaker_mapping") or {},
        "turns": stage1.get("turns") or [],
        "teacher_confirmed_pronunciation_evidence": (
            review.get("teacher_confirmed_pronunciation_evidence") or []
        ),
    }
    rules = """You are analyzing an English oral exam for teacher review.
Original audio is primary evidence.
Do not rewrite Stage 1.
Do not silently normalize heard forms.
Do not penalize an item solely because transcription is uncertain.
Use pronunciation=incorrect only when intended meaning is sufficiently clear and the audio supports a pronunciation mismatch.
Grammar, vocabulary, malformed forms, and pronunciation are separate.
Rapid low-value exchanges may be omitted unless they affect pronunciation, speaker attribution, Fluency, Interaction, or intended-word inference.
Teacher-confirmed evidence is authoritative and must not be contradicted.
Use pronunciation=uncertain when audio or intended meaning is not sufficiently clear; uncertain must never count toward pronunciation.
Use pronunciation=not_scored for grammar-only, vocabulary-only, malformed-form, discourse, or transcription issues.
Keep grammar_note, vocabulary_note, malformed_form_note, transcription_note, and pronunciation_note separate.
Return only useful evidence for later evaluation, not an exhaustive phonetic transcript.
Prefix every fluency observation with the student name, for example 'Paul: ...' or 'Paulina: ...'.
Do not assign final rubric scores.
"""
    return (
        rules
        + "\nAccepted Stage-1 context (reference only):\n"
        + json.dumps(context, ensure_ascii=False, separators=(",", ":"))
    )


def validate_model_available(client, model_name):
    expected = model_name.removeprefix("models/")
    for model in client.models.list():
        actual = str(getattr(model, "name", "")).removeprefix("models/")
        if actual != expected:
            continue
        actions = set(getattr(model, "supported_actions", []) or [])
        if "generateContent" not in actions:
            raise RuntimeError(
                f"Configured Stage-2 model {model_name} does not support generateContent"
            )
        return
    raise RuntimeError(f"Configured Stage-2 model {model_name} is not available")


def parse_model_payload(text):
    try:
        payload = json.loads(text)
    except (TypeError, json.JSONDecodeError) as exc:
        raise ValueError("Stage-2 model returned invalid JSON") from exc
    if not isinstance(payload, dict):
        raise ValueError("Stage-2 model returned invalid JSON object")
    if not isinstance(payload.get("evidence"), list):
        raise ValueError("Stage-2 model payload must contain evidence array")
    if not isinstance(payload.get("fluency_observations"), list):
        raise ValueError(
            "Stage-2 model payload must contain fluency_observations array"
        )
    if not isinstance(payload.get("teacher_interventions"), list):
        raise ValueError(
            "Stage-2 model payload must contain teacher_interventions array"
        )
    return payload


def _interaction_error_status_code(exc):
    for attr in ("status_code", "code"):
        value = getattr(exc, attr, None)
        if isinstance(value, int):
            return value
    response = getattr(exc, "response", None)
    value = getattr(response, "status_code", None)
    if isinstance(value, int):
        return value
    body = getattr(exc, "body", None)
    if isinstance(body, dict):
        error = body.get("error")
        if isinstance(error, dict) and isinstance(error.get("code"), int):
            return error["code"]

    match = re.search(r"Error code:\s*(\d{3})\b", str(exc))
    if match:
        return int(match.group(1))
    return None


def create_interaction_with_retry(
    create_fn,
    kwargs,
    *,
    attempts=2,
    delay_seconds=20.0,
    sleep_fn=time.sleep,
):
    transient_statuses = {429, 500, 502, 503, 504}
    if attempts < 1:
        raise ValueError("attempts must be at least 1")

    for attempt in range(1, attempts + 1):
        try:
            return create_fn(**kwargs)
        except Exception as exc:
            status = _interaction_error_status_code(exc)
            if status not in transient_statuses or attempt >= attempts:
                raise
            sleep_fn(delay_seconds)

    raise RuntimeError("unreachable")


def analyze_audio(
    audio_path: Path,
    pair_slug: str,
    stage1_path: Path,
    review_path: Path,
    output_json: Path,
    output_md: Path,
):
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY or GOOGLE_API_KEY is required")
    model_name = os.environ.get("ORAL_GRADER_STAGE2_MODEL")
    if not model_name:
        raise RuntimeError("ORAL_GRADER_STAGE2_MODEL is required")

    stage1 = json.loads(stage1_path.read_text(encoding="utf-8"))
    review = json.loads(review_path.read_text(encoding="utf-8"))
    mapping = validate_stage1_preconditions(stage1, review)
    if stage1.get("pair_slug") != pair_slug:
        raise ValueError("pair slug does not match Stage-1 evidence")
    if review.get("pair_slug") not in (None, pair_slug):
        raise ValueError("pair slug does not match Stage-1 review")

    from google import genai  # type: ignore

    client = genai.Client(api_key=api_key)
    validate_model_available(client, model_name)
    uploaded_file = client.files.upload(file=str(audio_path))
    interaction = create_interaction_with_retry(
        client.interactions.create,
        {
            "model": model_name,
            "input": [
                {"type": "text", "text": build_analysis_prompt(stage1, review)},
                {
                    "type": "audio",
                    "uri": uploaded_file.uri,
                    "mime_type": uploaded_file.mime_type,
                },
            ],
            "response_format": {
                "type": "text",
                "mime_type": "application/json",
                "schema": STAGE2_RESPONSE_SCHEMA,
            },
        },
        attempts=2,
        delay_seconds=20.0,
    )

    output_text = getattr(interaction, "output_text", "") or ""
    if not output_text.strip():
        raise ValueError("Stage-2 model returned empty output")
    payload = parse_model_payload(output_text)

    allowed_students = {name for name in mapping.values() if name != "Teacher"}
    model_evidence = []
    for raw in payload["evidence"]:
        if not isinstance(raw, dict):
            raise ValueError("Stage-2 model evidence items must be objects")
        item = normalize_evidence_item(raw, allowed_students)
        item["model_origin"] = True
        model_evidence.append(item)

    evidence = apply_teacher_evidence(model_evidence, review)
    summaries = build_student_summaries(evidence, mapping)
    _attach_observations(
        summaries,
        payload["fluency_observations"],
        payload["teacher_interventions"],
    )

    result = {
        "project": "Oral-Grader",
        "stage": 2,
        "pair_slug": pair_slug,
        "model": model_name,
        "stage1_source": str(stage1_path),
        "stage1_review": str(review_path),
        "speaker_mapping": mapping,
        "students": summaries,
        "evidence": evidence,
        "fluency_observations": payload["fluency_observations"],
        "teacher_interventions": payload["teacher_interventions"],
        "scoring_status": "evidence_only_not_final_rubric",
    }

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
    parser.add_argument("audio", type=Path)
    parser.add_argument("--pair-slug", required=True)
    parser.add_argument("--stage1", type=Path, required=True)
    parser.add_argument("--review", type=Path, required=True)
    parser.add_argument("--output-json", type=Path, required=True)
    parser.add_argument("--output-md", type=Path, required=True)
    args = parser.parse_args()

    if not args.pair_slug.replace("-", "").isalnum():
        raise SystemExit("pair_slug must contain only letters, numbers, and hyphens")

    analyze_audio(
        args.audio,
        args.pair_slug,
        args.stage1,
        args.review,
        args.output_json,
        args.output_md,
    )


if __name__ == "__main__":
    main()
