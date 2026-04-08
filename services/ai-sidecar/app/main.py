from __future__ import annotations

import argparse
import logging
import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

try:
    from faster_whisper import WhisperModel  # type: ignore
except Exception:
    WhisperModel = None

try:
    import ctranslate2  # type: ignore
    import sentencepiece as spm  # type: ignore
except Exception:
    ctranslate2 = None
    spm = None


APP = FastAPI(title="LinguaDraft AI Sidecar")
logger = logging.getLogger("linguadraft.sidecar")
DEBUG_TRANSLATION = os.getenv("LINGUA_DEBUG_TRANSLATION", "0") == "1"

REPO_ROOT = Path(__file__).resolve().parents[3]
BUILTIN_ROOT = Path(
    os.getenv("LINGUA_MODEL_ROOT", str(REPO_ROOT / "local-model" / "models" / "builtin"))
)

ASR_PATH = BUILTIN_ROOT / "asr" / "faster-whisper-base"
TR_ZH_EN = BUILTIN_ROOT / "translation" / "zh-en"
TR_EN_ZH = BUILTIN_ROOT / "translation" / "en-zh"
DEMO_AUDIO = BUILTIN_ROOT / "asr" / "demo.wav"

_asr_model = None
_translators = {}
_tokenizers = {}


def to_label(lang_code: str) -> str:
    lang_code = lang_code.lower()
    if lang_code.startswith("zh"):
        return "中文"
    if lang_code.startswith("en"):
        return "英文"
    if lang_code.startswith("ja"):
        return "日文"
    if lang_code.startswith("ko"):
        return "韩文"
    return "unknown"


def _load_asr():
    global _asr_model
    if _asr_model is not None:
        return _asr_model
    if WhisperModel is None or not ASR_PATH.exists():
        return None
    _asr_model = WhisperModel(str(ASR_PATH), device="cpu", compute_type="int8")
    return _asr_model


def _load_translator(source_lang: str, target_lang: str):
    key = f"{source_lang}->{target_lang}"
    if key in _translators:
        return _translators[key], _tokenizers[key]

    if ctranslate2 is None or spm is None:
        return None, None

    if key == "中文->英文":
        model_dir = TR_ZH_EN
    elif key == "英文->中文":
        model_dir = TR_EN_ZH
    else:
        return None, None

    if not model_dir.exists():
        return None, None

    source_spm_candidates = [model_dir / "source.spm", model_dir / "spm.model"]
    source_spm = next((p for p in source_spm_candidates if p.exists()), None)
    if source_spm is None:
        return None, None

    target_spm_candidates = [model_dir / "target.spm", model_dir / "spm.model"]
    target_spm = next((p for p in target_spm_candidates if p.exists()), None)
    if target_spm is None:
        return None, None

    source_tokenizer = spm.SentencePieceProcessor(model_file=str(source_spm))
    target_tokenizer = spm.SentencePieceProcessor(model_file=str(target_spm))
    translator = ctranslate2.Translator(str(model_dir), device="cpu", compute_type="int8")
    _translators[key] = translator
    _tokenizers[key] = (source_tokenizer, target_tokenizer)
    return translator, _tokenizers[key]


class TranslateReq(BaseModel):
    text: str
    source_lang: str
    target_lang: str


class TranslateResp(BaseModel):
    text: str


class AsrReq(BaseModel):
    audio_path: Optional[str] = None


class AsrResp(BaseModel):
    text: str
    language: str
    confidence: float


@APP.get("/health")
def health():
    return {
        "ok": True,
        "engines": {
            "faster_whisper": WhisperModel is not None,
            "ctranslate2": ctranslate2 is not None,
        },
    }


@APP.post("/translation/run", response_model=TranslateResp)
def run_translation(req: TranslateReq):
    translator, tokenizers = _load_translator(req.source_lang, req.target_lang)
    if translator is None or tokenizers is None:
        raise HTTPException(status_code=503, detail="translation-model-not-ready")
    source_tokenizer, target_tokenizer = tokenizers

    pieces = source_tokenizer.encode(req.text, out_type=str)
    max_len = min(48, max(12, len(pieces) * 2 + 4))
    result = translator.translate_batch(
        [pieces],
        beam_size=4,
        max_decoding_length=max_len,
        repetition_penalty=1.2,
        no_repeat_ngram_size=3,
    )
    out_pieces = result[0].hypotheses[0] if result and result[0].hypotheses else []
    decoded = target_tokenizer.decode(out_pieces).strip()
    text = " ".join(decoded.replace("▁", " ").split())

    if DEBUG_TRANSLATION:
        logger.info(
            "[translation-debug] %s->%s input=%r source_pieces=%s out_pieces=%s decoded=%r cleaned=%r",
            req.source_lang,
            req.target_lang,
            req.text,
            pieces,
            out_pieces,
            decoded,
            text,
        )

    if not text:
        raise HTTPException(status_code=500, detail="translation-empty")
    if len(text) > 240:
        text = text[:240].strip()
    return TranslateResp(text=text)


@APP.post("/asr/transcribe", response_model=AsrResp)
def run_asr(req: AsrReq):
    model = _load_asr()
    if model is None:
        raise HTTPException(status_code=503, detail="asr-model-not-ready")

    audio_path = Path(req.audio_path) if req.audio_path else (DEMO_AUDIO if DEMO_AUDIO.exists() else None)
    if audio_path is None or not audio_path.exists():
        raise HTTPException(status_code=400, detail="audio-not-provided")

    segments, info = model.transcribe(str(audio_path), beam_size=1)
    text = "".join(seg.text for seg in segments).strip()
    return AsrResp(
        text=text or "",
        language=to_label(getattr(info, "language", "unknown")),
        confidence=float(getattr(info, "language_probability", 0.0)),
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    import uvicorn

    uvicorn.run(APP, host="127.0.0.1", port=args.port, log_level="info")


if __name__ == "__main__":
    main()
