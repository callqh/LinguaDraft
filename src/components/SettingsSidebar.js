import { jsx as _jsx } from "react/jsx-runtime";
const items = ["通用", "语音输入", "翻译", "存储", "关于"];
export const SettingsSidebar = ({ value, onChange }) => (_jsx("aside", { className: "panel p-3", children: _jsx("div", { className: "space-y-1", children: items.map((item) => (_jsx("button", { onClick: () => onChange(item), className: `w-full text-left rounded-xl px-3 py-2 text-sm ${value === item ? "bg-blue-50 text-accent" : "hover:bg-slate-50"}`, children: item }, item))) }) }));
