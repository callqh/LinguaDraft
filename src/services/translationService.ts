import { sleep } from "@/utils/format";

const detectByText = (text: string) => {
  if (/[\u3040-\u30ff]/.test(text)) return "日文";
  if (/[\uac00-\ud7af]/.test(text)) return "韩文";
  if (/[a-zA-Z]/.test(text) && !/[\u4e00-\u9fa5]/.test(text)) return "英文";
  return "中文";
};

export const translationService = {
  async detectLanguage(text: string) {
    await sleep(240);
    return detectByText(text);
  },

  async translate(text: string, targetLang: string) {
    await sleep(780);
    if (Math.random() < 0.08) {
      throw new Error("翻译服务暂时不可用");
    }
    return `[${targetLang}译文] ${text}`;
  }
};

