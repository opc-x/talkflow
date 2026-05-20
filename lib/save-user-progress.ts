import { createClient } from "@/lib/supabase/client"
import type { AssessmentResult } from "@shared/types/assessment"

/** 把 onboarding 起点写入 user_progress（首页「开口练习」依赖 current_lesson_id） */
export async function saveUserProgressFromResult(
  result: AssessmentResult
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
      const res = await fetch("/api/dev/seed-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookNum: result.bookNum,
          lessonNum: result.suggestedLessonNum,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        return { ok: false, error: data.error ?? "开发环境写入进度失败" }
      }
      return { ok: true }
    }
    return { ok: false, error: "未登录，无法保存进度" }
  }

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id")
    .eq("book_num", result.bookNum)
    .eq("lesson_num", result.suggestedLessonNum)
    .maybeSingle()

  let lessonId = lesson?.id ?? null
  if (!lessonId) {
    const { data: byNum } = await supabase
      .from("lessons")
      .select("id")
      .eq("lesson_num", result.suggestedLessonNum)
      .maybeSingle()
    lessonId = byNum?.id ?? null
  }

  const { error } = await supabase.from("user_progress").upsert(
    {
      user_id: user.id,
      current_lesson_id: lessonId,
      lessons_done: [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
