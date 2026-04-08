export declare const translationRunner: {
    detectLanguage(text: string): import("./types").LanguageDetection;
    translate(text: string, targetLang: string): Promise<string>;
};
