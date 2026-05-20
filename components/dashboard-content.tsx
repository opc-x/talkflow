"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, Mic } from "lucide-react"
import { MarketScene } from "@/components/scenes/market-scene"

const DISPLAY_STAGES = [
  { index: 1, name: "入门", emoji: "🌱" },
  { index: 2, name: "日常对话", emoji: "💬" },
  { index: 3, name: "职场流利", emoji: "💼" },
  { index: 4, name: "高级表达", emoji: "🎯" },
]

export interface DashboardContentProps {
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
  const [imgFailed, setImgFailed] = useState(false)
  const showImg = Boolean(imageUrl) && !imgFailed

  return (
    <>
      <div className="absolute inset-0 [&_svg]:h-full [&_svg]:w-full">
        <MarketScene />
      </div>
      {showImg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl!}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      )}
    </>
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
    <main className="mx-auto min-h-full w-full max-w-[430px] px-4 pb-28 pt-4">
      <section className="mb-5">
        <p className="mb-1 text-xs text-muted-foreground">{dateStr}</p>
        <h1 className="text-xl font-semibold text-foreground">
          {greeting}，{displayName}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {stageEmoji} {stageName}
          {currentLesson ? ` · 第${currentLesson}课` : ""}
        </p>
      </section>

      <section className="mb-6">
        {hasProgress ? (
          <Link href={resumeHref} className="block group">
            <article className="relative aspect-[4/5] max-h-[400px] min-h-[280px] w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition-transform group-hover:scale-[1.01] group-active:scale-[0.99]">
              <div className="absolute inset-0 bg-[#0d2e20]">
                <SceneHero imageUrl={sceneImageUrl} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/5" />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-semibold text-white">
                看图说话
              </span>
              <div className="absolute inset-x-0 bottom-0 p-5 pt-16">
                {currentLesson && (
                  <p className="text-xs font-medium text-white/70">
                    第 {currentLesson} 课 · 约 15 分钟
                  </p>
                )}
                <p className="mt-1 text-2xl font-bold text-white">开口练习</p>
                {vocabPreview && (
                  <p className="mt-2 line-clamp-2 text-sm text-white/75">{vocabPreview}</p>
                )}
                <div className="mt-4 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#10B981] font-semibold text-white shadow-[0_8px_24px_rgba(16,185,129,0.45)]">
                  <Mic className="h-5 w-5" />
                  进入场景 →
                </div>
              </div>
            </article>
          </Link>
        ) : (
          <Link href={onboardingHref} className="block group">
            <article className="relative aspect-[4/5] max-h-[400px] min-h-[280px] w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition-transform group-hover:scale-[1.01]">
              <div className="absolute inset-0 bg-[#0d2e20]">
                <SceneHero imageUrl={null} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-semibold text-white">
                看图说话
              </span>
              <div className="absolute inset-x-0 bottom-0 p-5 pt-12 text-center">
                <h2 className="text-xl font-bold text-white">开始你的英语旅程</h2>
                <p className="mt-2 text-sm text-white/75">先试两句，找到练嘴起点</p>
                <div className="mt-5 flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#10B981] text-lg font-semibold text-white shadow-[0_16px_36px_rgba(16,185,129,0.35)]">
                  <Mic className="h-5 w-5" />
                  开始体验 →
                </div>
              </div>
            </article>
          </Link>
        )}
      </section>

      <section className="mb-5">
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
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[#10B981] transition-all duration-500"
                        style={{ width: `${stagePct}%` }}
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
      </section>

      <section className="mb-4">
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
      </section>
    </main>
  )
}
