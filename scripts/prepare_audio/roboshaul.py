# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "hebrew==0.8.1",
#     "inflect==7.5.0",
#     "librosa==0.11.0",
#     "matplotlib==3.10.8",
#     "nakdimon-onnx==0.1.0",
#     "numpy==2.2.6",
#     "scipy==1.15.3",
#     "torch==2.10.0",
#     "tqdm==4.67.3",
#     "unidecode==1.4.0",
#     "pydub",
# ]
# ///
"""Generate TTS audio for each sentence in sentences.json using Robo-Shaul.

Setup:
  cd scripts/prepare_audio
  git clone https://github.com/maxmelichov/Text-To-speech.git
  cd Text-To-speech
  git clone https://github.com/maxmelichov/tacotron2.git
  git clone https://github.com/maxmelichov/waveglow.git
  cp waveglow/glow.py ./
  mkdir -p checkpoints waveglow_weights
  wget -O checkpoints/roboshaul_90K.pt "https://huggingface.co/notmax123/robo_shaul/resolve/main/roboshaul_90K.pt?download=true"
  wget -O waveglow_weights/waveglow_256channels_universal_v5.pt "https://huggingface.co/notmax123/robo_shaul/resolve/main/waveglow_256channels_universal_v5.pt?download=true"
  cd ..
  wget https://github.com/thewh1teagle/nakdimon-onnx/releases/download/v0.1.0/nakdimon.onnx
  cd ../..
  uv run scripts/prepare_audio/roboshaul.py
"""

import json
import sys
import types
from pathlib import Path

# Mock tensorflow — tacotron2/hparams.py imports it but never uses it
sys.modules["tensorflow"] = types.ModuleType("tensorflow")

# Hacky imports from the Text-To-Speech repo
TTS_DIR = Path(__file__).parent / "Text-To-speech"
sys.path.insert(0, str(TTS_DIR))
sys.path.insert(0, str(TTS_DIR / "tacotron2"))

import numpy as np
import torch
from nakdimon_onnx import Nakdimon
from scipy.io.wavfile import write
from pydub import AudioSegment
from pydub.effects import normalize
from tqdm import tqdm

import HebrewToEnglish
from tacotron2.hparams import create_hparams
from tacotron2.model import Tacotron2
from tacotron2.text import text_to_sequence
from waveglow.denoiser import Denoiser

SENTENCES_PATH = Path(__file__).parent.parent / "sentences.json"
OUTPUT_DIR = Path(__file__).parent.parent.parent / "web" / "public" / "audio" / "roboshaul"
TACOTRON2_MODEL = TTS_DIR / "checkpoints" / "roboshaul_90K.pt"
WAVEGLOW_MODEL = TTS_DIR / "waveglow_weights" / "waveglow_256channels_universal_v5.pt"
NAKDIMON_MODEL = Path(__file__).parent / "nakdimon.onnx"


def load_models(device: str = "cpu"):
    hparams = create_hparams()
    hparams.sampling_rate = 22050
    hparams.max_decoder_steps = 1000
    hparams.gate_threshold = 0.1

    print("Loading Tacotron2 model...")
    model = Tacotron2(hparams)
    checkpoint = torch.load(str(TACOTRON2_MODEL), map_location=device, weights_only=False)
    model.load_state_dict(checkpoint["state_dict"])
    model = model.to(device).eval()

    print("Loading WaveGlow model...")
    waveglow_checkpoint = torch.load(str(WAVEGLOW_MODEL), map_location=device, weights_only=False)
    waveglow = waveglow_checkpoint["model"].to(device).eval()
    for k in waveglow.convinv:
        k.float()
    denoiser = Denoiser(waveglow)

    print("Loading Nakdimon model...")
    nakdimon = Nakdimon(str(NAKDIMON_MODEL))

    print("Models loaded.")
    return model, waveglow, denoiser, hparams, nakdimon


def synthesize(text: str, model, waveglow, hparams, device: str = "cpu", sigma: float = 0.8):
    processed = HebrewToEnglish.HebrewToEnglish(text)
    with torch.no_grad():
        sequence = np.array(text_to_sequence(processed, ["english_cleaners"]))[None, :]
        sequence = torch.from_numpy(sequence).long().to(device)
        mel_outputs, mel_outputs_postnet, _, alignments = model.inference(sequence)
        audio = waveglow.infer(mel_outputs_postnet, sigma=sigma)
    return audio[0].data.cpu().numpy()


def main():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    sentences = json.loads(SENTENCES_PATH.read_text(encoding="utf-8"))
    print(f"Loaded {len(sentences)} sentences from {SENTENCES_PATH}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    model, waveglow, denoiser, hparams, nakdimon = load_models(device)

    for i, sentence in tqdm(list(enumerate(sentences)), desc="Generating"):
        vocalized = nakdimon.compute(sentence)
        tqdm.write(f"[{i}] {sentence[:50]}...")
        tqdm.write(f"     -> {vocalized[:50]}...")
        audio = synthesize(vocalized, model, waveglow, hparams, device)
        tmp_path = OUTPUT_DIR / f"{i}.tmp.wav"
        write(str(tmp_path), hparams.sampling_rate, audio)
        seg = normalize(AudioSegment.from_wav(str(tmp_path)))
        out_path = OUTPUT_DIR / f"{i}.m4a"
        seg.export(str(out_path), format="ipod", bitrate="128k")
        tmp_path.unlink()

    print(f"Done. Generated {len(sentences)} files in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
