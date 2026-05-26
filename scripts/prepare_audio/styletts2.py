# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "style-onnx",
#     "phonikud-onnx",
#     "phonikud-tts",
#     "soundfile",
#     "tqdm",
#     "pydub",
# ]
#
# [tool.uv.sources]
# phonikud-tts = { git = "https://github.com/thewh1teagle/phonikud-tts" }
# ///
"""Generate TTS audio for each sentence in sentences.json using StyleTTS2.

Setup:
  cd scripts/prepare_audio
  wget https://github.com/thewh1teagle/style-onnx/releases/download/model-files-v1.0/636_female_style.npy
  wget https://github.com/thewh1teagle/style-onnx/releases/download/model-files-v1.0/libritts_hebrew.onnx
  wget https://huggingface.co/thewh1teagle/phonikud-onnx/resolve/main/phonikud-1.0.int8.onnx
  cd ../..
  uv run scripts/prepare_audio/styletts2.py
"""

import json
from pathlib import Path

import soundfile as sf
from phonikud import phonemize
from pydub import AudioSegment
from pydub.effects import normalize
from phonikud_onnx import Phonikud
from style_onnx import StyleTTS2
from tqdm import tqdm

SCRIPT_DIR = Path(__file__).parent
SENTENCES_PATH = SCRIPT_DIR.parent / "sentences.json"
OUTPUT_DIR = SCRIPT_DIR.parent.parent / "web" / "public" / "audio" / "styletts2"

MODEL_PATH = SCRIPT_DIR / "libritts_hebrew.onnx"
STYLES_PATH = SCRIPT_DIR / "636_female_style.npy"
NIKUD_MODEL_PATH = SCRIPT_DIR / "phonikud-1.0.int8.onnx"


def main():
    sentences = json.loads(SENTENCES_PATH.read_text(encoding="utf-8"))
    print(f"Loaded {len(sentences)} sentences")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Loading models...")
    phonikud_model = Phonikud(str(NIKUD_MODEL_PATH))
    tts = StyleTTS2(str(MODEL_PATH), str(STYLES_PATH))
    print("Models loaded.")

    for i, sentence in tqdm(list(enumerate(sentences)), desc="Generating"):
        vocalized = phonikud_model.add_diacritics(sentence)
        phonemes = phonemize(vocalized)
        tqdm.write(f"[{i}] {sentence[:50]}...")
        tqdm.write(f"     -> {vocalized[:50]}...")
        samples, sr = tts.create(phonemes, speed=1.32)
        tmp_path = OUTPUT_DIR / f"{i}.tmp.wav"
        sf.write(str(tmp_path), samples, sr)
        seg = normalize(AudioSegment.from_wav(str(tmp_path)))
        out_path = OUTPUT_DIR / f"{i}.m4a"
        seg.export(str(out_path), format="ipod", bitrate="128k")
        tmp_path.unlink()

    print(f"Done. Generated {len(sentences)} files in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
