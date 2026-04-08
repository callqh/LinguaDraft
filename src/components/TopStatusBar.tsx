import { Link } from "react-router-dom";

type Props = {
  title: string;
  detectedLang: string;
  translationEnabled: boolean;
  targetLang: string;
};

export const TopStatusBar = ({ title }: Props) => (
  <div className="panel px-4 py-3 flex items-center justify-between">
    <div>
      <div className="font-semibold">{title}</div>
    </div>
  </div>
);
