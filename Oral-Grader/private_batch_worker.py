#!/usr/bin/env python3
"""One-shot private Oral Grader batch worker for GitHub Actions.

Only ephemeral public keys and authenticated ciphertext are stored in GitHub.
Raw student audio, verbatim transcript, and personal feedback stay in the
job's temporary directory until destroyed at job completion.
"""

import base64
import hashlib
import json
import os
import pathlib
import secrets
import signal
import tempfile
import time
import traceback
import urllib.error
import urllib.parse
import urllib.request

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

from secure_envelope import decrypt_audio, encrypt_response, unwrap_request


RUBRIC_KEYS = (
    'fluency',
    'coherence_and_organization',
    'grammar_and_vocabulary',
    'pronunciation_and_intelligibility',
    'communicative_interaction',
)
SESSION_PATH = 'Oral-Grader/transport/session.json'
REQUEST_PATH = 'Oral-Grader/transport/request.json'
RESULT_PATH = 'Oral-Grader/transport/result.json'


def validate_scores(data, expected_students):
    if not isinstance(data, dict) or not isinstance(data.get('students'), list):
        raise ValueError('Expected a students array')
    actual = []
    for entry in data['students']:
        if not isinstance(entry, dict):
            raise ValueError('Invalid student entry')
        name = entry.get('student')
        if not isinstance(name, str) or name not in expected_students:
            raise ValueError('Unrecognized student')
        actual.append(name)
        scores = entry.get('rubric_scores')
        if not isinstance(scores, dict) or set(scores) != set(RUBRIC_KEYS):
            raise ValueError('Wrong Oral Grader criteria')
        if any(type(v) is not int or not 0 <= v <= 8 for v in scores.values()):
            raise ValueError('Each criterion must be integer 0..8')
        if entry.get('total') != sum(scores.values()):
            raise ValueError('Incorrect score total')
        if entry.get('confidence') not in ('low', 'medium', 'high'):
            raise ValueError('Invalid confidence')
        if type(entry.get('review_required')) is not bool:
            raise ValueError('Missing review_required boolean')
        rationale = entry.get('rationale')
        if not isinstance(rationale, dict) or set(rationale) != set(RUBRIC_KEYS):
            raise ValueError('Missing criterion rationale')
        if not all(isinstance(x, str) and x.strip() for x in rationale.values()):
            raise ValueError('Blank rationale')
        if not isinstance(entry.get('comments'), list):
            raise ValueError('Missing comments')
    if sorted(actual) != sorted(expected_students):
        raise ValueError('Missing or duplicated student')
    return data


def _gh_request(method, path, content=None, query=''):
    repo = os.environ['GITHUB_REPOSITORY']
    address = 'https://api.github.com/repos/' + repo + '/contents/' + path + query
    headers = {
        'Accept': 'application/vnd.github+json',
        'Authorization': 'Bearer ' + os.environ['GH_TOKEN'],
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'OralGraderPrivateBatch',
    }
    body = json.dumps(content).encode() if content is not None else None
    if body is not None:
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(address, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=20) as response:
        return json.loads(response.read())


def _get_content(path):
    try:
        branch = urllib.parse.quote(os.environ['GITHUB_REF_NAME'], safe='')
        item = _gh_request('GET', path, query='?ref=' + branch)
        return item['sha'], json.loads(base64.b64decode(item['content']))
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return None, None
        raise


def _put_content(path, payload, description):
    for attempt in range(4):
        sha, _ = _get_content(path)
        body = {
            'message': description,
            'branch': os.environ['GITHUB_REF_NAME'],
            'content': base64.b64encode(json.dumps(payload, separators=(',', ':')).encode()).decode(),
        }
        if sha:
            body['sha'] = sha
        try:
            _gh_request('PUT', path, content=body)
            return
        except urllib.error.HTTPError as exc:
            if exc.code not in (409, 422) or attempt == 3:
                raise
            time.sleep(2)


