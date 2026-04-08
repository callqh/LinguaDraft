import { useState } from "react";
import { CheckCircle2, Copy, LoaderCircle, RefreshCw, XCircle } from "lucide-react";
import type { RecordItem } from "@/types";
import { formatClock } from "@/utils/format";
import { languageOptions } from "@/mock/data";

type Props = {
  record: RecordItem;
  onRetranslate: (recordId: string, targetLang: string) => void;
  onNotify?: (
    message: string,
    type?: "info" | "success" | "warning" | "error",
  ) => void;
};

export const RecordCard = ({ record, onRetranslate, onNotify }: Props) => {
  const [targetLang, setTargetLang] = useState(record.targetLang ?? "英文");
  const hasTranslation =
    record.translationEnabled ||
    record.translationStatus === "translating" ||
    record.translationStatus === "failed" ||
    Boolean(record.translatedText);
  const translationText =
    record.translationStatus === "translating"
      ? "翻译中..."
      : record.translationStatus === "failed"
        ? "翻译失败"
        : record.translatedText || "未翻译";

  const handleCopy = async (text: string, successMessage: string) => {
    if (!text) {
      onNotify?.("暂无可复制内容", "warning");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      onNotify?.(successMessage, "success");
    } catch {
      onNotify?.("复制失败，请稍后重试", "error");
    }
  };

  return (
    <article
      data-testid="record-card"
      data-source-lang={record.sourceLang}
      data-target-lang={record.targetLang ?? ""}
      data-translation-status={record.translationStatus}
      className="group relative px-1 py-2"
    >
      <div className="mb-1 pl-2 text-[11px] text-textMuted/90">
        {formatClock(record.createdAt)}
      </div>

      <div className="relative ml-auto max-w-[84%] rounded-2xl rounded-tr-md border border-emerald-300/50 bg-emerald-400 px-4 py-3 text-[15px] leading-7 text-slate-900 shadow-sm transition-shadow duration-200 group-hover:shadow-md">
        <div className="pointer-events-none absolute right-2 top-2 flex items-center justify-end gap-1 opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto">
          <button
            aria-label="复制原文"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-700 transition-colors duration-150 hover:bg-white/35"
            onClick={() => void handleCopy(record.sourceText, "已复制原文")}
          >
            <Copy size={13} />
          </button>
          <select
            data-testid={`record-target-lang-${record.id}`}
            value={targetLang}
            onChange={(event) => setTargetLang(event.target.value)}
            className="h-6 rounded-md border border-white/60 bg-white/75 px-1 text-[11px] text-slate-700 outline-none focus:border-white"
          >
            {languageOptions.map((item) => (
              <option key={item.code} value={item.label}>
                {item.label}
              </option>
            ))}
          </select>
          <button
            data-testid={`record-retranslate-${record.id}`}
            aria-label="重新翻译"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-700 transition-colors duration-150 hover:bg-white/35"
            onClick={() => onRetranslate(record.id, targetLang)}
          >
            <RefreshCw size={13} />
          </button>
        </div>
        <div className="pr-28">
          <span className="whitespace-pre-wrap break-words">{record.sourceText}</span>
        </div>
      </div>

      {hasTranslation ? (
        <div className="relative mt-2 ml-auto max-w-[84%] rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-[15px] leading-7 text-slate-800 shadow-sm transition-shadow duration-200 group-hover:shadow-md">
          <button
            aria-label="复制译文"
            className="absolute right-2 top-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-500 opacity-0 transition-all duration-150 hover:bg-slate-100 group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-35"
            onClick={() =>
              void handleCopy(record.translatedText ?? "", "已复制译文")
            }
            disabled={!record.translatedText}
          >
            <Copy size={13} />
          </button>
          <div className="flex items-start justify-between gap-2">
            {record.translationStatus === "translating" ? (
              <span data-testid="translation-content" className="inline-flex items-center">
                <LoaderCircle size={14} className="mr-1.5 animate-spin text-accent" />
                {translationText}
              </span>
            ) : record.translationStatus === "failed" ? (
              <span data-testid="translation-content" className="inline-flex items-center text-red-500">
                <XCircle size={14} className="mr-1.5" />
                {translationText}
              </span>
            ) : (
              <span data-testid="translation-content" className="whitespace-pre-wrap break-words">
                {translationText}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span className="opacity-85">
              {record.sourceLang}
              {record.targetLang ? ` -> ${record.targetLang}` : ""}
            </span>
            <span
              data-testid={`record-status-icon-${record.id}`}
              title={
                record.translationStatus === "success"
                  ? "翻译完成"
                  : record.translationStatus === "failed"
                    ? "翻译失败"
                    : record.translationStatus === "translating"
                      ? "翻译中"
                      : "未翻译"
              }
            >
              {record.translationStatus === "success" ? (
                <CheckCircle2 size={13} className="text-emerald-500" />
              ) : record.translationStatus === "failed" ? (
                <XCircle size={13} className="text-red-500" />
              ) : record.translationStatus === "translating" ? (
                <LoaderCircle size={13} className="animate-spin text-accent" />
              ) : null}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-2 ml-auto max-w-[84%] rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-2 text-xs text-textMuted">
          未开启翻译
        </div>
      )}
    </article>
  );
};
