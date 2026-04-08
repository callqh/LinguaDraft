import { useMemo, useState } from "react";
import { Check, PencilLine, Plus, Trash2, X } from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";
import { useUiStore } from "@/stores/useUiStore";
import { formatClock } from "@/utils/format";

export const SessionList = () => {
  const sessions = useAppStore((state) => state.sessions);
  const currentSessionId = useAppStore((state) => state.currentSessionId);
  const setCurrentSession = useAppStore((state) => state.setCurrentSession);
  const createSession = useAppStore((state) => state.createSession);
  const renameSession = useAppStore((state) => state.renameSession);
  const deleteSession = useAppStore((state) => state.deleteSession);
  const openDialog = useUiStore((state) => state.openDialog);
  const showToast = useUiStore((state) => state.showToast);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const editingSession = useMemo(
    () => sessions.find((session) => session.id === editingId),
    [editingId, sessions],
  );

  const handleCreate = () => {
    createSession();
    showToast("已新建会话", "success");
  };

  const handleRenameStart = (sessionId: string, title: string) => {
    setEditingId(sessionId);
    setDraftTitle(title);
  };

  const handleRenameConfirm = () => {
    if (!editingId) return;
    renameSession(editingId, draftTitle);
    setEditingId(null);
    setDraftTitle("");
    showToast("会话标题已更新", "success");
  };

  const handleDelete = (sessionId: string, title: string) => {
    openDialog({
      title: "删除会话",
      description: `确认删除「${title}」吗？该会话记录将一并移除。`,
      confirmText: "删除",
      cancelText: "取消",
      onConfirm: () => {
        const result = deleteSession(sessionId);
        if (result === "blocked-last") {
          showToast("至少保留一个会话", "warning");
          return;
        }
        showToast("会话已删除", "success");
      },
    });
  };

  return (
    <div className="flex-1 min-h-0">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium">会话</div>
        <button
          data-testid="session-create"
          className="inline-flex items-center rounded-md px-2 py-1 text-xs text-accent hover:bg-blue-50"
          onClick={handleCreate}
        >
          <Plus size={14} className="mr-1" />
          新建会话
        </button>
      </div>
      <div className="space-y-1 overflow-auto max-h-[48vh] pr-1">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`group relative rounded-lg px-2 py-1.5 ${
              currentSessionId === session.id ? "bg-blue-50" : "hover:bg-slate-50"
            }`}
          >
            <button
              data-testid={`session-item-${session.id}`}
              onClick={() => setCurrentSession(session.id)}
              className="w-full text-left flex items-center justify-between gap-2 pr-16"
            >
              {editingId === session.id ? (
                <input
                  data-testid={`session-title-input-${session.id}`}
                  autoFocus
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleRenameConfirm();
                    }
                    if (event.key === "Escape") {
                      setEditingId(null);
                      setDraftTitle("");
                    }
                  }}
                  className="w-full rounded-md border border-borderSoft px-2 py-1 text-sm outline-none"
                />
              ) : (
                <div className="min-w-0 flex-1 text-sm truncate">{session.title}</div>
              )}
              <div className="text-[11px] text-textMuted shrink-0">{formatClock(session.updatedAt)}</div>
            </button>
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
              {editingId === session.id ? (
                <>
                  <button
                    data-testid={`session-rename-confirm-${session.id}`}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50"
                    onClick={handleRenameConfirm}
                  >
                    <Check size={13} />
                  </button>
                  <button
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                    onClick={() => {
                      setEditingId(null);
                      setDraftTitle("");
                    }}
                  >
                    <X size={13} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    data-testid={`session-rename-${session.id}`}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRenameStart(session.id, session.title);
                    }}
                  >
                    <PencilLine size={13} />
                  </button>
                  <button
                    data-testid={`session-delete-${session.id}`}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(session.id, session.title);
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {editingSession ? (
        <div className="mt-2 text-[11px] text-textMuted">
          正在编辑：{editingSession.title}
        </div>
      ) : null}
    </div>
  );
};
