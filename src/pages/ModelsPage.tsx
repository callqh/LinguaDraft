import { useEffect, useMemo, useState } from "react";
import { DownloadProgressCard } from "@/components/DownloadProgressCard";
import { ModelList } from "@/components/ModelList";
import { useAppStore } from "@/stores/useAppStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useUiStore } from "@/stores/useUiStore";

export const ModelsPage = () => {
  const [activeTab, setActiveTab] = useState<"local" | "remote">("local");
  const [diagLoading, setDiagLoading] = useState(false);
  const [sidecarDiag, setSidecarDiag] = useState<{
    selectedPython: string;
    pythonSource: "bundled" | "runtime-venv" | "system" | "unknown";
    depsReady: boolean;
    sidecarEntry: string;
    requirementsPath: string;
    runtimeVenvRoot: string;
    modelRoot: string;
    healthReason?: string;
    lastError?: string;
    ready: boolean;
  } | null>(null);
  const models = useAppStore((state) => state.models);
  const deepSeekEnabled = useSettingsStore((state) => state.deepSeekEnabled);
  const deepSeekApiKey = useSettingsStore((state) => state.deepSeekApiKey);
  const setDeepSeekEnabled = useSettingsStore((state) => state.setDeepSeekEnabled);
  const setDeepSeekApiKey = useSettingsStore((state) => state.setDeepSeekApiKey);
  const downloadModel = useAppStore((state) => state.downloadModel);
  const pauseDownload = useAppStore((state) => state.pauseDownload);
  const resumeDownload = useAppStore((state) => state.resumeDownload);
  const cancelDownload = useAppStore((state) => state.cancelDownload);
  const deleteModel = useAppStore((state) => state.deleteModel);
  const showToast = useUiStore((state) => state.showToast);

  const translationModels = useMemo(
    () => models.filter((item) => item.type === "translation"),
    [models],
  );

  const loadSidecarDiag = async () => {
    if (!window.linguaDraft?.sidecar) return;
    setDiagLoading(true);
    try {
      const payload = await window.linguaDraft.sidecar.diagnose();
      setSidecarDiag(payload);
    } finally {
      setDiagLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "remote") return;
    void loadSidecarDiag();
  }, [activeTab]);

  return (
    <div className="h-full overflow-auto pr-1">
      <div className="panel p-5 space-y-4">
        <h1 className="text-2xl font-semibold">模型管理</h1>
        <div className="inline-flex rounded-xl border border-borderSoft bg-white p-1">
          <button
            className={`px-4 py-1.5 text-sm rounded-lg transition ${
              activeTab === "local"
                ? "bg-blue-50 text-accent"
                : "text-textMain hover:bg-slate-50"
            }`}
            onClick={() => setActiveTab("local")}
          >
            本地模型
          </button>
          <button
            className={`px-4 py-1.5 text-sm rounded-lg transition ${
              activeTab === "remote"
                ? "bg-blue-50 text-accent"
                : "text-textMain hover:bg-slate-50"
            }`}
            onClick={() => setActiveTab("remote")}
          >
            远程模型
          </button>
        </div>

        {activeTab === "local" ? (
          <>
            <div className="rounded-xl border border-borderSoft bg-white p-3 text-xs text-textMuted">
              下载对应语言模型后，可在工作台直接翻译到该语言（示例：下载日文模型后可翻译中文 → 日文）。
            </div>
            <ModelList
              models={translationModels}
              onDownload={(id) => downloadModel(id, showToast)}
              onPause={pauseDownload}
              onResume={resumeDownload}
              onCancel={(id) => cancelDownload(id, showToast)}
              onDelete={(id) => deleteModel(id, showToast)}
            />
            <DownloadProgressCard models={translationModels} />
          </>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border border-borderSoft bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">DeepSeek 远程翻译模型</div>
                <button
                  type="button"
                  aria-label="切换远程模型"
                  onClick={() => setDeepSeekEnabled(!deepSeekEnabled)}
                  className={`relative h-6 w-11 rounded-full transition ${
                    deepSeekEnabled ? "bg-accent" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                      deepSeekEnabled ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-textMuted">
                  开启后优先使用 DeepSeek，关闭则仅使用本地模型。
                </span>
                <span
                  className={
                    deepSeekEnabled ? "text-emerald-600" : "text-textMuted"
                  }
                >
                  {deepSeekEnabled ? "当前：远程优先" : "当前：本地模型"}
                </span>
              </div>

              {deepSeekEnabled ? (
                <div>
                  <div className="text-xs text-textMuted mb-1">API Key</div>
                  <input
                    type="password"
                    value={deepSeekApiKey}
                    onChange={(event) => setDeepSeekApiKey(event.target.value)}
                    placeholder="请输入 DeepSeek API Key"
                    className="w-full h-9 rounded-xl border border-borderSoft px-3 text-sm outline-none focus:border-blue-300"
                  />
                </div>
              ) : null}

              <div className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-textMuted">
                模型名：deepseek-chat（官方 Chat Completions 接口）
              </div>
            </div>

            <div className="rounded-xl border border-borderSoft bg-white p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">Sidecar 启动自检</div>
                <button
                  className="btn-ghost text-xs"
                  onClick={() => void loadSidecarDiag()}
                  disabled={diagLoading}
                >
                  {diagLoading ? "刷新中..." : "刷新"}
                </button>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-[11px] text-textMuted space-y-1.5 break-all">
                <div>状态：{sidecarDiag?.ready ? "已就绪" : "未就绪"}</div>
                <div>依赖：{sidecarDiag?.depsReady ? "已就绪" : "未就绪"}</div>
                <div>Python：{sidecarDiag?.selectedPython || "-"}</div>
                <div>Python 来源：{sidecarDiag?.pythonSource || "-"}</div>
                <div>Sidecar 入口：{sidecarDiag?.sidecarEntry || "-"}</div>
                <div>Requirements：{sidecarDiag?.requirementsPath || "-"}</div>
                <div>Runtime venv：{sidecarDiag?.runtimeVenvRoot || "-"}</div>
                <div>模型目录：{sidecarDiag?.modelRoot || "-"}</div>
                {sidecarDiag?.healthReason ? <div>健康检查：{sidecarDiag.healthReason}</div> : null}
                {sidecarDiag?.lastError ? <div className="text-red-500">最近错误：{sidecarDiag.lastError}</div> : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
