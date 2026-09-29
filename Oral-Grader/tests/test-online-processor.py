import importlib.util
import json
from pathlib import Path

import pytest

ROOT=Path(__file__).parents[1]
PROCESSOR_PATH=ROOT/"online"/"processor.py"
STAGE2_PATH=ROOT/"stage2"/"analyze-audio.py"


def load(path,name):
    assert path.is_file(), f"Missing production module: {path}"
    spec=importlib.util.spec_from_file_location(name,path)
    mod=importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(mod)
    return mod


def stage1_result(speakers=("spk:0",)):
    return {
        "project":"Oral-Grader",
        "stage":1,
        "pair_slug":"job-123",
        "full_text":"Hello there.",
        "turns":[
            {"speaker":speaker,"start_offset":"0s","end_offset":"1s","heard":f"heard-{i}"}
            for i,speaker in enumerate(speakers)
        ]
    }


def job(students=None):
    return {
        "jobId":"job-123",
        "attemptId":"attempt-123",
        "status":"submitted",
        "students":students or [{"studentId":"student-1","name":"Paul"}],
        "audio":{"mimeType":"audio/webm","storageKey":"oral-grader/jobs/job-123/source"},
        "mode":"assessment"
    }


def test_online_stage1_review_maps_single_student_without_teacher():
    mod=load(PROCESSOR_PATH,"og_online_processor_single")
    review=mod.build_online_stage1_review(stage1_result(),job())
    assert review["accepted_for_stage2"] is True
    assert review["speaker_mapping"]=={"spk:0":"Paul"}
    assert review["context"]["session_kind"]=="peer_conversation"


def test_online_stage1_review_maps_pair_by_controlled_first_speaker_order():
    mod=load(PROCESSOR_PATH,"og_online_processor_pair")
    review=mod.build_online_stage1_review(
        stage1_result(("spk:0","spk:1")),
        job([
            {"studentId":"student-1","name":"Paul"},
            {"studentId":"student-2","name":"Paulina"}
        ])
    )
    assert review["speaker_mapping"]=={"spk:0":"Paul","spk:1":"Paulina"}


def test_online_stage1_review_requires_review_when_diarization_count_is_ambiguous():
    mod=load(PROCESSOR_PATH,"og_online_processor_ambiguous")
    with pytest.raises(mod.ReviewRequired,match="speaker"):
        mod.build_online_stage1_review(
            stage1_result(("spk:0","spk:1","spk:2")),
            job([
                {"studentId":"student-1","name":"Paul"},
                {"studentId":"student-2","name":"Paulina"}
            ])
        )


def test_stage2_accepts_peer_conversation_mapping_without_teacher():
    mod=load(STAGE2_PATH,"og_stage2_peer")
    stage1=stage1_result(("spk:0","spk:1"))
    review={
        "accepted_for_stage2":True,
        "speaker_mapping":{"spk:0":"Paul","spk:1":"Paulina"},
        "context":{"session_kind":"peer_conversation"}
    }
    mapping=mod.validate_stage1_preconditions(stage1,review)
    assert mapping=={"spk:0":"Paul","spk:1":"Paulina"}


class FakeJobStore:
    def __init__(self,row):
        self.row=json.loads(json.dumps(row))
        self.patches=[]

    def get(self,job_id):
        return json.loads(json.dumps(self.row)) if job_id==self.row["jobId"] else None

    def update(self,job_id,patch):
        assert job_id==self.row["jobId"]
        self.patches.append(json.loads(json.dumps(patch)))
        self.row.update(json.loads(json.dumps(patch)))
        return json.loads(json.dumps(self.row))


class FakeAudioStore:
    def __init__(self):
        self.downloads=[]

    def download(self,key,target):
        self.downloads.append((key,str(target)))
        Path(target).write_bytes(b"audio")
        return Path(target)


class FakeService:
    def __init__(self):
        self.completed=[]
        self.review_required=[]

    def complete(self,job_id,result):
        self.completed.append((job_id,result))
        return {"jobId":job_id,"status":result["status"],"result":result}

    def require_review(self,job_id,*,reason,details=None):
        self.review_required.append((job_id,reason,details))
        return {"jobId":job_id,"status":"review_required"}


