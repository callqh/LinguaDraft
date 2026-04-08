import type { TranscriptionResult } from "./types";
export declare const asrRunner: {
    isModelReady(): boolean;
    start(): Promise<{
        status: "recording";
    }>;
    stop(): Promise<{
        status: "idle";
    } | {
        status: "transcribing";
    }>;
    transcribe(): Promise<TranscriptionResult>;
};
