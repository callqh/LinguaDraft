import { Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { WorkbenchPage } from "@/pages/WorkbenchPage";
import { ModelsPage } from "@/pages/ModelsPage";
import { GlobalDialog } from "@/components/GlobalDialog";
import { ToastNotice } from "@/components/ToastNotice";
import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { AppBootSplash } from "@/components/AppBootSplash";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const withTimeout = async <T,>(promise: Promise<T>, ms: number) => {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) =>
      setTimeout(() => reject(new Error("init-timeout")), ms),
    ),
  ]);
};

function App() {
  const initializeModels = useAppStore((state) => state.initializeModels);
  const [booting, setBooting] = useState(true);
  const [bootStatus, setBootStatus] = useState("正在加载模型清单...");

  useEffect(() => {
    let disposed = false;
    const startAt = Date.now();

    const run = async () => {
      try {
        setBootStatus("正在加载模型清单...");
        await withTimeout(initializeModels(), 12000);
      } catch {
        // keep going, user can still open app and diagnose from models page
      }

      try {
        if (window.linguaDraft?.sidecar?.diagnose) {
          setBootStatus("正在检查本地服务...");
          await withTimeout(window.linguaDraft.sidecar.diagnose(), 8000);
        }
      } catch {
        // keep going, sidecar may still come up lazily on demand
      }

      const elapsed = Date.now() - startAt;
      if (elapsed < 900) {
        await wait(900 - elapsed);
      }
      if (!disposed) setBooting(false);
    };

    void run();
    return () => {
      disposed = true;
    };
  }, [initializeModels]);

  return (
    <>
      {booting ? <AppBootSplash statusText={bootStatus} /> : null}
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
