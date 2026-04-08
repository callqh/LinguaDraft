import type { SettingsCategory } from "@/stores/useSettingsStore";

type Props = {
  active: SettingsCategory;
  microphoneName: string;
  microphonePermission: string;
  shortcutVoice: string;
  shortcutStop: string;
  defaultTranslation: boolean;
  defaultTargetLang: string;
  dualPanelEnabled: boolean;
  modelStoragePath: string;
  onRefreshPermission: () => void;
  onToggleDefaultTranslation: (v: boolean) => void;
  onDefaultTargetLangChange: (v: string) => void;
  onToggleDualPanel: () => void;
};

export const SettingsPanel = ({
  active,
  microphoneName,
  microphonePermission,
  shortcutVoice,
  shortcutStop,
  defaultTranslation,
  defaultTargetLang,
  dualPanelEnabled,
  modelStoragePath,
  onRefreshPermission,
  onToggleDefaultTranslation,
  onDefaultTargetLangChange,
  onToggleDualPanel
}: Props) => (
  <section className="panel p-5">
    <h2 className="text-xl font-semibold mb-4">{active}</h2>
    {(active === "通用" || active === "语音输入") && (
      <div className="space-y-3">
        <div className="rounded-xl border border-borderSoft p-4">
          <div className="text-sm mb-2">麦克风设备</div>
          <div className="text-sm text-textMuted">{microphoneName}</div>
        </div>
        <div className="rounded-xl border border-borderSoft p-4 flex items-center justify-between">
          <div className="text-sm">权限状态：{microphonePermission}</div>
          <button className="btn-ghost text-xs" onClick={onRefreshPermission}>
            重新检查权限
          </button>
        </div>
        <div className="rounded-xl border border-borderSoft p-4">
          <div className="font-medium text-sm mb-2">快捷键</div>
          <div className="text-sm text-textMuted">语音输入：{shortcutVoice}</div>
          <div className="text-sm text-textMuted">停止录音：{shortcutStop}</div>
        </div>
      </div>
    )}

    {(active === "通用" || active === "翻译") && (
      <div className="space-y-3 mt-4">
        <div className="rounded-xl border border-borderSoft p-4 flex items-center justify-between">
          <div className="text-sm">默认翻译开关</div>
          <button className="btn-ghost text-xs" onClick={() => onToggleDefaultTranslation(!defaultTranslation)}>
            {defaultTranslation ? "已开启" : "已关闭"}
          </button>
        </div>
        <div className="rounded-xl border border-borderSoft p-4 flex items-center justify-between">
          <div className="text-sm">默认目标语言</div>
          <select
            value={defaultTargetLang}
            onChange={(event) => onDefaultTargetLangChange(event.target.value)}
            className="h-9 rounded-xl border border-borderSoft px-3 text-sm"
          >
            <option>中文</option>
            <option>英文</option>
            <option>日文</option>
            <option>韩文</option>
            <option>法文</option>
            <option>德文</option>
          </select>
        </div>
        <div className="rounded-xl border border-borderSoft p-4 flex items-center justify-between">
          <div className="text-sm">原文 / 译文双区显示</div>
          <button className="btn-ghost text-xs" onClick={onToggleDualPanel}>
            {dualPanelEnabled ? "开启" : "关闭"}
          </button>
        </div>
      </div>
    )}

    {(active === "通用" || active === "存储") && (
      <div className="space-y-3 mt-4">
        <div className="rounded-xl border border-borderSoft p-4">
          <div className="text-sm mb-1">模型存储路径</div>
          <div className="text-sm text-textMuted">{modelStoragePath}</div>
        </div>
        <div className="rounded-xl border border-borderSoft p-4 flex items-center justify-between">
          <div className="text-sm">已用空间：12.4 GB / 50 GB</div>
          <button className="btn-ghost text-xs">清理缓存</button>
        </div>
      </div>
    )}

    {active === "关于" && (
      <div className="rounded-xl border border-borderSoft p-4">
        <div className="text-sm">LinguaDraft MVP</div>
        <div className="text-sm text-textMuted mt-1">版本 0.1.0 · 当前为 mock 演示能力</div>
      </div>
    )}
  </section>
);

