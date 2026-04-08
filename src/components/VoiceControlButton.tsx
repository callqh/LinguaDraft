import { LoaderCircle, Mic, Square } from "lucide-react";
import type { RecordingState } from "@/types";

type Props = {
  state: RecordingState;
  onClick: () => void;
};

export const VoiceControlButton = ({ state, onClick }: Props) => {
  const text =
    state === "recording" ? "停止录音" : state === "transcribing" ? "识别中..." : "按住说话 / 语音录入";
  const icon =
    state === "recording" ? (
      <Square size={14} className="mr-1.5" />
    ) : state === "transcribing" ? (
      <LoaderCircle size={14} className="mr-1.5 animate-spin" />
    ) : (
      <Mic size={14} className="mr-1.5" />
    );
  return (
    <button
      onClick={onClick}
      disabled={state === "transcribing"}
      className={`btn ${
        state === "recording"
          ? "bg-red-500 text-white"
          : state === "transcribing"
            ? "bg-slate-200 text-textMuted"
            : "bg-blue-50 text-accent border border-blue-200"
      }`}
    >
      {icon}
      {text}
    </button>
  );
};
