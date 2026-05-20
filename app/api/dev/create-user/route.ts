import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * 本地开发：用 Service Role 创建用户，不发确认邮件、不占邮件限流。
 * 需要 .env.local：SUPABASE_SERVICE_ROLE_KEY + DEV_ALLOW_ADMIN_SIGNUP=true
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "仅开发环境可用" }, { status: 403 })
  }

  if (process.env.DEV_ALLOW_ADMIN_SIGNUP !== "true") {
    return NextResponse.json(
      { error: "未启用 DEV_ALLOW_ADMIN_SIGNUP" },
      { status: 403 }
    )
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !url) {
    return NextResponse.json({ error: "缺少 SUPABASE_SERVICE_ROLE_KEY 或 URL" }, { status: 500 })
  }

  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  const password = body.password
  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "需要 email 和至少 8 位 password" }, { status: 400 })
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: 400 }
    )
  }

  return NextResponse.json({
    userId: data.user?.id,
    email: data.user?.email,
    message: "用户已创建，可用该邮箱密码登录",
  })
}
