import { sleep } from "@/utils/format";

const detectByText = (text: string) => {
  if (/[\u3040-\u30ff]/.test(text)) return "日文";
  if (/[\uac00-\ud7af]/.test(text)) return "韩文";
  if (/[a-zA-Z]/.test(text) && !/[\u4e00-\u9fa5]/.test(text)) return "英文";
  return "中文";
};

export const translationService = {
  async detectLanguage(text: string) {
    try {
      if (window.linguaDraft?.translation) {
        const result = await window.linguaDraft.translation.detect(text);
        return result.language === "unknown" ? detectByText(text) : result.language;
      }
    } catch {
      // fallback to mock
    }
    await sleep(240);
    return detectByText(text);
  },

  async translate(text: string, targetLang: string) {
    try {
      if (window.linguaDraft?.translation) {
        return await window.linguaDraft.translation.translate(text, targetLang);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "翻译服务暂时不可用";
      throw new Error(message);
    }
    await sleep(780);
    if (Math.random() < 0.08) {
      throw new Error("翻译服务暂时不可用");
    }
    return `[${targetLang}译文] ${text}`;
  }
};
