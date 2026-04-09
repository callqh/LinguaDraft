import { create } from "zustand";

export type SettingsCategory = "通用" | "语音输入" | "翻译" | "存储" | "关于";

type SettingsState = {
  activeCategory: SettingsCategory;
  microphoneName: string;
  microphonePermission: "已授权" | "未授权";
  shortcutVoice: string;
  shortcutStop: string;
  defaultTranslation: boolean;
  defaultTargetLang: string;
  dualPanelEnabled: boolean;
  modelStoragePath: string;
  deepSeekEnabled: boolean;
  deepSeekApiKey: string;
  setActiveCategory: (value: SettingsCategory) => void;
  setDefaultTranslation: (value: boolean) => void;
  setDefaultTargetLang: (value: string) => void;
  toggleDualPanel: () => void;
  refreshPermission: () => void;
  setDeepSeekEnabled: (value: boolean) => void;
  setDeepSeekApiKey: (value: string) => void;
};

const STORAGE_KEY = "lingua-settings-v1";

const readPersisted = () => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<SettingsState>;
  } catch {
    return {};
  }
};

const persist = (state: Partial<SettingsState>) => {
  if (typeof window === "undefined") return;
  try {
    const current = readPersisted();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...state }));
  } catch {
    // ignore persistence errors
  }
};

const initial = readPersisted();

export const useSettingsStore = create<SettingsState>((set) => ({
  activeCategory: "语音输入",
  microphoneName: "MacBook Pro 麦克风",
  microphonePermission: "已授权",
  shortcutVoice: "Ctrl/Cmd + T",
  shortcutStop: "Esc",
  defaultTranslation: initial.defaultTranslation ?? true,
  defaultTargetLang: initial.defaultTargetLang ?? "英文",
  dualPanelEnabled: initial.dualPanelEnabled ?? true,
  modelStoragePath: "D:\\AI-Models",
  deepSeekEnabled: initial.deepSeekEnabled ?? false,
  deepSeekApiKey: initial.deepSeekApiKey ?? "",
  setActiveCategory: (value) => set({ activeCategory: value }),
  setDefaultTranslation: (value) => {
    set({ defaultTranslation: value });
    persist({ defaultTranslation: value });
  },
  setDefaultTargetLang: (value) => {
    set({ defaultTargetLang: value });
    persist({ defaultTargetLang: value });
  },
  toggleDualPanel: () =>
    set((state) => {
      const next = !state.dualPanelEnabled;
      persist({ dualPanelEnabled: next });
      return { dualPanelEnabled: next };
    }),
  refreshPermission: () => {
    set({ microphonePermission: Math.random() < 0.9 ? "已授权" : "未授权" });
  },
  setDeepSeekEnabled: (value) => {
    set({ deepSeekEnabled: value });
    persist({ deepSeekEnabled: value });
  },
  setDeepSeekApiKey: (value) => {
    set({ deepSeekApiKey: value });
    persist({ deepSeekApiKey: value });
  },
}));
