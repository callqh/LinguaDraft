# AI Sidecar

本服务用于本地模型推理（ASR / LID / Translation），由 Electron 主进程拉起。

## 本地调试

```bash
cd services/ai-sidecar
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app/main.py --port 8765
```

健康检查：

```bash
curl http://127.0.0.1:8765/health
```

翻译模型自检（直接执行本地模型，不经过 UI）：

```bash
cd /Users/liuqh/lqh/LinguaDraft
services/ai-sidecar/.venv/bin/python services/ai-sidecar/scripts/test_translation_model.py
```

## 依赖模型路径

默认从仓库目录读取：

- `local-model/models/builtin/asr/faster-whisper-base`
- `local-model/models/builtin/translation/zh-en`
- `local-model/models/builtin/translation/en-zh`

若模型缺失，接口会返回 `*-model-not-ready`，Electron 会回退到 mock。
