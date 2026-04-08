import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
export const MainLayout = () => (_jsx("div", { className: "h-full bg-appBg p-4", children: _jsxs("div", { className: "h-full grid grid-cols-[280px_1fr] gap-4", children: [_jsx(AppSidebar, {}), _jsx("main", { className: "overflow-hidden", children: _jsx(Outlet, {}) })] }) }));
