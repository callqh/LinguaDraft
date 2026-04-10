import type { LocalModel } from "@/types";

declare global {
  interface Window {
    linguaDraft?: {
      version: string;
      model: {
        list: () => Promise<LocalModel[]>;
        download: (modelId: string) => Promise<LocalModel[]>;
        pause: (modelId: string) => Promise<LocalModel[]>;
        resume: (modelId: string) => Promise<LocalModel[]>;
        cancel: (modelId: string) => Promise<LocalModel[]>;
        delete: (modelId: string) => Promise<LocalModel[]>;
      };
      asr: {
        start: () => Promise<{ status: "recording" }>;
        stop: () => Promise<{ status: "transcribing" | "idle" }>;
        transcribe: () => Promise<{ text: string; language: string; confidence: number }>;
        transcribeAudio: (
          raw: ArrayBuffer,
          extension?: string,
        ) => Promise<{ text: string; language: string; confidence: number }>;
      };
      language: {
        detect: (text: string) => Promise<{ language: string; confidence: number }>;
      };
      translation: {
        detect: (text: string) => Promise<{ language: string; confidence: number }>;
        translate: (text: string, targetLang: string) => Promise<string>;
      };
      sidecar: {
        diagnose: () => Promise<{
          selectedPython: string;
          pythonSource: "bundled" | "runtime-venv" | "system" | "unknown";
          depsReady: boolean;
          sidecarEntry: string;
          requirementsPath: string;
          runtimeVenvRoot: string;
          modelRoot: string;
          healthReason?: string;
          lastError?: string;
          ready: boolean;
        }>;
      };
      performance: {
        metrics: () => Promise<{
          timestamp: number;
          system: {
            platform: string;
            cpuCount: number;
            totalMem: number;
            freeMem: number;
            loadAvg: number[];
            uptime: number;
          };
          app: {
            processes: Array<{
              pid: number;
              type: string;
              creationTime: number;
              serviceName?: string;
              sandboxed?: boolean;
              cpu?: { percentCPUUsage: number; idleWakeupsPerSecond: number };
              memory?: {
                workingSetSize: number;
                peakWorkingSetSize: number;
                privateBytes: number;
                sharedBytes: number;
              };
            }>;
          };
          gpu: {
            status: Record<string, string>;
            info: unknown;
          };
        }>;
      };
    };
  }
}

export {};
