#!/usr/bin/env python3
"""Oral Grader Stage 1: literal transcription with Gemini.

This module preserves Gemini's heard tokens and speaker labels as evidence.
It does not perform grammar correction, intended-word inference, or scoring.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any, Iterable

MODEL = "gemini-3.5-transcribe"
PROJECT = "Oral-Grader"


def build_generation_config() -> dict[str, Any]:
    return {
        "transcription_config": {
            "mode": {
                "type": "verbatim",
                "diarization_mode": "speaker",
                "timestamp_granularities": ["word"],
            }
        }
    }


def extract_word_annotations(interaction: Any) -> list[dict[str, str | None]]:
    words: list[dict[str, str | None]] = []
    for step in getattr(interaction, "steps", []) or []:
        for content in getattr(step, "content", []) or []:
            for annotation in getattr(content, "annotations", []) or []:
                if getattr(annotation, "type", None) != "word_info":
                    continue
                words.append(
                    {
                        "text": getattr(annotation, "text", ""),
                        "speaker": getattr(annotation, "speaker", None),
                        "start_offset": getattr(annotation, "start_offset", None),
                        "end_offset": getattr(annotation, "end_offset", None),
                    }
                )
    return words


def _join_tokens(tokens: Iterable[str]) -> str:
    return " ".join(token for token in tokens if token).strip()


def group_speaker_turns(
    words: list[dict[str, str | None]],
) -> list[dict[str, str | None]]:
    turns: list[dict[str, str | None]] = []
    current: dict[str, Any] | None = None

    for word in words:
        speaker = word.get("speaker") or "unknown"
        if current is None or current["speaker"] != speaker:
            if current is not None:
                current["heard"] = _join_tokens(current.pop("tokens"))
                turns.append(current)
            current = {
                "speaker": speaker,
                "start_offset": word.get("start_offset"),
                "end_offset": word.get("end_offset"),
                "tokens": [word.get("text") or ""],
            }
        else:
            current["end_offset"] = word.get("end_offset") or current["end_offset"]
            current["tokens"].append(word.get("text") or "")

    if current is not None:
        current["heard"] = _join_tokens(current.pop("tokens"))
        turns.append(current)

    return turns


def render_markdown(result: dict[str, Any]) -> str:
    lines = [
        f"# Oral Grader literal transcript — {result['pair_slug']}",
        "",
        f"Model: `{result['model']}`",
        "Mode: `verbatim` · speaker diarization · word timestamps",
        "",
        "> Stage 1 evidence only. Do not correct grammar, vocabulary, or pronunciation here.",
        "",
    ]
    for turn in result["turns"]:
        start = turn.get("start_offset") or "?"
        end = turn.get("end_offset") or "?"
        speaker = turn.get("speaker") or "unknown"
        lines.append(
            f"- **{speaker}** `{start}–{end}`: {turn.get('heard', '')}"
        )
    lines.append("")
    return "\n".join(lines)


def transcribe(
    audio_path: Path,
    pair_slug: str,
    output_json: Path,
    output_md: Path,
) -> None:
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY or GOOGLE_API_KEY is required")

    from google import genai  # type: ignore

    client = genai.Client(api_key=api_key)
    audio_file = client.files.upload(file=str(audio_path))
    interaction = client.interactions.create(
        model=MODEL,
        input=[
            {
                "type": "audio",
                "uri": audio_file.uri,
                "mime_type": audio_file.mime_type,
            }
        ],
        generation_config=build_generation_config(),
    )

    words = extract_word_annotations(interaction)
    turns = group_speaker_turns(words)
    result = {
        "project": PROJECT,
        "stage": 1,
        "pair_slug": pair_slug,
        "model": MODEL,
        "mode": "verbatim",
        "speaker_diarization": True,
        "word_timestamps": True,
        "source_file": audio_path.name,
        "full_text": getattr(interaction, "output_text", "") or "",
        "turns": turns,
        "words": words,
    }

    output_json.parent.mkdir(parents=True, exist_ok=True)
    output_md.parent.mkdir(parents=True, exist_ok=True)
    output_json.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    output_md.write_text(render_markdown(result), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("audio", type=Path)
    parser.add_argument("--pair-slug", required=True)
    parser.add_argument("--output-json", type=Path, required=True)
    parser.add_argument("--output-md", type=Path, required=True)
    args = parser.parse_args()

    if not args.pair_slug.replace("-", "").isalnum():
        raise SystemExit("pair_slug must contain only letters, numbers, and hyphens")

    transcribe(
        args.audio,
        args.pair_slug,
        args.output_json,
        args.output_md,
    )


if __name__ == "__main__":
    main()
