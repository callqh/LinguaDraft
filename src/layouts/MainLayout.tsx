import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { useUiStore } from "@/stores/useUiStore";

export const MainLayout = () => {
  const sidebarPinned = useUiStore((state) => state.sidebarPinned);
  const sidebarPeek = useUiStore((state) => state.sidebarPeek);
  const setSidebarPeek = useUiStore((state) => state.setSidebarPeek);
  const visible = !sidebarPinned && sidebarPeek;

  return (
    <div className="relative h-full bg-appBg p-4">
      {sidebarPinned ? (
        <div className="h-full grid grid-cols-[280px_1fr] gap-4">
          <AppSidebar />
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
          onMouseEnter={() => setSidebarPeek(true)}
          onMouseLeave={() => setSidebarPeek(false)}
        >
          <AppSidebar />
        </div>
      ) : null}
    </div>
  );
};
