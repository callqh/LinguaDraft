export const formatClock = (iso: string) =>
  new Date(iso).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

export const formatSize = (gb: number) => `${gb.toFixed(1)} GB`;

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
