#!/usr/bin/env bash
set -euo pipefail

# 用法:
#   ./scripts/test-translation-api.sh "测试文本" "中文" "英文"
# 默认:
#   文本=这是一个离线翻译接口测试
#   源语言=中文
#   目标语言=英文

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${SIDECAR_PORT:-8765}"
HEALTH_URL="http://127.0.0.1:${PORT}/health"
RUN_URL="http://127.0.0.1:${PORT}/translation/run"

TEXT="${1:-这是一个离线翻译接口测试。}"
SOURCE_LANG="${2:-中文}"
TARGET_LANG="${3:-英文}"

MODEL_ROOT_DEFAULT="$HOME/Library/Application Support/lingua-draft/models/builtin"
MODEL_ROOT="${LINGUA_MODEL_ROOT:-$MODEL_ROOT_DEFAULT}"
PYTHON_BIN="${SIDECAR_PYTHON:-$ROOT_DIR/services/ai-sidecar/.venv/bin/python}"
SIDECAR_ENTRY="$ROOT_DIR/services/ai-sidecar/app/main.py"

STARTED_BY_SCRIPT=0
SIDECAR_PID=""

cleanup() {
  if [[ "$STARTED_BY_SCRIPT" -eq 1 && -n "$SIDECAR_PID" ]]; then
    kill "$SIDECAR_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

ensure_sidecar() {
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    return 0
  fi

  if [[ ! -x "$PYTHON_BIN" ]]; then
    echo "❌ sidecar Python 不存在: $PYTHON_BIN"
    echo "请先执行: pnpm setup:sidecar"
    exit 1
  fi
  if [[ ! -f "$SIDECAR_ENTRY" ]]; then
    echo "❌ sidecar 入口不存在: $SIDECAR_ENTRY"
    exit 1
  fi

  echo "ℹ️ sidecar 未运行，正在启动..."
  LINGUA_MODEL_ROOT="$MODEL_ROOT" \
    "$PYTHON_BIN" "$SIDECAR_ENTRY" --port "$PORT" >/tmp/lingua-sidecar-test.log 2>&1 &
  SIDECAR_PID="$!"
  STARTED_BY_SCRIPT=1

  for _ in {1..30}; do
    if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.2
  done

  echo "❌ sidecar 启动失败，日志：/tmp/lingua-sidecar-test.log"
  sed -n '1,120p' /tmp/lingua-sidecar-test.log || true
  exit 1
}

ensure_sidecar

PAYLOAD="$(
  python3 - "$TEXT" "$SOURCE_LANG" "$TARGET_LANG" <<'PY'
import json, sys
text, source_lang, target_lang = sys.argv[1], sys.argv[2], sys.argv[3]
print(json.dumps({
  "text": text,
  "source_lang": source_lang,
  "target_lang": target_lang
}, ensure_ascii=False))
PY
)"

RAW="$(curl -sS -X POST "$RUN_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -w '\n__HTTP_STATUS__:%{http_code}')"

HTTP_STATUS="$(printf '%s\n' "$RAW" | sed -n 's/^__HTTP_STATUS__://p')"
BODY="$(printf '%s\n' "$RAW" | sed '/^__HTTP_STATUS__:/d')"

echo "===== 请求参数 ====="
echo "source_lang: $SOURCE_LANG"
echo "target_lang: $TARGET_LANG"
echo "text: $TEXT"
echo
echo "===== HTTP 状态 ====="
echo "$HTTP_STATUS"
echo
echo "===== 原始响应 ====="
echo "$BODY"
echo

if [[ "$HTTP_STATUS" != "200" ]]; then
  echo "❌ 翻译接口调用失败"
  exit 1
fi

echo "===== 解析后译文 ====="
python3 - "$BODY" <<'PY'
import json, sys
body = sys.argv[1]
try:
    data = json.loads(body)
except Exception:
    print("无法解析 JSON")
    raise SystemExit(1)
print(data.get("text", ""))
PY

echo
echo "✅ 翻译接口调用成功"
