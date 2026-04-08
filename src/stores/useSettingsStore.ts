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
  setActiveCategory: (value: SettingsCategory) => void;
  setDefaultTranslation: (value: boolean) => void;
  setDefaultTargetLang: (value: string) => void;
  toggleDualPanel: () => void;
  refreshPermission: () => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  activeCategory: "语音输入",
  microphoneName: "MacBook Pro 麦克风",
  microphonePermission: "已授权",
  shortcutVoice: "Ctrl/Cmd + Tab",
  shortcutStop: "Esc",
  defaultTranslation: true,
  defaultTargetLang: "英文",
  dualPanelEnabled: true,
  modelStoragePath: "D:\\AI-Models",
  setActiveCategory: (value) => set({ activeCategory: value }),
  setDefaultTranslation: (value) => set({ defaultTranslation: value }),
  setDefaultTargetLang: (value) => set({ defaultTargetLang: value }),
  toggleDualPanel: () => set((state) => ({ dualPanelEnabled: !state.dualPanelEnabled })),
  refreshPermission: () => {
    set({ microphonePermission: Math.random() < 0.9 ? "已授权" : "未授权" });
  }
}));

