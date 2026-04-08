import { LoaderCircle, OctagonAlert } from "lucide-react";
import type { TranslationStatus } from "@/types";

type Props = {
  text?: string;
  status: TranslationStatus;
};

export const TranslationBlock = ({ text, status }: Props) => {
  const body =
    status === "translating" ? "翻译中..." : status === "failed" ? "翻译失败" : text || "未翻译";
  return (
    <div data-testid="translation-block" className="rounded-xl border border-borderSoft p-3 bg-white min-h-[84px]">
      <div className="text-xs text-textMuted mb-1">译文</div>
      {status === "translating" ? (
        <p data-testid="translation-content" className="text-sm leading-6 whitespace-pre-wrap inline-flex items-center">
          <LoaderCircle size={14} className="mr-1.5 animate-spin text-accent" />
          {body}
        </p>
      ) : status === "failed" ? (
        <p data-testid="translation-content" className="text-sm leading-6 whitespace-pre-wrap inline-flex items-center text-red-500">
          <OctagonAlert size={14} className="mr-1.5" />
          {body}
        </p>
      ) : (
        <p data-testid="translation-content" className="text-sm leading-6 whitespace-pre-wrap">
          {body}
        </p>
      )}
    </div>
  );
};
