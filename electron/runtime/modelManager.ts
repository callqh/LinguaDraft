import { app } from "electron";
import * as fs from "node:fs";
import * as path from "node:path";
import type { LocalModel } from "./types";

type PersistState = {
  models: Record<string, Pick<LocalModel, "status" | "progress">>;
};

const randomStep = () => 4 + Math.random() * 10;

const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

const readJson = <T>(filePath: string): T | null => {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
};

export class ModelManager {
  private readonly statePath: string;
  private readonly modelRoot: string;
  private readonly modelFileRoot: string;
  private models: LocalModel[] = [];
  private timers = new Map<string, NodeJS.Timeout>();

  constructor() {
    this.modelRoot = path.join(app.getAppPath(), "local-model", "manifest");
    this.modelFileRoot = path.join(app.getPath("userData"), "models");
    this.statePath = path.join(app.getPath("userData"), "model-state.json");
    ensureDir(this.modelFileRoot);
    this.bootstrap();
  }

  private bootstrap() {
    const builtin = readJson<Omit<LocalModel, "status" | "progress">[]>(
      path.join(this.modelRoot, "builtin.manifest.json")
    );
    const remote = readJson<Omit<LocalModel, "status" | "progress">[]>(
      path.join(this.modelRoot, "remote.manifest.json")
    );
    const persisted = readJson<PersistState>(this.statePath);

    const merged = [...(builtin ?? []), ...(remote ?? [])].map((model) => {
      const saved = persisted?.models?.[model.id];
      if (saved) {
        return { ...model, status: saved.status, progress: saved.progress } as LocalModel;
      }
      return {
        ...model,
        status: model.builtIn ? "installed" : "not_installed",
        progress: model.builtIn ? 100 : 0
      } as LocalModel;
    });

    this.models = merged;
    this.persist();
  }

  private persist() {
    const state: PersistState = {
      models: this.models.reduce<PersistState["models"]>((acc, model) => {
        acc[model.id] = { status: model.status, progress: model.progress };
        return acc;
      }, {})
    };
    fs.writeFileSync(this.statePath, JSON.stringify(state, null, 2), "utf8");
  }

  listModels() {
    return structuredClone(this.models);
  }

  private setModel(modelId: string, patch: Partial<LocalModel>) {
    this.models = this.models.map((model) => (model.id === modelId ? { ...model, ...patch } : model));
    this.persist();
  }

  private clearTimer(modelId: string) {
    const timer = this.timers.get(modelId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(modelId);
    }
  }

  private writePlaceholder(modelId: string) {
    const modelDir = path.join(this.modelFileRoot, modelId);
    ensureDir(modelDir);
    fs.writeFileSync(path.join(modelDir, "ready.flag"), "installed", "utf8");
  }

  downloadModel(modelId: string) {
    const model = this.models.find((item) => item.id === modelId);
    if (!model || model.builtIn) return this.listModels();

    this.clearTimer(modelId);
    this.setModel(modelId, {
      status: "downloading",
      progress: model.progress && model.progress > 0 ? model.progress : 1
    });

    const timer = setInterval(() => {
      const current = this.models.find((item) => item.id === modelId);
      if (!current || current.status !== "downloading") return;

      const progress = Math.min(100, (current.progress ?? 0) + randomStep());
      if (Math.random() < 0.015) {
        this.clearTimer(modelId);
        this.setModel(modelId, { status: "failed" });
        return;
      }
      if (progress >= 100) {
        this.clearTimer(modelId);
        this.setModel(modelId, { status: "installed", progress: 100 });
        this.writePlaceholder(modelId);
        return;
      }
      this.setModel(modelId, { progress: Math.round(progress), status: "downloading" });
    }, 420);

    this.timers.set(modelId, timer);
    return this.listModels();
  }

  pauseDownload(modelId: string) {
    const model = this.models.find((item) => item.id === modelId);
    if (!model || model.status !== "downloading") return this.listModels();
    this.setModel(modelId, { status: "paused" });
    return this.listModels();
  }

  resumeDownload(modelId: string) {
    const model = this.models.find((item) => item.id === modelId);
    if (!model || model.status !== "paused") return this.listModels();
    this.downloadModel(modelId);
    return this.listModels();
  }

  cancelDownload(modelId: string) {
    this.clearTimer(modelId);
    this.setModel(modelId, { status: "not_installed", progress: 0 });
    return this.listModels();
  }

  deleteModel(modelId: string) {
    const model = this.models.find((item) => item.id === modelId);
    if (!model || model.builtIn) return this.listModels();
    this.clearTimer(modelId);
    this.setModel(modelId, { status: "not_installed", progress: 0 });
    const modelDir = path.join(this.modelFileRoot, modelId);
    if (fs.existsSync(modelDir)) fs.rmSync(modelDir, { recursive: true, force: true });
    return this.listModels();
  }

  isModelInstalled(modelId: string) {
    return this.models.some((item) => item.id === modelId && item.status === "installed");
  }

  isTranslationLanguageInstalled(language: string) {
    return this.models.some(
      (item) => item.type === "translation" && item.language === language && item.status === "installed"
    );
  }
}

let instance: ModelManager | null = null;
export const getModelManager = () => {
  if (!instance) instance = new ModelManager();
  return instance;
};
