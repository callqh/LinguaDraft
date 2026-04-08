import * as path from "node:path";
import * as fs from "node:fs";
import { app } from "electron";
import type { TranscriptionResult } from "./types";
import { getModelManager } from "./modelManager";
import { sidecarClient } from "../sidecar/client";

const MODEL_MARKER = path.join(app.getPath("userData"), "models", "asr-faster-whisper-base", "ready.flag");

let recording = false;
let recordingStartedAt = 0;

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
    return sidecarClient.transcribe();
  }
};