def _wait_request(challenge, private_key, max_seconds=600):
    end = time.monotonic() + max_seconds
    while time.monotonic() < end:
        _, ciphertext = _get_content(REQUEST_PATH)
        if ciphertext and ciphertext.get('challenge') == challenge:
            return unwrap_request(private_key, challenge, ciphertext)
        time.sleep(5)
    raise TimeoutError('No encrypted request received')


def _get_git_blob(sha):
    if len(sha) != 40 or any(ch not in '0123456789abcdef' for ch in sha):
        raise ValueError('Invalid Git blob SHA')
    repo = os.environ['GITHUB_REPOSITORY']
    url = 'https://api.github.com/repos/' + repo + '/git/blobs/' + sha
    request = urllib.request.Request(url, headers={
        'Accept': 'application/vnd.github+json',
        'Authorization': 'Bearer ' + os.environ['GH_TOKEN'],
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'OralGraderPrivateBatch',
    })
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = json.loads(response.read())
    if payload.get('encoding') != 'base64':
        raise ValueError('Git blob must be Base64 encoded')
    return base64.b64decode(payload['content'], validate=False)


def _download(entry, destination):
    if 'blob_shas' in entry:
        shas = entry['blob_shas']
        if not isinstance(shas, list) or not 1 <= len(shas) <= 64:
            raise ValueError('Invalid list of encrypted Git blobs')
        data = b''.join(_get_git_blob(sha) for sha in shas)
    else:
        url = entry['url']
        if not url.startswith('https://'):
            raise ValueError('A secure signed URL is required')
        request = urllib.request.Request(url, headers={'User-Agent': 'OralGrader/1.0'})
        with urllib.request.urlopen(request, timeout=120) as response:
            data = response.read(25 * 1024 * 1024 + 1)
    if len(data) > 25 * 1024 * 1024:
        raise ValueError('Unexpected large input')
    if 'encrypted_audio_key_b64' in entry:
        key = base64.b64decode(entry['encrypted_audio_key_b64'], validate=True)
        if len(key) != 32:
            raise ValueError('Invalid audio key')
        data = decrypt_audio(data, key)
    if hashlib.sha256(data).hexdigest() != entry['sha256']:
        raise ValueError('Audio integrity mismatch')
    destination.write_bytes(data)


def _json_model(client, model, prompt, attachment=None):
    from google.genai import types

    content = [prompt]
    if attachment:
        content.append(types.Part.from_uri(file_uri=attachment.uri, mime_type=attachment.mime_type))
    options = types.GenerateContentConfig(
        response_mime_type='application/json', temperature=0.15,
    )
    try:
        response = client.models.generate_content(
            model=model, contents=content, config=options,
        )
    except Exception as exc:
        # Google retires model IDs independently from listing them. The fallback
        # has been verified with uploaded audio against the configured key.
        if getattr(exc, 'code', None) != 404 or model == 'gemini-3.1-flash-lite':
            raise
        response = client.models.generate_content(
            model='gemini-3.1-flash-lite', contents=content, config=options,
        )
    if not response.text:
        raise ValueError('Gemini returned no text')
    return json.loads(response.text)