class FakeRunners:
    def __init__(self,stage1):
        self.stage1=stage1
        self.calls=[]

    def transcribe(self,**kwargs):
        self.calls.append("stage1")
        Path(kwargs["output_json"]).write_text(json.dumps(self.stage1),encoding="utf-8")

    def analyze(self,**kwargs):
        self.calls.append("stage2")
        review=json.loads(Path(kwargs["review_path"]).read_text(encoding="utf-8"))
        names=[name for name in review["speaker_mapping"].values()]
        stage2={
            "project":"Oral-Grader",
            "stage":2,
            "pair_slug":"job-123",
            "speaker_mapping":review["speaker_mapping"],
            "students":{name:{"fluency_observations":[]} for name in names},
            "evidence":[],
            "fluency_observations":[],
            "teacher_interventions":[],
            "scoring_status":"evidence_only_not_final_rubric"
        }
        Path(kwargs["output_json"]).write_text(json.dumps(stage2),encoding="utf-8")
        return stage2

    def score(self,**kwargs):
        self.calls.append("stage3")
        review=json.loads(Path(kwargs["review_path"]).read_text(encoding="utf-8"))
        stage2=json.loads(Path(kwargs["stage2_path"]).read_text(encoding="utf-8"))
        rows=[]
        for name in stage2["students"]:
            rows.append({
                "student":name,
                "rubric_scores":{
                    "fluency":7,
                    "coherence_and_organization":6,
                    "grammar_and_vocabulary":6,
                    "pronunciation_and_intelligibility":7,
                    "communicative_interaction":7
                },
                "total":33,
                "confidence":"high",
                "review_required":False,
                "rationale":{},
                "comments":[]
            })
        result={"project":"Oral-Grader","stage":3,"pair_slug":"job-123","students":rows}
        Path(kwargs["output_json"]).write_text(json.dumps(result),encoding="utf-8")
        return result


def test_processor_runs_stage1_stage2_stage3_and_builds_canonical_online_result(tmp_path):
    mod=load(PROCESSOR_PATH,"og_online_processor_pipeline")
    jobs=FakeJobStore(job())
    audio=FakeAudioStore()
    service=FakeService()
    runners=FakeRunners(stage1_result())

    result=mod.process_online_job(
        "job-123",
        job_store=jobs,
        audio_store=audio,
        service=service,
        runners=runners,
        calibration_path=ROOT/"rubrics"/"units-1-4-scoring-calibration.md",
        work_root=tmp_path
    )

    assert runners.calls==["stage1","stage2","stage3"]
    assert [p["status"] for p in jobs.patches]==["transcribing","analyzing","scoring"]
    assert result["status"]=="completed"
    assert result["transcript"]["heard_text"]=="Hello there."
    assert result["transcript"]["segments"][0]["speaker"]=="Paul"
    assert result["transcript"]["segments"][0]["heard_text"]=="heard-0"
    assert result["students"][0]["studentId"]=="student-1"
    assert result["students"][0]["total"]==33
    assert service.completed[0][0]=="job-123"


def test_processor_marks_ambiguous_speaker_mapping_review_required(tmp_path):
    mod=load(PROCESSOR_PATH,"og_online_processor_review")
    jobs=FakeJobStore(job([
        {"studentId":"student-1","name":"Paul"},
        {"studentId":"student-2","name":"Paulina"}
    ]))
    audio=FakeAudioStore()
    service=FakeService()
    runners=FakeRunners(stage1_result(("spk:0","spk:1","spk:2")))

    out=mod.process_online_job(
        "job-123",
        job_store=jobs,
        audio_store=audio,
        service=service,
        runners=runners,
        calibration_path=ROOT/"rubrics"/"units-1-4-scoring-calibration.md",
        work_root=tmp_path
    )

    assert out["status"]=="review_required"
    assert service.review_required[0][1]=="speaker_mapping_uncertain"
    assert runners.calls==["stage1"]
