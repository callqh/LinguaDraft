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
const polls = new Map<string, number>();

const clearTask = (modelId: string) => {
  const task = tasks.get(modelId);
  if (task) {
    window.clearInterval(task.timer);
    tasks.delete(modelId);
  }
  const pollTimer = polls.get(modelId);
  if (pollTimer) {
    window.clearInterval(pollTimer);
    polls.delete(modelId);
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

  async listModels() {
    if (window.linguaDraft?.model) {
      try {
        return await window.linguaDraft.model.list();
      } catch {
        return structuredClone(initialModels);
      }
    }
    return structuredClone(initialModels);
  },

  downloadModel(
    modelId: string,
    initialProgress: number,
    onTick: DownloadCallback,
    onDone: DownloadDone,
    onFailed: DownloadFailed
  ) {
    if (window.linguaDraft?.model) {
      void window.linguaDraft.model.download(modelId);
      onTick({ status: "downloading", progress: Math.round(initialProgress || 1) });

      const pollTimer = window.setInterval(async () => {
        try {
          const models = await window.linguaDraft!.model.list();
          const current = models.find((item) => item.id === modelId);
          if (!current) return;
          onTick({ status: current.status, progress: current.progress });

          if (current.status === "installed") {
            clearTask(modelId);
            onDone();
          } else if (current.status === "failed" || current.status === "not_installed") {
            clearTask(modelId);
            onFailed();
          }
        } catch {
          clearTask(modelId);
          onFailed();
        }
      }, 420);
      polls.set(modelId, pollTimer);
      return;
    }

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
    if (window.linguaDraft?.model) {
      void window.linguaDraft.model.pause(modelId);
      return;
    }
    const task = tasks.get(modelId);
    if (task) task.paused = true;
  },

  resumeDownload(modelId: string) {
    if (window.linguaDraft?.model) {
      void window.linguaDraft.model.resume(modelId);
      return;
    }
    const task = tasks.get(modelId);
    if (task) task.paused = false;
  },

  cancelDownload(modelId: string) {
    if (window.linguaDraft?.model) {
      clearTask(modelId);
      void window.linguaDraft.model.cancel(modelId);
      return;
    }
    clearTask(modelId);
  },

  deleteModel(modelId: string) {
    if (window.linguaDraft?.model) {
      clearTask(modelId);
      void window.linguaDraft.model.delete(modelId);
      return;
    }
    clearTask(modelId);
  }
};