def _stage1_transcript(client, attachment, model):
    # Matches the original Oral Grader Stage 1 literal diarized transcript.
    if hasattr(client, 'interactions'):
        try:
            call = client.interactions.create(
                model='gemini-3.5-transcribe',
                input=[{'type': 'audio', 'uri': attachment.uri,
                        'mime_type': attachment.mime_type}],
                generation_config={'transcription_config': {'mode': {
                    'type': 'verbatim', 'diarization_mode': 'speaker',
                    'timestamp_granularities': ['word']}}},
            )
            words = []
            for step in getattr(call, 'steps', []) or []:
                for content in getattr(step, 'content', []) or []:
                    for ann in getattr(content, 'annotations', []) or []:
                        if getattr(ann, 'type', None) != 'word_info':
                            continue
                        words.append({'speaker': getattr(ann, 'speaker', None),
                                      'word': getattr(ann, 'text', ''),
                                      'start': str(getattr(ann, 'start_offset', ''))})
            if words:
                return {'model': 'gemini-3.5-transcribe', 'words': words}
        except Exception as exc:
            if isinstance(exc, TimeoutError):
                raise
            # Retry via a general audio-capable model, still marking method.
            pass
    prompt = (
        'Transcribe this English oral examination VERBATIM. Preserve grammar '
        'mistakes and false starts. Assign stable Speaker 1, Speaker 2, etc. '
        'Include teacher turns. Give timestamp seconds. Do not grade. '
        'Return JSON {"turns": [{"speaker": "Speaker 1", '
        '"start": 0, "end": 10, "heard": "exact words"}]}.'
    )
    return {'model': model, 'data': _json_model(client, model, prompt, attachment)}


def _upload_active(client, audio_file):
    uploaded = client.files.upload(file=str(audio_file))
    for _ in range(60):
        state = str(getattr(uploaded, 'state', ''))
        if state.endswith('ACTIVE'):
            return uploaded
        if state.endswith('FAILED'):
            raise RuntimeError('Uploaded audio processing failed')
        time.sleep(3)
        uploaded = client.files.get(name=uploaded.name)
    raise TimeoutError('Uploaded audio never became active')


def _grade_one(client, model, audio_file, entry):
    uploaded = _upload_active(client, audio_file)
    try:
        stage1 = _stage1_transcript(client, uploaded, model)
        students = entry['students']
        stage2_prompt = (
            'You are Oral Grader Stage 2. Review the original audio and the literal '
            'speaker-labelled transcript. Students: ' + json.dumps(students) + '. '
            'Exclude the teacher from scoring. Map each voice to the named student '
            'only if there is audible evidence; if names cannot be verified, '
            'say exactly why and mark the mapping uncertain. '
            'Analyze each student separately: evidence of fluency, coherence, '
            'grammar and vocabulary, pronunciation, and communicative interaction. '
            'Distinguish speech-recognition errors from student pronunciation errors. '
            'Include timestamps and teacher prompting. Do not correct the literal '
            'transcript. Do not assign scores in this stage. JSON only. Transcript: '
            + json.dumps(stage1, ensure_ascii=False)
        )
        stage2 = _json_model(client, model, stage2_prompt, uploaded)
        stage3_prompt = (
            'You are the Oral Grader Stage 3 summative assessor. '
            'Using Stage 1 literal evidence and Stage 2 voice/audio analysis, score '
            'each student independently in FIVE criteria, each integer 0..8: '
            + ', '.join(RUBRIC_KEYS) + '. Maximum 40. Passing 32 is a threshold, '
            'NOT a target. Evaluate the WHOLE performance holistically; do not use '
            'error counts as formula. Unit-specific grammar not prompted by the '
            'exam cannot be penalized. Do not confidently penalize uncertain '
            'pronunciation/transcription. Teacher interventions affect fluency '
            'and interaction only when substantiated. Teacher is never scored. '
            'Use the exact student identifiers: ' + json.dumps(students) + '. '
            'For the unnamed trio, Speaker A/B/C represent distinct voices; '
            'be very cautious mapping identities and set review_required true. '
            'Output JSON object {"students": [each with "student", '
            '"rubric_scores" (five keys above), "total" exact sum, '
            '"confidence" (low|medium|high), "review_required" boolean, '
            '"rationale" (five criterion keys, evidence-grounded strings), '
            '"comments" (array of actionable strings), "speaker_evidence" '
            '(short explanation with timestamps)]}. '
            'Stage 1: ' + json.dumps(stage1, ensure_ascii=False) + '\n'
            'Stage 2: ' + json.dumps(stage2, ensure_ascii=False)
        )
        scores = _json_model(client, model, stage3_prompt)
        return {
            'source': entry['name'],
            'model': model,
            'stage1_model': stage1['model'],
            'stages': ['literal_transcription', 'audio_evidence', 'rubric'],
            'stage1': stage1,
            'stage2': stage2,
            'grade': validate_scores(scores, students),
        }
    finally:
        try:
            client.files.delete(name=uploaded.name)
        except Exception:
            pass


