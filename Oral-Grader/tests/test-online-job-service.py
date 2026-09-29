import importlib.util
from pathlib import Path

import pytest

ROOT = Path(__file__).parents[1]
SERVICE_PATH = ROOT / "online" / "job-service.py"
AUTH_PATH = ROOT / "online" / "auth.py"


def load(path, name):
    assert path.is_file(), f"Missing production module: {path}"
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(mod)
    return mod


class FakeJobStore:
    def __init__(self):
        self.jobs = {}
        self.by_idempotency = {}

    def get_by_idempotency(self, key):
        job_id = self.by_idempotency.get(key)
        return self.jobs.get(job_id) if job_id else None

    def create(self, job):
        self.jobs[job["jobId"]] = dict(job)
        self.by_idempotency[job["idempotencyKey"]] = job["jobId"]
        return dict(job)

    def get(self, job_id):
        row = self.jobs.get(job_id)
        return dict(row) if row else None

    def update(self, job_id, patch):
        self.jobs[job_id].update(patch)
        return dict(self.jobs[job_id])

    def list_recent(self, limit=50):
        rows=list(self.jobs.values())
        rows.sort(key=lambda row: row.get("createdAt",0), reverse=True)
        return [dict(row) for row in rows[:limit]]


class FakeAudioStore:
    def __init__(self):
        self.objects = {}
        self.put_calls = []
        self.delete_calls = []

    def put(self, key, data, mime_type):
        self.put_calls.append((key, bytes(data), mime_type))
        self.objects[key] = bytes(data)
        return key

    def read(self, key):
        return self.objects.get(key)

    def delete(self, key):
        self.delete_calls.append(key)
        self.objects.pop(key, None)


def job_payload():
    return {
        "attemptId": "attempt-123",
        "sessionId": "session-123",
        "activityId": "activity-123",
        "students": [{"studentId": "student-1", "name": "Paul"}],
        "mode": "assessment",
        "rubricId": "e6c-units-1-4-v1",
        "language": "en",
        "promptContext": "Tell me what happened.",
        "audio": {"mimeType": "audio/webm"},
        "clientCreatedAt": "2026-09-28T21:30:00-06:00",
        "idempotencyKey": "attempt-123:grade",
    }


def test_signed_preview_session_token_round_trips_and_expires():
    auth = load(AUTH_PATH, "og_online_auth")
    token = auth.issue_session_token(
        role="student",
        subject="student",
        secret="test-secret",
        now=lambda: 1000,
        ttl_seconds=60,
    )
    claims = auth.verify_session_token(token, secret="test-secret", now=lambda: 1030)
    assert claims["role"] == "student"
    assert claims["sub"] == "student"

    with pytest.raises(ValueError, match="expired"):
        auth.verify_session_token(token, secret="test-secret", now=lambda: 1061)


def test_signed_preview_session_token_rejects_tampering():
    auth = load(AUTH_PATH, "og_online_auth_tamper")
    token = auth.issue_session_token(
        role="student",
        subject="student",
        secret="test-secret",
        now=lambda: 1000,
        ttl_seconds=60,
    )
    tampered = token[:-1] + ("A" if token[-1] != "A" else "B")
    with pytest.raises(ValueError, match="signature"):
        auth.verify_session_token(tampered, secret="test-secret", now=lambda: 1010)


def test_submit_stores_audio_once_and_returns_submitted_job():
    mod = load(SERVICE_PATH, "og_online_service_submit")
    jobs = FakeJobStore()
    audio = FakeAudioStore()
    service = mod.create_job_service(
        job_store=jobs,
        audio_store=audio,
        now=lambda: 2000,
        job_id_factory=lambda: "job-123",
    )

    out = service.submit(job_payload(), b"webm-audio", actor={"role": "student", "sub": "student"})

    assert out["jobId"] == "job-123"
    assert out["status"] == "submitted"
    assert out["audio"]["mimeType"] == "audio/webm"
    assert out["audio"]["storageKey"] == "oral-grader/jobs/job-123/source"
    assert len(audio.put_calls) == 1
    assert "webm-audio" not in repr(out)


def test_duplicate_idempotency_key_returns_existing_job_without_second_audio_write():
    mod = load(SERVICE_PATH, "og_online_service_idempotency")
    jobs = FakeJobStore()
    audio = FakeAudioStore()
    ids = iter(["job-123", "job-should-not-exist"])
    service = mod.create_job_service(
        job_store=jobs,
        audio_store=audio,
        now=lambda: 2000,
        job_id_factory=lambda: next(ids),
    )

    first = service.submit(job_payload(), b"first-audio", actor={"role": "student", "sub": "student"})
    second = service.submit(job_payload(), b"duplicate-audio", actor={"role": "student", "sub": "student"})

    assert second["jobId"] == first["jobId"]
    assert second["status"] == "submitted"
    assert len(audio.put_calls) == 1
    assert audio.objects[first["audio"]["storageKey"]] == b"first-audio"


