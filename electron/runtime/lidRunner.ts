import type { LanguageDetection } from "./types";

const heuristicDetect = (text: string) => {
  const zhCount = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const jaCount = (text.match(/[\u3040-\u30ff]/g) ?? []).length;
  const koCount = (text.match(/[\uac00-\ud7af]/g) ?? []).length;
  const latinCount = (text.match(/[a-zA-Z]/g) ?? []).length;
  if (jaCount >= 1) return "日文";
  if (koCount >= 1) return "韩文";
  if (zhCount >= 1) return "中文";
  if (latinCount >= 2) return "英文";
  return "unknown";
};

export const lidRunner = {
  async detect(text: string): Promise<LanguageDetection> {
    const trimmed = text.trim();
    if (!trimmed) return { language: "unknown", confidence: 0 };

    const heuristic = heuristicDetect(trimmed);
    return {
      language: heuristic,
      confidence: heuristic === "unknown" ? 0.2 : 0.6
    };
  }
};
