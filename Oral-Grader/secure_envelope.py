"""Ephemeral sealed requests and authenticated encrypted grader responses."""

import base64
import json
import os

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _b64(data):
    return base64.b64encode(data).decode('ascii')


def _unb64(data):
    return base64.b64decode(data, validate=True)


def _encode(payload):
    return json.dumps(payload, ensure_ascii=False, separators=(',', ':')).encode('utf-8')


def encrypt_request(public_der, challenge, payload):
    public_key = serialization.load_der_public_key(public_der)
    key = os.urandom(32)
    nonce = os.urandom(12)
    aad = challenge.encode('utf-8')
    wrapped_key = public_key.encrypt(
        key,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=aad,
        ),
    )
    return {
        'challenge': challenge,
        'wrapped_key': _b64(wrapped_key),
        'nonce': _b64(nonce),
        'ciphertext': _b64(AESGCM(key).encrypt(nonce, _encode(payload), aad)),
    }, key


def unwrap_request(private_key, challenge, payload):
    if payload.get('challenge') != challenge:
        raise ValueError('Request challenge mismatch')
    aad = challenge.encode('utf-8')
    key = private_key.decrypt(
        _unb64(payload['wrapped_key']),
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=aad,
        ),
    )
    return json.loads(AESGCM(key).decrypt(
        _unb64(payload['nonce']), _unb64(payload['ciphertext']), aad,
    ))


def encrypt_response(key, challenge, payload):
    nonce = os.urandom(12)
    return {
        'challenge': challenge,
        'nonce': _b64(nonce),
        'ciphertext': _b64(AESGCM(key).encrypt(
            nonce, _encode(payload), challenge.encode('utf-8'),
        )),
    }


def decrypt_response(key, challenge, blob):
    if blob.get('challenge') != challenge:
        raise ValueError('Result challenge mismatch')
    return json.loads(AESGCM(key).decrypt(
        _unb64(blob['nonce']),
        _unb64(blob['ciphertext']),
        challenge.encode('utf-8'),
    ))


def encrypt_audio(audio, key):
    nonce = os.urandom(12)
    return nonce + AESGCM(key).encrypt(nonce, audio, b'oral-grader-audio-v1')


def decrypt_audio(blob, key):
    if len(blob) < 29:
        raise ValueError('Encrypted audio too short')
    return AESGCM(key).decrypt(blob[:12], blob[12:], b'oral-grader-audio-v1')
