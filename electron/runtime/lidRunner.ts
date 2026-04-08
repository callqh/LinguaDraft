import * as path from "node:path";
import * as fs from "node:fs";
import { app } from "electron";
import type { LanguageDetection } from "./types";

const MODEL_PATH = path.join(
  app.getAppPath(),
  "local-model",
  "models",
  "builtin",
  "lid",
  "fasttext-lid-176-ftz",
  "lid.176.ftz"
);

const MIN_TEXT_LEN = 8;

const detectByRule = (text: string): LanguageDetection => {
  if (!text.trim()) return { language: "unknown", confidence: 0 };
  const hasCJK = /[\u4e00-\u9fa5]/.test(text);
  const hasJP = /[\u3040-\u30ff]/.test(text);
  const hasKR = /[\uac00-\ud7af]/.test(text);
  const alphaOnly = /[a-zA-Z]/.test(text) && !hasCJK && !hasJP && !hasKR;

  if (hasJP) return { language: "日文", confidence: 0.9 };
  if (hasKR) return { language: "韩文", confidence: 0.9 };
  if (hasCJK) return { language: "中文", confidence: 0.88 };
  if (alphaOnly) return { language: "英文", confidence: 0.85 };
  return { language: "unknown", confidence: 0.3 };
};

export const lidRunner = {
  isModelReady() {
    return fs.existsSync(MODEL_PATH);
  },

  detect(text: string): LanguageDetection {
    const ruleResult = detectByRule(text);

    // fastText 模型加载位保留：当前阶段若模型文件不存在则回退规则识别。
    const hasFastTextModel = this.isModelReady();
    if (!hasFastTextModel) {
      if (text.trim().length < MIN_TEXT_LEN) return { language: "unknown", confidence: 0.25 };
      return ruleResult;
    }

    // 预留真实 fastText 推理；当前仍返回同结构结果，确保接口稳定。
    if (text.trim().length < MIN_TEXT_LEN) return { language: "unknown", confidence: 0.35 };
    return ruleResult;
  }
};
