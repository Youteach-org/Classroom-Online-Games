import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).parents[1]
ADAPTER_PATH = ROOT / "online" / "firebase-adapter.py"
MAIN_PATH = ROOT / "main.py"
FIREBASE_JSON = ROOT.parent / "firebase.json"
REQUIREMENTS = ROOT / "requirements.txt"


def load(path, name):
    assert path.is_file(), f"Missing production module: {path}"
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(mod)
    return mod


class FakeRef:
    def __init__(self, tree, path=()):
        self.tree = tree
        self.path = tuple(path)

    def child(self, name):
        return FakeRef(self.tree, self.path + (str(name),))

    def _parent(self, create=False):
        node = self.tree
        if not self.path:
            return None, None
        for part in self.path[:-1]:
            if create:
                node = node.setdefault(part, {})
            else:
                node = node.get(part, {})
        return node, self.path[-1]

    def get(self):
        node = self.tree
        for part in self.path:
            if not isinstance(node, dict) or part not in node:
                return None
            node = node[part]
        return json.loads(json.dumps(node))

    def set(self, value):
        parent, key = self._parent(create=True)
        parent[key] = json.loads(json.dumps(value))

    def update(self, patch):
        current = self.get() or {}
        current.update(json.loads(json.dumps(patch)))
        self.set(current)

    def transaction(self, callback):
        current = self.get()
        value = callback(current)
        self.set(value)
        return self.get()


class FakeBlob:
    def __init__(self, store, key):
        self.store = store
        self.key = key

    def upload_from_string(self, data, content_type=None):
        self.store[self.key] = {
            "data": bytes(data),
            "content_type": content_type,
        }

    def delete(self):
        self.store.pop(self.key, None)


class FakeBucket:
    def __init__(self):
        self.objects = {}

    def blob(self, key):
        return FakeBlob(self.objects, key)


def test_stable_job_id_is_deterministic_and_does_not_expose_idempotency_key():
    mod = load(ADAPTER_PATH, "og_firebase_adapter_id")
    a = mod.stable_job_id("attempt-123:grade")
    b = mod.stable_job_id("attempt-123:grade")
    c = mod.stable_job_id("attempt-456:grade")

    assert a == b
    assert a != c
    assert a.startswith("job-")
    assert "attempt-123" not in a


def test_firebase_job_store_uses_shared_rtdb_job_path_and_atomic_create():
    mod = load(ADAPTER_PATH, "og_firebase_adapter_jobs")
    tree = {}
    store = mod.FirebaseJobStore(lambda path: FakeRef(tree, tuple(p for p in path.split("/") if p)))

    job = {
        "jobId": mod.stable_job_id("attempt-123:grade"),
        "idempotencyKey": "attempt-123:grade",
        "status": "submitted",
    }
    created = store.create(job)
    assert created["status"] == "submitted"
    assert store.get(job["jobId"])["jobId"] == job["jobId"]
    assert store.get_by_idempotency("attempt-123:grade")["jobId"] == job["jobId"]

    duplicate = {**job, "status": "should-not-overwrite"}
    returned = store.create(duplicate)
    assert returned["status"] == "submitted"


def test_firebase_audio_store_writes_and_deletes_one_storage_key():
    mod = load(ADAPTER_PATH, "og_firebase_adapter_audio")
    bucket = FakeBucket()
    store = mod.FirebaseAudioStore(bucket)

    key = "oral-grader/jobs/job-123/source"
    assert store.put(key, b"audio", "audio/webm") == key
    assert bucket.objects[key]["data"] == b"audio"
    assert bucket.objects[key]["content_type"] == "audio/webm"

    store.delete(key)
    assert key not in bucket.objects


def test_firebase_project_config_declares_python_functions_source():
    config = json.loads(FIREBASE_JSON.read_text(encoding="utf-8"))
    functions = config["functions"]
    assert functions["source"] == "Oral-Grader"
    assert functions["runtime"] == "python312"


def test_firebase_entrypoint_exposes_preview_auth_submit_and_status_without_browser_secrets():
    source = MAIN_PATH.read_text(encoding="utf-8")
    assert "talk_talk_preview_login" in source
    assert "oral_grader_submit" in source
    assert "oral_grader_job_status" in source
    assert "process_oral_grader_job" in source
    assert "db_fn.on_value_created" in source
    assert "TALK_TALK_SESSION_SECRET" in source
    assert "GEMINI_API_KEY" in source
    assert "GEMINI_API_KEY" not in source
    assert "Authorization" in source or "authorization" in source.lower()
    assert "audio" in source
    assert "idempotencyKey" in source


def test_runtime_requirements_include_firebase_sdk():
    req = REQUIREMENTS.read_text(encoding="utf-8")
    assert "firebase-functions" in req
    assert "firebase-admin" in req


def test_firebase_audio_store_downloads_source_for_processor(tmp_path):
    mod = load(ADAPTER_PATH, "og_firebase_adapter_download")
    bucket = FakeBucket()
    bucket.objects["oral-grader/jobs/job-123/source"] = {
        "data": b"audio-bytes",
        "content_type": "audio/webm",
    }

    class DownloadBlob(FakeBlob):
        def download_to_filename(self, filename):
            Path(filename).write_bytes(self.store[self.key]["data"])

    class DownloadBucket(FakeBucket):
        def __init__(self, objects):
            self.objects = objects

        def blob(self, key):
            return DownloadBlob(self.objects, key)

    store = mod.FirebaseAudioStore(DownloadBucket(bucket.objects))
    target = tmp_path / "source.webm"
    returned = store.download("oral-grader/jobs/job-123/source", target)

    assert returned == target
    assert target.read_bytes() == b"audio-bytes"
