import * as path from "node:path";
import * as fs from "node:fs";
import { app } from "electron";
import { randomUUID } from "node:crypto";
import type { TranscriptionResult } from "./types";
import { getModelManager } from "./modelManager";
import { getUserBuiltinRoot } from "./modelPaths";
import { sidecarClient } from "../sidecar/client";

const MODEL_MARKER = path.join(app.getPath("userData"), "models", "asr-faster-whisper-base", "ready.flag");
const MODEL_BIN = path.join(getUserBuiltinRoot(), "asr", "faster-whisper-base", "model.bin");
const RECORDING_DIR = path.join(app.getPath("userData"), "recordings");

let recording = false;

export const asrRunner = {
  isModelReady() {
    return (
      fs.existsSync(MODEL_BIN) ||
      fs.existsSync(MODEL_MARKER) ||
      getModelManager().isModelInstalled("asr-faster-whisper-base")
    );
  },

  async start() {
    recording = true;
    return { status: "recording" as const };
  },

  async stop() {
    if (!recording) return { status: "idle" as const };
    recording = false;
    return { status: "transcribing" as const };
  },

  async transcribe(audioPath?: string): Promise<TranscriptionResult> {
    if (!this.isModelReady()) {
      throw new Error("语音识别模型未就绪");
    }
    let result: TranscriptionResult;
    try {
      result = await sidecarClient.transcribe(audioPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("audio-not-provided")) {
        throw new Error("未检测到可用音频，请先录音或检查 demo.wav");
      }
      if (message.includes("sidecar-not-ready")) {
        throw new Error("语音服务未就绪，请先执行 pnpm setup:sidecar");
      }
      throw new Error(`语音识别失败：${message}`);
    }
    if (!result.text?.trim()) {
      throw new Error("语音识别结果为空");
    }
    return result;
  },

  async transcribeAudioBuffer(
    raw: ArrayBuffer,
    extension = "webm",
  ): Promise<TranscriptionResult> {
    const bytes = Buffer.from(new Uint8Array(raw));
    if (!bytes.length) throw new Error("录音数据为空");
    fs.mkdirSync(RECORDING_DIR, { recursive: true });
    const safeExt = extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "webm";
    const audioPath = path.join(RECORDING_DIR, `${Date.now()}-${randomUUID()}.${safeExt}`);
    fs.writeFileSync(audioPath, bytes);
    try {
      return await this.transcribe(audioPath);
    } finally {
      try {
        fs.rmSync(audioPath, { force: true });
      } catch {
        // ignore temp cleanup error
      }
    }
  },
};
