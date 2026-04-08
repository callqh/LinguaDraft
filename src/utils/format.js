export const formatClock = (iso) => new Date(iso).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
});
export const formatDateTime = (iso) => new Date(iso).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
});
export const formatSize = (gb) => `${gb.toFixed(1)} GB`;
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
