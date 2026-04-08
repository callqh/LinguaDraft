import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
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
    </div>
  );
};
