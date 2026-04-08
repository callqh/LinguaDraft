import { SettingsPanel } from "@/components/SettingsPanel";
import { SettingsSidebar } from "@/components/SettingsSidebar";
import { useSettingsStore } from "@/stores/useSettingsStore";

export const SettingsPage = () => {
  const {
    activeCategory,
    setActiveCategory,
    microphoneName,
    microphonePermission,
    shortcutVoice,
    shortcutStop,
    defaultTranslation,
    defaultTargetLang,
    dualPanelEnabled,
    modelStoragePath,
    refreshPermission,
    setDefaultTranslation,
    setDefaultTargetLang,
    toggleDualPanel
  } = useSettingsStore();

  return (
    <div className="h-full grid grid-cols-[220px_1fr] gap-3">
      <SettingsSidebar value={activeCategory} onChange={setActiveCategory} />
      <SettingsPanel
        active={activeCategory}
        microphoneName={microphoneName}
        microphonePermission={microphonePermission}
        shortcutVoice={shortcutVoice}
        shortcutStop={shortcutStop}
        defaultTranslation={defaultTranslation}
        defaultTargetLang={defaultTargetLang}
        dualPanelEnabled={dualPanelEnabled}
        modelStoragePath={modelStoragePath}
        onRefreshPermission={refreshPermission}
        onToggleDefaultTranslation={setDefaultTranslation}
        onDefaultTargetLangChange={setDefaultTargetLang}
        onToggleDualPanel={toggleDualPanel}
      />
    </div>
  );
};

