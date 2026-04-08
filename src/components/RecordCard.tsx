import { useState } from "react";
import type { RecordItem } from "@/types";
import { formatClock } from "@/utils/format";
import { SourceBlock } from "@/components/SourceBlock";
import { TranslationBlock } from "@/components/TranslationBlock";
import { languageOptions } from "@/mock/data";

type Props = {
  record: RecordItem;
  onRetranslate: (recordId: string, targetLang: string) => void;
};

export const RecordCard = ({ record, onRetranslate }: Props) => {
  const [targetLang, setTargetLang] = useState(record.targetLang ?? "英文");
  return (
    <article className="panel p-4">
      <div className="mb-3 flex items-center justify-between text-xs text-textMuted">
        <div className="flex items-center gap-3">
          <span>{formatClock(record.createdAt)}</span>
          <span>源语言：{record.sourceLang}</span>
          {record.targetLang && <span>目标语言：{record.targetLang}</span>}
        </div>
        <span className="text-textMuted">翻译状态：{record.translationStatus}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SourceBlock text={record.sourceText} />
        <TranslationBlock text={record.translatedText} status={record.translationStatus} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button className="btn-ghost text-xs" onClick={() => void navigator.clipboard.writeText(record.sourceText)}>
          复制原文
        </button>
        <button
          className="btn-ghost text-xs"
          onClick={() => void navigator.clipboard.writeText(record.translatedText ?? "")}
          disabled={!record.translatedText}
        >
          复制译文
        </button>
        <select
          value={targetLang}
          onChange={(event) => setTargetLang(event.target.value)}
          className="h-9 rounded-xl border border-borderSoft px-2 text-sm"
        >
          {languageOptions.map((item) => (
            <option key={item.code} value={item.label}>
              {item.label}
            </option>
          ))}
        </select>
        <button className="btn-ghost text-xs" onClick={() => onRetranslate(record.id, targetLang)}>
          重新翻译
        </button>
      </div>
    </article>
  );
};

