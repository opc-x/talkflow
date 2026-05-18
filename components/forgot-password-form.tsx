"use client"

import { useState } from "react"
import Link from "next/link"
import { Mic, Loader2, AlertCircle, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      if (error) throw error
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "操作失败，请稍后再试")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#111111" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{ backgroundColor: "rgba(16,185,129,0.15)" }}
          >
            <Mic className="w-4 h-4" style={{ color: "#10B981" }} />
          </div>
          <span className="font-bold text-xl" style={{ color: "#F5F5F5" }}>
            TalkFlow
          </span>
        </div>

        {success ? (
          /* ── Success state ── */
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: "rgba(16,185,129,0.12)" }}
            >
              <Mail className="w-7 h-7" style={{ color: "#10B981" }} />
            </div>
            <h2 className="font-bold text-xl mb-2" style={{ color: "#F5F5F5" }}>
              邮件已发送
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(245,245,245,0.55)" }}>
              重置链接已发送到 <span style={{ color: "#F5F5F5" }}>{email}</span>，请查收邮箱。
            </p>
            <Link
              href="/auth/login"
              className="text-sm font-medium"
              style={{ color: "#10B981" }}
            >
              返回登录 →
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <div
            className="rounded-2xl p-8"
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h2 className="font-bold text-xl mb-1" style={{ color: "#F5F5F5" }}>
              找回密码
            </h2>
            <p className="text-sm mb-6" style={{ color: "rgba(245,245,245,0.5)" }}>
              输入注册邮箱，我们发给你重置链接
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" style={{ color: "rgba(245,245,245,0.7)", fontSize: "13px" }}>
                  邮箱
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    backgroundColor: "#111111",
                    borderColor: "rgba(255,255,255,0.12)",
                    color: "#F5F5F5",
                  }}
                />
              </div>

              {error && (
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.18)",
                    color: "#EF4444",
                  }}
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 font-semibold"
                style={{ backgroundColor: "#10B981", color: "#ffffff" }}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "发送重置链接"
                )}
              </Button>
            </form>

            <p className="text-center text-sm mt-5" style={{ color: "rgba(245,245,245,0.45)" }}>
              想起来了？{" "}
              <Link href="/auth/login" className="font-medium" style={{ color: "#10B981" }}>
                返回登录
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
