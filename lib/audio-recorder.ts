export class AudioRecorderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AudioRecorderError";
  }
}

export async function recordAudio(maxMs = 6000): Promise<Blob> {
  const { promise } = startRecording(maxMs)
  return promise
}

export interface RecordingHandle {
  promise: Promise<Blob>
  stop: () => void
}

/** 点击开始、再点结束；超时也会自动 stop */
export function startRecording(maxMs = 6000): RecordingHandle {
  if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return {
      stop: () => {},
      promise: Promise.reject(new AudioRecorderError("当前浏览器不支持录音")),
    }
  }

  let stream: MediaStream | null = null
  let recorder: MediaRecorder | null = null
  let timeoutId = 0

  const promise = (async () => {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm"

    recorder = new MediaRecorder(stream, { mimeType })
    const chunks: BlobPart[] = []

    return new Promise<Blob>((resolve, reject) => {
      timeoutId = window.setTimeout(() => {
        if (recorder?.state === "recording") recorder.stop()
      }, maxMs)

      recorder!.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }

      recorder!.onerror = () => {
        window.clearTimeout(timeoutId)
        stream?.getTracks().forEach((t) => t.stop())
        reject(new AudioRecorderError("录音失败，请检查麦克风权限"))
      }

      recorder!.onstop = () => {
        window.clearTimeout(timeoutId)
        stream?.getTracks().forEach((t) => t.stop())
        if (chunks.length === 0) {
          reject(new AudioRecorderError("没有录到声音，请再试一次或点「跳过录音」"))
          return
        }
        resolve(new Blob(chunks, { type: mimeType }))
      }

      recorder!.start()
    })
  })()

  return {
    promise,
    stop: () => {
      if (recorder?.state === "recording") recorder.stop()
    },
  }
}
