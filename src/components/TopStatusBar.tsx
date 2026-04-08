import { Link } from "react-router-dom";

type Props = {
  title: string;
  detectedLang: string;
  translationEnabled: boolean;
  targetLang: string;
};

export const TopStatusBar = ({ title, detectedLang, translationEnabled, targetLang }: Props) => (
  <div className="panel px-4 py-3 flex items-center justify-between">
    <div>
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-textMuted">自动保存于本地 · 当前为 MVP mock 流程</div>
    </div>
    <div className="flex items-center gap-4 text-sm text-textMuted">
      <span>检测为：{detectedLang}</span>
      <span>翻译：{translationEnabled ? "开启" : "关闭"}</span>
      <span>目标语言：{targetLang}</span>
      <Link to="/models" className="text-accent">
        模型管理
      </Link>
      <Link to="/settings" className="text-accent">
        设置
      </Link>
    </div>
  </div>
);

