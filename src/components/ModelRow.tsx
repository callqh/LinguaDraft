import type { LocalModel } from "@/types";

type Props = {
  model: LocalModel;
  onDownload: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
};

const statusText: Record<LocalModel["status"], string> = {
  not_installed: "未安装",
  downloading: "下载中",
  paused: "已暂停",
  installed: "已安装",
  failed: "下载失败"
};

export const ModelRow = ({ model, onDownload, onPause, onResume, onCancel, onDelete }: Props) => (
  <div className="grid grid-cols-[1.2fr_120px_120px_170px] items-center gap-2 rounded-xl border border-borderSoft bg-white px-3 py-3 text-sm">
    <div>
      <div className="font-medium">{model.language ?? "中文语音识别"}</div>
      <div className="text-xs text-textMuted">{model.version}</div>
    </div>
    <div className="text-textMuted">{statusText[model.status]}</div>
    <div className="text-textMuted">{model.size.toFixed(1)} GB</div>
    <div className="flex items-center justify-end gap-1">
      {model.status === "not_installed" && (
        <button className="btn-ghost text-xs" onClick={() => onDownload(model.id)}>
          下载
        </button>
      )}
      {model.status === "downloading" && (
        <>
          <button className="btn-ghost text-xs" onClick={() => onPause(model.id)}>
            暂停
          </button>
          <button className="btn-ghost text-xs" onClick={() => onCancel(model.id)}>
            取消
          </button>
        </>
      )}
      {model.status === "paused" && (
        <button className="btn-ghost text-xs" onClick={() => onResume(model.id)}>
          继续
        </button>
      )}
      {model.status === "failed" && (
        <button className="btn-ghost text-xs" onClick={() => onDownload(model.id)}>
          重试
        </button>
      )}
      {model.status === "installed" && (
        <button className="btn-ghost text-xs text-red-500" onClick={() => onDelete(model.id)}>
          删除
        </button>
      )}
    </div>
    {(model.status === "downloading" || model.status === "failed") && (
      <div className="col-span-4 mt-1 h-1.5 rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-accent" style={{ width: `${model.progress ?? 0}%` }} />
      </div>
    )}
  </div>
);

