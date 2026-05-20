"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Mic, Loader2, Zap } from "lucide-react"
import { speakEnglish } from "@/lib/speech"

const ROUNDS = [
  {
    scene: "office",
    question: "What do you do for work?",
    userSaid: "I am... engineer",
    suggestion: "I'm a software engineer.",
  },
  {
    scene: "cafe",
    question: "What would you like to drink?",
    userSaid: "I want coffee... no sugar",
    suggestion: "I'd like a coffee with no sugar, please.",
  },
  {
    scene: "airport",
    question: "Where are you flying to?",
    userSaid: "I go to London",
    suggestion: "I'm flying to London.",
  },
] as const

const START_LESSON = { book: 3, lesson: 28 }

export default function OnboardingPage() {
  const [screen, setScreen] = useState(0)
  const [round, setRound] = useState(0)
  const [recording, setRecording] = useState(false)
  const [visible, setVisible] = useState(true)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [screen, round])

  useEffect(() => {
    if (screen !== 4) return
    const t = setTimeout(() => setScreen(5), 2200)
    return () => clearTimeout(t)
  }, [screen])

  function finish() {
    startTransition(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      const { data: lesson } = await supabase
        .from("lessons")
        .select("id")
        .eq("book_num", START_LESSON.book)
        .eq("lesson_num", START_LESSON.lesson)
        .maybeSingle()

      if (lesson) {
        await supabase.from("user_progress").upsert(
          {
            user_id: user.id,
            current_lesson_id: lesson.id,
            lessons_done: [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
      }
      router.push(`/protected/learn/${START_LESSON.book}/${START_LESSON.lesson}`)
    })
  }

  function startRecording() {
    setRecording(true)
    setTimeout(() => {
      setRecording(false)
      setScreen(3)
    }, 2800)
  }

  function nextFromFeedback() {
    if (round < ROUNDS.length - 1) {
      setRound((r) => r + 1)
      setScreen(1)
    } else {
      setScreen(4)
    }
  }

  const fade: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(8px)",
    transition: "opacity 300ms ease, transform 300ms ease",
  }

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center px-5 py-10"
      style={{
        background:
          "radial-gradient(ellipse 120% 50% at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 55%), #111111",
      }}
    >
      <div className="w-full max-w-md flex flex-col flex-1" style={fade}>
        {/* Screen 0 — Hook */}
        {screen === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
                <Mic className="w-9 h-9 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">3 分钟，测出你的英语</h1>
            <p className="text-sm text-muted-foreground mb-10">开口说，AI 立刻给反馈</p>
            <button
              type="button"
              onClick={() => setScreen(1)}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg"
            >
              开始测评 →
            </button>
          </div>
        )}

        {/* Screen 1 — Scene + question */}
        {screen === 1 && (
          <div className="flex-1 flex flex-col pt-4">
            <div className="flex justify-center gap-2 mb-6">
              {ROUNDS.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full ${i <= round ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
            <div className="h-40 rounded-2xl bg-[#1a1a1a] border border-border mb-6 flex items-center justify-center text-muted-foreground text-sm">
              场景：{ROUNDS[round].scene === "office" ? "办公室" : ROUNDS[round].scene === "cafe" ? "咖啡厅" : "机场"}
            </div>
            <div className="rounded-2xl bg-[#1a1a1a] border border-border px-4 py-3 mb-auto">
              <p className="text-xs text-muted-foreground mb-1">AI</p>
              <p className="text-lg text-foreground">{ROUNDS[round].question}</p>
            </div>
            <button
              type="button"
              onClick={() => setScreen(2)}
              className="mt-8 mx-auto w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_0_32px_rgba(16,185,129,0.45)]"
              aria-label="开始录音"
            >
              <Mic className="w-8 h-8" />
            </button>
          </div>
        )}

        {/* Screen 2 — Recording */}
        {screen === 2 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-lg text-foreground mb-6">{recording ? "正在听…" : "准备好了吗？"}</p>
            <div className="flex items-end gap-1 h-10 mb-8">
              {[3, 6, 4, 8, 5, 7, 4].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-primary"
                  style={{
                    height: recording ? `${h * 4}px` : "4px",
                    transition: "height 200ms ease",
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={startRecording}
              disabled={recording}
              className={`w-20 h-20 rounded-full flex items-center justify-center ${
                recording ? "bg-red-500 animate-pulse" : "bg-primary"
              } text-white`}
            >
              <Mic className="w-8 h-8" />
            </button>
            {!recording && (
              <p className="text-xs text-muted-foreground mt-4">点击麦克风开始，约 3 秒自动结束</p>
            )}
          </div>
        )}

        {/* Screen 3 — Feedback */}
        {screen === 3 && (
          <div className="flex-1 flex flex-col pt-4">
            <div className="flex justify-center gap-2 mb-6">
              {ROUNDS.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full ${i <= round ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-2">你说的：</p>
            <div className="rounded-xl border border-border bg-[#1a1a1a] px-4 py-3 mb-4 text-foreground">
              &ldquo;{ROUNDS[round].userSaid}&rdquo;
            </div>
            <p className="text-sm text-muted-foreground mb-2">AI 建议：</p>
            <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 mb-auto">
              <p className="text-foreground flex items-start gap-2">
                <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                {ROUNDS[round].suggestion}
              </p>
              <p className="text-xs text-primary mt-2">流利度 +1</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                className="flex-1 h-12 rounded-xl border border-border text-muted-foreground"
                onClick={() => {
                  speakEnglish(ROUNDS[round].suggestion)
                  setScreen(2)
                  setRecording(false)
                }}
              >
                ↺ 再来一遍
              </button>
              <button
                type="button"
                className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-medium"
                onClick={nextFromFeedback}
              >
                继续下一题 →
              </button>
            </div>
          </div>
        )}

        {/* Screen 4 — Level reveal */}
        {screen === 4 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h1 className="text-2xl font-bold text-foreground mb-6">你的英语水平</h1>
            <div className="w-full flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span>A1</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-[grow_0.8s_ease-out_forwards]" style={{ width: "52%" }} />
              </div>
              <span>C2</span>
            </div>
            <p className="text-xl font-semibold text-primary mt-4">B1 · 日常对话级</p>
            <div className="mt-8 rounded-2xl border border-border bg-[#1a1a1a] p-5 text-sm text-muted-foreground text-left w-full">
              <p>✓ 流利度 &nbsp; ✓ 词汇量 &nbsp; ✓ 语法基础</p>
              <p className="mt-2 text-foreground">已为你生成专属课程 · 从第 28 课开始</p>
            </div>
            <style>{`@keyframes grow { from { width: 0 } to { width: 52% } }`}</style>
          </div>
        )}

        {/* Screen 5 — Launch */}
        {screen === 5 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h1 className="text-2xl font-bold text-foreground mb-6">准备好了！</h1>
            <div className="w-full rounded-2xl border border-primary/25 bg-[#1a1a1a] p-5 text-left mb-8">
              <p className="text-lg font-semibold text-foreground">💬 日常对话 · 第 28 课</p>
              <p className="text-sm text-muted-foreground mt-2">know · travel · station · weather</p>
              <p className="text-xs text-muted-foreground mt-3">约 15 分钟 · 20 句口语练习</p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={finish}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg flex items-center justify-center gap-2"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
              {isPending ? "准备中…" : "开始第一课 →"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
