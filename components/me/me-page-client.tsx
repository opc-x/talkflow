"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Flame,
  ArrowRight,
  Search,
  BookText,
  FileText,
  KeyRound,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import { NicknameEditor } from "@/components/me/nickname-editor"
import { UpgradeModal } from "@/components/upgrade-modal"
import { planLabel, type UserPlan } from "@/lib/subscription"
import type { Stage } from "@/lib/stages"

interface MePageClientProps {
  locale: string
  userId: string
  email: string
  displayName: string
  streak: number
  masteredCount: number
  thisWeekAccuracy: number | null
  lastWeekAccuracy: number | null
  cefrStage: Stage | null
  tier: UserPlan
}

function AccuracyDelta({
  thisWeek,
  lastWeek,
}: {
  thisWeek: number
  lastWeek: number | null
}) {
  if (lastWeek === null) return null
  const delta = thisWeek - lastWeek
  if (delta === 0) {
    return <span className="text-xs text-muted-foreground">— 持平</span>
  }
  const up = delta > 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span
      className={`text-xs font-medium flex items-center gap-0.5 ${up ? "text-emerald-500" : "text-orange-400"}`}
    >
      <Icon className="w-3 h-3" />
      {up ? "↑" : "↓"} {Math.abs(delta)}%
    </span>
  )
}

export function MePageClient({
  locale,
  userId,
  email,
  displayName,
  streak,
  masteredCount,
  thisWeekAccuracy,
  lastWeekAccuracy,
  cefrStage,
  tier,
}: MePageClientProps) {
  const searchParams = useSearchParams()
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get("upgrade") === "1") setUpgradeOpen(true)
  }, [searchParams])

  return (
    <div className="min-h-full" style={{ backgroundColor: "#111111" }}>
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">我的</h1>

        <div className="rounded-2xl border border-border p-5 mb-4" style={{ backgroundColor: "#1a1a1a" }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
              {displayName[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-semibold truncate">{displayName}</p>
              <p className="text-sm text-muted-foreground truncate">{email}</p>
            </div>
          </div>
          <NicknameEditor userId={userId} initialNickname={displayName} />
        </div>

        <div className="rounded-2xl border border-border p-5 mb-4" style={{ backgroundColor: "#1a1a1a" }}>
          <div className="text-sm text-muted-foreground mb-4">进步仪表盘</div>

          <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-border">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">当前等级</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground leading-tight">
                  {cefrStage ? (
                    <>
                      <span className="mr-0.5">{cefrStage.emoji}</span>
                      {cefrStage.name}
                    </>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground mb-1">已掌握句型</span>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-2xl font-bold text-foreground">{masteredCount}</span>
              </div>
              <span className="text-xs text-muted-foreground">句</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground mb-1">连续天数</span>
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="text-2xl font-bold text-foreground">{streak}</span>
              </div>
              <span className="text-xs text-muted-foreground">天</span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <BarChart3 className="w-3.5 h-3.5" />
                本周准确率
              </div>
              <div className="text-2xl font-bold text-foreground">
                {thisWeekAccuracy !== null ? `${thisWeekAccuracy}%` : "--"}
              </div>
            </div>
            {thisWeekAccuracy !== null && (
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">vs 上周</div>
                <AccuracyDelta
                  thisWeek={thisWeekAccuracy}
                  lastWeek={lastWeekAccuracy}
                />
              </div>
            )}
          </div>

          <Link
            href={`/${locale}/protected/stats`}
            className="flex items-center justify-between py-3 mt-4 border-t border-border text-sm text-primary"
          >
            <span>查看完整报告</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="rounded-2xl border border-border p-5 mb-3" style={{ backgroundColor: "#1a1a1a" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">订阅</div>
              <div className="text-foreground font-medium">当前：{planLabel(tier)}</div>
            </div>
            {tier === "free" && (
              <Button
                size="sm"
                className="bg-primary text-primary-foreground"
                onClick={() => setUpgradeOpen(true)}
              >
                升级 Pro →
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border p-3 mb-4" style={{ backgroundColor: "#1a1a1a" }}>
          <div className="text-xs text-muted-foreground mb-2">学习工具箱</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Search, label: "词汇搜索" },
              { icon: BookText, label: "语法参考" },
              { icon: FileText, label: "教材原文" },
            ].map(({ icon: Icon, label }) => (
              <Link
                key={label}
                href={`/${locale}/protected/tools`}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-background/50"
              >
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border overflow-hidden" style={{ backgroundColor: "#1a1a1a" }}>
          <Link
            href={`/${locale}/protected/settings`}
            className="flex items-center gap-3 px-5 py-4 border-b border-border hover:bg-background/50"
          >
            <KeyRound className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground">修改密码</span>
          </Link>
          <div className="px-5 py-4 border-b border-border">
            <Link
              href={`/${locale}/onboarding/assessment`}
              style={{ color: "#10B981", fontSize: 14 }}
            >
              重新口语测级 →
            </Link>
          </div>
          <div className="px-5 py-4">
            <LogoutButton variant="text" />
          </div>
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  )
}
