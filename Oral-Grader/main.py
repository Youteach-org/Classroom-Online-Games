import importlib.util
import json
import os
from pathlib import Path

from firebase_admin import db, initialize_app, storage
from firebase_functions import https_fn


ROOT = Path(__file__).resolve().parent
initialize_app()


def _load(relative_path, module_name):
    path = ROOT / relative_path
    spec = importlib.util.spec_from_file_location(module_name, path)
    module = importlib.util.module_from_spec(spec)
    if not spec or not spec.loader:
        raise RuntimeError(f"Cannot load Oral Grader module: {path}")
    spec.loader.exec_module(module)
    return module


AUTH = _load("online/auth.py", "oral_grader_online_auth")
JOB_SERVICE = _load("online/job-service.py", "oral_grader_online_job_service")
FIREBASE_ADAPTER = _load("online/firebase-adapter.py", "oral_grader_firebase_adapter")

ALLOWED_STANDALONE_CREDENTIALS = {
    "student": {"password": "talktalk", "role": "student"},
    "teacher": {"password": "talktalk", "role": "teacher"},
}


def _origin_allowed(origin):
    value = str(origin or "").strip().lower()
    if not value:
        return False
    return (
        value == "https://classroom-online-games.pages.dev"
        or value.endswith(".classroom-online-games.pages.dev")
        or value in {"http://localhost:8788", "http://127.0.0.1:8788"}
    )


def _cors_headers(request):
    origin = request.headers.get("Origin", "")
    headers = {
        "Vary": "Origin",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Cache-Control": "no-store",
    }
    if _origin_allowed(origin):
        headers["Access-Control-Allow-Origin"] = origin
    return headers


def _json_response(request, payload, status=200):
    return https_fn.Response(
        json.dumps(payload, ensure_ascii=False),
        status=status,
        headers={**_cors_headers(request), "Content-Type": "application/json; charset=utf-8"},
    )


def _preflight(request):
    if request.method == "OPTIONS":
        return https_fn.Response("", status=204, headers=_cors_headers(request))
    return None


def _bearer_claims(request):
    authorization = str(request.headers.get("Authorization") or "")
    if not authorization.startswith("Bearer "):
        raise PermissionError("missing bearer token")
    token = authorization[7:].strip()
    secret = os.environ.get("TALK_TALK_SESSION_SECRET", "")
    return AUTH.verify_session_token(token, secret=secret)


def _job_service(metadata):
    idempotency_key = str((metadata or {}).get("idempotencyKey") or "").strip()
    if not idempotency_key:
        raise ValueError("idempotencyKey is required")
    return JOB_SERVICE.create_job_service(
        job_store=FIREBASE_ADAPTER.FirebaseJobStore(db.reference),
        audio_store=FIREBASE_ADAPTER.FirebaseAudioStore(storage.bucket()),
        job_id_factory=lambda: FIREBASE_ADAPTER.stable_job_id(idempotency_key),
    )


def _public_job(job):
    if not isinstance(job, dict):
        return job
    public = dict(job)
    audio = public.get("audio")
    if isinstance(audio, dict):
        public["audio"] = {"mimeType": audio.get("mimeType", "")}
    return public


@https_fn.on_request(secrets=["TALK_TALK_SESSION_SECRET"])
def talk_talk_preview_login(request):
    preflight = _preflight(request)
    if preflight is not None:
        return preflight
    if request.method != "POST":
        return _json_response(request, {"ok": False, "error": "method-not-allowed"}, 405)

    body = request.get_json(silent=True) or {}
    username = str(body.get("username") or "").strip()
    password = str(body.get("password") or "")
    record = ALLOWED_STANDALONE_CREDENTIALS.get(username)
    if not record or password != record["password"]:
        return _json_response(request, {"ok": False, "error": "invalid-credentials"}, 401)

    token = AUTH.issue_session_token(
        role=record["role"],
        subject=username,
        secret=os.environ.get("TALK_TALK_SESSION_SECRET", ""),
    )
    return _json_response(
        request,
        {"ok": True, "token": token, "role": record["role"], "subject": username},
        200,
    )


@https_fn.on_request(secrets=["TALK_TALK_SESSION_SECRET"])
def oral_grader_submit(request):
    preflight = _preflight(request)
    if preflight is not None:
        return preflight
    if request.method != "POST":
        return _json_response(request, {"ok": False, "error": "method-not-allowed"}, 405)

    try:
        actor = _bearer_claims(request)
        metadata_raw = request.form.get("metadata")
        metadata = json.loads(metadata_raw or "{}")
        audio_file = request.files.get("audio")
        if audio_file is None:
            raise ValueError("audio is required")
        audio_bytes = audio_file.read()
        if "audio" not in metadata:
            metadata["audio"] = {}
        metadata["audio"]["mimeType"] = (
            audio_file.mimetype
            or metadata["audio"].get("mimeType")
            or "application/octet-stream"
        )
        job = _job_service(metadata).submit(metadata, audio_bytes, actor=actor)
        return _json_response(
            request,
            {"ok": True, "jobId": job["jobId"], "status": job["status"]},
            202,
        )
    except PermissionError as exc:
        return _json_response(request, {"ok": False, "error": str(exc)}, 401)
    except (ValueError, TypeError, json.JSONDecodeError) as exc:
        return _json_response(request, {"ok": False, "error": str(exc)}, 400)


@https_fn.on_request(secrets=["TALK_TALK_SESSION_SECRET"])
def oral_grader_job_status(request):
    preflight = _preflight(request)
    if preflight is not None:
        return preflight
    if request.method != "GET":
        return _json_response(request, {"ok": False, "error": "method-not-allowed"}, 405)

    try:
        actor = _bearer_claims(request)
        job_id = str(request.args.get("jobId") or "").strip()
        if not job_id:
            raise ValueError("jobId is required")
        service = JOB_SERVICE.create_job_service(
            job_store=FIREBASE_ADAPTER.FirebaseJobStore(db.reference),
            audio_store=FIREBASE_ADAPTER.FirebaseAudioStore(storage.bucket()),
        )
        job = service.get_status(job_id, actor=actor)
        return _json_response(request, {"ok": True, "job": _public_job(job)}, 200)
    except PermissionError as exc:
        return _json_response(request, {"ok": False, "error": str(exc)}, 401)
    except ValueError as exc:
        return _json_response(request, {"ok": False, "error": str(exc)}, 400)
    except KeyError:
        return _json_response(request, {"ok": False, "error": "job-not-found"}, 404)
