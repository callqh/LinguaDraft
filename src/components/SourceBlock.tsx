type Props = {
  text: string;
};

export const SourceBlock = ({ text }: Props) => (
  <div className="rounded-xl border border-borderSoft p-3 bg-slate-50/70 min-h-[84px]">
    <div className="text-xs text-textMuted mb-1">原文</div>
    <p className="text-sm leading-6 whitespace-pre-wrap">{text}</p>
  </div>
);

