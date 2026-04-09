import { Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { WorkbenchPage } from "@/pages/WorkbenchPage";
import { ModelsPage } from "@/pages/ModelsPage";
import { GlobalDialog } from "@/components/GlobalDialog";
import { ToastNotice } from "@/components/ToastNotice";
import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";

function App() {
  const initializeModels = useAppStore((state) => state.initializeModels);
  useEffect(() => {
    void initializeModels();
  }, [initializeModels]);

  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/workbench" replace />} />
          <Route path="/workbench" element={<WorkbenchPage />} />
          <Route path="/models" element={<ModelsPage />} />
        </Route>
      </Routes>
      <GlobalDialog />
      <ToastNotice />
    </>
  );
}

export default App;
