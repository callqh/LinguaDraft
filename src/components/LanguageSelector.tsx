import { languageOptions } from "@/mock/data";

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export const LanguageSelector = ({ value, onChange, className }: Props) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className={`h-10 rounded-xl border border-borderSoft bg-white px-3 text-sm outline-none ${className ?? ""}`}
  >
    {languageOptions.map((item) => (
      <option key={item.code} value={item.label}>
        {item.label}
      </option>
    ))}
  </select>
);

