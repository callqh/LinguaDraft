import { franc } from "franc";
import { useSettingsStore } from "@/stores/useSettingsStore";

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

const toDeepSeekTarget = (label: string) => {
  switch (label) {
    case "中文":
      return "简体中文";
    case "英文":
      return "英语";
    case "日文":
      return "日语";
    case "韩文":
      return "韩语";
    case "法文":
      return "法语";
    case "德文":
      return "德语";
    case "俄文":
      return "俄语";
    case "西班牙文":
      return "西班牙语";
    case "意大利文":
      return "意大利语";
    default:
      return label;
  }
};

const translateByDeepSeek = async (
  text: string,
  targetLang: string,
  apiKey: string,
) => {
  const endpoint = "https://api.deepseek.com/v1/chat/completions";
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content:
              "你是专业翻译助手。仅输出译文本身，不要任何解释、前后缀、引号或额外标记。",
          },
          {
            role: "user",
            content: `请将以下文本翻译为${toDeepSeekTarget(targetLang)}：\n${text}`,
          },
        ],
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `DeepSeek 调用失败(${response.status})${detail ? `: ${detail}` : ""}`,
      );
    }
    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!content) throw new Error("DeepSeek 返回为空");
    return content.replace(/^["'`]|["'`]$/g, "").trim();
  } finally {
    window.clearTimeout(timeout);
  }
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const splitBySentence = (text: string) => {
  const parts = text
    .split(/([。！？!?；;\n]+)/g)
    .reduce<string[]>((acc, current, index, arr) => {
      if (index % 2 === 0) {
        const punc = arr[index + 1] ?? "";
        const merged = `${current}${punc}`.trim();
        if (merged) acc.push(merged);
      }
      return acc;
    }, []);
  if (parts.length > 0) return parts;
  return text
    .split(/([,.，、\s]+)/g)
    .map((item) => item.trim())
    .filter(Boolean);
};

const translateByDeepSeekStream = async (
  text: string,
  targetLang: string,
  apiKey: string,
  onChunk: (chunk: string) => void,
) => {
  const endpoint = "https://api.deepseek.com/v1/chat/completions";
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.1,
        stream: true,
        messages: [
          {
            role: "system",
            content:
              "你是专业翻译助手。仅输出译文本身，不要任何解释、前后缀、引号或额外标记。",
          },
          {
            role: "user",
            content: `请将以下文本翻译为${toDeepSeekTarget(targetLang)}：\n${text}`,
          },
        ],
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `DeepSeek 调用失败(${response.status})${detail ? `: ${detail}` : ""}`,
      );
    }
    if (!response.body) {
      throw new Error("DeepSeek 流式响应不可用");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const lineRaw of lines) {
        const line = lineRaw.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        let json:
          | { choices?: Array<{ delta?: { content?: string } }> }
          | undefined;
        try {
          json = JSON.parse(payload);
        } catch {
          continue;
        }
        const chunk = json?.choices?.[0]?.delta?.content ?? "";
        if (chunk) onChunk(chunk);
      }
    }
  } finally {
    window.clearTimeout(timeout);
  }
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
    const { deepSeekEnabled, deepSeekApiKey } = useSettingsStore.getState();
    if (deepSeekEnabled && deepSeekApiKey.trim()) {
      return translateByDeepSeek(text, targetLang, deepSeekApiKey.trim());
    }
    if (!window.linguaDraft?.translation) {
      throw new Error("本地翻译服务未初始化");
    }
    return window.linguaDraft.translation.translate(text, targetLang);
  },

  async translateStream(
    text: string,
    targetLang: string,
    onChunk: (chunk: string) => void,
  ) {
    const { deepSeekEnabled, deepSeekApiKey } = useSettingsStore.getState();
    if (deepSeekEnabled && deepSeekApiKey.trim()) {
      await translateByDeepSeekStream(
        text,
        targetLang,
        deepSeekApiKey.trim(),
        onChunk,
      );
      return;
    }
    if (!window.linguaDraft?.translation) {
      throw new Error("本地翻译服务未初始化");
    }

    const sentences = splitBySentence(text);
    if (sentences.length === 0) return;
    for (let index = 0; index < sentences.length; index += 1) {
      const segment = sentences[index];
      const translated = await window.linguaDraft.translation.translate(
        segment,
        targetLang,
      );
      const normalized = translated.trim();
      if (!normalized) continue;
      if (index > 0) onChunk(" ");
      const words = normalized.split(/\s+/).filter(Boolean);
      if (words.length <= 2) {
        onChunk(normalized);
        continue;
      }
      for (let wordIndex = 0; wordIndex < words.length; wordIndex += 1) {
        const word = words[wordIndex];
        onChunk(wordIndex === 0 ? word : ` ${word}`);
        await sleep(12);
      }
    }
  },
};
