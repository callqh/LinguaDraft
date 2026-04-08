import { useAppStore } from "@/stores/useAppStore";
import { formatClock } from "@/utils/format";

export const SessionList = () => {
  const sessions = useAppStore((state) => state.sessions);
  const currentSessionId = useAppStore((state) => state.currentSessionId);
  const setCurrentSession = useAppStore((state) => state.setCurrentSession);

  return (
    <div className="flex-1 min-h-0">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium">会话</div>
        <button className="text-xs text-accent">+ 新建会话</button>
      </div>
      <div className="space-y-1 overflow-auto max-h-[48vh] pr-1">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setCurrentSession(session.id)}
            className={`w-full text-left rounded-lg px-3 py-2 ${
              currentSessionId === session.id ? "bg-blue-50" : "hover:bg-slate-50"
            }`}
          >
            <div className="text-sm truncate">{session.title}</div>
            <div className="text-[11px] text-textMuted">{formatClock(session.updatedAt)}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

