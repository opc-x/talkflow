"use client"

import { useState, useEffect, useTransition, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Mic, Loader2, Zap, AlertCircle, ImageIcon, MessageCircle, RotateCcw } from "lucide-react"
import { speakEnglish } from "@/lib/speech"
import { recordAudio, AudioRecorderError } from "@/lib/audio-recorder"
import { roundAverageScore } from "@shared/assessment/placement"
import type { AssessmentQuestion, AssessmentResult, RoundEvaluation } from "@shared/types/assessment"
import {
  getAssessmentQuestions,
  evaluateAssessmentRound,
  completeAssessment,
} from "@/lib/api/assessment"
import { COPY } from "@/lib/copy"

const RULES = [
  {
    title: "看到场景就开口",
    desc: "别在脑子里翻译成中文，直接用英语反应",
  },
  {
    title: "说错了会当场纠正",
    desc: "AI 不会嘲笑你，但会逼你说到更自然为止",
  },
  {
    title: "练的是嘴，不是眼",
    desc: "不用背词表，反复说到脱口而出",
  },
] as const

const PASS_SCORE = 5

export default function OnboardingPage() {
  const [screen, setScreen] = useState(0)
  const [round, setRound] = useState(0)
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [evaluations, setEvaluations] = useState<RoundEvaluation[]>([])
  const [currentEval, setCurrentEval] = useState<RoundEvaluation | null>(null)
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [recording, setRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [visible, setVisible] = useState(true)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const currentQuestion = questions[round] ?? null
  const totalRounds = questions.length

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [screen, round])

  useEffect(() => {
    let cancelled = false
    async function loadQuestions() {
      setLoading(true)
      setLoadError(null)
      try {
        const data = await getAssessmentQuestions()
        if (!cancelled) setQuestions(data.questions ?? [])
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "加载失败")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadQuestions()
    return () => {
      cancelled = true
    }
  }, [])

  const finalizeAndLaunch = useCallback(async (rounds: RoundEvaluation[]) => {
    const data = await completeAssessment(rounds)
    setResult(data)
    setScreen(4)
  }, [])

  async function handleRecord() {
    if (!currentQuestion || recording) return
    setActionError(null)
    setRecording(true)

    try {
      const blob = await recordAudio(8000)
      const formData = new FormData()
      formData.append("audio", blob, `round-${round}.webm`)
      formData.append("question", currentQuestion.question)
      formData.append("referenceAnswer", currentQuestion.referenceAnswer)
      formData.append("roundIndex", String(round))

      const evaluation = await evaluateAssessmentRound(formData)
      setCurrentEval(evaluation)
      setEvaluations((prev) => {
        const next = [...prev.filter((e) => e.roundIndex !== round), evaluation]
        return next.sort((a, b) => a.roundIndex - b.roundIndex)
      })
      setScreen(3)
    } catch (err) {
      const domErr = err as DOMException
      if (domErr?.name === "NotAllowedError" || domErr?.name === "PermissionDeniedError") {
        setActionError(
          "麦克风权限被拒绝。请在浏览器地址栏点击锁形图标 → 允许麦克风，然后刷新页面重试。"
        )
      } else {
        setActionError(
          err instanceof AudioRecorderError
            ? err.message
            : err instanceof Error
              ? err.message
              : "录音或评估失败"
        )
      }
    } finally {
      setRecording(false)
    }
  }

  function continueAfterFeedback() {
    setActionError(null)
    const allRounds = currentEval
      ? [...evaluations.filter((e) => e.roundIndex !== currentEval.roundIndex), currentEval].sort(
          (a, b) => a.roundIndex - b.roundIndex
        )
      : evaluations

    if (round < totalRounds - 1) {
      setRound((r) => r + 1)
      setCurrentEval(null)
      setScreen(2)
      return
    }

    startTransition(async () => {
      try {
        await finalizeAndLaunch(allRounds)
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "完成体验失败")
      }
    })
  }

  function finish() {
    if (!result) return
    router.push(`/${locale}/protected/learn/${result.bookNum}/${result.suggestedLessonNum}`)
  }

  const fade: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(8px)",
    transition: "opacity 300ms ease, transform 300ms ease",
  }

  const roundScore = currentEval ? roundAverageScore(currentEval) : 0
  const passedRound = roundScore >= PASS_SCORE

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center px-5 py-10"
      style={{
        background:
          "radial-gradient(ellipse 120% 50% at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 55%), #111111",
      }}
    >
      <div className="w-full max-w-md flex flex-col flex-1" style={fade}>
        {(loadError || actionError) && (
          <div className="mb-4 flex flex-col gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loadError ?? actionError}</span>
            </div>
            {actionError && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="self-start rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-100 hover:bg-red-500/10"
              >
                刷新重试
              </button>
            )}
          </div>
        )}

        {/* 0 — 产品承诺 */}
        {screen === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
                <Mic className="w-9 h-9 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">脱口而出，靠练不靠背</h1>
            <p className="text-sm text-muted-foreground mb-1">AI 问，你答，说对为止</p>
            <p className="text-sm text-muted-foreground mb-10 max-w-xs">
              先看场景，开口说两句，体验 TalkFlow 怎么练嘴
            </p>
            <button
              type="button"
              disabled={loading || !!loadError || questions.length === 0}
              onClick={() => setScreen(2)}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg disabled:opacity-50"
            >
              {loading ? "准备场景…" : "开口练第一句 →"}
            </button>
          </div>
        )}

        {/* 1 — 怎么练 */}
        {screen === 1 && (
          <div className="flex-1 flex flex-col pt-4">
            <h1 className="text-xl font-bold text-foreground mb-2">TalkFlow 怎么练？</h1>
            <p className="text-sm text-muted-foreground mb-6">三句话，记住就够了</p>
            <ul className="flex flex-col gap-4 mb-auto">
              {RULES.map((rule, i) => (
                <li
                  key={rule.title}
                  className="rounded-2xl border border-border bg-[#1a1a1a] px-4 py-4"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {i + 1}. {rule.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{rule.desc}</p>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setScreen(2)}
              className="mt-8 w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold"
            >
              明白了，试第一句 →
            </button>
          </div>
        )}

        {/* 2 — 场景 + 问题（题目缺失） */}
        {screen === 2 && !currentQuestion && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <p className="text-foreground mb-4">题目加载失败，请返回重试</p>
            <button
              type="button"
              onClick={() => setScreen(1)}
              className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              返回
            </button>
          </div>
        )}

        {/* 2 — 场景 + 问题 */}
        {screen === 2 && currentQuestion && (
          <div className="flex-1 flex flex-col pt-2">
            <div className="flex justify-center gap-2 mb-4">
              {questions.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full ${i <= round ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground mb-3">
              体验 {round + 1} / {totalRounds}
            </p>

            <div className="h-44 rounded-2xl bg-[#1a1a1a] border border-border mb-5 overflow-hidden relative">
              {currentQuestion.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentQuestion.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImageIcon className="w-8 h-8 opacity-40" />
                  <span className="text-sm">{currentQuestion.sceneLabel}</span>
                </div>
              )}
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-semibold text-white">
                <ImageIcon className="w-3 h-3" />
                {COPY.featureBadge}
              </span>
            </div>

            <div className="rounded-2xl bg-[#1a1a1a] border border-border px-4 py-3 mb-auto">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <MessageCircle className="w-3 h-3" /> AI 问你
              </p>
              <p className="text-lg text-foreground">{currentQuestion.question}</p>
            </div>

            <div className="mt-8 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleRecord}
                disabled={recording || isPending}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-[0_0_32px_rgba(16,185,129,0.45)] ${
                  recording ? "bg-red-500 animate-pulse" : "bg-primary text-primary-foreground"
                }`}
                aria-label="开始说话"
              >
                {recording ? (
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
              <p className="text-xs text-muted-foreground">
                {recording ? "正在听… 说完自动结束" : "点击麦克风，用英语回答"}
              </p>
            </div>
          </div>
        )}

        {/* 3 — 纠正反馈 */}
        {screen === 3 && currentEval && currentQuestion && (
          <div className="flex-1 flex flex-col pt-4">
            <div className="flex justify-center gap-2 mb-6">
              {questions.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full ${i <= round ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>

            <p className="text-sm text-muted-foreground mb-2">你说的：</p>
            <div className="rounded-xl border border-border bg-[#1a1a1a] px-4 py-3 mb-4 text-foreground">
              &ldquo;{currentEval.transcript}&rdquo;
            </div>

            <p className="text-sm text-muted-foreground mb-2">这样说更自然：</p>
            <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 mb-2">
              <p className="text-foreground flex items-start gap-2">
                <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                {currentEval.suggestion}
              </p>
              <p className="text-xs text-primary mt-2">{currentEval.feedback}</p>
            </div>

            {!passedRound && (
              <p className="text-xs text-amber-400/90 mb-auto mt-2">
                正式练习里，AI 会一直等你说到更标准为止。再练一遍？
              </p>
            )}
            {passedRound && <div className="mb-auto" />}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                className="flex-1 h-12 rounded-xl border border-border text-muted-foreground inline-flex items-center justify-center gap-1.5"
                onClick={async () => {
                  await speakEnglish(currentEval.suggestion)
                  setScreen(2)
                }}
                disabled={recording || isPending}
              >
                <RotateCcw className="w-4 h-4" />
                再练一遍
              </button>
              <button
                type="button"
                disabled={isPending}
                className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50"
                onClick={continueAfterFeedback}
              >
                {isPending
                  ? "准备中…"
                  : round < totalRounds - 1
                    ? "下一句 →"
                    : "看起点 →"}
              </button>
            </div>
            {!passedRound && (
              <button
                type="button"
                className="mt-3 text-xs text-muted-foreground underline"
                onClick={continueAfterFeedback}
              >
                先跳过，后面正式练
              </button>
            )}
          </div>
        )}

        {/* 4 — 出发 */}
        {screen === 4 && result && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">准备好了，开练</h1>
            <p className="text-sm text-muted-foreground mb-8">{result.readinessHint}</p>

            <div className="w-full rounded-2xl border border-primary/25 bg-[#1a1a1a] p-5 text-left mb-8">
              <p className="text-lg font-semibold text-foreground">
                {result.stageEmoji} {result.stageName} · 第 {result.suggestedLessonNum} 课
              </p>
              {result.vocabPreview && (
                <p className="text-sm text-muted-foreground mt-2">{result.vocabPreview}</p>
              )}
              <p className="text-xs text-muted-foreground mt-3">约 15 分钟 · 场景图 + 开口练习</p>
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={finish}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg flex items-center justify-center gap-2"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
              开口练第一课 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
