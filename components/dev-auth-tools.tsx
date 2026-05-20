"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Wrench, LogIn, UserPlus, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { isDevBypassAuth, isDevToolsEnabled } from "@/lib/dev-config"

interface DevAuthToolsProps {
  locale?: string
  email: string
  password: string
  onLoggedIn?: () => void
}

export function DevAuthTools({
  locale = "zh",
  email,
  password,
  onLoggedIn,
}: DevAuthToolsProps) {
  const router = useRouter()
  const [busy, setBusy] = useState<"create" | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  if (!isDevToolsEnabled()) return null

  const bypass = isDevBypassAuth()
  const protectedHref = `/${locale}/protected`
  const onboardingHref = `/${locale}/onboarding`

  async function devCreateAndLogin() {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || password.length < 8) {
      setErr("请先填邮箱和至少 8 位密码，再点开发建号")
      return
    }
    setErr(null)
    setHint(null)
    setBusy("create")
    try {
      const res = await fetch("/api/dev/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? "开发建号失败")
      }

      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      })
      if (signInError) {
        setHint(data.message ?? "账号已创建，请点上方「登录」")
        return
      }

      onLoggedIn?.()
      router.push(protectedHref)
      router.refresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "开发建号失败"
      if (msg.includes("未启用 DEV_ALLOW_ADMIN_SIGNUP")) {
        setErr(
          "请在 .env.local 配置 SUPABASE_SERVICE_ROLE_KEY 与 DEV_ALLOW_ADMIN_SIGNUP=true 后重启 dev"
        )
      } else {
        setErr(msg)
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <div
      className="mt-5 rounded-xl p-4 text-left"
      style={{
        backgroundColor: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.35)",
      }}
    >
      <p
        className="text-xs font-semibold flex items-center gap-1.5 mb-2"
        style={{ color: "#F59E0B" }}
      >
        <Wrench className="w-3.5 h-3.5" />
        本地开发 · 不拦你调页面
      </p>
      <p className="text-[11px] leading-relaxed mb-3" style={{ color: "rgba(245,245,245,0.55)" }}>
        注册邮件被 Supabase 限流时，用下面按钮；只想看 UI 可跳过登录。
      </p>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy !== null}
          className="w-full h-10 text-sm justify-start gap-2 border-amber-500/40 text-amber-100/90 hover:bg-amber-500/10"
          onClick={devCreateAndLogin}
        >
          {busy === "create" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          开发建号并登录（不发邮件）
        </Button>

        {bypass ? (
          <Button
            type="button"
            variant="outline"
            asChild
            className="w-full h-10 text-sm justify-start gap-2 border-amber-500/40 text-amber-100/90 hover:bg-amber-500/10"
          >
            <Link href={protectedHref}>
              <LogIn className="w-4 h-4" />
              跳过登录，直接进应用
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </Link>
          </Button>
        ) : (
          <p className="text-[10px] px-1" style={{ color: "rgba(245,245,245,0.45)" }}>
            跳过登录：在 .env.local 设{" "}
            <code className="text-amber-200/80">DEV_BYPASS_AUTH=true</code> 与{" "}
            <code className="text-amber-200/80">NEXT_PUBLIC_DEV_BYPASS_AUTH=true</code>{" "}
            后重启
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          disabled={busy !== null}
          className="w-full h-10 text-sm border-amber-500/40 text-amber-100/90 hover:bg-amber-500/10"
          onClick={async () => {
            setErr(null)
            setHint(null)
            setBusy("create")
            try {
              const res = await fetch("/api/dev/seed-progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookNum: 1, lessonNum: 8 }),
              })
              const data = await res.json().catch(() => ({}))
              if (!res.ok) throw new Error(data.error ?? "写入失败")
              setHint(data.hint ?? "已刷成老用户首页，点下面链接刷新")
            } catch (e) {
              setErr(e instanceof Error ? e.message : "失败")
            } finally {
              setBusy(null)
            }
          }}
        >
          {busy === "create" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : null}
          一键刷老用户首页（免走完 onboarding）
        </Button>

        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href={`${protectedHref}/preview/new-user`}
            className="text-[11px] underline underline-offset-2"
            style={{ color: "#10B981" }}
          >
            预览·新用户首页
          </Link>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
          <Link
            href={`${protectedHref}/preview/returning-user`}
            className="text-[11px] underline underline-offset-2"
            style={{ color: "#10B981" }}
          >
            预览·老用户首页
          </Link>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
          <Link
            href={onboardingHref}
            className="text-[11px] underline underline-offset-2"
            style={{ color: "#10B981" }}
          >
            onboarding
          </Link>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
          <Link
            href={`${protectedHref}/learn/1/1`}
            className="text-[11px] underline underline-offset-2"
            style={{ color: "#10B981" }}
          >
            第 1 课
          </Link>
        </div>
      </div>

      {hint && (
        <p className="text-xs mt-2" style={{ color: "#10B981" }}>
          {hint}
        </p>
      )}
      {err && (
        <p className="text-xs mt-2" style={{ color: "#EF4444" }}>
          {err}
        </p>
      )}
    </div>
  )
}
