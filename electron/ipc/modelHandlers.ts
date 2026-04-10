import { app, ipcMain } from "electron";
import * as os from "node:os";
import { asrRunner } from "../runtime/asrRunner";
import { lidRunner } from "../runtime/lidRunner";
import { getModelManager, type ModelManager } from "../runtime/modelManager";
import { translationRunner } from "../runtime/translationRunner";
import { getSidecarDiagnostics } from "../sidecar/processManager";

export const registerIpcHandlers = () => {
  let modelManager: ModelManager | null = null;
  const ensureModelManager = () => {
    if (modelManager) return modelManager;
    modelManager = getModelManager();
    return modelManager;
  };
  const toSerializable = (value: unknown): unknown =>
    JSON.parse(
      JSON.stringify(value, (_key, current) =>
        typeof current === "bigint" ? current.toString() : current,
      ),
    );

  ipcMain.handle("model:list", async () => ensureModelManager().listModels());
  ipcMain.handle("model:download", async (_event, modelId: string) =>
    ensureModelManager().downloadModel(modelId),
  );
  ipcMain.handle("model:pause", async (_event, modelId: string) =>
    ensureModelManager().pauseDownload(modelId),
  );
  ipcMain.handle("model:resume", async (_event, modelId: string) =>
    ensureModelManager().resumeDownload(modelId),
  );
  ipcMain.handle("model:cancel", async (_event, modelId: string) =>
    ensureModelManager().cancelDownload(modelId),
  );
  ipcMain.handle("model:delete", async (_event, modelId: string) =>
    ensureModelManager().deleteModel(modelId),
  );

  ipcMain.handle("asr:start", async () => asrRunner.start());
  ipcMain.handle("asr:stop", async () => asrRunner.stop());
  ipcMain.handle("asr:transcribe", async () => asrRunner.transcribe());
  ipcMain.handle(
    "asr:transcribe-audio",
    async (_event, raw: ArrayBuffer, extension?: string) =>
      asrRunner.transcribeAudioBuffer(raw, extension),
  );

  ipcMain.handle("language:detect", async (_event, text: string) => lidRunner.detect(text));
  ipcMain.handle("translation:detect", async (_event, text: string) => translationRunner.detectLanguage(text));
  ipcMain.handle("translation:run", async (_event, text: string, targetLang: string) =>
    translationRunner.translate(text, targetLang)
  );
  ipcMain.handle("sidecar:diagnose", async () => getSidecarDiagnostics());
  ipcMain.handle("perf:metrics", async () => {
    let gpuInfo: unknown = null;
    try {
      gpuInfo = await app.getGPUInfo("basic");
    } catch {
      gpuInfo = null;
    }

    return {
      timestamp: Date.now(),
      system: {
        platform: process.platform,
        cpuCount: os.cpus().length,
        totalMem: os.totalmem(),
        freeMem: os.freemem(),
        loadAvg: os.loadavg(),
        uptime: os.uptime(),
      },
      app: {
        processes: app.getAppMetrics().map((item) => ({
          pid: item.pid,
          type: item.type,
          creationTime: item.creationTime,
          serviceName: item.serviceName,
          sandboxed: item.sandboxed,
          cpu: item.cpu,
          memory: item.memory,
        })),
      },
      gpu: {
        status: app.getGPUFeatureStatus(),
        info: toSerializable(gpuInfo),
      },
    };
  });
};
