import type { LanguageDetection } from "./types";
export declare const lidRunner: {
    isModelReady(): boolean;
    detect(text: string): LanguageDetection;
};
