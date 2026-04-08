import { create } from "zustand";
import { initialSessions, languageOptions } from "@/mock/data";
import { modelService } from "@/services/modelService";
import { translationService } from "@/services/translationService";
import { voiceService } from "@/services/voiceService";
import type { LocalModel, RecordingState, RecordItem, Session } from "@/types";

type AppState = {
  sessions: Session[];
  currentSessionId: string;
  inputText: string;
  detectedSourceLang: string;
  translationEnabled: boolean;
  targetLang: string;
  recordingState: RecordingState;
  models: LocalModel[];
  initializeModels: () => Promise<void>;
  setCurrentSession: (sessionId: string) => void;
  setInputText: (value: string) => void;
  setTranslationEnabled: (value: boolean) => void;
  setTargetLang: (value: string) => void;
  submitInput: (
    notify: (
      message: string,
      type?: "info" | "success" | "warning" | "error",
    ) => void,
  ) => Promise<void>;
  retranslateRecord: (
    recordId: string,
    targetLang: string,
    notify: (
      message: string,
      type?: "info" | "success" | "warning" | "error",
    ) => void,
  ) => Promise<"ok" | "missing-model">;
  startVoiceInput: (
    notify: (
      message: string,
      type?: "info" | "success" | "warning" | "error",
    ) => void,
  ) => Promise<"ok" | "missing-model">;
  stopVoiceInput: (
    notify: (
      message: string,
      type?: "info" | "success" | "warning" | "error",
    ) => void,
  ) => Promise<void>;
  downloadModel: (
    modelId: string,
    notify: (
      message: string,
      type?: "info" | "success" | "warning" | "error",
    ) => void,
  ) => void;
  pauseDownload: (modelId: string) => void;
  resumeDownload: (modelId: string) => void;
  cancelDownload: (
    modelId: string,
    notify: (
      message: string,
      type?: "info" | "success" | "warning" | "error",
    ) => void,
  ) => void;
  deleteModel: (
    modelId: string,
    notify: (
      message: string,
      type?: "info" | "success" | "warning" | "error",
    ) => void,
  ) => void;
  getCurrentSession: () => Session | undefined;
  getTranslationModelByLanguage: (lang: string) => LocalModel | undefined;
  isVoiceModelInstalled: () => boolean;
};

