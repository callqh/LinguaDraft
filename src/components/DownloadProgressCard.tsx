import type { LocalModel } from "@/types";

type Props = {
  models: LocalModel[];
};

export const DownloadProgressCard = ({ models }: Props) => {
  const downloading = models.filter((item) => item.status === "downloading");
  if (downloading.length === 0) return null;
  return (
    <div className="panel p-4">
      <div className="font-medium mb-2">下载进度</div>
      <div className="space-y-2">
        {downloading.map((item) => (
          <div key={item.id}>
            <div className="flex justify-between text-sm mb-1">
              <span>{item.language ?? "语音识别"}</span>
              <span>{item.progress ?? 0}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-accent" style={{ width: `${item.progress ?? 0}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

