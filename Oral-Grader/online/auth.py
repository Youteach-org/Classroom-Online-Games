import base64
import hashlib
import hmac
import json
import time


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _json_b64(payload: dict) -> str:
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return _b64url(raw)


def _decode_json_b64(value: str) -> dict:
    padding = "=" * ((4 - len(value) % 4) % 4)
    try:
        raw = base64.urlsafe_b64decode((value + padding).encode("ascii"))
        payload = json.loads(raw.decode("utf-8"))
    except Exception as exc:
        raise ValueError("invalid session token payload") from exc
    if not isinstance(payload, dict):
        raise ValueError("invalid session token payload")
    return payload


def _require_secret(secret: str) -> bytes:
    value = str(secret or "")
    if not value:
        raise ValueError("session signing secret is required")
    return value.encode("utf-8")


def issue_session_token(
    *,
    role: str,
    subject: str,
    secret: str,
    now=time.time,
    ttl_seconds: int = 60 * 60 * 12,
) -> str:
    clean_role = str(role or "").strip()
    clean_subject = str(subject or "").strip()
    if clean_role not in {"student", "teacher"}:
        raise ValueError("unsupported session role")
    if not clean_subject:
        raise ValueError("session subject is required")
    if int(ttl_seconds) <= 0:
        raise ValueError("ttl_seconds must be positive")

    issued_at = int(now())
    payload = {
        "sub": clean_subject,
        "role": clean_role,
        "iat": issued_at,
        "exp": issued_at + int(ttl_seconds),
    }
    encoded = _json_b64(payload)
    signature = hmac.new(
        _require_secret(secret),
        encoded.encode("ascii"),
        hashlib.sha256,
    ).digest()
    return encoded + "." + _b64url(signature)


def verify_session_token(token: str, *, secret: str, now=time.time) -> dict:
    value = str(token or "").strip()
    if "." not in value:
        raise ValueError("invalid session token")
    encoded, supplied_signature = value.split(".", 1)
    if not encoded or not supplied_signature:
        raise ValueError("invalid session token")

    expected_signature = _b64url(
        hmac.new(
            _require_secret(secret),
            encoded.encode("ascii"),
            hashlib.sha256,
        ).digest()
    )
    if not hmac.compare_digest(supplied_signature, expected_signature):
        raise ValueError("invalid session token signature")

    payload = _decode_json_b64(encoded)
    role = payload.get("role")
    subject = payload.get("sub")
    expires = payload.get("exp")
    if role not in {"student", "teacher"} or not isinstance(subject, str) or not subject:
        raise ValueError("invalid session token claims")
    if not isinstance(expires, int):
        raise ValueError("invalid session token expiry")
    if int(now()) > expires:
        raise ValueError("session token expired")
    return payload