def test_submit_rejects_non_student_actor_and_empty_audio():
    mod = load(SERVICE_PATH, "og_online_service_auth")
    service = mod.create_job_service(
        job_store=FakeJobStore(),
        audio_store=FakeAudioStore(),
        now=lambda: 2000,
        job_id_factory=lambda: "job-123",
    )

    with pytest.raises(PermissionError, match="student"):
        service.submit(job_payload(), b"audio", actor={"role": "teacher", "sub": "teacher"})

    with pytest.raises(ValueError, match="audio"):
        service.submit(job_payload(), b"", actor={"role": "student", "sub": "student"})


def test_status_returns_shared_online_job_without_raw_audio():
    mod = load(SERVICE_PATH, "og_online_service_status")
    jobs = FakeJobStore()
    service = mod.create_job_service(
        job_store=jobs,
        audio_store=FakeAudioStore(),
        now=lambda: 2000,
        job_id_factory=lambda: "job-123",
    )
    service.submit(job_payload(), b"audio", actor={"role": "student", "sub": "student"})

    out = service.get_status("job-123", actor={"role": "teacher", "sub": "teacher"})

    assert out["jobId"] == "job-123"
    assert out["status"] == "submitted"
    assert "audioBytes" not in out


def test_completed_job_persists_result_and_retains_audio_until_teacher_publish():
    mod = load(SERVICE_PATH, "og_online_service_complete")
    jobs = FakeJobStore()
    audio = FakeAudioStore()
    service = mod.create_job_service(
        job_store=jobs,
        audio_store=audio,
        now=lambda: 2000,
        job_id_factory=lambda: "job-123",
    )
    submitted = service.submit(
        job_payload(),
        b"audio",
        actor={"role": "student", "sub": "student"},
    )

    result = {
        "jobId": "job-123",
        "status": "completed",
        "students": [{"studentId": "student-1", "total": 33}],
    }
    out = service.complete("job-123", result)

    assert out["status"] == "completed"
    assert out["result"] == result
    assert submitted["audio"]["storageKey"] not in audio.delete_calls
    assert submitted["audio"]["storageKey"] in audio.objects


def test_retryable_failure_keeps_audio_for_retry():
    mod = load(SERVICE_PATH, "og_online_service_retry")
    jobs = FakeJobStore()
    audio = FakeAudioStore()
    service = mod.create_job_service(
        job_store=jobs,
        audio_store=audio,
        now=lambda: 2000,
        job_id_factory=lambda: "job-123",
    )
    submitted = service.submit(
        job_payload(),
        b"audio",
        actor={"role": "student", "sub": "student"},
    )

    out = service.fail("job-123", retryable=True, error_code="gemini-temporary")

    assert out["status"] == "failed_retryable"
    assert submitted["audio"]["storageKey"] in audio.objects
    assert audio.delete_calls == []


def test_concurrent_idempotency_claim_returns_winning_job_and_cleans_losing_audio():
    mod = load(SERVICE_PATH, "og_online_service_race")

    existing = {
        **job_payload(),
        "jobId": "job-winner",
        "status": "submitted",
        "createdAt": 1999,
        "updatedAt": 1999,
        "submittedBy": "student",
        "audio": {
            "mimeType": "audio/webm",
            "storageKey": "oral-grader/jobs/job-winner/source",
        },
    }

    class RaceJobStore(FakeJobStore):
        def __init__(self):
            super().__init__()
            self.jobs["job-winner"] = dict(existing)
            self.by_idempotency[existing["idempotencyKey"]] = "job-winner"
            self.lookup_calls = 0

        def get_by_idempotency(self, key):
            self.lookup_calls += 1
            if self.lookup_calls == 1:
                return None
            return super().get_by_idempotency(key)

        def create(self, job):
            raise mod.DuplicateIdempotencyError("job-winner")

    jobs = RaceJobStore()
    audio = FakeAudioStore()
    service = mod.create_job_service(
        job_store=jobs,
        audio_store=audio,
        now=lambda: 2000,
        job_id_factory=lambda: "job-loser",
    )

    out = service.submit(
        job_payload(),
        b"losing-audio",
        actor={"role": "student", "sub": "student"},
    )

    assert out["jobId"] == "job-winner"
    assert "oral-grader/jobs/job-loser/source" in audio.delete_calls
    assert len(audio.put_calls) == 1


