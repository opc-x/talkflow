"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Mic } from "lucide-react"

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

const DISPLAY_STAGES = [
  { index: 1, name: "入门",     emoji: "🌱" },
  { index: 2, name: "日常对话", emoji: "💬" },
  { index: 3, name: "职场流利", emoji: "💼" },
  { index: 4, name: "高级表达", emoji: "🎯" },
]

interface DashboardContentProps {
  displayName: string
  hasProgress: boolean
  lessonsDone: number
  reviewCount: number
  currentLesson?: number
  vocabPreview?: string | null
  resumeHref: string
  onboardingHref: string
  reviewHref: string
  greeting: string
  dateStr: string
  stageName: string
  stageEmoji: string
  stagePct: number
  stageIndex: number
  locale: string
}

export function DashboardContent({
  displayName,
  hasProgress,
  lessonsDone,
  reviewCount,
  currentLesson,
  vocabPreview,
  resumeHref,
  onboardingHref,
  reviewHref,
  greeting,
  dateStr,
  stageName,
  stageEmoji,
  stagePct,
  stageIndex,
  locale,
}: DashboardContentProps) {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%) }
          100% { transform: translateX(200%) }
        }
        .cta-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%);
          animation: shimmer 2.5s ease infinite;
          pointer-events: none;
        }
      `}</style>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-[480px] mx-auto px-5 pt-6 pb-24 min-h-full"
        style={{
          background:
            "radial-gradient(ellipse 120% 40% at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 50%)",
        }}
      >
        {/* A. Header */}
        <motion.div variants={item} className="mb-5">
          <div className="text-xs text-muted-foreground mb-1">{dateStr}</div>
          <div className="text-2xl font-black text-foreground">
            {greeting}，{displayName}
          </div>
          {/* D6 Slot: <SubscriptionBadge /> from Issue #12 */}
        </motion.div>

        {/* B. Main card */}
        <motion.div variants={item} className="mb-5">
          {hasProgress ? (
            <div className="bg-primary/5 border border-primary/30 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-foreground">今日练习</span>
                <span className="text-xs text-muted-foreground">约15分钟</span>
              </div>
              <div className="text-xl font-bold text-foreground mb-2">
                {stageEmoji} {stageName} · 第{currentLesson}课
              </div>
              {vocabPreview && (
                <div className="text-sm text-muted-foreground mb-2">{vocabPreview}</div>
              )}
              <div className="text-xs text-muted-foreground/70 mb-4">
                🤖 AI实时纠错 · 20句口语练习
              </div>
              <Link
                href={resumeHref}
                className="cta-shimmer relative overflow-hidden flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <Mic className="w-4 h-4" />
                🎤 开口练习 →
              </Link>
            </div>
          ) : (
            <div className="bg-muted/30 border border-border rounded-2xl p-6">
              <div className="text-xl font-bold text-foreground mb-2">
                开始你的英语旅程
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                3分钟口语测评，AI找到你的起点
              </div>
              <Link
                href={onboardingHref}
                className="cta-shimmer relative overflow-hidden flex items-center justify-center w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                开始测评 →
              </Link>
            </div>
          )}
        </motion.div>

        {/* C. Stage progress */}
        <motion.div variants={item} className="mb-5">
          <div className="text-sm font-medium text-foreground mb-3">我的进度</div>
          <div className="flex items-center overflow-x-auto no-scrollbar pb-1">
            {DISPLAY_STAGES.map((stageItem, i) => {
              const isCompleted = stageIndex > stageItem.index
              const isCurrent = stageIndex === stageItem.index
              const isFuture = stageIndex < stageItem.index
              return (
                <div key={stageItem.index} className="flex items-center shrink-0">
                  {i > 0 && (
                    <span className="text-xs text-muted-foreground mx-1.5">→</span>
                  )}
                  {isCompleted && (
                    <div className="flex items-center gap-1">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">
                        ✓
                      </span>
                      <span className="text-xs text-primary">{stageItem.name}</span>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="border border-primary rounded-xl px-3 py-2">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="text-xs font-semibold text-primary whitespace-nowrap">
                          {stageItem.emoji} {stageItem.name}
                        </span>
                        <span className="text-xs text-primary">{stagePct}%</span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden w-20">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-700"
                          style={{ width: `${stagePct}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {isFuture && (
                    <div className="flex items-center gap-1">
                      <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center">
                        ○
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {stageItem.name}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* D. Secondary cards */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3 mb-5">
          <div className="border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-primary mb-0.5">{reviewCount}</div>
            <div className="text-xs text-muted-foreground mb-3">词到期</div>
            <Link
              href={reviewHref}
              className="text-xs text-primary font-medium hover:underline"
            >
              去复习→
            </Link>
          </div>
          <div className="border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-primary mb-0.5">{lessonsDone}</div>
            <div className="text-xs text-muted-foreground mb-3">课已完成</div>
            <Link
              href={`/${locale}/protected/stats`}
              className="text-xs text-primary font-medium hover:underline"
            >
              查看→
            </Link>
          </div>
        </motion.div>

        {/* E. Map link */}
        <motion.div variants={item}>
          <Link
            href={`/${locale}/protected/map`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            全部课程地图 →
          </Link>
        </motion.div>
      </motion.div>
    </>
  )
}
