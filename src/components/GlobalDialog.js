import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useUiStore } from "@/stores/useUiStore";
export const GlobalDialog = () => {
    const dialog = useUiStore((state) => state.dialog);
    const closeDialog = useUiStore((state) => state.closeDialog);
    if (!dialog.open)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black/30 z-40 flex items-center justify-center", children: _jsxs("div", { className: "panel w-[420px] p-5", children: [_jsx("h3", { className: "text-lg font-semibold", children: dialog.title }), _jsx("p", { className: "text-sm text-textMuted mt-2", children: dialog.description }), _jsxs("div", { className: "mt-5 flex justify-end gap-2", children: [_jsx("button", { className: "btn-ghost", onClick: closeDialog, children: dialog.cancelText ?? "取消" }), _jsx("button", { className: "btn-primary", onClick: () => {
                                dialog.onConfirm?.();
                                closeDialog();
                            }, children: dialog.confirmText ?? "确认" })] })] }) }));
};
