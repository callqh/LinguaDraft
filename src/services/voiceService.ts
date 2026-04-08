import { sleep } from "@/utils/format";

let isRecording = false;

export const voiceService = {
  async startRecording() {
    await sleep(140);
    isRecording = true;
    return { status: "recording" as const };
  },

  async stopRecording() {
    await sleep(120);
    isRecording = false;
    return { status: "transcribing" as const };
  },

  async transcribe() {
    await sleep(1100);
    if (!isRecording && Math.random() < 0.1) {
      throw new Error("语音识别失败，请重试");
    }
    const textPool = [
      "这是一段模拟语音转写文本，你可以直接点击提交。",
      "请将这段语音内容整理成英文摘要，突出重点信息。",
      "今天先记录一个灵感，后续再扩展成完整文章。"
    ];
    return textPool[Math.floor(Math.random() * textPool.length)];
  }
};

