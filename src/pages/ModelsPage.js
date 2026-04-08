import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { DownloadProgressCard } from "@/components/DownloadProgressCard";
import { ModelList } from "@/components/ModelList";
import { ModelTabs } from "@/components/ModelTabs";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
export const ModelsPage = () => {
    const [tab, setTab] = useState("translation");
    const models = useAppStore((state) => state.models);
    const downloadModel = useAppStore((state) => state.downloadModel);
    const pauseDownload = useAppStore((state) => state.pauseDownload);
    const resumeDownload = useAppStore((state) => state.resumeDownload);
    const cancelDownload = useAppStore((state) => state.cancelDownload);
    const deleteModel = useAppStore((state) => state.deleteModel);
    const showToast = useUiStore((state) => state.showToast);
    const list = useMemo(() => models.filter((item) => item.type === tab), [models, tab]);
    return (_jsx("div", { className: "h-full overflow-auto pr-1", children: _jsxs("div", { className: "panel p-5 space-y-4", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "\u6A21\u578B\u7BA1\u7406" }), _jsx(ModelTabs, { value: tab, onChange: setTab }), _jsx(ModelList, { models: list, onDownload: (id) => downloadModel(id, showToast), onPause: pauseDownload, onResume: resumeDownload, onCancel: (id) => cancelDownload(id, showToast), onDelete: (id) => deleteModel(id, showToast) }), _jsx(DownloadProgressCard, { models: models }), _jsxs("div", { className: "rounded-xl border border-borderSoft p-4 flex items-center justify-between", children: [_jsxs("div", { className: "text-sm text-textMuted", children: [_jsx("div", { children: "\u5B58\u50A8\u4F4D\u7F6E\uFF1AD:\\\\AI-Models" }), _jsx("div", { children: "\u5DF2\u7528\u7A7A\u95F4\uFF1A12.4 GB / 50 GB" })] }), _jsx("button", { className: "btn-ghost text-xs", children: "\u6E05\u7406\u7F13\u5B58" })] })] }) }));
};
