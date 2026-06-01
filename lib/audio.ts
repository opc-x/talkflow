import { speakEnglish } from "@/lib/speech"

/** Play pre-generated audio when available, else Web Speech */
export async function playUtterance(
  text: string,
  audioUrl?: string | null,
  rate = 0.85
): Promise<void> {
  if (audioUrl?.trim()) {
    try {
      await new Promise<void>((resolve, reject) => {
        const audio = new Audio(audioUrl)
        audio.onended = () => resolve()
        audio.onerror = () => reject(new Error("audio playback failed"))
        void audio.play().catch(reject)
      })
      return
    } catch {
      // fall through to Web Speech
    }
  }
  await speakEnglish(text, rate)
}
