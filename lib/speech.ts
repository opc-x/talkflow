let voiceReady: Promise<void> | null = null

function loadVoices(): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve()
  }
  if (window.speechSynthesis.getVoices().length > 0) {
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    const done = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", done)
      resolve()
    }
    window.speechSynthesis.addEventListener("voiceschanged", done)
    window.setTimeout(done, 300)
  })
}

function pickEnUsVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null
  const voices = window.speechSynthesis.getVoices()
  const preferred = ["Samantha", "Google US English", "Aaron", "Daniel", "Karen"]
  for (const name of preferred) {
    const match = voices.find(
      (v) => v.name.includes(name) && v.lang.toLowerCase().startsWith("en")
    )
    if (match) return match
  }
  return (
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.toLowerCase().startsWith("en")) ??
    null
  )
}

/** Web Speech API playback — returns a Promise that resolves when audio ends */
export async function speakEnglish(text: string, rate = 0.85): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return
  if (!voiceReady) voiceReady = loadVoices()
  await voiceReady

  window.speechSynthesis.cancel()
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-US"
    utterance.rate = rate
    const voice = pickEnUsVoice()
    if (voice) utterance.voice = voice
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    window.speechSynthesis.speak(utterance)
  })
}
