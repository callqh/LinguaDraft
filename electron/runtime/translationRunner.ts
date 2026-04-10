import { lidRunner } from "./lidRunner";
import { getModelManager } from "./modelManager";
import { sidecarClient } from "../sidecar/client";

const normalizeLang = (lang: string) => {
  if (lang.includes("中")) return "中文";
  if (lang.includes("英")) return "英文";
  if (lang.includes("日")) return "日文";
  if (lang.includes("韩")) return "韩文";
  if (lang.includes("法")) return "法文";
  if (lang.includes("德")) return "德文";
  if (lang.includes("俄")) return "俄文";
  if (lang.includes("西班牙")) return "西班牙文";
  if (lang.includes("意大利")) return "意大利文";
  return lang;
};

const normalizeTranslationText = (text: string) => {
  const cleaned = text.replace(/▁/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return "";

  const tokens = cleaned.split(" ");
  if (tokens.length >= 6) {
    const head = tokens[0].toLowerCase();
    const allSame = tokens.every((token) => token.toLowerCase() === head);
    if (allSame) return tokens[0];
  }

  const compact: string[] = [];
  for (const token of tokens) {
    if (
      !compact.length ||
      compact[compact.length - 1].toLowerCase() !== token.toLowerCase()
    ) {
      compact.push(token);
    }
  }
  const compactText = compact.join(" ").trim();
  if (!compactText) return "";

  // Drop pathological repeating bi-grams like:
  // "done well done good done well ..."
  const words = compactText.split(" ");
  if (words.length >= 12) {
    const biGramCounts = new Map<string, number>();
    for (let i = 0; i < words.length - 1; i += 1) {
      const key = `${words[i].toLowerCase()} ${words[i + 1].toLowerCase()}`;
      biGramCounts.set(key, (biGramCounts.get(key) ?? 0) + 1);
    }
    const maxBiGramFreq = Math.max(...biGramCounts.values());
    if (maxBiGramFreq >= 4) {
      return words.slice(0, 12).join(" ");
    }
  }

  return compactText;
};

export const translationRunner = {
  async detectLanguage(text: string) {
    return lidRunner.detect(text);
  },

  async translate(text: string, targetLang: string) {
    const source = normalizeLang((await this.detectLanguage(text)).language);
    const target = normalizeLang(targetLang);
    const modelManager = getModelManager();

    if (source === "unknown") {
      throw new Error("语种识别失败，无法执行翻译");
    }

    if (source === target) return text;

    const run = async (input: string, from: string, to: string) => {
      try {
        const result = await sidecarClient.translate(input, from, to);
        const normalized = normalizeTranslationText(result.text ?? "");
        if (!normalized) throw new Error("翻译结果为空");
        return normalized;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // if (message.includes("translation-quality-low")) {
        //   throw new Error("翻译结果质量不稳定，请补充上下文后重试");
        // }
        if (message.includes("translation-quality-low")) {
          return input;
        }
        if (message.includes("translation-model-not-ready")) {
          throw new Error(`${from} 到 ${to} 模型未就绪，请先下载对应模型`);
        }
        if (message.includes("sidecar-not-ready")) {
          throw new Error("翻译服务未就绪，请稍后重试");
        }
        throw new Error(`翻译失败：${message}`);
      }
    };

    const hasPair = (from: string, to: string) =>
      modelManager.isTranslationPairInstalled(from, to);

    if (hasPair(source, target)) {
      return run(text, source, target);
    }

    // Use English as pivot for multi-language translation.
    if (source !== "英文" && target !== "英文") {
      if (!hasPair(source, "英文") || !hasPair("英文", target)) {
        throw new Error(`未安装 ${source}->英文 或 英文->${target} 模型`);
      }
      const mid = await run(text, source, "英文");
      return run(mid, "英文", target);
    }
    if (source !== "英文" && target === "英文") {
      if (!hasPair(source, "英文")) {
        throw new Error(`未安装 ${source}->英文 模型`);
      }
      return run(text, source, "英文");
    }
    if (source === "英文" && target !== "英文") {
      if (!hasPair("英文", target)) {
        throw new Error(`未安装 英文->${target} 模型`);
      }
      return run(text, "英文", target);
    }

    throw new Error(`暂不支持 ${source} 到 ${target} 的离线翻译`);
  },
};
