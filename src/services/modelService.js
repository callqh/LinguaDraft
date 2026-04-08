import { initialModels } from "@/mock/data";
const tasks = new Map();
const clearTask = (modelId) => {
    const task = tasks.get(modelId);
    if (task) {
        window.clearInterval(task.timer);
        tasks.delete(modelId);
    }
};
const createInterval = (task) => window.setInterval(() => {
    if (task.paused)
        return;
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
    downloadModel(modelId, initialProgress, onTick, onDone, onFailed) {
        clearTask(modelId);
        const task = {
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
    pauseDownload(modelId) {
        const task = tasks.get(modelId);
        if (task)
            task.paused = true;
    },
    resumeDownload(modelId) {
        const task = tasks.get(modelId);
        if (task)
            task.paused = false;
    },
    cancelDownload(modelId) {
        clearTask(modelId);
    },
    deleteModel(modelId) {
        clearTask(modelId);
    }
};
