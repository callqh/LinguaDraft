import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const DownloadProgressCard = ({ models }) => {
    const downloading = models.filter((item) => item.status === "downloading");
    if (downloading.length === 0)
        return null;
    return (_jsxs("div", { className: "panel p-4", children: [_jsx("div", { className: "font-medium mb-2", children: "\u4E0B\u8F7D\u8FDB\u5EA6" }), _jsx("div", { className: "space-y-2", children: downloading.map((item) => (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { children: item.language ?? "语音识别" }), _jsxs("span", { children: [item.progress ?? 0, "%"] })] }), _jsx("div", { className: "h-2 rounded-full bg-slate-100", children: _jsx("div", { className: "h-full rounded-full bg-accent", style: { width: `${item.progress ?? 0}%` } }) })] }, item.id))) })] }));
};
