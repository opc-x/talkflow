import type { RoundEvaluation } from "@shared/types/assessment"

export class SpeechRecognitionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SpeechRecognitionError"
  }
}

type SpeechResult = {
  isFinal: boolean
  0: { transcript: string }
  length: number
}

type SpeechRecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((ev: { resultIndex: number; results: { length: number; [i: number]: SpeechResult } }) => void) | null
  onerror: ((ev: { error: string }) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

let activeRecognition: SpeechRecognitionInstance | null = null

export interface ListeningHandle {
  promise: Promise<string>
  stop: () => void
  abort: () => void
}

/**
 * Start on pointerdown (must be synchronous with user gesture).
 * Call stop() on pointerup — Chrome finalizes transcript on stop/end.
 */
export function startEnglishListening(maxMs = 12000): ListeningHandle {
  const SR = getSpeechRecognition()
  if (!SR) {
    return {
      stop: () => {},
      abort: () => {},
      promise: Promise.reject(
        new SpeechRecognitionError("当前浏览器不支持语音识别，请用 Chrome 或 Edge")
      ),
    }
  }

  activeRecognition?.abort()

  let settled = false
  let timer = 0
  let manualStop = false
  let bestTranscript = ""
  const rec = new SR()
  activeRecognition = rec

  rec.lang = "en-US"
  rec.continuous = true
  rec.interimResults = true
  rec.maxAlternatives = 1

  const promise = new Promise<string>((resolve, reject) => {
    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      if (activeRecognition === rec) activeRecognition = null
      fn()
    }

    timer = window.setTimeout(() => {
      manualStop = true
      try {
        rec.stop()
      } catch {
        /* ignore */
      }
    }, maxMs)

    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i]
        const text = chunk?.[0]?.transcript?.trim() ?? ""
        if (!text) continue
        if (chunk.isFinal) {
          bestTranscript = `${bestTranscript} ${text}`.trim()
          finish(() => resolve(bestTranscript))
          return
        }
        bestTranscript = text
      }
    }

    rec.onerror = (event) => {
      if (event.error === "aborted") return
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        finish(() =>
          reject(new SpeechRecognitionError("麦克风权限被拒绝，请在浏览器设置里允许"))
        )
        return
      }
      if (event.error === "no-speech") {
        finish(() =>
          reject(new SpeechRecognitionError("没听到声音，按住麦克风再说一遍"))
        )
        return
      }
      if (event.error === "network") {
        finish(() =>
          reject(
            new SpeechRecognitionError("语音识别需要网络（Chrome 走 Google 服务）")
          )
        )
        return
      }
      finish(() => reject(new SpeechRecognitionError("语音识别失败，请重试")))
    }

    rec.onend = () => {
      if (settled) return
      const text = bestTranscript.trim()
      if (text) {
        finish(() => resolve(text))
        return
      }
      finish(() =>
        reject(
          new SpeechRecognitionError(
            manualStop
              ? "没听到声音，按住麦克风用英语说，松开结束"
              : "没听清，按住麦克风再说一遍"
          )
        )
      )
    }

    try {
      rec.start()
    } catch {
      finish(() => reject(new SpeechRecognitionError("无法启动语音识别，请再试一次")))
    }
  })

  return {
    promise,
    stop: () => {
      manualStop = true
      try {
        rec.stop()
      } catch {
        /* ignore */
      }
    },
    abort: () => {
      manualStop = true
      try {
        rec.abort()
      } catch {
        /* ignore */
      }
    },
  }
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokens(text: string): string[] {
  return normalize(text).split(" ").filter(Boolean)
}

function wordOverlap(user: string, reference: string): number {
  const ref = tokens(reference)
  if (ref.length === 0) return tokens(user).length > 0 ? 0.4 : 0
  const userSet = new Set(tokens(user))
  let hit = 0
  for (const w of ref) {
    if (userSet.has(w)) hit++
  }
  return hit / ref.length
}

function scoresFromOverlap(overlap: number) {
  const scaled = Math.round(overlap * 10)
  const base = Math.max(1, Math.min(10, scaled || 1))
  return {
    fluency: base,
    grammar: Math.max(1, Math.min(10, base + (overlap >= 0.6 ? 1 : 0))),
    vocabulary: Math.max(1, Math.min(10, base + (overlap >= 0.4 ? 1 : -1))),
  }
}

function buildFeedback(overlap: number): string {
  if (overlap >= 0.75) return "不错，关键词都到了，再练几遍会更顺。"
  if (overlap >= 0.5) return "大意对了，对照参考答案把缺的词补上说出来。"
  if (overlap >= 0.25) return "只匹配了一部分，听参考答案再完整说一遍。"
  return "和参考答案差比较多，先听一遍标准答案，再模仿着说。"
}

export function evaluateLocally(
  question: string,
  referenceAnswer: string,
  transcript: string,
  roundIndex: number,
  scoringAnswer?: string
): RoundEvaluation {
  const ref = (scoringAnswer?.trim() || referenceAnswer).trim()
  const overlap = wordOverlap(transcript, ref)
  const scores = scoresFromOverlap(overlap)
  const suggestion = referenceAnswer.trim() || transcript

  return {
    roundIndex,
    transcript: transcript || "（未识别到语音）",
    suggestion,
    feedback: buildFeedback(overlap),
    scores,
  }
}

export function isAiPracticeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AI_PRACTICE === "true"
}
