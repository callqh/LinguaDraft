import { LanguageSelector } from "@/components/LanguageSelector";
import { TranslationToggle } from "@/components/TranslationToggle";
import { VoiceControlButton } from "@/components/VoiceControlButton";
import type { RecordingState } from "@/types";

type Props = {
  inputText: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  translationEnabled: boolean;
  onTranslationToggle: (value: boolean) => void;
  targetLang: string;
  onTargetLangChange: (value: string) => void;
  recordingState: RecordingState;
  onVoiceClick: () => void;
};

export const InputComposer = ({
  inputText,
  onChange,
  onSubmit,
  translationEnabled,
  onTranslationToggle,
  targetLang,
  onTargetLangChange,
  recordingState,
  onVoiceClick
}: Props) => (
  <div className="panel p-3">
    <textarea
      data-testid="input-composer-textarea"
      value={inputText}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          onSubmit();
        }
      }}
      placeholder="在这里输入文字，或使用语音输入..."
      className="w-full h-28 resize-none rounded-xl border border-borderSoft p-3 text-sm outline-none focus:border-blue-300"
    />
    <div className="mt-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <VoiceControlButton state={recordingState} onClick={onVoiceClick} />
        <span className="text-xs text-textMuted">快捷键：Ctrl/Cmd + Tab，Enter 提交，Shift+Enter 换行</span>
      </div>
      <div className="flex items-center gap-3">
        <TranslationToggle checked={translationEnabled} onChange={onTranslationToggle} />
        <LanguageSelector
          testId="input-composer-target-lang"
          value={targetLang}
          onChange={onTargetLangChange}
        />
        <button data-testid="input-composer-submit" className="btn-primary min-w-24" onClick={onSubmit}>
          提交
        </button>
      </div>
    </div>
    {recordingState === "recording" ? (
      <div
        data-testid="voice-wave"
        className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2"
      >
        <div className="mb-1 text-xs text-accent">正在收集声音...</div>
        <div className="voice-wave-track">
          {Array.from({ length: 24 }).map((_, index) => (
            <span
              key={index}
              className="voice-wave-bar"
              style={{ animationDelay: `${index * 0.05}s` }}
            />
          ))}
        </div>
      </div>
    ) : null}
  </div>
);
