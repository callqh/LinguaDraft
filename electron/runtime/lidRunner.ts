import type { LanguageDetection } from "./types";

const fromFrancCode = (code: string) => {
  switch (code) {
    case "cmn":
    case "zho":
      return "中文";
    case "eng":
      return "英文";
    case "jpn":
      return "日文";
    case "kor":
      return "韩文";
    case "fra":
      return "法文";
    case "deu":
      return "德文";
    case "rus":
      return "俄文";
    case "spa":
      return "西班牙文";
    case "ita":
      return "意大利文";
    default:
      return "unknown";
  }
};

const heuristicDetect = (text: string) => {
  if (/[\u3040-\u30ff]/.test(text)) return "日文";
  if (/[\uac00-\ud7af]/.test(text)) return "韩文";
  if (/[\u4e00-\u9fff]/.test(text)) return "中文";
  if (/[a-zA-Z]/.test(text)) return "英文";
  return "unknown";
};

export const lidRunner = {
  async detect(text: string): Promise<LanguageDetection> {
    const trimmed = text.trim();
    if (!trimmed) return { language: "unknown", confidence: 0 };

    const { franc } = await import("franc");
    const code = franc(trimmed, { minLength: 3 });
    const mapped = fromFrancCode(code);

    if (mapped !== "unknown") {
      return { language: mapped, confidence: 0.85 };
    }

    const heuristic = heuristicDetect(trimmed);
    return {
      language: heuristic,
      confidence: heuristic === "unknown" ? 0.2 : 0.6
    };
  }
};

