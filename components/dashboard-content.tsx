"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import CountUp from "react-countup"
import { Mic, ArrowRight, Flame, BookOpen, RotateCcw } from "lucide-react"

// ── Framer Motion variants ──────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
}

// ── Hover card helper ───────────────────────────────────────────────────────
function useHover() {
  const [hovered, setHovered] = useState(false)
  return {
    hovered,
    handlers: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
    },
  }
}

function hoverStyle(hovered: boolean) {
  return {
    transform: hovered ? "translateY(-4px) scale(1.01)" : "translateY(0) scale(1)",
    boxShadow: hovered
      ? "0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(16,185,129,0.20)"
      : "none",
    transition:
      "transform 280ms cubic-bezier(0.16,1,0.3,1), box-shadow 280ms cubic-bezier(0.16,1,0.3,1)",
  }
}

// ── Props ───────────────────────────────────────────────────────────────────
interface DashboardContentProps {
  displayName: string
  hasProgress: boolean
  streak: number
  lessonsDone: number
  reviewCount: number
  currentBook?: number
  currentLesson?: number
  vocabPreview?: string | null
  resumeHref: string
  onboardingHref: string
  reviewHref: string
  greeting: string
  dateStr: string
}

// ── Component ───────────────────────────────────────────────────────────────
export function DashboardContent({
  displayName,
  hasProgress,
  streak,
  lessonsDone,
  reviewCount,
  currentBook,
  currentLesson,
  vocabPreview,
  resumeHref,
  onboardingHref,
  reviewHref,
  greeting,
  dateStr,
}: DashboardContentProps) {
  const progressPct = Math.min(((lessonsDone % 16) / 16) * 100, 100)

  const mainCard = useHover()
  const task1 = useHover()
  const task2 = useHover()
  const stat1 = useHover()
  const stat2 = useHover()
  const stat3 = useHover()

  const streakBadge =
    streak >= 7 ? `🏆 连续 ${streak} 天！` : `再坚持 ${7 - streak} 天拿徽章 🎯`

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%) }
          100% { transform: translateX(200%) }
        }
        .cta-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 40%,
            rgba(255,255,255,0.18) 50%,
            transparent 60%
          );
          animation: shimmer 2.5s ease infinite;
          pointer-events: none;
        }
        @keyframes flame-pulse {
          0%,100% { transform: scale(1) }
          50%      { transform: scale(1.25) }
        }
      `}</style>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          minHeight: "100%",
          background:
            "radial-gradient(ellipse 120% 40% at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 50%), #111111",
          padding: "24px 20px 96px",
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        {/* ── 1. Greeting ──────────────────────────────────────────────────── */}
        <motion.div variants={item} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "rgba(245,245,245,0.38)", marginBottom: 4 }}>
            {dateStr}
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#F5F5F5" }}>
            {greeting}，{displayName}！
          </div>
        </motion.div>

        {/* ── 2. Streak banner ─────────────────────────────────────────────── */}
        {streak > 0 && (
          <motion.div
            variants={item}
            style={{
              backgroundColor: "rgba(249,115,22,0.08)",
              border: "1px solid rgba(249,115,22,0.22)",
              borderRadius: 16,
              padding: "12px 16px",
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "inline-flex", animation: "flame-pulse 1.5s ease-in-out infinite" }}>
                <Flame size={18} color="#f97316" />
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#f97316" }}>
                {streak} 天连续练习
              </span>
            </div>
            <span style={{ fontSize: 12, color: "rgba(249,115,22,0.80)" }}>
              {streakBadge}
            </span>
          </motion.div>
        )}

        {/* ── 3. Main card ─────────────────────────────────────────────────── */}
        {hasProgress ? (
          <motion.div
            variants={item}
            {...mainCard.handlers}
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.08)",
              borderLeft: "3px solid #10B981",
              borderRadius: 20,
              padding: 20,
              ...hoverStyle(mainCard.hovered),
            }}
          >
            <div style={{ fontSize: 11, color: "rgba(245,245,245,0.38)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
              继续上次
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#F5F5F5", marginBottom: 4 }}>
              Book {currentBook} · Lesson {currentLesson}
            </div>
            {vocabPreview && (
              <div style={{ fontSize: 13, color: "rgba(245,245,245,0.60)", marginBottom: 16 }}>
                {vocabPreview}
              </div>
            )}

            <div style={{ height: 4, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 999, marginBottom: 4, overflow: "hidden" }}>
              <motion.div
                style={{ height: "100%", backgroundColor: "#10B981", borderRadius: 999 }}
                initial={{ width: "0%" }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              />
            </div>

            <div style={{ fontSize: 11, color: "rgba(245,245,245,0.38)", marginBottom: 20 }}>
              已完成 {lessonsDone} 课
            </div>

            <Link
              href={resumeHref}
              className="cta-btn"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", height: 56, backgroundColor: "#10B981", borderRadius: 14,
                fontWeight: 700, fontSize: 16, color: "#fff", textDecoration: "none",
                position: "relative", overflow: "hidden",
              }}
            >
              <Mic size={18} />
              开口练习
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={item}
            {...mainCard.handlers}
            style={{
              backgroundColor: "rgba(16,185,129,0.04)",
              border: "1px solid rgba(16,185,129,0.22)",
              borderRadius: 20,
              padding: 24,
              ...hoverStyle(mainCard.hovered),
            }}
          >
            <div style={{ fontSize: 34, fontWeight: 900, color: "#F5F5F5", lineHeight: 1.15, marginBottom: 12 }}>
              开口，<br />就现在。
            </div>
            <div style={{ fontSize: 14, color: "rgba(245,245,245,0.60)", lineHeight: 1.65, marginBottom: 24 }}>
              AI 问，你答，说错立刻纠正。不背单词，不学语法，张口就练。— 今天开始，7天后你会感谢自己
            </div>
            <Link
              href={onboardingHref}
              className="cta-btn"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", height: 56, backgroundColor: "#10B981", borderRadius: 14,
                fontWeight: 700, fontSize: 16, color: "#fff", textDecoration: "none",
                position: "relative", overflow: "hidden",
              }}
            >
              <Mic size={18} />
              开始第一课 →
            </Link>
          </motion.div>
        )}

        {/* ── 4. Today tasks ───────────────────────────────────────────────── */}
        {hasProgress && (
          <motion.div variants={item}>
            <div style={{ fontSize: 11, color: "rgba(245,245,245,0.38)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, marginTop: 20 }}>
              今日待办
            </div>

            <div
              {...task1.handlers}
              style={{
                backgroundColor: "#1a1a1a",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: "14px 16px",
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                ...hoverStyle(task1.hovered),
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <BookOpen size={18} color="#10B981" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F5" }}>今日新课</div>
                  <div style={{ fontSize: 12, color: "rgba(245,245,245,0.38)", marginTop: 1 }}>Lesson {currentLesson}</div>
                </div>
              </div>
              <Link href={resumeHref} style={{ fontSize: 13, color: "#10B981", textDecoration: "none", fontWeight: 600 }}>
                开始 →
              </Link>
            </div>

            <div
              {...task2.handlers}
              style={{
                backgroundColor: "#1a1a1a",
                border: `1px solid ${reviewCount > 0 ? "rgba(239,68,68,0.28)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                ...hoverStyle(task2.hovered),
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <RotateCcw size={18} color={reviewCount > 0 ? "#ef4444" : "rgba(245,245,245,0.38)"} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F5" }}>到期复习</div>
                  {reviewCount > 0 ? (
                    <>
                      <div style={{ fontSize: 12, color: "#ef4444", marginTop: 1 }}>{reviewCount} 个词汇</div>
                      <div style={{ fontSize: 11, color: "#ef4444", marginTop: 1 }}>⚡ 不复习，明天还在</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 12, color: "rgba(245,245,245,0.38)", marginTop: 1 }}>暂无</div>
                  )}
                </div>
              </div>
              {reviewCount > 0 ? (
                <Link href={reviewHref} style={{ fontSize: 13, color: "#ef4444", textDecoration: "none", fontWeight: 600 }}>
                  复习 →
                </Link>
              ) : (
                <span style={{ fontSize: 13, color: "rgba(245,245,245,0.38)" }}>暂无</span>
              )}
            </div>
          </motion.div>
        )}

        {/* ── 5. Stats row ─────────────────────────────────────────────────── */}
        {(lessonsDone > 0 || streak > 0) && (
          <motion.div variants={item}>
            <div style={{ fontSize: 11, color: "rgba(245,245,245,0.38)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, marginTop: 20 }}>
              我的成就
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {[
                { icon: <Flame size={18} color="#10B981" />, value: streak, label: "连续天", hook: stat1, color: "#F5F5F5" },
                { icon: <BookOpen size={18} color="#10B981" />, value: lessonsDone, label: "已学课时", hook: stat2, color: "#F5F5F5" },
                { icon: <RotateCcw size={18} color="#10B981" />, value: reviewCount, label: "待复习", hook: stat3, color: reviewCount > 0 ? "#ef4444" : "#F5F5F5" },
              ].map((stat, i) => (
                <div
                  key={i}
                  {...stat.hook.handlers}
                  style={{
                    flex: 1,
                    backgroundColor: "#1a1a1a",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 14,
                    padding: "14px 8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    ...hoverStyle(stat.hook.hovered),
                  }}
                >
                  {stat.icon}
                  <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, lineHeight: 1 }}>
                    <CountUp end={stat.value} duration={1.5} enableScrollSpy scrollSpyOnce />
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(245,245,245,0.38)" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  )
}
