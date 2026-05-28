"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

/** 自选等级：按 lesson_num 解析 lessons.id 后写入 user_progress */
export async function setStartingLevel(lessonNum: number, locale: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id")
    .eq("lesson_num", lessonNum)
    .maybeSingle()

  if (!lesson?.id) {
    throw new Error(`未找到第 ${lessonNum} 课`)
  }

  await supabase.from("user_progress").upsert(
    {
      user_id: user.id,
      current_lesson_id: lesson.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )

  redirect(`/${locale}/protected`)
}
