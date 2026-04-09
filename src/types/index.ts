export type TranslationStatus = "idle" | "translating" | "success" | "failed";

export type RecordItem = {
  id: string;
  createdAt: string;
  sourceText: string;
  sourceLang: string;
  translationEnabled: boolean;
  targetLang?: string;
  translatedText?: string;
  translationStatus: TranslationStatus;
};

export type LocalModel = {
  id: string;
  type: "asr" | "translation";
  language?: string;
  version: string;
  status: "not_installed" | "downloading" | "paused" | "installed" | "failed";
  size: number;
  progress?: number;
  builtIn?: boolean;
};

export type Session = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  records: RecordItem[];
};

export type RecordingState = "idle" | "recording" | "transcribing" | "failed";

export type DialogState = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
};

export type ToastType = "info" | "success" | "warning" | "error";

export type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
};
