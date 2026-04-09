let mediaStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;
let chunks: BlobPart[] = [];
let recordedBlob: Blob | null = null;
let mimeTypeUsed = "audio/webm";
let progressListener: ((text: string) => void) | null = null;
let interimTimer: number | null = null;
let interimInFlight = false;

const INTERIM_MS = 1200;

const pickMimeType = () => {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
};

const extensionFromMimeType = (mimeType: string) => {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
};

const notifyProgress = (text: string) => {
  if (!progressListener) return;
  progressListener(text);
};

const scheduleInterim = () => {
  if (interimTimer !== null) return;
  interimTimer = window.setTimeout(async () => {
    interimTimer = null;
    if (interimInFlight || !window.linguaDraft?.asr || chunks.length === 0) return;
    try {
      interimInFlight = true;
      const blob = new Blob(chunks, { type: mimeTypeUsed });
      if (!blob.size) return;
      const raw = await blob.arrayBuffer();
      const extension = extensionFromMimeType(blob.type || mimeTypeUsed);
      const result = await window.linguaDraft.asr.transcribeAudio(raw, extension);
      if (result?.text?.trim()) notifyProgress(result.text.trim());
    } catch {
      // ignore interim recognition errors and continue final recognition
    } finally {
      interimInFlight = false;
    }
  }, INTERIM_MS);
};

export const voiceService = {
  setProgressListener(listener: ((text: string) => void) | null) {
    progressListener = listener;
  },

  async startRecording() {
    if (!window.linguaDraft?.asr) {
      throw new Error("本地语音服务未初始化");
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("当前环境不支持麦克风录音");
    }
    chunks = [];
    recordedBlob = null;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStream = stream;
    const selectedMimeType = pickMimeType();
    mimeTypeUsed = selectedMimeType || "audio/webm";
    mediaRecorder = selectedMimeType
      ? new MediaRecorder(stream, { mimeType: selectedMimeType })
      : new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
        scheduleInterim();
      }
    };
    mediaRecorder.start(500);
    return window.linguaDraft.asr.start();
  },

  async stopRecording() {
    if (!window.linguaDraft?.asr) {
      throw new Error("本地语音服务未初始化");
    }
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        const recorder = mediaRecorder!;
        recorder.onstop = () => resolve();
        recorder.stop();
      });
      recordedBlob = new Blob(chunks, { type: mimeTypeUsed });
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    mediaStream = null;
    mediaRecorder = null;
    if (interimTimer !== null) {
      window.clearTimeout(interimTimer);
      interimTimer = null;
    }
    return window.linguaDraft.asr.stop();
  },

  async cancelRecording() {
    if (!window.linguaDraft?.asr) {
      throw new Error("本地语音服务未初始化");
    }
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        const recorder = mediaRecorder!;
        recorder.onstop = () => resolve();
        recorder.stop();
      });
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    mediaStream = null;
    mediaRecorder = null;
    recordedBlob = null;
    chunks = [];
    if (interimTimer !== null) {
      window.clearTimeout(interimTimer);
      interimTimer = null;
    }
    return window.linguaDraft.asr.stop();
  },

  async transcribe() {
    if (!window.linguaDraft?.asr) {
      throw new Error("本地语音服务未初始化");
    }
    if (!recordedBlob || recordedBlob.size === 0) {
      throw new Error("未获取到录音数据，请重新录音");
    }
    const raw = await recordedBlob.arrayBuffer();
    const extension = extensionFromMimeType(recordedBlob.type || mimeTypeUsed);
    const result = await window.linguaDraft.asr.transcribeAudio(raw, extension);
    recordedBlob = null;
    chunks = [];
    if (interimTimer !== null) {
      window.clearTimeout(interimTimer);
      interimTimer = null;
    }
    return result.text;
  }
};
