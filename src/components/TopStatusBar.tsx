import { Link } from "react-router-dom";
import {
  Languages,
  LoaderCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  SquareFunction,
} from "lucide-react";

type Props = {
  title: string;
  detectedLang: string;
  translationEnabled: boolean;
  targetLang: string;
  sidebarPinned?: boolean;
  onToggleSidebarPinned?: () => void;
  onSidebarTriggerHover?: (value: boolean) => void;
};

export const TopStatusBar = ({
  title,
  detectedLang,
  translationEnabled,
  targetLang,
  sidebarPinned = true,
  onToggleSidebarPinned,
  onSidebarTriggerHover,
}: Props) => (
  <div className="panel px-4 py-3 flex items-center justify-between">
    <div className="flex items-center gap-5">
      <button
        aria-label={sidebarPinned ? "收起侧边栏" : "展开侧边栏"}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
        onMouseEnter={() => onSidebarTriggerHover?.(true)}
        onMouseLeave={() => onSidebarTriggerHover?.(false)}
        onClick={onToggleSidebarPinned}
      >
        {sidebarPinned ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
      </button>
      <div className="font-semibold">{title}</div>
      <div className="hidden lg:flex items-center gap-4 text-xs text-textMuted">
        <span className="inline-flex items-center gap-1">
          <SquareFunction size={14} />
          自动识别：{detectedLang}
        </span>
        <span className="inline-flex items-center gap-1">
          {translationEnabled ? (
            <LoaderCircle size={14} className="animate-spin text-accent" />
          ) : (
            <Sparkles size={14} />
          )}
          翻译：{translationEnabled ? "开启" : "关闭"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Languages size={14} />
          目标语言：{targetLang}
        </span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Link className="btn-ghost text-xs px-3 py-1.5" to="/models">
        模型管理
      </Link>
      <Link className="btn-ghost text-xs px-3 py-1.5" to="/settings">
        <Settings size={14} className="mr-1" />
        设置
      </Link>
    </div>
  </div>
);
