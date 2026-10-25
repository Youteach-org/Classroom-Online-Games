import hashlib


JOBS_ROOT = "classroomGames/talkTalk/oralGrader/jobs"


def stable_job_id(idempotency_key: str) -> str:
    value = str(idempotency_key or "").strip()
    if not value:
        raise ValueError("idempotencyKey is required")
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()[:32]
    return "job-" + digest


class FirebaseJobStore:
    def __init__(self, reference_factory):
        if not callable(reference_factory):
            raise ValueError("reference_factory is required")
        self.reference_factory = reference_factory
        self.root = reference_factory(JOBS_ROOT)

    def get_by_idempotency(self, key):
        return self.get(stable_job_id(key))

    def create(self, job):
        job_id = str((job or {}).get("jobId") or "").strip()
        if not job_id:
            raise ValueError("jobId is required")
        ref = self.root.child(job_id)
        result = ref.transaction(lambda current: current if current is not None else job)
        return result

    def get(self, job_id):
        value = self.root.child(str(job_id)).get()
        return value if isinstance(value, dict) else None

    def update(self, job_id, patch):
        ref = self.root.child(str(job_id))
        if ref.get() is None:
            raise KeyError("job not found")
        ref.update(patch)
        return ref.get()

    def list_recent(self, limit=50):
        value = self.root.get()
        if not isinstance(value, dict):
            return []
        rows = [row for row in value.values() if isinstance(row, dict)]
        rows.sort(key=lambda row: row.get("createdAt", 0), reverse=True)
        return rows[: max(1, min(100, int(limit)))]


class FirebaseAudioStore:
    def __init__(self, bucket):
        if bucket is None:
            raise ValueError("bucket is required")
        self.bucket = bucket

    def put(self, key, data, mime_type):
        clean_key = str(key or "").strip()
        if not clean_key:
            raise ValueError("storage key is required")
        blob = self.bucket.blob(clean_key)
        blob.upload_from_string(bytes(data), content_type=str(mime_type or "application/octet-stream"))
        return clean_key

    def read(self, key):
        clean_key = str(key or "").strip()
        if not clean_key:
            raise ValueError("storage key is required")
        return self.bucket.blob(clean_key).download_as_bytes()

    def download(self, key, target):
        from pathlib import Path

        clean_key = str(key or "").strip()
        if not clean_key:
            raise ValueError("storage key is required")
        target_path = Path(target)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        self.bucket.blob(clean_key).download_to_filename(str(target_path))
        return target_path

    def delete(self, key):
        clean_key = str(key or "").strip()
        if clean_key:
            self.bucket.blob(clean_key).delete()