def test_teacher_lists_shared_jobs_and_student_cannot_list_all_jobs():
    mod = load(SERVICE_PATH, "og_online_service_list")
    jobs = FakeJobStore()
    service = mod.create_job_service(
        job_store=jobs,
        audio_store=FakeAudioStore(),
        now=lambda: 2000,
        job_id_factory=lambda: "job-123",
    )
    service.submit(job_payload(), b"audio", actor={"role":"student","sub":"student"})

    rows = service.list_jobs(actor={"role":"teacher","sub":"teacher"})
    assert len(rows) == 1
    assert rows[0]["jobId"] == "job-123"

    with pytest.raises(PermissionError, match="teacher"):
        service.list_jobs(actor={"role":"student","sub":"student"})


def test_teacher_can_read_audio_before_publish_and_publish_deletes_it():
    mod = load(SERVICE_PATH, "og_online_service_teacher_audio")
    jobs = FakeJobStore()
    audio = FakeAudioStore()
    service = mod.create_job_service(
        job_store=jobs,
        audio_store=audio,
        now=lambda: 2000,
        job_id_factory=lambda: "job-123",
    )
    submitted = service.submit(
        job_payload(), b"source-audio",
        actor={"role":"student","sub":"student"}
    )
    service.complete("job-123", {
        "jobId":"job-123",
        "status":"completed",
        "students":[{"studentId":"student-1","total":33}],
    })

    source = service.get_audio(
        "job-123",
        actor={"role":"teacher","sub":"teacher"}
    )
    assert source["bytes"] == b"source-audio"
    assert source["mimeType"] == "audio/webm"

    published = service.save_teacher_review(
        "job-123",
        scores={
            "fluency":7,
            "coherence_and_organization":6,
            "grammar_and_vocabulary":6,
            "pronunciation_and_intelligibility":7,
            "communicative_interaction":7,
        },
        comments="Ready to publish.",
        publish=True,
        actor={"role":"teacher","sub":"teacher"},
    )
    assert published["teacherReview"]["published"] is True
    assert published["teacherReview"]["total"] == 33
    assert submitted["audio"]["storageKey"] in audio.delete_calls
    assert submitted["audio"]["storageKey"] not in audio.objects


def test_teacher_override_is_separate_from_immutable_oral_grader_result():
    mod = load(SERVICE_PATH, "og_online_service_override")
    jobs = FakeJobStore()
    audio = FakeAudioStore()
    service = mod.create_job_service(
        job_store=jobs,
        audio_store=audio,
        now=lambda: 2000,
        job_id_factory=lambda: "job-123",
    )
    service.submit(job_payload(), b"audio", actor={"role":"student","sub":"student"})
    original = {
        "jobId":"job-123",
        "status":"completed",
        "transcript":{"heard_text":"I have went to the park."},
        "students":[{
            "studentId":"student-1",
            "rubric_scores":{
                "fluency":7,
                "coherence_and_organization":6,
                "grammar_and_vocabulary":6,
                "pronunciation_and_intelligibility":7,
                "communicative_interaction":7,
            },
            "total":33,
        }],
    }
    service.complete("job-123", original)

    reviewed = service.save_teacher_review(
        "job-123",
        scores={
            "fluency":6,
            "coherence_and_organization":6,
            "grammar_and_vocabulary":6,
            "pronunciation_and_intelligibility":7,
            "communicative_interaction":7,
        },
        comments="Manual fluency adjustment.",
        publish=False,
        actor={"role":"teacher","sub":"teacher"},
    )

    assert reviewed["result"] == original
    assert reviewed["result"]["transcript"]["heard_text"] == "I have went to the park."
    assert reviewed["teacherReview"]["scores"]["fluency"] == 6
    assert reviewed["teacherReview"]["total"] == 32
    assert reviewed["teacherReview"]["published"] is False


def test_teacher_review_requires_all_five_scores_in_zero_to_eight():
    mod = load(SERVICE_PATH, "og_online_service_review_validation")
    jobs = FakeJobStore()
    service = mod.create_job_service(
        job_store=jobs,
        audio_store=FakeAudioStore(),
        now=lambda: 2000,
        job_id_factory=lambda: "job-123",
    )
    service.submit(job_payload(), b"audio", actor={"role":"student","sub":"student"})

    with pytest.raises(ValueError, match="five"):
        service.save_teacher_review(
            "job-123",
            scores={"fluency":7},
            comments="",
            publish=False,
            actor={"role":"teacher","sub":"teacher"},
        )

    with pytest.raises(ValueError, match="0..8"):
        service.save_teacher_review(
            "job-123",
            scores={
                "fluency":9,
                "coherence_and_organization":6,
                "grammar_and_vocabulary":6,
                "pronunciation_and_intelligibility":7,
                "communicative_interaction":7,
            },
            comments="",
            publish=False,
            actor={"role":"teacher","sub":"teacher"},
        )
