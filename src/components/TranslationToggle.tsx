type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export const TranslationToggle = ({ checked, onChange }: Props) => (
  <label className="inline-flex items-center gap-2 text-sm">
    <span>翻译</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-accent" : "bg-slate-300"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  </label>
);

