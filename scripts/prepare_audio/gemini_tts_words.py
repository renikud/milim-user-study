# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "google-genai",
#     "python-dotenv",
#     "tqdm",
# ]
# ///
"""Generate single-word ReNikud target audio with Gemini TTS.

Reads the ReNikud item TSV and synthesizes each informal/formal target IPA token
as a standalone Hebrew utterance with a period appended.
"""

from __future__ import annotations

import argparse
import csv
import mimetypes
import os
import re
import struct
import time
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types
from tqdm import tqdm


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ITEMS = REPO_ROOT / "web" / "public" / "renikud_items.tsv"
DEFAULT_OUT_DIR = REPO_ROOT / "web" / "public" / "audio_words_gemini"
DEFAULT_ENV = REPO_ROOT / ".env"
DEFAULT_MODEL = "gemini-3.1-flash-tts-preview"
DEFAULT_VOICE = "Zephyr"


def save_binary_file(file_name: Path, data: bytes) -> None:
    file_name.parent.mkdir(parents=True, exist_ok=True)
    file_name.write_bytes(data)


def parse_audio_mime_type(mime_type: str) -> dict[str, int | None]:
    bits_per_sample = 16
    rate = 24000

    parts = mime_type.split(";")
    for param in parts:
        param = param.strip()
        if param.lower().startswith("rate="):
            try:
                rate = int(param.split("=", 1)[1])
            except (ValueError, IndexError):
                pass
        elif param.startswith("audio/L"):
            try:
                bits_per_sample = int(param.split("L", 1)[1])
            except (ValueError, IndexError):
                pass

    return {"bits_per_sample": bits_per_sample, "rate": rate}


def convert_to_wav(audio_data: bytes, mime_type: str) -> bytes:
    parameters = parse_audio_mime_type(mime_type)
    bits_per_sample = parameters["bits_per_sample"] or 16
    sample_rate = parameters["rate"] or 24000
    num_channels = 1
    data_size = len(audio_data)
    bytes_per_sample = bits_per_sample // 8
    block_align = num_channels * bytes_per_sample
    byte_rate = sample_rate * block_align
    chunk_size = 36 + data_size

    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        chunk_size,
        b"WAVE",
        b"fmt ",
        16,
        1,
        num_channels,
        sample_rate,
        byte_rate,
        block_align,
        bits_per_sample,
        b"data",
        data_size,
    )
    return header + audio_data


def load_items(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def generate_one(
    client: genai.Client,
    model: str,
    voice_name: str,
    ipa: str,
    out_path: Path,
) -> None:
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(
                    text=f"""## Scene:
Say it in Hebrew

## Transcript:
{ipa}."""
                ),
            ],
        ),
    ]
    config = types.GenerateContentConfig(
        temperature=1,
        response_modalities=["audio"],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice_name)
            )
        ),
    )

    for attempt in range(1, 8):
        try:
            file_index = 0
            for chunk in client.models.generate_content_stream(
                model=model,
                contents=contents,
                config=config,
            ):
                if chunk.parts is None:
                    continue
                part = chunk.parts[0]
                if part.inline_data and part.inline_data.data:
                    inline_data = part.inline_data
                    data_buffer = inline_data.data
                    file_extension = mimetypes.guess_extension(inline_data.mime_type)
                    target = out_path
                    if file_extension is None:
                        data_buffer = convert_to_wav(data_buffer, inline_data.mime_type)
                    elif out_path.suffix != file_extension and file_index > 0:
                        target = out_path.with_name(f"{out_path.stem}_{file_index}{file_extension}")
                    save_binary_file(target, data_buffer)
                    file_index += 1
                elif chunk.text:
                    print(chunk.text)
            return
        except Exception as exc:
            status_code = getattr(exc, "status_code", None)
            message = str(exc)
            if status_code != 429 and "RESOURCE_EXHAUSTED" not in message:
                raise
            match = re.search(r"retryDelay': '([0-9]+)s'", message)
            delay = int(match.group(1)) + 5 if match else min(90, 15 * attempt)
            tqdm.write(f"Quota hit; sleeping {delay}s before retry {attempt}/7")
            time.sleep(delay)

    raise RuntimeError(f"Failed after retries: {ipa}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--items", default=str(DEFAULT_ITEMS))
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR))
    parser.add_argument("--env-file", default=str(DEFAULT_ENV))
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--voice", default=DEFAULT_VOICE)
    parser.add_argument("--force", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    load_dotenv(args.env_file)
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise SystemExit(
            f"Missing GEMINI_API_KEY. Copy .env.example to {DEFAULT_ENV} and fill it."
        )

    client = genai.Client(api_key=api_key)
    rows = load_items(Path(args.items))
    jobs: list[tuple[str, str, Path]] = []
    out_dir = Path(args.out_dir)
    for row in rows:
        for condition, ipa_column in (("informal", "informal_ipa"), ("formal", "formal_ipa")):
            out_path = out_dir / condition / f"{row['id']}.wav"
            if out_path.exists() and not args.force:
                continue
            jobs.append((condition, row[ipa_column], out_path))

    for condition, ipa, out_path in tqdm(jobs, desc="Gemini TTS words"):
        tqdm.write(f"{condition}: {ipa} -> {out_path.relative_to(REPO_ROOT)}")
        generate_one(client, args.model, args.voice, ipa, out_path)

    print(f"Done. Generated or verified {len(jobs)} files under {out_dir}")


if __name__ == "__main__":
    main()
