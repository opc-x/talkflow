/** MVP: Web Speech API for word / sentence playback */
export function speakEnglish(text: string, rate = 0.85) {
  if (typeof window === "undefined" || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "en-US"
  utterance.rate = rate
  window.speechSynthesis.speak(utterance)
}
