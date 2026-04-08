import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const TranslationBlock = ({ text, status }) => {
    const body = status === "translating" ? "翻译中..." : status === "failed" ? "翻译失败" : text || "未翻译";
    return (_jsxs("div", { className: "rounded-xl border border-borderSoft p-3 bg-white min-h-[84px]", children: [_jsx("div", { className: "text-xs text-textMuted mb-1", children: "\u8BD1\u6587" }), _jsx("p", { className: "text-sm leading-6 whitespace-pre-wrap", children: body })] }));
};
