import copy
import time
import uuid


ALLOWED_MODES = {"practice", "assessment", "live_assessment"}


class DuplicateIdempotencyError(RuntimeError):
    def __init__(self, existing_job_id):
        super().__init__("idempotency key already claimed")
        self.existing_job_id = str(existing_job_id or "").strip()


def _copy(value):
    return copy.deepcopy(value)


def _require_string(value, name):
    clean = str(value or "").strip()
    if not clean:
        raise ValueError(f"{name} is required")
    return clean


def _validate_actor(actor, *, allow_teacher=False):
    if not isinstance(actor, dict):
        raise PermissionError("authenticated student actor is required")
    role = actor.get("role")
    allowed = {"student", "teacher"} if allow_teacher else {"student"}
    if role not in allowed:
        expected = "student or teacher" if allow_teacher else "student"
        raise PermissionError(f"authenticated {expected} actor is required")
    if not str(actor.get("sub") or "").strip():
        raise PermissionError("authenticated actor subject is required")
    return {"role": role, "sub": str(actor["sub"]).strip()}


def _validate_job_payload(raw):
    if not isinstance(raw, dict):
        raise ValueError("job payload must be an object")

    mode = _require_string(raw.get("mode"), "mode")
    if mode not in ALLOWED_MODES:
        raise ValueError("unsupported mode")

    students = raw.get("students")
    if not isinstance(students, list) or not students:
        raise ValueError("students are required")
    clean_students = []
    for row in students:
        if not isinstance(row, dict):
            raise ValueError("student identity must be an object")
        clean_students.append(
            {
                "studentId": _require_string(row.get("studentId"), "studentId"),
                "name": _require_string(row.get("name"), "student name"),
            }
        )

    audio = raw.get("audio")
    if not isinstance(audio, dict):
        raise ValueError("audio metadata is required")
    mime_type = _require_string(audio.get("mimeType"), "audio.mimeType")

    prompt_context = raw.get("promptContext")
    if not isinstance(prompt_context, (str, dict)):
        raise ValueError("promptContext must be a string or object")

    out = {
        "attemptId": _require_string(raw.get("attemptId"), "attemptId"),
        "sessionId": _require_string(raw.get("sessionId"), "sessionId"),
        "activityId": _require_string(raw.get("activityId"), "activityId"),
        "students": clean_students,
        "mode": mode,
        "rubricId": _require_string(raw.get("rubricId"), "rubricId"),
        "language": _require_string(raw.get("language"), "language"),
        "promptContext": _copy(prompt_context),
        "audio": {"mimeType": mime_type},
        "clientCreatedAt": _require_string(raw.get("clientCreatedAt"), "clientCreatedAt"),
        "idempotencyKey": _require_string(raw.get("idempotencyKey"), "idempotencyKey"),
    }
    for optional in ("groupId", "teamId"):
        if raw.get(optional) not in (None, ""):
            out[optional] = _require_string(raw.get(optional), optional)
    return out


class JobService:
    def __init__(self, *, job_store, audio_store, now=time.time, job_id_factory=None):
        if job_store is None or audio_store is None:
            raise ValueError("job_store and audio_store are required")
        self.job_store = job_store
        self.audio_store = audio_store
        self.now = now
        self.job_id_factory = job_id_factory or (lambda: "job-" + uuid.uuid4().hex)

    def submit(self, payload, audio_bytes, *, actor):
        clean_actor = _validate_actor(actor)
        job = _validate_job_payload(payload)
        if not isinstance(audio_bytes, (bytes, bytearray, memoryview)) or len(audio_bytes) == 0:
            raise ValueError("audio bytes are required")

        existing = self.job_store.get_by_idempotency(job["idempotencyKey"])
        if existing:
            return _copy(existing)

        job_id = _require_string(self.job_id_factory(), "jobId")
        storage_key = f"oral-grader/jobs/{job_id}/source"

        self.audio_store.put(
            storage_key,
            bytes(audio_bytes),
            job["audio"]["mimeType"],
        )

        created = {
            "jobId": job_id,
            **job,
            "status": "submitted",
            "createdAt": int(self.now()),
            "updatedAt": int(self.now()),
            "submittedBy": clean_actor["sub"],
            "audio": {
                "mimeType": job["audio"]["mimeType"],
                "storageKey": storage_key,
            },
        }

        try:
            return _copy(self.job_store.create(created))
        except DuplicateIdempotencyError as exc:
            self.audio_store.delete(storage_key)
            existing = self.job_store.get(exc.existing_job_id)
            if not existing:
                raise
            return _copy(existing)
        except Exception:
            self.audio_store.delete(storage_key)
            raise

    def get_status(self, job_id, *, actor):
        _validate_actor(actor, allow_teacher=True)
        clean_job_id = _require_string(job_id, "jobId")
        row = self.job_store.get(clean_job_id)
        if not row:
            raise KeyError("job not found")
        return _copy(row)

    def complete(self, job_id, result):
        clean_job_id = _require_string(job_id, "jobId")
        row = self.job_store.get(clean_job_id)
        if not row:
            raise KeyError("job not found")
        if not isinstance(result, dict):
            raise ValueError("result must be an object")
        final_status = str(result.get("status") or "completed")
        if final_status not in {"completed", "review_required"}:
            raise ValueError("result status must be completed or review_required")

        updated = self.job_store.update(
            clean_job_id,
            {
                "status": final_status,
                "result": _copy(result),
                "updatedAt": int(self.now()),
                "completedAt": int(self.now()),
            },
        )
        storage_key = (row.get("audio") or {}).get("storageKey")
        if storage_key:
            self.audio_store.delete(storage_key)
        return _copy(updated)

    def require_review(self, job_id, *, reason, details=None):
        clean_job_id = _require_string(job_id, "jobId")
        row = self.job_store.get(clean_job_id)
        if not row:
            raise KeyError("job not found")
        return _copy(
            self.job_store.update(
                clean_job_id,
                {
                    "status": "review_required",
                    "review": {
                        "reason": _require_string(reason, "reason"),
                        "details": _copy(details or {}),
                    },
                    "updatedAt": int(self.now()),
                },
            )
        )

    def fail(self, job_id, *, retryable, error_code):
        clean_job_id = _require_string(job_id, "jobId")
        row = self.job_store.get(clean_job_id)
        if not row:
            raise KeyError("job not found")
        status = "failed_retryable" if retryable else "failed_terminal"
        updated = self.job_store.update(
            clean_job_id,
            {
                "status": status,
                "error": {"code": _require_string(error_code, "error_code")},
                "updatedAt": int(self.now()),
            },
        )
        if not retryable:
            storage_key = (row.get("audio") or {}).get("storageKey")
            if storage_key:
                self.audio_store.delete(storage_key)
        return _copy(updated)


def create_job_service(*, job_store, audio_store, now=time.time, job_id_factory=None):
    return JobService(
        job_store=job_store,
        audio_store=audio_store,
        now=now,
        job_id_factory=job_id_factory,
    )
