import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";

export const MainLayout = () => (
  <div className="h-full bg-appBg p-4">
    <div className="h-full grid grid-cols-[280px_1fr] gap-4">
      <AppSidebar />
      <main className="overflow-hidden">
        <Outlet />
      </main>
    </div>
  </div>
);

