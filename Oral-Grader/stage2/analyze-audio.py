#!/usr/bin/env python3
from __future__ import annotations


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
            lines.append(f"- {intervention}")
        lines.append("")

    return "\n".join(lines)
