import { NavLink } from "react-router-dom";
import { PanelLeftClose, Pin } from "lucide-react";
import { SessionList } from "@/components/SessionList";

const menu = [
  { label: "工作台", to: "/workbench" },
  { label: "模型管理", to: "/models" },
  { label: "设置", to: "/settings" }
];

type Props = {
  pinned?: boolean;
  onTogglePinned?: () => void;
};

export const AppSidebar = ({ pinned = true, onTogglePinned }: Props) => (
  <aside className="panel h-full p-4 flex flex-col">
    <div className="mb-4 flex items-start justify-between">
      <div className="min-w-0">
        <div className="text-lg font-semibold">写译 · 本地</div>
        <div className="text-xs text-textMuted">离线写作翻译工具</div>
      </div>
      <button
        aria-label={pinned ? "收起侧边栏" : "固定侧边栏"}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
        onClick={onTogglePinned}
      >
        {pinned ? <PanelLeftClose size={16} /> : <Pin size={15} />}
      </button>
    </div>
    <nav className="space-y-2 mb-5">
      {menu.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `block rounded-xl px-3 py-2 text-sm ${isActive ? "bg-blue-50 text-accent" : "text-textMain hover:bg-slate-50"}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
    <SessionList />
    <div className="mt-auto border-t border-borderSoft pt-3 text-xs text-textMuted">
      <div>已用 12.4 GB / 50 GB</div>
      <div className="h-2 rounded-full bg-slate-100 mt-2 overflow-hidden">
        <div className="h-full w-1/4 bg-accent" />
      </div>
    </div>
  </aside>
);