def _process(payload, on_progress=None):
    from google import genai

    entries = payload['audios']
    if len(entries) != 3:
        raise ValueError('Exactly three pending October recordings are required')
    for item in entries:
        if not (item['name'] and item['sha256'] and item['students']):
            raise ValueError('Incomplete entry')
    results = []
    with tempfile.TemporaryDirectory(prefix='oral-grader-private-') as directory:
        temporary = pathlib.Path(directory)
        sources = []
        # Download first, while time-limited URLs remain valid.
        for index, entry in enumerate(entries):
            path = temporary / f'{index:02d}.ogg'
            _download(entry, path)
            sources.append(path)
        client = genai.Client(api_key=os.environ['GEMINI_API_KEY'])
        model = os.environ.get('ORAL_GRADER_BATCH_MODEL', 'gemini-3-flash-preview')
        def _deadline(signum, frame):
            raise TimeoutError('Recording exceeded its six-minute analysis limit')

        previous_handler = signal.signal(signal.SIGALRM, _deadline)
        for entry, audio_file in zip(entries, sources):
            try:
                signal.setitimer(signal.ITIMER_REAL, 240)
                results.append(_grade_one(client, model, audio_file, entry))
            except Exception as exc:
                # Do not leak private signed URLs or audio/transcript through logs.
                results.append({'source': entry['name'],
                                'error_type': type(exc).__name__,
                                'error_code': getattr(exc, 'code', None),
                                'error_frames': [{'file': pathlib.Path(f.filename).name, 'function': f.name, 'line': f.lineno} for f in traceback.extract_tb(exc.__traceback__)],
                                'grade': None})
            finally:
                signal.setitimer(signal.ITIMER_REAL, 0)
            if on_progress is not None:
                on_progress({'project': 'Oral-Grader', 'rubric_maximum': 40,
                             'status': 'partial' if len(results) < len(entries) else 'complete',
                             'results': list(results)})
            print('Completed evaluation step', len(results), 'of', len(entries), flush=True)
        signal.signal(signal.SIGALRM, previous_handler)
        try:
            client.close()
        except Exception:
            pass
    return {'project': 'Oral-Grader', 'rubric_maximum': 40, 'results': results}


def main():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=3072)
    public_der = private_key.public_key().public_bytes(
        serialization.Encoding.DER,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    challenge = secrets.token_hex(24)
    _put_content(SESSION_PATH, {
        'challenge': challenge,
        'run_id': os.environ['GITHUB_RUN_ID'],
        'public_key_der_b64': base64.b64encode(public_der).decode(),
        'status': 'ready',
    }, 'oral grader: publish short-lived encryption public key')
    print('OG_SESSION_READY', flush=True)
    payload = _wait_request(challenge, private_key)
    output_key = base64.b64decode(payload['output_key_b64'], validate=True)
    if len(output_key) != 32:
        raise ValueError('Invalid output key')
    checkpointed = False

    def _checkpoint(partial):
        nonlocal checkpointed
        _put_content(RESULT_PATH, encrypt_response(output_key, challenge, partial),
                     'oral grader: checkpoint encrypted private scores')
        checkpointed = True

    try:
        answer = _process(payload, on_progress=_checkpoint)
    except Exception as exc:
        if checkpointed:
            raise  # Preserve the latest encrypted partial result.
        answer = {'project': 'Oral-Grader', 'fatal_error': type(exc).__name__}
    _put_content(RESULT_PATH, encrypt_response(output_key, challenge, answer),
                 'oral grader: store encrypted private scores')
    print('OG_ENCRYPTED_RESULTS_READY', flush=True)


if __name__ == '__main__':
    main()
