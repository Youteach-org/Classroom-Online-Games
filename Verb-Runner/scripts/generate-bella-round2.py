from __future__ import annotations

import json
from pathlib import Path

VOICE="af_bella"
SAMPLE_RATE=24000
LEAD=0.04
TAIL=0.35

WORDS={
    "ask":{"label":"ask","text":"ask","phonemes":"æsk"},
    "bend":{"label":"bend","text":"bend","phonemes":"bɛnd"},
    "build":{"label":"build","text":"build","phonemes":"bɪld"},
    "washed":{"label":"washed","text":"washed","phonemes":"wɔʃt"},
    "wrote":{"label":"wrote","text":"rote","phonemes":"ɹOt"},
}

VARIANTS={
    "a-105-text":{"label":"A · Bella 1.05 · normal text","speed":1.05,"mode":"text"},
    "b-110-text":{"label":"B · Bella 1.10 · normal text","speed":1.10,"mode":"text"},
    "c-100-phoneme":{"label":"C · Bella 1.00 · explicit phonemes","speed":1.00,"mode":"phoneme"},
}

def as_numpy(audio):
    import numpy as np
    if hasattr(audio,"detach"):
        audio=audio.detach().cpu().numpy()
    return np.asarray(audio,dtype=np.float32).reshape(-1)

def main():
    import numpy as np
    import soundfile as sf
    from kokoro import KPipeline

    root=Path(__file__).resolve().parents[1]
    out_dir=root/"bella-samples"/"round2-audio"
    out_dir.mkdir(parents=True,exist_ok=True)
    pipeline=KPipeline(lang_code="a")
    lead=np.zeros(int(SAMPLE_RATE*LEAD),dtype=np.float32)
    tail=np.zeros(int(SAMPLE_RATE*TAIL),dtype=np.float32)

    manifest={"voice":VOICE,"sample_rate":SAMPLE_RATE,"variants":VARIANTS,"items":{}}
    for slug,item in WORDS.items():
        manifest["items"][slug]={"label":item["label"],"files":{}}
        for variant_id,variant in VARIANTS.items():
            pieces=[]
            if variant["mode"]=="phoneme":
                generated=pipeline.generate_from_tokens(
                    tokens=item["phonemes"],
                    voice=VOICE,
                    speed=variant["speed"],
                )
            else:
                generated=pipeline(
                    item["text"]+".",
                    voice=VOICE,
                    speed=variant["speed"],
                )
            for _g,_p,audio in generated:
                segment=as_numpy(audio)
                if segment.size:
                    pieces.append(segment)
            if not pieces:
                raise RuntimeError(f"No audio for {slug}/{variant_id}")
            speech=np.concatenate(pieces)
            peak=float(np.max(np.abs(speech))) if speech.size else 0.0
            if peak>0.98:
                speech=speech*(0.96/peak)
            clip=np.concatenate([lead,speech,tail])
            filename=f"{slug}--{variant_id}.wav"
            sf.write(out_dir/filename,clip,SAMPLE_RATE,subtype="PCM_16")
            manifest["items"][slug]["files"][variant_id]=f"./round2-audio/{filename}"
            print(slug,variant_id,filename)

    (root/"bella-samples"/"round2-manifest.json").write_text(
        json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",
        encoding="utf-8",
    )

if __name__=="__main__":
    main()
