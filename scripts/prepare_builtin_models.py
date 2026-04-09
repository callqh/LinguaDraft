#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]
BUILTIN_ROOT = ROOT / "local-model" / "models" / "builtin"

MODEL_SPECS = [
    {
        "repo": "Systran/faster-whisper-base",
        "target_dir": BUILTIN_ROOT / "asr" / "faster-whisper-base",
        "files": [
            "config.json",
            "model.bin",
            "tokenizer.json",
            "vocabulary.txt",
        ],
    },
    {
        "repo": "gaudi/opus-mt-zh-en-ctranslate2",
        "target_dir": BUILTIN_ROOT / "translation" / "zh-en",
        "files": [
            "config.json",
            "generation_config.json",
            "model.bin",
            "shared_vocabulary.json",
            "source.spm",
            "target.spm",
            "tokenizer_config.json",
            "vocab.json",
        ],
    },
    {
        "repo": "gaudi/opus-mt-en-zh-ctranslate2",
        "target_dir": BUILTIN_ROOT / "translation" / "en-zh",
        "files": [
            "config.json",
            "generation_config.json",
            "model.bin",
            "shared_vocabulary.json",
            "source.spm",
            "target.spm",
            "tokenizer_config.json",
            "vocab.json",
        ],
    },
]


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def download_file(url: str, target: Path, retries: int = 3) -> None:
    ensure_dir(target.parent)
    tmp = target.with_suffix(target.suffix + ".part")
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "LinguaDraft-Packager/1.0"})
            with urllib.request.urlopen(req, timeout=90) as resp, tmp.open("wb") as fw:
                while True:
                    chunk = resp.read(1024 * 1024)
                    if not chunk:
                        break
                    fw.write(chunk)
            tmp.replace(target)
            return
        except (urllib.error.URLError, TimeoutError) as err:
            if tmp.exists():
                tmp.unlink(missing_ok=True)
            if attempt >= retries:
                raise RuntimeError(f"下载失败: {url} -> {target} ({err})") from err
            sleep_s = attempt * 2
            print(f"  重试 {attempt}/{retries}: {target.name}，{sleep_s}s 后继续")
            time.sleep(sleep_s)


def verify_files(base_dir: Path, files: Iterable[str]) -> list[str]:
    missing: list[str] = []
    for name in files:
        path = base_dir / name
        if not path.exists() or path.stat().st_size == 0:
            missing.append(name)
    return missing


def main() -> int:
    print(f"[prepare-models] 内置模型目录: {BUILTIN_ROOT}")
    ensure_dir(BUILTIN_ROOT)

    for spec in MODEL_SPECS:
        repo = spec["repo"]
        target_dir: Path = spec["target_dir"]
        files: list[str] = spec["files"]

        print(f"\\n[prepare-models] 检查 {repo}")
        ensure_dir(target_dir)
        missing = verify_files(target_dir, files)
        if not missing:
            print(f"  已就绪: {target_dir}")
            continue

        print(f"  缺失文件 {len(missing)} 个，开始下载...")
        for name in missing:
            url = f"https://huggingface.co/{repo}/resolve/main/{name}"
            dst = target_dir / name
            print(f"    -> {name}")
            download_file(url, dst)

        missing_after = verify_files(target_dir, files)
        if missing_after:
            print(f"[prepare-models] 失败，仍缺失: {repo} -> {missing_after}")
            return 1

        manifest = {
            "repo": repo,
            "downloaded_at": int(time.time()),
            "files": files,
        }
        (target_dir / "_manifest.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"  下载完成: {target_dir}")

    print("\\n[prepare-models] 所有内置模型已准备完成")
    return 0


if __name__ == "__main__":
    sys.exit(main())
