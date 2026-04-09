import { getSidecarPort, isSidecarReady } from "./processManager";
import type { TranscriptionResult } from "../runtime/types";

const sidecarFetch = async <T>(path: string, payload: Record<string, unknown>) => {
  if (!isSidecarReady()) throw new Error("sidecar-not-ready");
  const res = await fetch(`http://127.0.0.1:${getSidecarPort()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `sidecar-${res.status}`);
  }
  return (await res.json()) as T;
};

export const sidecarClient = {
  async translate(text: string, sourceLang: string, targetLang: string): Promise<{ text: string }> {
    return sidecarFetch<{ text: string }>("/translation/run", { text, source_lang: sourceLang, target_lang: targetLang });
  },
  async transcribe(audioPath?: string): Promise<TranscriptionResult> {
    return sidecarFetch<TranscriptionResult>("/asr/transcribe", audioPath ? { audio_path: audioPath } : {});
  }
};
