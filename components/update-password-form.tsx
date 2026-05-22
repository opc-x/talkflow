"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mic, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      router.push("/zh/protected")
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

        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h2 className="font-bold text-xl mb-1" style={{ color: "#F5F5F5" }}>
            设置新密码
          </h2>
          <p className="text-sm mb-6" style={{ color: "rgba(245,245,245,0.5)" }}>
            至少 8 位，设置完成后自动登录
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" style={{ color: "rgba(245,245,245,0.7)", fontSize: "13px" }}>
                新密码
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="输入新密码"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    backgroundColor: "#111111",
                    borderColor: "rgba(255,255,255,0.12)",
                    color: "#F5F5F5",
                    paddingRight: "2.5rem",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(245,245,245,0.35)" }}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
                "保存新密码"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
