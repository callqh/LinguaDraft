import * as path from "node:path";
import * as fs from "node:fs";
import { app } from "electron";
import type { TranscriptionResult } from "./types";
import { lidRunner } from "./lidRunner";
import { getModelManager } from "./modelManager";

const MODEL_MARKER = path.join(app.getPath("userData"), "models", "asr-faster-whisper-base", "ready.flag");

let recording = false;
let recordingStartedAt = 0;

const pickMockByDuration = (durationMs: number) => {
  if (durationMs > 4000) return "这是一次较长的语音输入，系统已完成离线转写。";
  if (durationMs > 2000) return "请把这段语音整理为英文要点，突出核心信息。";
  return "今天记录一个新想法，后续再扩展为完整文稿。";
};

export const asrRunner = {
  isModelReady() {
    return fs.existsSync(MODEL_MARKER) || getModelManager().isModelInstalled("asr-faster-whisper-base");
  },

  async start() {
    if (!this.isModelReady()) throw new Error("语音模型未安装");
    recording = true;
    recordingStartedAt = Date.now();
    return { status: "recording" as const };
  },

  async stop() {
    if (!recording) return { status: "idle" as const };
    recording = false;
    return { status: "transcribing" as const };
  },

  async transcribe(): Promise<TranscriptionResult> {
    if (!this.isModelReady()) throw new Error("语音模型未安装");

    const duration = Math.max(600, Date.now() - recordingStartedAt);
    const text = pickMockByDuration(duration);
    const lid = lidRunner.detect(text);
    return {
      text,
      language: lid.language === "unknown" ? "中文" : lid.language,
      confidence: Math.max(0.6, lid.confidence)
    };
  }
};
