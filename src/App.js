import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { WorkbenchPage } from "@/pages/WorkbenchPage";
import { ModelsPage } from "@/pages/ModelsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { GlobalDialog } from "@/components/GlobalDialog";
import { ToastNotice } from "@/components/ToastNotice";
function App() {
    return (_jsxs(_Fragment, { children: [_jsx(Routes, { children: _jsxs(Route, { element: _jsx(MainLayout, {}), children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/workbench", replace: true }) }), _jsx(Route, { path: "/workbench", element: _jsx(WorkbenchPage, {}) }), _jsx(Route, { path: "/models", element: _jsx(ModelsPage, {}) }), _jsx(Route, { path: "/settings", element: _jsx(SettingsPage, {}) })] }) }), _jsx(GlobalDialog, {}), _jsx(ToastNotice, {})] }));
}
export default App;