const createRecord = (payload: Partial<RecordItem>): RecordItem => ({
  id: `r-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
  createdAt: new Date().toISOString(),
  sourceText: payload.sourceText ?? "",
  sourceLang: payload.sourceLang ?? "中文",
  translationEnabled: payload.translationEnabled ?? false,
  targetLang: payload.targetLang,
  translatedText: payload.translatedText,
  translationStatus: payload.translationStatus ?? "idle",
});

const updateRecordInSession = (
  sessions: Session[],
  sessionId: string,
  recordId: string,
  updater: (r: RecordItem) => RecordItem,
) =>
  sessions.map((session) =>
    session.id === sessionId
      ? {
          ...session,
          updatedAt: new Date().toISOString(),
          records: session.records.map((record) =>
            record.id === recordId ? updater(record) : record,
          ),
        }
      : session,
  );

export const useAppStore = create<AppState>((set, get) => ({
  sessions: initialSessions,
  currentSessionId: "s-1",
  inputText: "",
  detectedSourceLang: "自动识别",
  translationEnabled: true,
  targetLang: "英文",
  recordingState: "idle",
  models: modelService.getModels(),
  initializeModels: async () => {
    const models = await modelService.listModels();
    set({ models });
  },

  setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),
  setInputText: (value) => set({ inputText: value }),
  setTranslationEnabled: (value) => set({ translationEnabled: value }),
  setTargetLang: (value) => set({ targetLang: value }),

  getCurrentSession: () =>
    get().sessions.find((item) => item.id === get().currentSessionId),
  getTranslationModelByLanguage: (lang) =>
    get().models.find(
      (model) => model.type === "translation" && model.language === lang,
    ),
  isVoiceModelInstalled: () =>
    get().models.some(
      (model) =>
        model.id === "asr-faster-whisper-base" && model.status === "installed",
    ),

  submitInput: async (notify) => {
    const { inputText, translationEnabled, targetLang, currentSessionId } =
      get();
    const text = inputText.trim();
    if (!text) {
      notify("输入为空，无法提交", "warning");
      return;
    }

    const sourceLang = await translationService.detectLanguage(text);
    const baseRecord = createRecord({
      sourceText: text,
      sourceLang,
      translationEnabled,
      targetLang: translationEnabled ? targetLang : undefined,
      translationStatus: translationEnabled ? "translating" : "idle",
    });

    set((state) => ({
      detectedSourceLang: sourceLang,
      inputText: "",
      sessions: state.sessions.map((session) =>
        session.id === currentSessionId
          ? {
              ...session,
              updatedAt: new Date().toISOString(),
              records: [baseRecord, ...session.records],
            }
          : session,
      ),
    }));

    if (!translationEnabled) {
      notify("已提交原文记录", "success");
      return;
    }

    const model = get().getTranslationModelByLanguage(targetLang);
    if (!model || model.status !== "installed") {
      set((state) => ({
        sessions: updateRecordInSession(
          state.sessions,
          currentSessionId,
          baseRecord.id,
          (record) => ({
            ...record,
            translationStatus: "failed",
          }),
        ),
      }));
      notify(`${targetLang}模型未安装，请先下载`, "warning");
      return;
    }

    try {
      const translated = await translationService.translate(text, targetLang);
      set((state) => ({
        sessions: updateRecordInSession(
          state.sessions,
          currentSessionId,
          baseRecord.id,
          (record) => ({
            ...record,
            translatedText: translated,
            translationStatus: "success",
          }),
        ),
      }));
      notify("翻译完成", "success");
    } catch {
      set((state) => ({
        sessions: updateRecordInSession(
          state.sessions,
          currentSessionId,
          baseRecord.id,
          (record) => ({
            ...record,
            translationStatus: "failed",
          }),
        ),
      }));
      notify("翻译失败，请稍后重试", "error");
    }
  },

  retranslateRecord: async (recordId, targetLang, notify) => {
    const { currentSessionId, getTranslationModelByLanguage } = get();
    const model = getTranslationModelByLanguage(targetLang);
    if (!model || model.status !== "installed") {
      notify(`${targetLang}模型未安装`, "warning");
      return "missing-model";
    }

    const session = get().getCurrentSession();
    const record = session?.records.find((item) => item.id === recordId);
    if (!record) return "ok";

    set((state) => ({
      sessions: updateRecordInSession(
        state.sessions,
        currentSessionId,
        recordId,
        (item) => ({
          ...item,
          targetLang,
          translationEnabled: true,
          translationStatus: "translating",
        }),
      ),
    }));

    try {
      const translated = await translationService.translate(
        record.sourceText,
        targetLang,
      );
      set((state) => ({
        sessions: updateRecordInSession(
          state.sessions,
          currentSessionId,
          recordId,
          (item) => ({
            ...item,
            targetLang,
            translatedText: translated,
            translationStatus: "success",
          }),
        ),
      }));
      notify("重翻译完成（已覆盖原记录）", "success");
      return "ok";
    } catch {
      set((state) => ({
        sessions: updateRecordInSession(
          state.sessions,
          currentSessionId,
          recordId,
          (item) => ({
            ...item,
            targetLang,
            translationStatus: "failed",
          }),
        ),
      }));
      notify("重翻译失败", "error");
      return "ok";
    }
  },

  startVoiceInput: async (notify) => {
    if (!get().isVoiceModelInstalled()) {
      notify("语音识别模型未安装", "warning");
      return "missing-model";
    }
    try {
      await voiceService.startRecording();
      set({ recordingState: "recording" });
      return "ok";
    } catch {
      notify("无法启动录音", "error");
      return "ok";
    }
  },

  stopVoiceInput: async (notify) => {
    try {
      await voiceService.stopRecording();
      set({ recordingState: "transcribing" });
      const text = await voiceService.transcribe();
      set((state) => ({
        recordingState: "idle",
        inputText: state.inputText ? `${state.inputText}\n${text}` : text,
      }));
      notify("语音识别完成，已回填输入框", "success");
    } catch {
      set({ recordingState: "failed" });
      notify("语音识别失败", "error");
      window.setTimeout(() => set({ recordingState: "idle" }), 1000);
    }
  },

  downloadModel: (modelId, notify) => {
    const model = get().models.find((item) => item.id === modelId);
    if (!model) return;
    modelService.downloadModel(
      modelId,
      model.progress ?? 0,
      (patch) => {
        set((state) => ({
          models: state.models.map((item) =>
            item.id === modelId ? { ...item, ...patch } : item,
          ),
        }));
      },
      () => notify(`${model.language ?? "语音"}模型下载完成`, "success"),
      () => notify(`${model.language ?? "语音"}模型下载失败`, "error"),
    );
  },

  pauseDownload: (modelId) => {
    modelService.pauseDownload(modelId);
    if (!window.linguaDraft?.model) {
      set((state) => ({
        models: state.models.map((item) =>
          item.id === modelId ? { ...item, status: "paused" } : item,
        ),
      }));
    }
  },

  resumeDownload: (modelId) => {
    modelService.resumeDownload(modelId);
    if (!window.linguaDraft?.model) {
      set((state) => ({
        models: state.models.map((item) =>
          item.id === modelId ? { ...item, status: "downloading" } : item,
        ),
      }));
    }
  },

  cancelDownload: (modelId, notify) => {
    modelService.cancelDownload(modelId);
    if (!window.linguaDraft?.model) {
      set((state) => ({
        models: state.models.map((item) =>
          item.id === modelId
            ? { ...item, status: "not_installed", progress: 0 }
            : item,
        ),
      }));
    }
    notify("下载已取消", "info");
  },

  deleteModel: (modelId, notify) => {
    modelService.deleteModel(modelId);
    if (!window.linguaDraft?.model) {
      set((state) => ({
        models: state.models.map((item) =>
          item.id === modelId
            ? { ...item, status: "not_installed", progress: 0 }
            : item,
        ),
      }));
    }
    notify("模型已删除", "info");
  },
}));

export const findLanguageLabel = (codeOrLabel: string) =>
  languageOptions.find(
    (item) => item.code === codeOrLabel || item.label === codeOrLabel,
  )?.label ?? codeOrLabel;
