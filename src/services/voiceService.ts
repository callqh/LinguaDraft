export const voiceService = {
  async startRecording() {
    if (!window.linguaDraft?.asr) {
      throw new Error("本地语音服务未初始化");
    }
    return window.linguaDraft.asr.start();
  },

  async stopRecording() {
    if (!window.linguaDraft?.asr) {
      throw new Error("本地语音服务未初始化");
    }
    return window.linguaDraft.asr.stop();
  },

  async transcribe() {
    if (!window.linguaDraft?.asr) {
      throw new Error("本地语音服务未初始化");
    }
    const result = await window.linguaDraft.asr.transcribe();
    return result.text;
  }
};
