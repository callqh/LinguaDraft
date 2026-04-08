import { useUiStore } from "@/stores/useUiStore";

const cls = {
  info: "bg-slate-900",
  success: "bg-emerald-600",
  warning: "bg-amber-500",
  error: "bg-red-600"
};

export const ToastNotice = () => {
  const toasts = useUiStore((state) => state.toasts);
  return (
    <div className="fixed right-4 top-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div key={toast.id} className={`rounded-lg px-3 py-2 text-white text-sm shadow ${cls[toast.type]}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
};

