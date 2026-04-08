type ModelTab = "asr" | "translation";

type Props = {
  value: ModelTab;
  onChange: (value: ModelTab) => void;
};

export const ModelTabs = ({ value, onChange }: Props) => (
  <div className="inline-flex rounded-xl border border-borderSoft p-1 bg-white">
    <button
      className={`px-4 py-2 rounded-lg text-sm ${value === "asr" ? "bg-blue-50 text-accent" : "text-textMain"}`}
      onClick={() => onChange("asr")}
    >
      语音识别模型
    </button>
    <button
      className={`px-4 py-2 rounded-lg text-sm ${value === "translation" ? "bg-blue-50 text-accent" : "text-textMain"}`}
      onClick={() => onChange("translation")}
    >
      翻译模型
    </button>
  </div>
);

