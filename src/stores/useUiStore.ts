import { create } from "zustand";
import type { DialogState, ToastItem, ToastType } from "@/types";

type UiState = {
  dialog: DialogState;
  toasts: ToastItem[];
  sidebarPinned: boolean;
  sidebarPeek: boolean;
  openDialog: (dialog: Omit<DialogState, "open">) => void;
  closeDialog: () => void;
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  setSidebarPinned: (value: boolean) => void;
  setSidebarPeek: (value: boolean) => void;
  scheduleSidebarPeekHide: (delayMs?: number) => void;
  cancelSidebarPeekHide: () => void;
};

let sidebarHideTimer: number | null = null;

export const useUiStore = create<UiState>((set) => ({
  dialog: {
    open: false,
    title: "",
    description: "",
    cancelText: "取消",
    confirmText: "确认"
  },
  toasts: [],
  sidebarPinned: true,
  sidebarPeek: false,
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
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
  setSidebarPinned: (value) => set({ sidebarPinned: value }),
  setSidebarPeek: (value) => set({ sidebarPeek: value }),
  scheduleSidebarPeekHide: (delayMs = 180) => {
    if (sidebarHideTimer) {
      window.clearTimeout(sidebarHideTimer);
    }
    sidebarHideTimer = window.setTimeout(() => {
      set({ sidebarPeek: false });
      sidebarHideTimer = null;
    }, delayMs);
  },
  cancelSidebarPeekHide: () => {
    if (sidebarHideTimer) {
      window.clearTimeout(sidebarHideTimer);
      sidebarHideTimer = null;
    }
  },
}));
