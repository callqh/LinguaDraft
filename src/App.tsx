import { Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { WorkbenchPage } from "@/pages/WorkbenchPage";
import { ModelsPage } from "@/pages/ModelsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { GlobalDialog } from "@/components/GlobalDialog";
import { ToastNotice } from "@/components/ToastNotice";

function App() {
  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/workbench" replace />} />
          <Route path="/workbench" element={<WorkbenchPage />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      <GlobalDialog />
      <ToastNotice />
    </>
  );
}

export default App;

