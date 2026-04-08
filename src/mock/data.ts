import type { LocalModel, Session } from "@/types";

const now = Date.now();

export const languageOptions = [
  { code: "zh", label: "中文" },
  { code: "en", label: "英文" },
  { code: "ja", label: "日文" },
  { code: "ko", label: "韩文" },
  { code: "fr", label: "法文" },
  { code: "de", label: "德文" },
  { code: "ru", label: "俄文" },
  { code: "es", label: "西班牙文" },
  { code: "it", label: "意大利文" }
];

export const initialSessions: Session[] = [
  {
    id: "s-1",
    title: "未命名写作",
    createdAt: new Date(now - 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 3).toISOString(),
    records: [
      {
        id: "r-1",
        createdAt: new Date(now - 1000 * 60 * 20).toISOString(),
        sourceText:
          "人工智能正在改变我们处理写作任务的方式，它不仅提升效率，还帮助我们更快组织思路。",
        sourceLang: "中文",
        translationEnabled: true,
        targetLang: "英文",
        translatedText:
          "Artificial intelligence is reshaping how we handle writing tasks, improving efficiency and helping us structure ideas faster.",
        translationStatus: "success"
      },
      {
        id: "r-2",
        createdAt: new Date(now - 1000 * 60 * 40).toISOString(),
        sourceText:
          "世界是一个不断探索的过程，每一次记录，都是对思考的梳理。",
        sourceLang: "中文",
        translationEnabled: true,
        targetLang: "日文",
        translatedText:
          "世界は探求の連続であり、一つひとつの記録は思考を整理する行為です。",
        translationStatus: "success"
      }
    ]
  },
  {
    id: "s-2",
    title: "产品需求文档",
    createdAt: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 50).toISOString(),
    records: []
  },
  {
    id: "s-3",
    title: "学习日记 - 第3周",
    createdAt: new Date(now - 1000 * 60 * 60 * 30).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 220).toISOString(),
    records: []
  },
  {
    id: "s-4",
    title: "灵感记录",
    createdAt: new Date(now - 1000 * 60 * 60 * 42).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
    records: []
  }
];

export const initialModels: LocalModel[] = [
  {
    id: "asr-base-zh",
    type: "asr",
    language: "中文",
    version: "v1.0.0",
    status: "installed",
    size: 1.2
  },
  {
    id: "tr-zh",
    type: "translation",
    language: "中文",
    version: "v1.0.0",
    status: "installed",
    size: 1.2
  },
  {
    id: "tr-en",
    type: "translation",
    language: "英文",
    version: "v1.0.0",
    status: "installed",
    size: 1.5
  },
  {
    id: "tr-ja",
    type: "translation",
    language: "日文",
    version: "v1.0.0",
    status: "installed",
    size: 1.3
  },
  {
    id: "tr-ko",
    type: "translation",
    language: "韩文",
    version: "v1.0.0",
    status: "not_installed",
    size: 1.4
  },
  {
    id: "tr-fr",
    type: "translation",
    language: "法文",
    version: "v1.0.0",
    status: "failed",
    size: 1.6,
    progress: 68
  },
  {
    id: "tr-de",
    type: "translation",
    language: "德文",
    version: "v1.0.0",
    status: "not_installed",
    size: 1.5
  },
  {
    id: "tr-ru",
    type: "translation",
    language: "俄文",
    version: "v1.0.0",
    status: "not_installed",
    size: 1.7
  },
  {
    id: "tr-es",
    type: "translation",
    language: "西班牙文",
    version: "v1.0.0",
    status: "not_installed",
    size: 1.6
  },
  {
    id: "tr-it",
    type: "translation",
    language: "意大利文",
    version: "v1.0.0",
    status: "not_installed",
    size: 1.5
  }
];

