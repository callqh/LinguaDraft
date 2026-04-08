import { franc } from "franc";

const mapFranc = (code: string) => {
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

export const translationService = {
  async detectLanguage(text: string) {
    const trimmed = text.trim();
    const code = franc(trimmed, { minLength: 3 });
    let language = mapFranc(code);
    if (language === "unknown") language = heuristicDetect(trimmed);

    if (language === "unknown") {
      throw new Error("语种识别失败，请输入更完整的句子");
    }
    return language;
  },

  async translate(text: string, targetLang: string) {
    if (!window.linguaDraft?.translation) {
      throw new Error("本地翻译服务未初始化");
    }
    return window.linguaDraft.translation.translate(text, targetLang);
  }
};
