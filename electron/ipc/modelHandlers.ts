import { ipcMain } from "electron";
import { asrRunner } from "../runtime/asrRunner";
import { lidRunner } from "../runtime/lidRunner";
import { getModelManager } from "../runtime/modelManager";
import { translationRunner } from "../runtime/translationRunner";

export const registerIpcHandlers = () => {
  const modelManager = getModelManager();

  ipcMain.handle("model:list", async () => modelManager.listModels());
  ipcMain.handle("model:download", async (_event, modelId: string) => modelManager.downloadModel(modelId));
  ipcMain.handle("model:pause", async (_event, modelId: string) => modelManager.pauseDownload(modelId));
  ipcMain.handle("model:resume", async (_event, modelId: string) => modelManager.resumeDownload(modelId));
  ipcMain.handle("model:cancel", async (_event, modelId: string) => modelManager.cancelDownload(modelId));
  ipcMain.handle("model:delete", async (_event, modelId: string) => modelManager.deleteModel(modelId));

  ipcMain.handle("asr:start", async () => asrRunner.start());
  ipcMain.handle("asr:stop", async () => asrRunner.stop());
  ipcMain.handle("asr:transcribe", async () => asrRunner.transcribe());

  ipcMain.handle("language:detect", async (_event, text: string) => lidRunner.detect(text));
  ipcMain.handle("translation:detect", async (_event, text: string) => translationRunner.detectLanguage(text));
  ipcMain.handle("translation:run", async (_event, text: string, targetLang: string) =>
    translationRunner.translate(text, targetLang)
  );
};

