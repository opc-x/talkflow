/** Web Speech API playback — returns a Promise that resolves when audio ends */
export function speakEnglish(text: string, rate = 0.85): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve()
  window.speechSynthesis.cancel()
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-US"
    utterance.rate = rate
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    window.speechSynthesis.speak(utterance)
  })
}
