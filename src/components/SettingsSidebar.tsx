import type { SettingsCategory } from "@/stores/useSettingsStore";

const items: SettingsCategory[] = ["通用", "语音输入", "翻译", "存储", "关于"];

type Props = {
  value: SettingsCategory;
  onChange: (value: SettingsCategory) => void;
};

export const SettingsSidebar = ({ value, onChange }: Props) => (
  <aside className="panel p-3">
    <div className="space-y-1">
      {items.map((item) => (
        <button
          key={item}
          onClick={() => onChange(item)}
          className={`w-full text-left rounded-xl px-3 py-2 text-sm ${
            value === item ? "bg-blue-50 text-accent" : "hover:bg-slate-50"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  </aside>
);

