# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "blue-onnx",
#     "huggingface-hub",
#     "numpy",
#     "renikud-onnx",
#     "soundfile",
# ]
# ///
"""Generate ReNikud study audio with BlueTTS.

The script reads web/public/renikud_items.tsv and writes one WAV per variant:

    web/public/audio/informal/<id>.wav
    web/public/audio/formal/<id>.wav

It expects the BlueTTS ONNX bundle in ./onnx_models, a voice JSON at
./voices/female1.json, and the Hebrew G2P model at ./model.onnx. Missing model
files are downloaded automatically by default.
"""

from __future__ import annotations

import argparse
import csv
import os
import subprocess
import sys
import urllib.request
from pathlib import Path
from typing import Any

import numpy as np
import soundfile as sf


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ITEMS = REPO_ROOT / "web" / "public" / "renikud_items.tsv"
DEFAULT_AUDIO_DIR = REPO_ROOT / "web" / "public" / "audio"
DEFAULT_WORD_AUDIO_DIR = REPO_ROOT / "web" / "public" / "audio_words"
DEFAULT_ONNX_DIR = REPO_ROOT / "onnx_models"
DEFAULT_VOICE = REPO_ROOT / "voices" / "female1.json"
DEFAULT_RENIKUD = REPO_ROOT / "model.onnx"
RENIKUD_URL = "https://huggingface.co/thewh1teagle/renikud/resolve/main/model.onnx"
VOICE_URL = "https://raw.githubusercontent.com/maxmelichov/BlueTTS/main/voices/female1.json"


def ensure_inputs(onnx_dir: Path, voice_json: Path, renikud_path: Path, skip_download: bool) -> None:
    if skip_download:
        missing = [p for p in [onnx_dir, voice_json, renikud_path] if not p.exists()]
        if missing:
            raise FileNotFoundError("Missing required files: " + ", ".join(str(p) for p in missing))
        return

    if not onnx_dir.exists() or not any(onnx_dir.iterdir()):
        subprocess.run(
            [
                "uv",
                "run",
                "hf",
                "download",
                "notmax123/blue-onnx-v2",
                "--repo-type",
                "model",
                "--local-dir",
                str(onnx_dir),
            ],
            cwd=REPO_ROOT,
            check=True,
        )

    if not renikud_path.exists():
        urllib.request.urlretrieve(RENIKUD_URL, renikud_path)

    if not voice_json.exists():
        voice_json.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(VOICE_URL, voice_json)


def load_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def phonemes_for_variant(g2p: Any, text: str, target_index: int, ipa: str) -> str:
    source_words = text.split()
    phoneme_words = g2p.phonemize(text).split()
    if len(source_words) != len(phoneme_words):
        raise ValueError(
            f"G2P word count mismatch for {text!r}: "
            f"{len(source_words)} text words vs {len(phoneme_words)} phoneme words"
        )
    if target_index < 0 or target_index >= len(phoneme_words):
        raise ValueError(f"target_index {target_index} is out of range for: {text}")
    phoneme_words[target_index] = ipa
    return " ".join(phoneme_words)


def build_tts(onnx_dir: Path, voice_json: Path, renikud_path: Path) -> tuple[Any, Any, Any]:
    try:
        from blue_onnx import (
            TextToSpeech,
            UnicodeProcessor,
            load_cfgs,
            load_onnx_all,
            load_voice_style,
        )
        from renikud_onnx import G2P
        import onnxruntime as ort
    except ImportError:
        sys.path.append(str(REPO_ROOT))
        from src.blue_onnx import (  # type: ignore
            TextToSpeech,
            UnicodeProcessor,
            load_cfgs,
            load_onnx_all,
            load_voice_style,
        )
        from renikud_onnx import G2P
        import onnxruntime as ort

    opts = ort.SessionOptions()
    opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
    opts.intra_op_num_threads = int(os.environ.get("ORT_NUM_THREADS", min(8, os.cpu_count() or 1)))
    opts.inter_op_num_threads = 1
    cfgs = load_cfgs(str(onnx_dir))
    dp_ort, text_enc_ort, vector_est_ort, vocoder_ort = load_onnx_all(
        str(onnx_dir),
        opts,
        ["CPUExecutionProvider"],
    )
    text_processor = UnicodeProcessor(str(onnx_dir / "vocab.json"))
    tts = TextToSpeech(
        cfgs,
        text_processor,
        dp_ort,
        text_enc_ort,
        vector_est_ort,
        vocoder_ort,
        g2p=None,
    )
    style = load_voice_style([str(voice_json)])
    g2p = G2P(str(renikud_path))
    return tts, style, g2p


def synthesize(tts: Any, style: Any, text: str) -> tuple[np.ndarray, int]:
    audio, _durations = tts(
        text,
        lang="he",
        style=style,
        total_step=5,
        cfg_scale=4.0,
        text_is_phonemes=True,
    )

    audio = np.asarray(audio)
    if audio.ndim == 2:
        audio = audio[0]
    return audio, int(tts.sample_rate)


def generate(args: argparse.Namespace) -> None:
    items_path = Path(args.items).resolve()
    audio_dir = Path(args.word_audio_dir if args.words_only else args.audio_dir).resolve()
    onnx_dir = Path(args.onnx_dir).resolve()
    voice_json = Path(args.voice_json).resolve()
    renikud_path = Path(args.renikud_path).resolve()

    ensure_inputs(onnx_dir, voice_json, renikud_path, args.skip_download)
    tts, style, g2p = build_tts(onnx_dir, voice_json, renikud_path)

    rows = load_rows(items_path)
    for row in rows:
        item_id = row["id"]
        target_index = int(row["target_index"])
        variants = {
            "informal": row["informal_ipa"],
            "formal": row["formal_ipa"],
        }

        for variant, ipa in variants.items():
            out_dir = audio_dir / variant
            out_dir.mkdir(parents=True, exist_ok=True)
            out_path = out_dir / f"{item_id}.wav"
            if out_path.exists() and not args.force:
                continue

            phoneme_text = f"{ipa}." if args.words_only else phonemes_for_variant(g2p, row["text"], target_index, ipa)
            audio, sample_rate = synthesize(tts, style, phoneme_text)
            sf.write(out_path, audio, sample_rate)
            print(f"Saved {out_path.resolve().relative_to(REPO_ROOT)}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--items", default=str(DEFAULT_ITEMS))
    parser.add_argument("--audio-dir", default=str(DEFAULT_AUDIO_DIR))
    parser.add_argument("--word-audio-dir", default=str(DEFAULT_WORD_AUDIO_DIR))
    parser.add_argument("--onnx-dir", default=os.environ.get("ONNX_DIR", str(DEFAULT_ONNX_DIR)))
    parser.add_argument("--voice-json", default=os.environ.get("VOICE_JSON", str(DEFAULT_VOICE)))
    parser.add_argument("--renikud-path", default=os.environ.get("RENIKUD_PATH", str(DEFAULT_RENIKUD)))
    parser.add_argument("--skip-download", action="store_true")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--words-only", action="store_true", help="Synthesize only the target IPA token plus a period.")
    return parser.parse_args()


if __name__ == "__main__":
    try:
        generate(parse_args())
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise
