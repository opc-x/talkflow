"use server";

import { createClient } from "@/lib/supabase/server";

export async function completeLesson(lessonId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const now = new Date().toISOString();

  // Insert session record
  await supabase.from("session_records").insert({
    user_id: user.id,
    lesson_id: lessonId,
    ended_at: now,
  });

  // Get current progress
  const { data: progress } = await supabase
    .from("user_progress")
    .select("lessons_done")
    .eq("user_id", user.id)
    .single();

  const done: number[] = progress?.lessons_done ?? [];
  if (!done.includes(lessonId)) done.push(lessonId);

  // Find next lesson
  const { data: cur } = await supabase
    .from("lessons")
    .select("book_num, lesson_num")
    .eq("id", lessonId)
    .single();

  let nextLesson: { id: number; book_num: number; lesson_num: number } | null =
    null;
  if (cur) {
    const { data: next } = await supabase
      .from("lessons")
      .select("id, book_num, lesson_num")
      .eq("book_num", cur.book_num)
      .eq("lesson_num", cur.lesson_num + 1)
      .single();

    if (next) {
      nextLesson = next;
    } else {
      // try first lesson of next book
      const { data: nextBook } = await supabase
        .from("lessons")
        .select("id, book_num, lesson_num")
        .eq("book_num", cur.book_num + 1)
        .order("lesson_num", { ascending: true })
        .limit(1)
        .single();
      if (nextBook) nextLesson = nextBook;
    }
  }

  // Upsert user_progress
  await supabase.from("user_progress").upsert(
    {
      user_id: user.id,
      current_lesson_id: nextLesson?.id ?? lessonId,
      lessons_done: done,
      updated_at: now,
    },
    { onConflict: "user_id" }
  );

  return { nextLesson };
}
