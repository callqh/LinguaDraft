import { lidRunner } from "./lidRunner";
import { getModelManager } from "./modelManager";

const normalizeLang = (lang: string) => {
  if (lang.includes("中")) return "中文";
  if (lang.includes("英")) return "英文";
  return lang;
};

const templates: Record<string, (text: string) => string> = {
  "中文->英文": (text) => `English draft: ${text}`,
  "英文->中文": (text) => `中文草稿：${text}`
};

export const translationRunner = {
  detectLanguage(text: string) {
    return lidRunner.detect(text);
  },

  async translate(text: string, targetLang: string) {
    const source = normalizeLang(this.detectLanguage(text).language);
    const target = normalizeLang(targetLang);
    const modelManager = getModelManager();

    if (!modelManager.isTranslationLanguageInstalled(target)) {
      throw new Error(`${target}模型未安装`);
    }

    if (source === target) return text;

    const pair = `${source}->${target}`;
    if (!templates[pair]) {
      throw new Error(`暂不支持 ${source} 到 ${target} 的离线翻译`);
    }

    return templates[pair](text);
  }
};

