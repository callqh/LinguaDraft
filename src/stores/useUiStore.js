import { create } from "zustand";
export const useUiStore = create((set) => ({
    dialog: {
        open: false,
        title: "",
        description: "",
        cancelText: "取消",
        confirmText: "确认"
    },
    toasts: [],
    openDialog: (dialog) => {
        set({ dialog: { ...dialog, open: true } });
    },
    closeDialog: () => {
        set((state) => ({ dialog: { ...state.dialog, open: false } }));
    },
    showToast: (message, type = "info") => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
        window.setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
        }, 2800);
    },
    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }))
}));
