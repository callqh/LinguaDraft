from __future__ import annotations

import argparse
import logging
import os
from collections import Counter
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

try:
    from opencc import OpenCC  # type: ignore
except Exception:
    OpenCC = None


APP = FastAPI(title="LinguaDraft AI Sidecar")
logger = logging.getLogger("linguadraft.sidecar")
DEBUG_TRANSLATION = os.getenv("LINGUA_DEBUG_TRANSLATION", "0") == "1"

REPO_ROOT = Path(__file__).resolve().parents[3]
BUILTIN_ROOT = Path(
    os.getenv("LINGUA_MODEL_ROOT", str(REPO_ROOT / "local-model" / "models" / "builtin"))
)

ASR_PATH = BUILTIN_ROOT / "asr" / "faster-whisper-base"

_asr_model = None
_translators = {}
_tokenizers = {}
_opencc = OpenCC("t2s") if OpenCC is not None else None


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


def to_code(lang_label: str) -> str:
    if "中" in lang_label:
        return "zh"
    if "英" in lang_label:
        return "en"
    if "日" in lang_label:
        return "ja"
    if "韩" in lang_label:
        return "ko"
    if "法" in lang_label:
        return "fr"
    if "德" in lang_label:
        return "de"
    if "俄" in lang_label:
        return "ru"
    if "西班牙" in lang_label:
        return "es"
    if "意大利" in lang_label:
        return "it"
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

    source_code = to_code(source_lang)
    target_code = to_code(target_lang)
    if source_code == "unknown" or target_code == "unknown":
        return None, None
    model_dir = BUILTIN_ROOT / "translation" / f"{source_code}-{target_code}"

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


def _is_low_quality_translation(text: str) -> bool:
    cleaned = " ".join(text.split()).strip().lower()
    if not cleaned:
        return True
    words = [w for w in cleaned.split(" ") if w]
    if len(words) < 6:
        return False

    unique_ratio = len(set(words)) / len(words)
    if unique_ratio < 0.45:
        return True

    counts = Counter(words)
    if counts and max(counts.values()) >= 5:
        return True

    if len(words) >= 8:
        bi_counts = Counter(
            f"{words[i]} {words[i + 1]}" for i in range(0, len(words) - 1)
        )
        if bi_counts and max(bi_counts.values()) >= 4:
            return True

    return False


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
    asr_ready = (
        WhisperModel is not None
        and ASR_PATH.exists()
        and (ASR_PATH / "model.bin").exists()
    )
    tr_zh_en = BUILTIN_ROOT / "translation" / "zh-en"
    tr_en_zh = BUILTIN_ROOT / "translation" / "en-zh"
    tr_zh_en_ready = tr_zh_en.exists() and (tr_zh_en / "model.bin").exists()
    tr_en_zh_ready = tr_en_zh.exists() and (tr_en_zh / "model.bin").exists()
    return {
        "ok": True,
        "model_root": str(BUILTIN_ROOT),
        "engines": {
            "faster_whisper": WhisperModel is not None,
            "ctranslate2": ctranslate2 is not None,
        },
        "models": {
            "asr_ready": asr_ready,
            "tr_zh_en_ready": tr_zh_en_ready,
            "tr_en_zh_ready": tr_en_zh_ready,
        },
    }


@APP.post("/translation/run", response_model=TranslateResp)
def run_translation(req: TranslateReq):
    translator, tokenizers = _load_translator(req.source_lang, req.target_lang)
    if translator is None or tokenizers is None:
        raise HTTPException(status_code=503, detail="translation-model-not-ready")
    source_tokenizer, target_tokenizer = tokenizers

    pieces = source_tokenizer.encode(req.text, out_type=str)
    short_input = len(req.text.strip()) <= 8 or len(pieces) <= 4

    def decode_once(**kwargs):
        result = translator.translate_batch([pieces], **kwargs)
        out_pieces = result[0].hypotheses[0] if result and result[0].hypotheses else []
        decoded = target_tokenizer.decode(out_pieces).strip()
        text = " ".join(decoded.replace("▁", " ").split())
        return text, out_pieces, decoded

    primary_max_len = min(48, max(12, len(pieces) * 2 + 4))
    text, out_pieces, decoded = decode_once(
        beam_size=4,
        max_decoding_length=primary_max_len,
        repetition_penalty=1.2,
        no_repeat_ngram_size=3,
    )

    # Retry with stricter decoding strategy for short/noisy inputs.
    if _is_low_quality_translation(text):
        retry_max_len = min(24, max(8, len(pieces) * 2 + 2))
        retry_text, retry_out, retry_decoded = decode_once(
            beam_size=1,
            max_decoding_length=retry_max_len,
            repetition_penalty=1.35,
            no_repeat_ngram_size=2,
        )
        if retry_text and (
            not _is_low_quality_translation(retry_text) or len(retry_text) < len(text)
        ):
            text, out_pieces, decoded = retry_text, retry_out, retry_decoded

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
    if short_input and _is_low_quality_translation(text):
        raise HTTPException(status_code=422, detail="translation-quality-low")
    if len(text) > 240:
        text = text[:240].strip()
    return TranslateResp(text=text)


@APP.post("/asr/transcribe", response_model=AsrResp)
def run_asr(req: AsrReq):
    model = _load_asr()
    if model is None:
        raise HTTPException(status_code=503, detail="asr-model-not-ready")

    audio_path = Path(req.audio_path) if req.audio_path else None
    if audio_path is None or not audio_path.exists():
        raise HTTPException(status_code=400, detail="audio-not-provided")

    segments, info = model.transcribe(str(audio_path), beam_size=1)
    text = "".join(seg.text for seg in segments).strip()
    if _opencc is not None and text:
        text = _opencc.convert(text)
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
