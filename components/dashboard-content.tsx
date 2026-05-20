"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle2, Mic } from "lucide-react"
import { MarketScene } from "@/components/scenes/market-scene"

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
  { index: 1, name: "入门", emoji: "🌱" },
  { index: 2, name: "日常对话", emoji: "💬" },
  { index: 3, name: "职场流利", emoji: "💼" },
  { index: 4, name: "高级表达", emoji: "🎯" },
]

interface DashboardContentProps {
  displayName: string
  hasProgress: boolean
  reviewCount: number
  currentLesson?: number
  vocabPreview?: string | null
  sceneImageUrl?: string | null
  resumeHref: string
  onboardingHref: string
  reviewHref: string
  mapHref: string
  greeting: string
  dateStr: string
  stageName: string
  stageEmoji: string
  stagePct: number
  stageIndex: number
}

function SceneHero({ imageUrl }: { imageUrl?: string | null }) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        className="h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none"
        }}
      />
    )
  }
  return <MarketScene />
}

function EmptyStateScene() {
  return (
    <div className="flex h-48 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#0d2e20] to-[#111111]">
      <Mic className="h-12 w-12 text-[#10B981] opacity-40" />
    </div>
  )
}

export function DashboardContent({
  displayName,
  hasProgress,
  reviewCount,
  currentLesson,
  vocabPreview,
  sceneImageUrl,
  resumeHref,
  onboardingHref,
  reviewHref,
  mapHref,
  greeting,
  dateStr,
  stageName,
  stageEmoji,
  stagePct,
  stageIndex,
}: DashboardContentProps) {
  return (
    <motion.main
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto min-h-full w-full max-w-[430px] px-4 pb-28 pt-4"
    >
      <motion.section variants={item} className="mb-5">
        <p className="mb-1 text-xs text-muted-foreground">{dateStr}</p>
        <h1 className="text-xl font-semibold text-foreground">
          {greeting}，{displayName}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {stageEmoji} {stageName}
          {currentLesson ? ` · 第${currentLesson}课` : ""}
        </p>
      </motion.section>

      <motion.section variants={item} className="mb-6">
        {hasProgress ? (
          <Link href={resumeHref} className="block group">
            <article className="overflow-hidden rounded-3xl bg-[#10B981] shadow-[0_18px_60px_rgba(16,185,129,0.35)] transition-transform group-hover:scale-[1.01] group-active:scale-[0.99]">
              {sceneImageUrl && (
                <div className="relative h-36 w-full overflow-hidden">
                  <SceneHero imageUrl={sceneImageUrl} />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#10B981]" />
                </div>
              )}
              <div className={`px-5 pb-6 pt-5 text-center ${sceneImageUrl ? "" : "pt-8 min-h-[220px] flex flex-col justify-center"}`}>
                <Mic className="mx-auto mb-3 h-10 w-10 text-white" />
                <p className="text-2xl font-bold text-white">开口练习</p>
                <p className="mt-1 text-sm text-white/80">约 15 分钟</p>
                <p className="mt-3 text-sm text-white/70">
                  {vocabPreview ?? "know · travel · station · platform"}
                </p>
              </div>
            </article>
          </Link>
        ) : (
          <article className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-6 text-center shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <EmptyStateScene />
            <h2 className="mt-6 text-xl font-bold text-white">开始你的英语旅程</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
              先试两句，找到你的练嘴起点
            </p>
            <motion.div
              className="mt-6"
              animate={{ scale: [1, 1.025, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <Link
                href={onboardingHref}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#10B981] text-lg font-semibold text-white shadow-[0_16px_36px_rgba(16,185,129,0.28)]"
              >
                <Mic className="h-5 w-5" />
                开始体验 →
              </Link>
            </motion.div>
          </article>
        )}
      </motion.section>

      <motion.section variants={item} className="mb-5">
        <h2 className="mb-3 text-sm font-medium text-foreground">我的进度</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {DISPLAY_STAGES.map((stage, index) => {
            const isCompleted = stageIndex > stage.index
            const isCurrent = stageIndex === stage.index
            const isFuture = stageIndex < stage.index

            return (
              <div key={stage.index} className="flex shrink-0 items-center gap-2">
                {index > 0 && <span className="text-xs text-muted-foreground/30">→</span>}
                {isCompleted && (
                  <div className="flex flex-col items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                    <span className="whitespace-nowrap text-xs text-[#10B981]">
                      {stage.emoji} {stage.name}
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="rounded-xl border border-[#10B981] bg-[#10B981]/10 px-3 py-2">
                    <p className="whitespace-nowrap text-sm font-semibold text-[#10B981]">
                      {stage.emoji} {stage.name}
                    </p>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-[#10B981]"
                        initial={{ width: "0%" }}
                        animate={{ width: `${stagePct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-[#10B981]">{stagePct}%</p>
                  </div>
                )}
                {isFuture && (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground/30">
                    <span className="text-base">{stage.emoji}</span>
                    <span className="whitespace-nowrap text-xs">{stage.name}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </motion.section>

      <motion.section variants={item} className="mb-4">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
          <Link href={reviewHref} className="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition-colors">
            今日复习
            {reviewCount > 0 ? (
              <>
                <span className="font-bold text-[#10B981]">{reviewCount}</span>
                <span>词</span>
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" aria-hidden />
              </>
            ) : (
              <span className="text-muted-foreground">暂无</span>
            )}
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <Link href={mapHref} className="text-muted-foreground hover:text-foreground transition-colors">
            课程地图 →
          </Link>
        </div>
      </motion.section>
    </motion.main>
  )
}
