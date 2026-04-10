type Props = {
  statusText: string;
};

export const AppBootSplash = ({ statusText }: Props) => (
  <div className="boot-splash" role="status" aria-live="polite">
    <div className="boot-splash__glow" aria-hidden="true" />
    <div className="boot-splash__card">
      <div className="boot-splash__brand">LinguaDraft</div>
      <div className="boot-splash__title">服务初始化中</div>
      <div className="boot-splash__status">{statusText}</div>
      <div className="boot-splash__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  </div>
);
