import { NextResponse } from "next/server"
import { createAdminClient, DEV_USER_ID } from "@/lib/supabase/admin"

/**
 * 开发环境：用 Service Role 给 DEV 用户写入 current_lesson_id（绕过 RLS + 无登录 session）
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

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json(
      { error: "缺少 SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 }
    )
  }

  let body: { bookNum?: number; lessonNum?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }

  const bookNum = body.bookNum ?? 1
  const lessonNum = body.lessonNum ?? 8

  await admin.from("profiles").upsert(
    { id: DEV_USER_ID, nickname: "Dev" },
    { onConflict: "id" }
  )

  const { data: lesson } = await admin
    .from("lessons")
    .select("id")
    .eq("book_num", bookNum)
    .eq("lesson_num", lessonNum)
    .maybeSingle()

  let lessonId = lesson?.id ?? null
  if (!lessonId) {
    const { data: byNum } = await admin
      .from("lessons")
      .select("id")
      .eq("lesson_num", lessonNum)
      .maybeSingle()
    lessonId = byNum?.id ?? null
  }

  const { error } = await admin.from("user_progress").upsert(
    {
      user_id: DEV_USER_ID,
      current_lesson_id: lessonId,
      lessons_done: [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    userId: DEV_USER_ID,
    lessonId,
    lessonNum,
    bookNum,
    hint: lessonId
      ? "已写入进度，请刷新 /zh/protected"
      : "进度已写入但 lessons 表无对应课次，首页可能仍显示新用户（需 seed 课程数据）",
  })
}
