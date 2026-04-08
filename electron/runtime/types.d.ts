export type ModelStatus = "not_installed" | "downloading" | "paused" | "installed" | "failed";
export type LocalModel = {
    id: string;
    type: "asr" | "translation";
    language?: string;
    version: string;
    status: ModelStatus;
    size: number;
    progress?: number;
    builtIn?: boolean;
    downloadUrl?: string;
};
export type LanguageDetection = {
    language: string;
    confidence: number;
};
export type TranscriptionResult = {
    text: string;
    language: string;
    confidence: number;
};
