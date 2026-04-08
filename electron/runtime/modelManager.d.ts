import type { LocalModel } from "./types";
export declare class ModelManager {
    private readonly statePath;
    private readonly modelRoot;
    private readonly modelFileRoot;
    private models;
    private timers;
    constructor();
    private bootstrap;
    private persist;
    listModels(): LocalModel[];
    private setModel;
    private clearTimer;
    private writePlaceholder;
    downloadModel(modelId: string): LocalModel[];
    pauseDownload(modelId: string): LocalModel[];
    resumeDownload(modelId: string): LocalModel[];
    cancelDownload(modelId: string): LocalModel[];
    deleteModel(modelId: string): LocalModel[];
    isModelInstalled(modelId: string): boolean;
    isTranslationLanguageInstalled(language: string): boolean;
}
export declare const getModelManager: () => ModelManager;
