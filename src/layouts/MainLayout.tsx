import { Outlet } from "react-router-dom";
import { Activity } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { PerformanceOverlay } from "@/components/PerformanceOverlay";
import { useUiStore } from "@/stores/useUiStore";

export const MainLayout = () => {
  const sidebarPinned = useUiStore((state) => state.sidebarPinned);
  const sidebarPeek = useUiStore((state) => state.sidebarPeek);
  const setSidebarPinned = useUiStore((state) => state.setSidebarPinned);
  const setSidebarPeek = useUiStore((state) => state.setSidebarPeek);
  const scheduleSidebarPeekHide = useUiStore(
    (state) => state.scheduleSidebarPeekHide,
  );
  const cancelSidebarPeekHide = useUiStore(
    (state) => state.cancelSidebarPeekHide,
  );
  const performancePanelOpen = useUiStore((state) => state.performancePanelOpen);
  const performancePanelSide = useUiStore((state) => state.performancePanelSide);
  const openPerformancePanel = useUiStore((state) => state.openPerformancePanel);
  const closePerformancePanel = useUiStore((state) => state.closePerformancePanel);
  const visible = !sidebarPinned && sidebarPeek;

  return (
    <div className="relative h-full bg-appBg p-4">
      {sidebarPinned ? (
        <div className="h-full grid grid-cols-[280px_1fr] gap-4">
          <AppSidebar
            pinned
            onTogglePinned={() => {
              setSidebarPinned(false);
              setSidebarPeek(false);
            }}
          />
          <main className="overflow-hidden">
            <Outlet />
          </main>
        </div>
      ) : (
        <div className="h-full">
          <Outlet />
        </div>
      )}

      {visible ? (
        <div
          className="absolute left-4 top-4 bottom-4 z-30 w-[280px]"
          onMouseEnter={() => {
            cancelSidebarPeekHide();
            setSidebarPeek(true);
          }}
          onMouseLeave={() => scheduleSidebarPeekHide(120)}
        >
          <AppSidebar
            pinned={false}
            onTogglePinned={() => {
              setSidebarPinned(true);
              setSidebarPeek(false);
            }}
          />
        </div>
      ) : null}

      <button
        className="fixed left-2 top-1/2 z-30 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-borderSoft bg-white text-slate-600 shadow hover:bg-slate-50"
        aria-label="打开左侧性能面板"
        onClick={() => openPerformancePanel("left")}
      >
        <Activity size={16} />
      </button>

      <PerformanceOverlay
        side={performancePanelSide}
        open={performancePanelOpen}
        onClose={closePerformancePanel}
      />
    </div>
  );
};
