import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from "react-router-dom";
import { SessionList } from "@/components/SessionList";
const menu = [
    { label: "工作台", to: "/workbench" },
    { label: "模型管理", to: "/models" },
    { label: "设置", to: "/settings" }
];
export const AppSidebar = () => (_jsxs("aside", { className: "panel h-full p-4 flex flex-col", children: [_jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "text-lg font-semibold", children: "\u5199\u8BD1 \u00B7 \u672C\u5730" }), _jsx("div", { className: "text-xs text-textMuted", children: "\u79BB\u7EBF\u5199\u4F5C\u7FFB\u8BD1\u5DE5\u5177" })] }), _jsx("nav", { className: "space-y-2 mb-5", children: menu.map((item) => (_jsx(NavLink, { to: item.to, className: ({ isActive }) => `block rounded-xl px-3 py-2 text-sm ${isActive ? "bg-blue-50 text-accent" : "text-textMain hover:bg-slate-50"}`, children: item.label }, item.to))) }), _jsx(SessionList, {}), _jsxs("div", { className: "mt-auto border-t border-borderSoft pt-3 text-xs text-textMuted", children: [_jsx("div", { children: "\u5DF2\u7528 12.4 GB / 50 GB" }), _jsx("div", { className: "h-2 rounded-full bg-slate-100 mt-2 overflow-hidden", children: _jsx("div", { className: "h-full w-1/4 bg-accent" }) })] })] }));
