import { lidRunner } from "./lidRunner";
import { getModelManager } from "./modelManager";
import { sidecarClient } from "../sidecar/client";

const normalizeLang = (lang: string) => {
  if (lang.includes("中")) return "中文";
  if (lang.includes("英")) return "英文";
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
    if (!compact.length || compact[compact.length - 1].toLowerCase() !== token.toLowerCase()) {
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

    if (!modelManager.isTranslationLanguageInstalled(target)) {
      throw new Error(`${target}模型未安装`);
    }

    if (source === "unknown") {
      throw new Error("语种识别失败，无法执行翻译");
    }

    if (source === target) return text;

    if (!["中文->英文", "英文->中文"].includes(`${source}->${target}`)) {
      throw new Error(`暂不支持 ${source} 到 ${target} 的离线翻译`);
    }

    const result = await sidecarClient.translate(text, source, target);
    const normalized = normalizeTranslationText(result.text ?? "");
    if (!normalized) {
      throw new Error("翻译结果为空");
    }
    return normalized;
  },
};
