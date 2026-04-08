import { useMemo, useState } from "react";
import { DownloadProgressCard } from "@/components/DownloadProgressCard";
import { ModelList } from "@/components/ModelList";
import { ModelTabs } from "@/components/ModelTabs";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";

export const ModelsPage = () => {
  const [tab, setTab] = useState<"asr" | "translation">("translation");
  const models = useAppStore((state) => state.models);
  const downloadModel = useAppStore((state) => state.downloadModel);
  const pauseDownload = useAppStore((state) => state.pauseDownload);
  const resumeDownload = useAppStore((state) => state.resumeDownload);
  const cancelDownload = useAppStore((state) => state.cancelDownload);
  const deleteModel = useAppStore((state) => state.deleteModel);
  const showToast = useUiStore((state) => state.showToast);

  const list = useMemo(() => models.filter((item) => item.type === tab), [models, tab]);

  return (
    <div className="h-full overflow-auto pr-1">
      <div className="panel p-5 space-y-4">
        <h1 className="text-2xl font-semibold">模型管理</h1>
        <ModelTabs value={tab} onChange={setTab} />
        <ModelList
          models={list}
          onDownload={(id) => downloadModel(id, showToast)}
          onPause={pauseDownload}
          onResume={resumeDownload}
          onCancel={(id) => cancelDownload(id, showToast)}
          onDelete={(id) => deleteModel(id, showToast)}
        />
        <DownloadProgressCard models={models} />
        <div className="rounded-xl border border-borderSoft p-4 flex items-center justify-between">
          <div className="text-sm text-textMuted">
            <div>存储位置：D:\\AI-Models</div>
            <div>已用空间：12.4 GB / 50 GB</div>
          </div>
          <button className="btn-ghost text-xs">清理缓存</button>
        </div>
      </div>
    </div>
  );
};
