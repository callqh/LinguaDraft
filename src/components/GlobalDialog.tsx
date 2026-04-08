import { useUiStore } from "@/stores/useUiStore";

export const GlobalDialog = () => {
  const dialog = useUiStore((state) => state.dialog);
  const closeDialog = useUiStore((state) => state.closeDialog);
  if (!dialog.open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center">
      <div className="panel w-[420px] p-5">
        <h3 className="text-lg font-semibold">{dialog.title}</h3>
        <p className="text-sm text-textMuted mt-2">{dialog.description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={closeDialog}>
            {dialog.cancelText ?? "取消"}
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              dialog.onConfirm?.();
              closeDialog();
            }}
          >
            {dialog.confirmText ?? "确认"}
          </button>
        </div>
      </div>
    </div>
  );
};

