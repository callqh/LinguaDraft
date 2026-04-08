import { create } from "zustand";
export const useSettingsStore = create((set) => ({
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
