import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAppStore } from "@/stores/useAppStore";
import { formatClock } from "@/utils/format";
export const SessionList = () => {
    const sessions = useAppStore((state) => state.sessions);
    const currentSessionId = useAppStore((state) => state.currentSessionId);
    const setCurrentSession = useAppStore((state) => state.setCurrentSession);
    return (_jsxs("div", { className: "flex-1 min-h-0", children: [_jsxs("div", { className: "mb-2 flex items-center justify-between", children: [_jsx("div", { className: "text-sm font-medium", children: "\u4F1A\u8BDD" }), _jsx("button", { className: "text-xs text-accent", children: "+ \u65B0\u5EFA\u4F1A\u8BDD" })] }), _jsx("div", { className: "space-y-1 overflow-auto max-h-[48vh] pr-1", children: sessions.map((session) => (_jsxs("button", { onClick: () => setCurrentSession(session.id), className: `w-full text-left rounded-lg px-3 py-2 ${currentSessionId === session.id ? "bg-blue-50" : "hover:bg-slate-50"}`, children: [_jsx("div", { className: "text-sm truncate", children: session.title }), _jsx("div", { className: "text-[11px] text-textMuted", children: formatClock(session.updatedAt) })] }, session.id))) })] }));
};
