"use client"

import { useState } from "react"
import Link from "next/link"
import { Mic, CheckCircle2, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ─── Brand panel (shared visual) ────────────────────────────────────────────

function BrandPanel() {
  const trustItems = [
    "强迫开口输出",
    "即时纠正反馈",
    "系统化课程",
  ]

  return (
    <div
      className="hidden lg:flex flex-col justify-between h-full px-12 py-12"
      style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ backgroundColor: "rgba(16,185,129,0.15)" }}
        >
          <Mic className="w-5 h-5 text-primary" />
        </div>
        <span className="font-bold text-2xl" style={{ color: "#F5F5F5" }}>
          TalkFlow
        </span>
      </div>

      {/* Hero copy */}
      <div className="flex flex-col gap-5">
        <div>
          <h1
            className="font-bold leading-tight text-balance"
            style={{ fontSize: "clamp(2rem, 3.5vw, 2.75rem)", color: "#F5F5F5" }}
          >
            脱口而出
          </h1>
          <h1
            className="font-bold leading-tight text-balance"
            style={{ fontSize: "clamp(2rem, 3.5vw, 2.75rem)", color: "#10B981" }}
          >
            靠练不靠背
          </h1>
        </div>

        <p
          className="text-lg leading-relaxed max-w-xs"
          style={{ color: "rgba(245,245,245,0.6)" }}
        >
          每天 15 分钟，AI 问你答，说错立刻纠，练到不假思索说出来为止。
        </p>

        {/* Trust items */}
        <div className="flex flex-col gap-3 mt-1">
          {trustItems.map((item, i) => (
            <div
              key={item}
              className="flex items-center gap-2.5 animate-trust-in"
              style={{
                opacity: 0,
                animationDelay: `${300 + i * 100}ms`,
                animationFillMode: "forwards",
              }}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
              <span className="text-sm font-medium" style={{ color: "#F5F5F5" }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer tagline */}
      <p
        className="text-xs"
        style={{ color: "rgba(136,136,136,0.5)" }}
      >
        由语言教练设计 · 经系统训练方法验证
      </p>
    </div>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface SignUpFormProps {
  locale?: string
  onSubmit?: (data: { email: string; password: string; confirmPassword: string }) => Promise<void>
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SignUpForm({ locale = "zh", onSubmit }: SignUpFormProps) {
  const loginHref = `/${locale}/auth/login`

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致，请重新确认。")
      return
    }
    if (password.length < 8) {
      setError("密码至少需要 8 位字符。")
      return
    }

    setLoading(true)
    try {
      await onSubmit?.({ email, password, confirmPassword })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "注册失败，请稍后重试。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen font-sans grid lg:grid-cols-2"
      style={{ backgroundColor: "#111111" }}
    >
      {/* Left brand panel */}
      <BrandPanel />

      {/* Right form panel */}
      <div className="flex flex-col items-center justify-center px-5 py-12 sm:px-10">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ backgroundColor: "rgba(16,185,129,0.15)" }}
          >
            <Mic className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-xl" style={{ color: "#F5F5F5" }}>TalkFlow</span>
        </div>

        {/* Card */}
        <div
          className="w-full max-w-md rounded-2xl p-8 animate-form-card-in"
          style={{
            backgroundColor: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.08)",
            opacity: 0,
          }}
        >
          {/* Header */}
          <div className="mb-7">
            <h2 className="font-bold text-2xl mb-1.5" style={{ color: "#F5F5F5" }}>
              开始你的英语旅程
            </h2>
            <p className="text-sm" style={{ color: "rgba(245,245,245,0.5)" }}>
              注册后直接开始练习，不需要信用卡
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-start gap-2.5 rounded-lg p-3 mb-5 text-sm"
              style={{
                backgroundColor: "rgba(239,68,68,0.10)",
                border: "1px solid rgba(239,68,68,0.20)",
                color: "#EF4444",
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="signup-email"
                className="text-sm font-medium"
                style={{ color: "rgba(245,245,245,0.8)" }}
              >
                邮箱
              </Label>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-transparent text-foreground placeholder:text-muted-foreground
                  border-border focus-visible:ring-primary/50 focus-visible:border-primary/30
                  transition-[border-color,box-shadow] duration-150"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="signup-password"
                className="text-sm font-medium"
                style={{ color: "rgba(245,245,245,0.8)" }}
              >
                密码
              </Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="至少 8 位字符"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10 bg-transparent text-foreground placeholder:text-muted-foreground
                    border-border focus-visible:ring-primary/50 focus-visible:border-primary/30
                    transition-[border-color,box-shadow] duration-150"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="signup-confirm"
                className="text-sm font-medium"
                style={{ color: "rgba(245,245,245,0.8)" }}
              >
                确认密码
              </Label>
              <div className="relative">
                <Input
                  id="signup-confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="再次输入密码"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 pr-10 bg-transparent text-foreground placeholder:text-muted-foreground
                    border-border focus-visible:ring-primary/50 focus-visible:border-primary/30
                    transition-[border-color,box-shadow] duration-150"
                />
                <button
                  type="button"
                  aria-label={showConfirm ? "隐藏密码" : "显示密码"}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 font-semibold mt-1 transition-shadow duration-200"
              style={{
                backgroundColor: "#10B981",
                color: "#ffffff",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(16,185,129,0.25)"
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  注册中…
                </span>
              ) : (
                "创建账户"
              )}
            </Button>
          </form>

          {/* Footer links */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-xs text-center" style={{ color: "rgba(136,136,136,0.7)" }}>
              注册即表示你同意{" "}
              <Link href="/terms" className="underline underline-offset-2 hover:text-primary transition-colors">
                服务条款
              </Link>
              {" "}和{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-primary transition-colors">
                隐私政策
              </Link>
            </p>
            <p className="text-sm" style={{ color: "rgba(245,245,245,0.5)" }}>
              已有账户？{" "}
              <Link
                href={loginHref}
                className="font-medium transition-opacity hover:opacity-80"
                style={{ color: "#10B981" }}
              >
                立即登录
              </Link>
            </p>
          </div>
        </div>

        {/* Page footer */}
        <p className="mt-8 text-xs text-center" style={{ color: "rgba(136,136,136,0.5)" }}>
          © 2026 TalkFlow · 脱口而出，靠练不靠背
        </p>
      </div>
    </div>
  )
}
