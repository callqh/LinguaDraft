import { app } from "electron";
import * as fs from "node:fs";
import * as path from "node:path";
import * as fsp from "node:fs/promises";
import type { LocalModel } from "./types";
import { installBuiltinModels } from "./builtinInstaller";
import { getBundledManifestRoot, getUserBuiltinRoot } from "./modelPaths";

type PersistState = {
  models: Record<string, Pick<LocalModel, "status" | "progress">>;
};

const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

const HF_PRIMARY_BASE = "https://huggingface.co";
const HF_MIRROR_BASE = "https://hf-mirror.com";

const getRepoBaseCandidates = (repo: string) => {
  const pathPart = `/${repo}/resolve/main`;
  const envMirror = process.env.LINGUA_HF_MIRROR_BASE?.trim().replace(/\/$/, "");
  const bases = [HF_PRIMARY_BASE, HF_MIRROR_BASE];
  if (envMirror) bases.unshift(envMirror);
  return Array.from(new Set(bases)).map((base) => `${base}${pathPart}`);
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
  private tasks = new Map<string, AbortController>();

  constructor() {
    this.modelRoot = getBundledManifestRoot();
    this.modelFileRoot = getUserBuiltinRoot();
    this.statePath = path.join(app.getPath("userData"), "model-state.json");
    ensureDir(this.modelFileRoot);
    this.bootstrap();
  }

  private routeInstalled(route: NonNullable<LocalModel["routes"]>[number]) {
    const modelDir = path.join(this.modelFileRoot, "translation", route.pairCode);
    const hasVocab =
      fs.existsSync(path.join(modelDir, "shared_vocabulary.json")) ||
      fs.existsSync(path.join(modelDir, "shared_vocabulary.txt")) ||
      fs.existsSync(path.join(modelDir, "vocab.json")) ||
      fs.existsSync(path.join(modelDir, "vocabulary.json"));
    return (
      fs.existsSync(path.join(modelDir, "config.json")) &&
      fs.existsSync(path.join(modelDir, "model.bin")) &&
      fs.existsSync(path.join(modelDir, "source.spm")) &&
      fs.existsSync(path.join(modelDir, "target.spm")) &&
      hasVocab
    );
  }

  private modelFullyInstalled(model: LocalModel) {
    if (model.type === "asr") {
      const asrModelBin = path.join(
        this.modelFileRoot,
        "asr",
        "faster-whisper-base",
        "model.bin",
      );
      return fs.existsSync(asrModelBin);
    }
    if (!model.routes || model.routes.length === 0) {
      return Boolean(model.builtIn);
    }
    return model.routes.every((route) => this.routeInstalled(route));
  }

  private bootstrap() {
    installBuiltinModels();

    const builtin = readJson<Omit<LocalModel, "status" | "progress">[]>(
      path.join(this.modelRoot, "builtin.manifest.json")
    );
    const remote = readJson<Omit<LocalModel, "status" | "progress">[]>(
      path.join(this.modelRoot, "remote.manifest.json")
    );
    const persisted = readJson<PersistState>(this.statePath);

    const merged = [...(builtin ?? []), ...(remote ?? [])].map((model) => {
      const saved = persisted?.models?.[model.id];
      const runtimeInstalled = this.modelFullyInstalled(model as LocalModel);
      if (saved) {
        const status =
          saved.status === "installed" && !runtimeInstalled
            ? "not_installed"
            : saved.status;
        const progress = status === "installed" ? 100 : saved.progress ?? 0;
        return { ...model, status, progress } as LocalModel;
      }
      return {
        ...model,
        status: runtimeInstalled ? "installed" : "not_installed",
        progress: runtimeInstalled ? 100 : 0,
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
    // Reconcile runtime files with in-memory status to avoid stale "installed" state.
    let changed = false;
    this.models = this.models.map((model) => {
      if (model.status !== "installed") return model;
      if (this.modelFullyInstalled(model)) return model;
      changed = true;
      return { ...model, status: "not_installed", progress: 0 };
    });
    if (changed) this.persist();
    return structuredClone(this.models);
  }

  private setModel(modelId: string, patch: Partial<LocalModel>) {
    this.models = this.models.map((model) => (model.id === modelId ? { ...model, ...patch } : model));
    this.persist();
  }

  private clearTask(modelId: string) {
    const ctrl = this.tasks.get(modelId);
    if (ctrl) {
      ctrl.abort();
      this.tasks.delete(modelId);
    }
  }

  private async removeModelFiles(model: LocalModel) {
    if (!model.routes) return;
    for (const route of model.routes) {
      const modelDir = path.join(this.modelFileRoot, "translation", route.pairCode);
      if (fs.existsSync(modelDir)) {
        await fsp.rm(modelDir, { recursive: true, force: true });
      }
    }
  }

  private async downloadToFile(
    urls: string[],
    targetPath: string,
    onProgress: (deltaBytes: number) => void,
    signal: AbortSignal,
  ) {
    ensureDir(path.dirname(targetPath));
    let lastError: Error | null = null;
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          signal,
          headers: {
            "User-Agent": "LinguaDraft/1.0",
            "Accept": "*/*",
          },
        });
        if (!response.ok || !response.body) {
          throw new Error(`download-failed:${response.status}:${url}`);
        }
        const file = fs.createWriteStream(targetPath);
        const reader = response.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!value) continue;
            onProgress(value.byteLength);
            file.write(Buffer.from(value));
          }
        } finally {
          await new Promise<void>((resolve) => file.end(() => resolve()));
        }
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }
    throw lastError ?? new Error(`download-failed:${targetPath}`);
  }

  private async downloadSentencePiece(
    repo: string,
    modelDir: string,
    signal: AbortSignal,
    onProgress: (deltaBytes: number) => void,
  ) {
    const bases = getRepoBaseCandidates(repo);
    const sourceCandidates = [
      "source.spm",
      "spm.model",
      "sentencepiece.model",
      "tokenizer.model",
    ];
    const targetCandidates = [
      "target.spm",
      "spm.model",
      "sentencepiece.model",
      "tokenizer.model",
    ];

    const downloadWithFallback = async (candidates: string[], output: string) => {
      let lastError: Error | null = null;
      for (const name of candidates) {
        try {
          const urls = bases.map((base) => `${base}/${name}`);
          await this.downloadToFile(
            urls,
            path.join(modelDir, output),
            onProgress,
            signal,
          );
          return;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
        }
      }
      throw lastError ?? new Error(`missing-sentencepiece:${repo}`);
    };

    await downloadWithFallback(sourceCandidates, "source.spm");
    await downloadWithFallback(targetCandidates, "target.spm");
  }

  private async downloadRoute(
    route: NonNullable<LocalModel["routes"]>[number],
    signal: AbortSignal,
    onProgress: (deltaBytes: number) => void,
  ) {
    const modelDir = path.join(this.modelFileRoot, "translation", route.pairCode);
    ensureDir(modelDir);
    const bases = getRepoBaseCandidates(route.modelRepo);
    await this.downloadToFile(
      bases.map((base) => `${base}/config.json`),
      path.join(modelDir, "config.json"),
      onProgress,
      signal,
    );
    await this.downloadToFile(
      bases.map((base) => `${base}/model.bin`),
      path.join(modelDir, "model.bin"),
      onProgress,
      signal,
    );
    await this.downloadSentencePiece(route.modelRepo, modelDir, signal, onProgress);
    await this.downloadVocab(route.modelRepo, modelDir, signal, onProgress);
  }

  private async downloadVocab(
    repo: string,
    modelDir: string,
    signal: AbortSignal,
    onProgress: (deltaBytes: number) => void,
  ) {
    const bases = getRepoBaseCandidates(repo);
    const vocabCandidates = [
      { remote: "shared_vocabulary.json", local: "shared_vocabulary.json" },
      { remote: "shared_vocabulary.txt", local: "shared_vocabulary.txt" },
      { remote: "vocab.json", local: "vocab.json" },
      { remote: "vocabulary.json", local: "vocabulary.json" },
    ];
    let downloaded = false;
    let lastError: Error | null = null;
    for (const candidate of vocabCandidates) {
      try {
        const urls = bases.map((base) => `${base}/${candidate.remote}`);
        await this.downloadToFile(
          urls,
          path.join(modelDir, candidate.local),
          onProgress,
          signal,
        );
        downloaded = true;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }
    if (!downloaded) {
      throw lastError ?? new Error(`missing-vocabulary:${repo}`);
    }
  }

  private async performDownload(model: LocalModel) {
    if (!model.routes || model.routes.length === 0) {
      throw new Error("missing-model-routes");
    }
    await this.removeModelFiles(model);
    const controller = new AbortController();
    this.tasks.set(model.id, controller);
    this.setModel(model.id, { status: "downloading", progress: 1 });

    const expectedBytes = Math.max(1, Math.round(model.size * 1024 * 1024 * 1024));
    let downloadedBytes = 0;
    const pushProgress = (delta: number) => {
      downloadedBytes += delta;
      const ratio = Math.min(99, Math.round((downloadedBytes / expectedBytes) * 100));
      this.setModel(model.id, { status: "downloading", progress: Math.max(1, ratio) });
    };

    try {
      for (const route of model.routes) {
        await this.downloadRoute(route, controller.signal, pushProgress);
        if (!this.routeInstalled(route)) {
          throw new Error(`route-files-incomplete:${route.pairCode}`);
        }
      }
      this.tasks.delete(model.id);
      this.setModel(model.id, { status: "installed", progress: 100 });
    } catch (error) {
      this.tasks.delete(model.id);
      const aborted =
        error instanceof Error && error.name === "AbortError";
      if (!aborted) {
        this.setModel(model.id, { status: "failed" });
      }
    }
  }

  downloadModel(modelId: string) {
    const model = this.models.find((item) => item.id === modelId);
    if (!model || model.builtIn) return this.listModels();
    this.clearTask(modelId);
    void this.performDownload(model);
    return this.listModels();
  }

  pauseDownload(modelId: string) {
    const model = this.models.find((item) => item.id === modelId);
    if (!model || model.status !== "downloading") return this.listModels();
    this.clearTask(modelId);
    this.setModel(modelId, { status: "paused" });
    return this.listModels();
  }

  resumeDownload(modelId: string) {
    const model = this.models.find((item) => item.id === modelId);
    if (!model || model.status !== "paused") return this.listModels();
    this.setModel(modelId, { progress: 1 });
    this.downloadModel(modelId);
    return this.listModels();
  }

  cancelDownload(modelId: string) {
    this.clearTask(modelId);
    const model = this.models.find((item) => item.id === modelId);
    if (model) {
      void this.removeModelFiles(model);
    }
    this.setModel(modelId, { status: "not_installed", progress: 0 });
    return this.listModels();
  }

  deleteModel(modelId: string) {
    const model = this.models.find((item) => item.id === modelId);
    if (!model || model.builtIn) {
      throw new Error("内置模型不允许删除");
    }
    this.clearTask(modelId);
    this.setModel(modelId, { status: "not_installed", progress: 0 });
    void this.removeModelFiles(model);
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

  isTranslationPairInstalled(sourceLang: string, targetLang: string) {
    const matched = this.models.find(
      (item) =>
        item.type === "translation" &&
        item.status === "installed" &&
        item.routes?.some(
          (route) =>
            route.sourceLang === sourceLang && route.targetLang === targetLang,
        ),
    );
    return Boolean(matched);
  }
}

let instance: ModelManager | null = null;
export const getModelManager = () => {
  if (!instance) instance = new ModelManager();
  return instance;
};
