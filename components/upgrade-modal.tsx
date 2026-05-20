"use client"

import { useEffect, useState } from "react"
import { X, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  reason?: string
}

export function UpgradeModal({ open, onClose, reason }: UpgradeModalProps) {
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  async function checkout(plan: "basic" | "pro") {
    setLoading(plan)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      alert(data.message ?? "支付功能即将上线，请先完成免费课程体验。")
    } catch {
      alert("暂时无法连接支付，请稍后再试。")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="升级订阅"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-[#1a1a1a] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">解锁更多课程</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {reason ?? "入门阶段已完成，继续学习需要升级"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 px-5 pb-5">
          <div className="rounded-xl border border-border p-4 flex flex-col gap-3">
            <div className="text-sm font-semibold text-foreground">Basic</div>
            <ul className="text-xs text-muted-foreground space-y-1 flex-1">
              <li>💬 日常对话</li>
              <li>💼 职场流利</li>
              <li>前 126 课</li>
            </ul>
            <div>
              <p className="text-2xl font-bold text-foreground">¥28<span className="text-sm font-normal text-muted-foreground">/月</span></p>
              <p className="text-xs text-muted-foreground">¥199/年 省 40%</p>
            </div>
            <Button
              variant="outline"
              className="w-full rounded-xl"
              disabled={loading !== null}
              onClick={() => checkout("basic")}
            >
              {loading === "basic" ? "跳转中…" : "选择 Basic"}
            </Button>
          </div>

          <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 flex flex-col gap-3 relative">
            <span className="absolute -top-2 right-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              <Star className="w-3 h-3" /> 推荐
            </span>
            <div className="text-sm font-semibold text-primary">Pro</div>
            <ul className="text-xs text-muted-foreground space-y-1 flex-1">
              <li>💬 日常对话 + 💼 职场流利</li>
              <li>🎯 高级表达</li>
              <li>全 191 课 A1→C2</li>
            </ul>
            <div>
              <p className="text-2xl font-bold text-foreground">¥48<span className="text-sm font-normal text-muted-foreground">/月</span></p>
              <p className="text-xs text-muted-foreground">¥328/年 省 43%</p>
            </div>
            <Button
              className="w-full rounded-xl bg-primary text-primary-foreground"
              disabled={loading !== null}
              onClick={() => checkout("pro")}
            >
              {loading === "pro" ? "跳转中…" : "选择 Pro ★"}
            </Button>
          </div>
        </div>

        <p className="px-5 pb-4 text-center text-xs text-muted-foreground">
          已是付费用户？管理订阅功能即将上线
        </p>
      </div>
    </div>
  )
}
