"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Mic, CheckCircle2, Ear, Zap, Loader2 } from "lucide-react"

const STAGE_OPTIONS = [
  { label: "刚开始学口语",    sub: "从 Book 1 开始",  book: 1, lesson: 1,   recommended: false },
  { label: "学过一点，有基础", sub: "从 Book 3 开始",  book: 3, lesson: 31,  recommended: true  },
  { label: "中级，能简单交流", sub: "从 Book 5 开始",  book: 5, lesson: 91,  recommended: false },
  { label: "较流利，想突破",   sub: "从 Book 7 开始",  book: 7, lesson: 131, recommended: false },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const [visible, setVisible] = useState(true)
  const router = useRouter()
  const selected = selectedIdx !== null ? STAGE_OPTIONS[selectedIdx] : null

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 20)
    return () => clearTimeout(t)
  }, [step])

  async function handleFinish() {
    if (!selected) return
    startTransition(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth/login"); return }
      const { data: lesson } = await supabase
        .from("lessons").select("id")
        .eq("book_num", selected.book).eq("lesson_num", selected.lesson).single()
      if (lesson) {
        await supabase.from("user_progress").upsert(
          { user_id: user.id, current_lesson_id: lesson.id, lessons_done: [], updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        )
      }
      router.push(`/protected/learn/${selected.book}/${selected.lesson}`)
    })
  }

  const transitionStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(10px)",
    transition: "opacity 300ms ease-out, transform 300ms ease-out",
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "radial-gradient(ellipse 120% 50% at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 55%), #111111",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "0 0 48px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "384px",
          margin: "0 auto",
          padding: "40px 20px 0",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <Mic size={20} color="#10B981" />
          <span style={{ fontWeight: 700, fontSize: 20, color: "#F5F5F5", letterSpacing: "-0.3px" }}>
            TalkFlow
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 999,
                backgroundColor: i <= step ? "#10B981" : "rgba(255,255,255,0.12)",
                transition: "background-color 400ms ease",
              }}
            />
          ))}
        </div>

        {/* Step label */}
        <div
          style={{
            textAlign: "right",
            fontSize: 12,
            color: "rgba(245,245,245,0.38)",
            marginBottom: 32,
          }}
        >
          第 {step + 1} 步 · 共 3 步
        </div>

        {/* Step content */}
        <div style={transitionStyle}>
          {step === 0 && (
            <StepPickLevel
              selectedIdx={selectedIdx}
              setSelectedIdx={setSelectedIdx}
              onNext={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <StepRules
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <StepLaunch
              selected={selected}
              isPending={isPending}
              onFinish={handleFinish}
              onBack={() => setStep(0)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Step 0 ─────────────────────────────────────────────────────────── */

function StepPickLevel({
  selectedIdx,
  setSelectedIdx,
  onNext,
}: {
  selectedIdx: number | null
  setSelectedIdx: (i: number) => void
  onNext: () => void
}) {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#F5F5F5", margin: 0, lineHeight: 1.3 }}>
        你学到哪了？
      </h1>
      <p style={{ fontSize: 14, color: "rgba(245,245,245,0.60)", marginTop: 6, marginBottom: 20 }}>
        帮你找合适的起点，不浪费你一分钟
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {STAGE_OPTIONS.map((opt, i) => {
          const isSelected = selectedIdx === i
          return (
            <button
              key={i}
              onClick={() => setSelectedIdx(i)}
              style={{
                padding: 16,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                backgroundColor: isSelected ? "rgba(16,185,129,0.07)" : "#1a1a1a",
                border: `1px solid ${isSelected ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.08)"}`,
                transition: "background-color 180ms, border-color 180ms",
                outline: "none",
              }}
            >
              {/* Accent bar */}
              <div
                style={{
                  width: 4,
                  alignSelf: "stretch",
                  borderRadius: 2,
                  flexShrink: 0,
                  backgroundColor: isSelected ? "#10B981" : "rgba(16,185,129,0.0)",
                  transition: "background-color 180ms",
                }}
              />

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#F5F5F5", lineHeight: 1.4 }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 12, color: "rgba(245,245,245,0.38)", marginTop: 2 }}>
                  {opt.sub}
                </div>
              </div>

              {/* Right side */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                {opt.recommended && !isSelected && (
                  <span
                    style={{
                      backgroundColor: "rgba(16,185,129,0.12)",
                      color: "#10B981",
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontWeight: 600,
                      lineHeight: 1.6,
                    }}
                  >
                    推荐
                  </span>
                )}
                {isSelected && <CheckCircle2 size={16} color="#10B981" />}
              </div>
            </button>
          )
        })}
      </div>

      <button
        onClick={onNext}
        disabled={selectedIdx === null}
        style={{
          marginTop: 20,
          width: "100%",
          height: 48,
          borderRadius: 12,
          backgroundColor: "#10B981",
          color: "#fff",
          fontWeight: 600,
          fontSize: 15,
          border: "none",
          cursor: selectedIdx === null ? "not-allowed" : "pointer",
          opacity: selectedIdx === null ? 0.35 : 1,
          transition: "opacity 180ms",
        }}
      >
        确认，找我的起点 →
      </button>
    </div>
  )
}

/* ─── Step 1 ─────────────────────────────────────────────────────────── */

const RULES = [
  {
    icon: <Ear size={18} color="#10B981" />,
    title: "听到问题，不要停",
    desc: "AI 发问很快，别在脑子里翻译，直接开口",
  },
  {
    icon: <Mic size={18} color="#10B981" />,
    title: "说错了，重说",
    desc: "不会嘲笑你，但会逼你说对为止",
  },
  {
    icon: <Zap size={18} color="#10B981" />,
    title: "重复到自动",
    desc: "同一句话反复出现，直到你闭眼也能说出来",
  },
]

function StepRules({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F5F5F5", margin: 0, lineHeight: 1.3 }}>
        三件事，记住就够了
      </h1>
      <p style={{ fontSize: 14, color: "rgba(245,245,245,0.60)", marginTop: 6, marginBottom: 0 }}>
        不用懂语法，不用背单词——只要张嘴
      </p>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        {RULES.map((rule, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: "rgba(16,185,129,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {rule.icon}
            </div>
            <div style={{ paddingTop: 2 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#F5F5F5", lineHeight: 1.4 }}>
                {rule.title}
              </div>
              <div style={{ fontSize: 13, color: "rgba(245,245,245,0.60)", marginTop: 2, lineHeight: 1.5 }}>
                {rule.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tip box */}
      <div
        style={{
          marginTop: 16,
          backgroundColor: "rgba(16,185,129,0.05)",
          border: "1px solid rgba(16,185,129,0.14)",
          borderRadius: 16,
          padding: 16,
        }}
      >
        <p style={{ fontSize: 13, color: "rgba(245,245,245,0.60)", margin: 0, lineHeight: 1.6 }}>
          💡 一开始会很别扭，这很正常。坚持 2 周，你会发现自己开口快了一截。
        </p>
      </div>

      {/* Buttons */}
      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            fontSize: 14,
            color: "rgba(245,245,245,0.38)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          ← 返回
        </button>
        <button
          onClick={onNext}
          style={{
            flex: 1,
            height: 44,
            borderRadius: 12,
            backgroundColor: "#10B981",
            color: "#fff",
            fontWeight: 600,
            fontSize: 15,
            border: "none",
            cursor: "pointer",
          }}
        >
          我记住了 →
        </button>
      </div>
    </div>
  )
}

/* ─── Step 2 ─────────────────────────────────────────────────────────── */

function StepLaunch({
  selected,
  isPending,
  onFinish,
  onBack,
}: {
  selected: (typeof STAGE_OPTIONS)[number] | null
  isPending: boolean
  onFinish: () => void
  onBack: () => void
}) {
  return (
    <div style={{ textAlign: "center" }}>
      {/* Pulse mic */}
      <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 24px" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "rgba(16,185,129,0.15)",
            animation: "pulse-ring 2s ease-out infinite",
          }}
        />
        <div
          style={{
            position: "relative",
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(16,185,129,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Mic size={32} color="#10B981" />
        </div>
      </div>
      <style>{`@keyframes pulse-ring{0%{transform:scale(1);opacity:0.4}70%{transform:scale(1.5);opacity:0}100%{transform:scale(1.5);opacity:0}}`}</style>

      <h1 style={{ fontSize: 26, fontWeight: 700, color: "#F5F5F5", margin: 0, lineHeight: 1.3 }}>
        准备好了！
      </h1>
      <p style={{ fontSize: 14, color: "rgba(245,245,245,0.60)", marginTop: 8, marginBottom: 0 }}>
        第一课约 5 分钟，你会说出第一句完整的英语
      </p>

      {/* Start card */}
      <div
        style={{
          marginTop: 24,
          backgroundColor: "#1a1a1a",
          border: "1px solid rgba(16,185,129,0.22)",
          borderRadius: 16,
          padding: 20,
          textAlign: "left",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "rgba(245,245,245,0.38)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: 600,
          }}
        >
          你的起点
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#F5F5F5", marginTop: 4, lineHeight: 1.3 }}>
          Book {selected?.book} · Lesson {selected?.lesson}
        </div>
        <div style={{ fontSize: 13, color: "rgba(245,245,245,0.60)", marginTop: 2 }}>
          {selected?.sub ?? selected?.label}
        </div>
        <div
          style={{
            marginTop: 12,
            marginBottom: 12,
            height: 1,
            backgroundColor: "rgba(255,255,255,0.06)",
          }}
        />
        <div style={{ fontSize: 12, color: "rgba(245,245,245,0.38)" }}>
          ⏱ 预计 5 分钟完成第一课
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onFinish}
        disabled={isPending}
        style={{
          marginTop: 24,
          width: "100%",
          height: 56,
          borderRadius: 12,
          backgroundColor: "#10B981",
          color: "#fff",
          fontWeight: 700,
          fontSize: 16,
          border: "none",
          cursor: isPending ? "not-allowed" : "pointer",
          opacity: isPending ? 0.7 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "opacity 180ms",
        }}
      >
        {isPending ? (
          <>
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            准备中…
          </>
        ) : (
          "开始第一课 →"
        )}
      </button>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Back to edit */}
      <button
        onClick={onBack}
        style={{
          marginTop: 12,
          fontSize: 12,
          color: "rgba(245,245,245,0.38)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 0",
        }}
      >
        ← 修改起点
      </button>
    </div>
  )
}
