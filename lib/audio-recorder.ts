export class AudioRecorderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AudioRecorderError";
  }
}

export async function recordAudio(maxMs = 8000): Promise<Blob> {
  if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new AudioRecorderError("当前浏览器不支持录音");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";

  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, maxMs);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onerror = () => {
      window.clearTimeout(timeout);
      stream.getTracks().forEach((track) => track.stop());
      reject(new AudioRecorderError("录音失败，请检查麦克风权限"));
    };

    recorder.onstop = () => {
      window.clearTimeout(timeout);
      stream.getTracks().forEach((track) => track.stop());
      if (chunks.length === 0) {
        reject(new AudioRecorderError("没有录到声音，请再试一次"));
        return;
      }
      resolve(new Blob(chunks, { type: mimeType }));
    };

    recorder.start();
  });
}
