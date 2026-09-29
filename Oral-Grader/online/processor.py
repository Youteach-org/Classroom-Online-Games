import json
from pathlib import Path


class ReviewRequired(RuntimeError):
    def __init__(self, reason, details=None):
        super().__init__(str(reason))
        self.reason = str(reason)
        self.details = details or {}


def _unique_speakers_in_order(stage1):
    seen = set()
    ordered = []
    for turn in stage1.get("turns") or []:
        speaker = str(turn.get("speaker") or "").strip()
        if speaker and speaker not in seen:
            seen.add(speaker)
            ordered.append(speaker)
    return ordered


def _students(job):
    rows = job.get("students") or []
    clean = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        student_id = str(row.get("studentId") or "").strip()
        name = str(row.get("name") or "").strip()
        if student_id and name:
            clean.append({"studentId": student_id, "name": name})
    return clean


def build_online_stage1_review(stage1, job):
    speakers = _unique_speakers_in_order(stage1)
    students = _students(job)
    if not speakers or not students or len(speakers) != len(students):
        raise ReviewRequired(
            "speaker_mapping_uncertain",
            {
                "diarizedSpeakerCount": len(speakers),
                "expectedStudentCount": len(students),
            },
        )

    mapping = {
        speaker: students[index]["name"]
        for index, speaker in enumerate(speakers)
    }

    return {
        "project": "Oral-Grader",
        "pair_slug": str(stage1.get("pair_slug") or job.get("jobId") or ""),
        "stage": 1,
        "review_status": "accepted_online_identity_order",
        "accepted_for_stage2": True,
        "speaker_mapping": mapping,
        "fidelity_notes": [
            "Talk Talk peer-conversation identity order was used for online speaker mapping.",
            "Stage-1 literal heard evidence remains immutable.",
        ],
        "teacher_confirmed_pronunciation_evidence": [],
        "context": {
            "session_kind": "peer_conversation",
            "identity_mapping_source": "talk-talk-controlled-first-speaker-order",
        },
    }


def build_online_stage2_review(stage2, stage1_review, job):
    stage2_students = set((stage2.get("students") or {}).keys())
    expected_students = {row["name"] for row in _students(job)}
    if not stage2_students or stage2_students != expected_students:
        raise ReviewRequired(
            "student_mapping_uncertain",
            {
                "stage2Students": sorted(stage2_students),
                "expectedStudents": sorted(expected_students),
            },
        )

    return {
        "project": "Oral-Grader",
        "pair_slug": str(stage2.get("pair_slug") or job.get("jobId") or ""),
        "stage": 2,
        "review_status": "accepted_online",
        "accepted_for_rubric": True,
        "speaker_mapping": dict(stage1_review.get("speaker_mapping") or {}),
        "context": {
            "session_kind": "peer_conversation",
            "review_source": "talk-talk-online-pipeline",
        },
        "notes": [
            "Stage 2 was accepted automatically because student identity mapping remained consistent.",
            "Uncertain evidence stays uncertain and is handled by Stage 3 confidence/review rules.",
        ],
    }


def _offset_to_ms(value):
    if value is None:
        return 0
    text = str(value).strip()
    if text.endswith("s"):
        text = text[:-1]
    try:
        return max(0, int(round(float(text) * 1000)))
    except (TypeError, ValueError):
        return 0


def build_online_result(job, stage1, stage1_review, stage2, stage3):
    mapping = dict(stage1_review.get("speaker_mapping") or {})
    literal_text = stage1.get("full_text")
    if not isinstance(literal_text, str) or not literal_text:
        literal_text = " ".join(
            str(turn.get("heard") or "")
            for turn in stage1.get("turns") or []
            if str(turn.get("heard") or "")
        )

    segments = []
    for turn in stage1.get("turns") or []:
        raw_speaker = str(turn.get("speaker") or "")
        heard = str(turn.get("heard") or "")
        segments.append(
            {
                "speaker": mapping.get(raw_speaker, raw_speaker),
                "heard_text": heard,
                "start_ms": _offset_to_ms(turn.get("start_offset")),
                "end_ms": _offset_to_ms(turn.get("end_offset")),
            }
        )

    student_id_by_name = {
        row["name"]: row["studentId"]
        for row in _students(job)
    }

    students = []
    any_review_required = False
    for row in stage3.get("students") or []:
        name = str(row.get("student") or "").strip()
        if not name or name not in student_id_by_name:
            raise ReviewRequired(
                "student_mapping_uncertain",
                {"stage3Student": name},
            )
        review_required = bool(row.get("review_required"))
        any_review_required = any_review_required or review_required
        students.append(
            {
                "studentId": student_id_by_name[name],
                "name": name,
                "rubric_scores": dict(row.get("rubric_scores") or {}),
                "total": int(row.get("total") or 0),
                "comments": list(row.get("comments") or []),
                "confidence": str(row.get("confidence") or "low"),
                "review_required": review_required,
            }
        )

    evidence = list(stage2.get("evidence") or [])
    analysis = {
        "intended_text": [
            {
                "speaker": item.get("speaker"),
                "heard": item.get("reviewed_heard") or item.get("stage1_heard"),
                "intended": item.get("intended"),
                "confidence": item.get("intent_confidence"),
            }
            for item in evidence
            if item.get("intended") is not None
        ],
        "pronunciation": [
            item for item in evidence
            if item.get("pronunciation") not in (None, "not_scored")
        ],
        "grammar": [
            item for item in evidence if item.get("grammar_note")
        ],
        "vocabulary": [
            item for item in evidence if item.get("vocabulary_note")
        ],
        "fluency": list(stage2.get("fluency_observations") or []),
        "coherence": [],
        "interaction": list(stage2.get("teacher_interventions") or []),
        "evidence": evidence,
    }

    status = "review_required" if any_review_required else "completed"
    return {
        "jobId": str(job.get("jobId") or ""),
        "status": status,
        "transcript": {
            "heard_text": literal_text,
            "speakers": list(dict.fromkeys(mapping.values())),
            "segments": segments,
        },
        "analysis": analysis,
        "students": students,
        "report": {
            "status": "ready" if status == "completed" else "review_required",
            "source": "Oral-Grader Stage 1 -> Stage 2 -> Stage 3",
            "stage3": stage3,
        },
    }


