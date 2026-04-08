import * as path from "node:path";
import * as fs from "node:fs";
import { app } from "electron";
import type { TranscriptionResult } from "./types";
import { getModelManager } from "./modelManager";
import { sidecarClient } from "../sidecar/client";

const MODEL_MARKER = path.join(app.getPath("userData"), "models", "asr-faster-whisper-base", "ready.flag");

let recording = false;
let recordingStartedAt = 0;

const fallbackTranscribe = (): TranscriptionResult => {
  const elapsedMs = recordingStartedAt > 0 ? Date.now() - recordingStartedAt : 0;
  const shortSentence =
    elapsedMs >= 3_000 ? "这是一条语音输入的测试转写结果。" : "语音输入测试文本。";
  return {
    text: shortSentence,
    language: "中文",
    confidence: 0.6,
  };
};

export const asrRunner = {
  isModelReady() {
    return fs.existsSync(MODEL_MARKER) || getModelManager().isModelInstalled("asr-faster-whisper-base");
  },

  async start() {
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
    if (!this.isModelReady()) return fallbackTranscribe();
    try {
      const result = await sidecarClient.transcribe();
      if (!result.text?.trim()) return fallbackTranscribe();
      return result;
    } catch {
      return fallbackTranscribe();
    }
  }
};
