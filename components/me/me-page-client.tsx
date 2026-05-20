"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Flame,
  BookOpen,
  Target,
  ArrowRight,
  Search,
  BookText,
  FileText,
  KeyRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import { NicknameEditor } from "@/components/me/nickname-editor"
import { UpgradeModal } from "@/components/upgrade-modal"
import { planLabel, type UserPlan } from "@/lib/subscription"

interface MePageClientProps {
  locale: string
  userId: string
  email: string
  displayName: string
  streak: number
  weekLessons: number
  accuracy: number | null
  tier: UserPlan
}

export function MePageClient({
  locale,
  userId,
  email,
  displayName,
  streak,
  weekLessons,
  accuracy,
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
              <p className="text-foreground font-semibold truncate">{email}</p>
              <p className="text-sm text-muted-foreground">昵称</p>
            </div>
          </div>
          <NicknameEditor userId={userId} initialNickname={displayName} />
        </div>

        <div className="rounded-2xl border border-border p-5 mb-4" style={{ backgroundColor: "#1a1a1a" }}>
          <div className="text-sm text-muted-foreground mb-4">学习数据</div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="flex flex-col items-center">
              <Flame className="w-4 h-4 text-orange-500 mb-1" />
              <div className="text-2xl font-bold text-foreground">{streak}</div>
              <div className="text-xs text-muted-foreground">连续天</div>
            </div>
            <div className="flex flex-col items-center">
              <BookOpen className="w-4 h-4 text-primary mb-1" />
              <div className="text-2xl font-bold text-foreground">{weekLessons}</div>
              <div className="text-xs text-muted-foreground">本周课时</div>
            </div>
            <div className="flex flex-col items-center">
              <Target className="w-4 h-4 text-primary mb-1" />
              <div className="text-2xl font-bold text-foreground">
                {accuracy !== null ? `${accuracy}%` : "--"}
              </div>
              <div className="text-xs text-muted-foreground">正确率</div>
            </div>
          </div>
          <Link
            href={`/${locale}/protected/stats`}
            className="flex items-center justify-between py-3 border-t border-border text-sm text-primary"
          >
            <span>查看完整报告</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="rounded-2xl border border-border p-5 mb-4" style={{ backgroundColor: "#1a1a1a" }}>
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

        <div className="rounded-2xl border border-border p-5 mb-4" style={{ backgroundColor: "#1a1a1a" }}>
          <div className="text-sm text-muted-foreground mb-4">学习工具箱</div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Search, label: "词汇搜索" },
              { icon: BookText, label: "语法参考" },
              { icon: FileText, label: "教材原文" },
            ].map(({ icon: Icon, label }) => (
              <Link
                key={label}
                href={`/${locale}/protected/tools`}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-background/50"
              >
                <Icon className="w-5 h-5 text-primary" />
                <span className="text-xs text-muted-foreground">{label}</span>
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
          <div className="px-5 py-4">
            <LogoutButton variant="text" />
          </div>
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  )
}
