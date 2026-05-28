"use client"

import { useState } from "react"
import Link from "next/link"
import { Lock } from "lucide-react"
import { UpgradeModal } from "@/components/upgrade-modal"
import { isStageLocked, type UserPlan } from "@/lib/subscription"
import type { Stage } from "@/lib/stages"

type LessonRow = {
  id: number
  book_num: number
  lesson_num: number
  title?: string | null
  image_url?: string | null
}

interface MapClientProps {
  locale: string
  stages: Stage[]
  activePhase: number
  lessons: LessonRow[]
  doneIds: number[]
  currentLessonNum: number | null
  userPlan: UserPlan
  phaseInfo: Stage
  doneInPhase: number
  total: number
  pct: number
}

export function MapClient({
  locale,
  stages,
  activePhase,
  lessons,
  doneIds,
  currentLessonNum,
  userPlan,
  phaseInfo,
  doneInPhase,
  total,
  pct,
}: MapClientProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<string>()

  const isLocked = isStageLocked(phaseInfo.plan, userPlan)

  function openUpgrade(reason: string) {
    setUpgradeReason(reason)
    setUpgradeOpen(true)
  }

  return (
    <>
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-2 px-4 pb-4">
          {stages.map((stage) => {
            const locked = isStageLocked(stage.plan, userPlan)
            const isActive = stage.index === activePhase
            const stageDone =
              stage.index < activePhase ||
              (stage.index === activePhase && doneInPhase === total && total > 0)

            if (locked) {
              return (
                <button
                  key={stage.index}
                  type="button"
                  onClick={() => openUpgrade(`${stage.name}阶段需要升级订阅`)}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 bg-muted text-muted-foreground whitespace-nowrap opacity-60 text-sm font-medium"
                >
                  <Lock className="w-3 h-3" />
                  {stage.emoji} {stage.name}
                </button>
              )
            }

            return (
              <Link
                key={stage.index}
                href={`/${locale}/protected/map?phase=${stage.index}`}
                className={`flex items-center gap-1 rounded-xl px-4 py-2 whitespace-nowrap transition-colors text-sm font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {stageDone && !isActive ? "✓ " : ""}
                {stage.emoji} {stage.name}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="mx-4 mb-2 flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">
          {phaseInfo.emoji} {phaseInfo.name} · {total}课
        </span>
        <span className="text-sm text-muted-foreground">
          {doneInPhase}/{total}课 {pct}%
        </span>
      </div>
      <div className="mx-4 mb-4 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>

      {!isLocked ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-4 pb-4">
          {lessons.map((lesson) => {
            const isDone = doneIds.includes(lesson.lesson_num)
            const isCurrent = lesson.lesson_num === currentLessonNum
            return (
              <Link
                key={lesson.id}
                href={`/${locale}/protected/learn/${lesson.book_num}/${lesson.lesson_num}`}
                className={`relative flex flex-col overflow-hidden rounded-2xl border transition-all ${
                  isDone
                    ? "border-primary/40 bg-primary/10"
                    : isCurrent
                    ? "border-primary ring-2 ring-primary/30 node-current"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="aspect-[4/3] w-full bg-muted overflow-hidden">
                  {lesson.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external Supabase scene URLs
                    <img
                      src={lesson.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                      无图
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-[11px] text-muted-foreground">
                    第 {lesson.lesson_num} 课
                  </p>
                  <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight mt-0.5">
                    {lesson.title ?? `Lesson ${lesson.lesson_num}`}
                  </p>
                </div>
                {isDone && (
                  <span className="absolute top-1.5 right-1.5 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                    ✓
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute top-1.5 right-1.5 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                    ▶
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="mx-4 bg-muted/50 rounded-xl p-4 text-center">
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span>🔒 {phaseInfo.name}需 Basic 订阅</span>
            <button
              type="button"
              onClick={() => openUpgrade(`解锁${phaseInfo.name}阶段`)}
              className="text-primary font-medium hover:underline"
            >
              ¥28/月 解锁 →
            </button>
          </div>
        </div>
      )}

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason={upgradeReason} />
      <style>{`
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .node-current { animation: pulse-scale 2s ease-in-out infinite; }
      `}</style>
    </>
  )
}
