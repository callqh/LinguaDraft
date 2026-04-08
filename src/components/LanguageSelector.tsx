import { languageOptions } from "@/mock/data";

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  testId?: string;
};

export const LanguageSelector = ({ value, onChange, className, testId }: Props) => (
  <select
    data-testid={testId}
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
