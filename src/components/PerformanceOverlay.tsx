import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Cpu, Gauge, HardDriveDownload, MemoryStick, X } from "lucide-react";

type PerfPayload = Awaited<
  ReturnType<NonNullable<typeof window.linguaDraft>["performance"]["metrics"]>
>;

type Props = {
  side: "left" | "right";
  open: boolean;
  onClose: () => void;
};

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit >= 2 ? 2 : 0)} ${units[unit]}`;
};

const useFps = (enabled: boolean) => {
  const [fps, setFps] = useState(0);
  const rafRef = useRef<number | null>(null);
  const last = useRef(performance.now());
  const frames = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const tick = (time: number) => {
      frames.current += 1;
      const elapsed = time - last.current;
      if (elapsed >= 1000) {
        setFps(Math.round((frames.current * 1000) / elapsed));
        frames.current = 0;
        last.current = time;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  return fps;
};

export const PerformanceOverlay = ({ side, open, onClose }: Props) => {
  const [payload, setPayload] = useState<PerfPayload | null>(null);
  const [jsHeap, setJsHeap] = useState<{ used: number; total: number } | null>(null);
  const [error, setError] = useState<string>("");
  const fps = useFps(open);

  useEffect(() => {
    if (!open) return;
    let timer: number | null = null;
    const poll = async () => {
      try {
        if (!window.linguaDraft?.performance) return;
        const res = await window.linguaDraft.performance.metrics();
        setPayload(res);
        setError("");
        const memory = (performance as Performance & {
          memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
        }).memory;
        if (memory) {
          setJsHeap({ used: memory.usedJSHeapSize, total: memory.totalJSHeapSize });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "性能数据采集失败");
      }
    };
    void poll();
    timer = window.setInterval(() => void poll(), 1000);
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [open]);

  const processes = payload?.app.processes ?? [];
  const mainProc = useMemo(
    () => processes.find((item) => item.type === "Browser"),
    [processes],
  );
  const rendererProc = useMemo(
    () => processes.find((item) => item.type === "Tab"),
    [processes],
  );
  const totalWorkingSet = useMemo(
    () =>
      processes.reduce(
        // Electron metric memory fields are KB, convert to bytes.
        (sum, item) => sum + (item.memory?.workingSetSize ?? 0) * 1024,
        0,
      ),
    [processes],
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 z-50 h-full w-[380px] border-borderSoft bg-white shadow-2xl transition-transform ${
          side === "right"
            ? `right-0 border-l ${open ? "translate-x-0" : "translate-x-full"}`
            : `left-0 border-r ${open ? "translate-x-0" : "-translate-x-full"}`
        }`}
      >
        <div className="flex items-center justify-between border-b border-borderSoft px-4 py-3">
          <div className="text-sm font-semibold">性能分析面板</div>
          <button
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            aria-label="关闭性能面板"
          >
            <X size={16} />
          </button>
        </div>
        <div className="h-[calc(100%-53px)] overflow-auto p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-borderSoft p-3">
              <div className="flex items-center gap-1 text-xs text-textMuted"><Activity size={12} /> FPS</div>
              <div className="mt-1 text-xl font-semibold">{fps}</div>
            </div>
            <div className="rounded-xl border border-borderSoft p-3">
              <div className="flex items-center gap-1 text-xs text-textMuted"><Cpu size={12} /> 主进程 CPU</div>
              <div className="mt-1 text-xl font-semibold">{mainProc?.cpu?.percentCPUUsage?.toFixed(1) ?? "0.0"}%</div>
            </div>
            <div className="rounded-xl border border-borderSoft p-3">
              <div className="flex items-center gap-1 text-xs text-textMuted"><MemoryStick size={12} /> App 内存</div>
            <div className="mt-1 text-xl font-semibold">
              {payload ? formatBytes(totalWorkingSet) : "-"}
            </div>
          </div>
          <div className="rounded-xl border border-borderSoft p-3">
            <div className="flex items-center gap-1 text-xs text-textMuted"><HardDriveDownload size={12} /> 系统可用</div>
            <div className="mt-1 text-xl font-semibold">
              {payload ? formatBytes(payload.system.freeMem) : "-"}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-borderSoft p-3 space-y-1 text-sm">
          <div className="font-medium">运行进程</div>
          <div>主进程内存：{mainProc?.memory ? formatBytes(mainProc.memory.workingSetSize * 1024) : "-"}</div>
          <div>渲染进程内存：{rendererProc?.memory ? formatBytes(rendererProc.memory.workingSetSize * 1024) : "-"}</div>
          <div>渲染进程 CPU：{rendererProc?.cpu?.percentCPUUsage?.toFixed(1) ?? "0.0"}%</div>
          <div>
            JS Heap：{jsHeap ? `${formatBytes(jsHeap.used)} / ${formatBytes(jsHeap.total)}` : "-"}
          </div>
        </div>

          <div className="rounded-xl border border-borderSoft p-3 space-y-1 text-sm">
            <div className="flex items-center gap-1 font-medium"><Gauge size={14} /> GPU 状态</div>
            <div>GPU 合成：{payload?.gpu.status?.gpu_compositing ?? "-"}</div>
            <div>Rasterization：{payload?.gpu.status?.rasterization ?? "-"}</div>
            <div>WebGL：{payload?.gpu.status?.webgl ?? payload?.gpu.status?.webgl2 ?? "-"}</div>
          </div>

          <div className="rounded-xl border border-borderSoft p-3 space-y-1 text-xs text-textMuted">
            <div>平台：{payload?.system.platform ?? "-"}</div>
            <div>CPU 核心：{payload?.system.cpuCount ?? "-"}</div>
            <div>系统负载(1m)：{payload?.system.loadAvg?.[0]?.toFixed(2) ?? "-"}</div>
          <div>最近刷新：{payload ? new Date(payload.timestamp).toLocaleTimeString() : "-"}</div>
          {error ? <div className="text-red-500">采集错误：{error}</div> : null}
        </div>
      </div>
    </aside>
    </>
  );
};
