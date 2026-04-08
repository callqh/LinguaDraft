import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("linguaDraft", {
  version: "0.1.0-mvp"
});

