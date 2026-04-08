from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Tuple

import ctranslate2
import sentencepiece as spm


@dataclass
class PairConfig:
    name: str
    model_dir: Path
    sample: str


def fail(message: str) -> None:
    print(f"[FAIL] {message}")
    sys.exit(1)


def check_file_exists(path: Path) -> None:
    if not path.exists():
        fail(f"缺少文件: {path}")


def find_spm(model_dir: Path) -> Path:
    for candidate in (model_dir / "source.spm", model_dir / "spm.model"):
        if candidate.exists():
            return candidate
    fail(f"未找到 sentencepiece 模型文件（source.spm/spm.model）: {model_dir}")
    raise RuntimeError("unreachable")


def run_pair(pair: PairConfig) -> Tuple[str, int]:
    print(f"\n[CHECK] {pair.name}")
    if not pair.model_dir.exists():
        fail(f"模型目录不存在: {pair.model_dir}")

    check_file_exists(pair.model_dir / "config.json")
    check_file_exists(pair.model_dir / "shared_vocabulary.json")
    spm_path = find_spm(pair.model_dir)

    tokenizer = spm.SentencePieceProcessor(model_file=str(spm_path))
    translator = ctranslate2.Translator(str(pair.model_dir), device="cpu", compute_type="int8")

    source_tokens = tokenizer.encode(pair.sample, out_type=str)
    result = translator.translate_batch([source_tokens], beam_size=1, max_decoding_length=256)
    if not result or not result[0].hypotheses:
        fail(f"{pair.name} 未返回候选结果")

    out_tokens = result[0].hypotheses[0]
    text = tokenizer.decode(out_tokens).strip()
    if not text:
        fail(f"{pair.name} 输出为空")

    score = len(out_tokens)
    print(f"[OK] 输入: {pair.sample}")
    print(f"[OK] 输出: {text}")
    print(f"[OK] 输出 token 数: {score}")
    return text, score


def main() -> None:
    repo_root = Path(__file__).resolve().parents[3]
    builtin_root = Path(
        os.getenv("LINGUA_MODEL_ROOT", str(repo_root / "local-model" / "models" / "builtin"))
    )
    tr_root = builtin_root / "translation"

    zh_en = PairConfig("zh->en", tr_root / "zh-en", "今天先整理需求，明天开始开发。")
    en_zh = PairConfig("en->zh", tr_root / "en-zh", "We should finish the MVP first.")

    zh_out, _ = run_pair(zh_en)
    en_out, _ = run_pair(en_zh)

    if zh_out == zh_en.sample:
        fail("zh->en 输出与输入完全相同，疑似未生效")
    if en_out == en_zh.sample:
        fail("en->zh 输出与输入完全相同，疑似未生效")

    print("\n[SUCCESS] 翻译模型加载与推理自检通过")


if __name__ == "__main__":
    main()