class ModuleRunners:
    def __init__(self, stage1, stage2, stage3):
        self.stage1 = stage1
        self.stage2 = stage2
        self.stage3 = stage3

    def transcribe(self, **kwargs):
        return self.stage1.transcribe(
            kwargs["audio_path"],
            kwargs["pair_slug"],
            kwargs["output_json"],
            kwargs["output_md"],
        )

    def analyze(self, **kwargs):
        return self.stage2.analyze_audio(
            kwargs["audio_path"],
            kwargs["pair_slug"],
            kwargs["stage1_path"],
            kwargs["review_path"],
            kwargs["output_json"],
            kwargs["output_md"],
        )

    def score(self, **kwargs):
        return self.stage3.score_rubric(
            pair_slug=kwargs["pair_slug"],
            stage1_path=kwargs["stage1_path"],
            stage2_path=kwargs["stage2_path"],
            review_path=kwargs["review_path"],
            calibration_path=kwargs["calibration_path"],
            output_json=kwargs["output_json"],
            output_md=kwargs["output_md"],
        )


def process_online_job(
    job_id,
    *,
    job_store,
    audio_store,
    service,
    runners,
    calibration_path,
    work_root,
):
    job = job_store.get(job_id)
    if not job:
        raise KeyError("job not found")

    audio = job.get("audio") or {}
    storage_key = str(audio.get("storageKey") or "").strip()
    if not storage_key:
        raise ValueError("job has no temporary audio storage key")

    work_dir = Path(work_root) / str(job_id)
    work_dir.mkdir(parents=True, exist_ok=True)
    mime = str(audio.get("mimeType") or "")
    suffix = ".webm" if "webm" in mime else ".ogg" if "ogg" in mime else ".wav" if "wav" in mime else ".bin"
    source_audio = work_dir / ("source" + suffix)
    audio_store.download(storage_key, source_audio)

    pair_slug = str(job_id)
    stage1_json = work_dir / "stage1.json"
    stage1_md = work_dir / "stage1.md"
    stage1_review_json = work_dir / "stage1-review.json"
    stage2_json = work_dir / "stage2.json"
    stage2_md = work_dir / "stage2.md"
    stage2_review_json = work_dir / "stage2-review.json"
    stage3_json = work_dir / "stage3.json"
    stage3_md = work_dir / "stage3.md"

    job_store.update(job_id, {"status": "transcribing"})
    runners.transcribe(
        audio_path=source_audio,
        pair_slug=pair_slug,
        output_json=stage1_json,
        output_md=stage1_md,
    )
    stage1 = json.loads(stage1_json.read_text(encoding="utf-8"))

    try:
        stage1_review = build_online_stage1_review(stage1, job)
    except ReviewRequired as exc:
        return service.require_review(
            job_id,
            reason=exc.reason,
            details=exc.details,
        )
    stage1_review_json.write_text(
        json.dumps(stage1_review, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    job_store.update(job_id, {"status": "analyzing"})
    stage2 = runners.analyze(
        audio_path=source_audio,
        pair_slug=pair_slug,
        stage1_path=stage1_json,
        review_path=stage1_review_json,
        output_json=stage2_json,
        output_md=stage2_md,
    )
    if not isinstance(stage2, dict):
        stage2 = json.loads(stage2_json.read_text(encoding="utf-8"))

    try:
        stage2_review = build_online_stage2_review(stage2, stage1_review, job)
    except ReviewRequired as exc:
        return service.require_review(
            job_id,
            reason=exc.reason,
            details=exc.details,
        )
    stage2_review_json.write_text(
        json.dumps(stage2_review, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    job_store.update(job_id, {"status": "scoring"})
    stage3 = runners.score(
        pair_slug=pair_slug,
        stage1_path=stage1_json,
        stage2_path=stage2_json,
        review_path=stage2_review_json,
        calibration_path=Path(calibration_path),
        output_json=stage3_json,
        output_md=stage3_md,
    )
    if not isinstance(stage3, dict):
        stage3 = json.loads(stage3_json.read_text(encoding="utf-8"))

    result = build_online_result(job, stage1, stage1_review, stage2, stage3)
    service.complete(job_id, result)
    return result
