import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("linguaDraft", {
  version: "0.2.0-local-model",
  model: {
    list: () => ipcRenderer.invoke("model:list"),
    download: (modelId: string) => ipcRenderer.invoke("model:download", modelId),
    pause: (modelId: string) => ipcRenderer.invoke("model:pause", modelId),
    resume: (modelId: string) => ipcRenderer.invoke("model:resume", modelId),
    cancel: (modelId: string) => ipcRenderer.invoke("model:cancel", modelId),
    delete: (modelId: string) => ipcRenderer.invoke("model:delete", modelId)
  },
  asr: {
    start: () => ipcRenderer.invoke("asr:start"),
    stop: () => ipcRenderer.invoke("asr:stop"),
    transcribe: () => ipcRenderer.invoke("asr:transcribe")
  },
  language: {
    detect: (text: string) => ipcRenderer.invoke("language:detect", text)
  },
  translation: {
    detect: (text: string) => ipcRenderer.invoke("translation:detect", text),
    translate: (text: string, targetLang: string) => ipcRenderer.invoke("translation:run", text, targetLang)
  }
});
