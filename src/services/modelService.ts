import type { LocalModel } from "@/types";
import { initialModels } from "@/mock/data";

type DownloadCallback = (payload: Partial<LocalModel>) => void;
type DownloadDone = () => void;
type DownloadFailed = () => void;

type DownloadTask = {
  modelId: string;
  timer: number;
  progress: number;
  paused: boolean;
  onTick: DownloadCallback;
  onDone: DownloadDone;
  onFailed: DownloadFailed;
};

const tasks = new Map<string, DownloadTask>();

const clearTask = (modelId: string) => {
  const task = tasks.get(modelId);
  if (task) {
    window.clearInterval(task.timer);
    tasks.delete(modelId);
  }
};

const createInterval = (task: DownloadTask) =>
  window.setInterval(() => {
    if (task.paused) return;
    const step = 4 + Math.random() * 11;
    task.progress = Math.min(100, task.progress + step);
    task.onTick({ progress: Math.round(task.progress), status: "downloading" });

    if (Math.random() < 0.02) {
      clearTask(task.modelId);
      task.onTick({ status: "failed" });
      task.onFailed();
      return;
    }

    if (task.progress >= 100) {
      clearTask(task.modelId);
      task.onTick({ progress: 100, status: "installed" });
      task.onDone();
    }
  }, 380);

export const modelService = {
  getModels() {
    return structuredClone(initialModels);
  },

  downloadModel(
    modelId: string,
    initialProgress: number,
    onTick: DownloadCallback,
    onDone: DownloadDone,
    onFailed: DownloadFailed
  ) {
    clearTask(modelId);
    const task: DownloadTask = {
      modelId,
      progress: initialProgress,
      paused: false,
      onTick,
      onDone,
      onFailed,
      timer: -1
    };
    task.timer = createInterval(task);
    tasks.set(modelId, task);
    onTick({ status: "downloading", progress: Math.round(initialProgress) });
  },

  pauseDownload(modelId: string) {
    const task = tasks.get(modelId);
    if (task) task.paused = true;
  },

  resumeDownload(modelId: string) {
    const task = tasks.get(modelId);
    if (task) task.paused = false;
  },

  cancelDownload(modelId: string) {
    clearTask(modelId);
  },

  deleteModel(modelId: string) {
    clearTask(modelId);
  }
};

