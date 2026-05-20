import { AuthApiError, AuthError } from "@supabase/supabase-js"

/** Map Supabase Auth errors to user-facing Chinese (signup / login). */
export function translateAuthError(error: unknown): string {
  if (!(error instanceof AuthError)) {
    return error instanceof Error ? error.message : "操作失败，请稍后重试。"
  }

  const code = error.code ?? ""
  const msg = (error.message ?? "").toLowerCase()

  const byCode: Record<string, string> = {
    over_email_send_rate_limit:
      "注册/验证邮件发送太频繁，Supabase 已限流。请等 5～60 分钟再试，或到 Dashboard → Authentication → Rate Limits 调高。",
    over_request_rate_limit: "请求太频繁，请稍后再试。",
    user_already_exists: "该邮箱已注册，请直接登录。",
    email_exists: "该邮箱已注册，请直接登录。",
    signup_disabled: "当前未开放注册，请联系管理员。",
    email_address_invalid: "邮箱格式无效，请检查是否写错（如 gmail.com）。",
    validation_failed: "提交的信息未通过校验，请检查邮箱和密码。",
    weak_password: "密码强度不足，请使用更复杂的密码（建议 8 位以上含字母数字）。",
    same_password: "新密码不能与旧密码相同。",
    invalid_credentials: "邮箱或密码错误。",
    user_not_found: "用户不存在，请先注册。",
    email_not_confirmed: "邮箱尚未验证，请查收邮件或联系管理员关闭邮箱验证。",
    session_not_found: "登录已过期，请重新登录。",
    flow_state_expired: "操作已过期，请刷新页面后重试。",
    otp_expired: "验证码已过期，请重新获取。",
    otp_disabled: "当前未启用验证码登录。",
  }

  if (code && byCode[code]) {
    const base = byCode[code]
    if (
      process.env.NODE_ENV === "development" &&
      (code === "over_email_send_rate_limit" || code === "over_request_rate_limit")
    ) {
      return `${base} 本地开发：用注册页下方「开发建号并登录」，或开启 DEV_BYPASS_AUTH 跳过登录。`
    }
    return base
  }

  if (msg.includes("rate limit") && msg.includes("email")) {
    return byCode.over_email_send_rate_limit
  }
  if (msg.includes("already registered") || msg.includes("already exists")) {
    return byCode.user_already_exists
  }
  if (msg.includes("invalid") && msg.includes("email")) {
    return byCode.email_address_invalid
  }
  if (msg.includes("password") && msg.includes("weak")) {
    return byCode.weak_password
  }

  if (error instanceof AuthApiError && error.status === 429) {
    return "请求太频繁，请稍后再试。"
  }

  return error.message || "操作失败，请稍后重试。"
}

export function isConfirmEmailEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SUPABASE_CONFIRM_EMAIL === "true"
}
