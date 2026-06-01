"use server";

import { createClient } from "@/lib/supabase/server";

export async function completeLesson(lessonId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  // Insert session record
  await supabase.from("session_records").insert({
    user_id: user.id,
    lesson_id: lessonId,
    ended_at: now,
  });

  // Get current progress + current lesson info in parallel
  const [{ data: progress }, { data: cur }] = await Promise.all([
    supabase
      .from("user_progress")
      .select("lessons_done")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("lessons")
      .select("book_num, lesson_num")
      .eq("id", lessonId)
      .single(),
  ]);

  // Store lesson_num (not lesson id) so map/progress comparisons work correctly
  const done: number[] = progress?.lessons_done ?? [];
  if (cur && !done.includes(cur.lesson_num)) done.push(cur.lesson_num);

  // Find next lesson
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

  // Populate SRS queue with all qa_pairs from this lesson (skip existing)
  const { data: qaPairs } = await supabase
    .from("qa_pairs")
    .select("id")
    .eq("lesson_id", lessonId);

  if (qaPairs?.length) {
    await supabase.from("review_schedule").upsert(
      qaPairs.map((q: { id: number }) => ({
        user_id: user.id,
        qa_pair_id: q.id,
        target_type: "qa_pair" as const,
        next_review_at: today,
        interval_days: 1,
        ease_factor: 2.5,
        rep_count: 0,
      })),
      { onConflict: "user_id,qa_pair_id", ignoreDuplicates: true }
    );
  }

  const { data: vocabTerms } = await supabase
    .from("terms")
    .select("id")
    .eq("lesson_id", lessonId)
    .in("term_kind", ["word", "phrase"]);

  if (vocabTerms?.length) {
    for (const term of vocabTerms) {
      const { data: existing } = await supabase
        .from("review_schedule")
        .select("id")
        .eq("user_id", user.id)
        .eq("target_type", "term")
        .eq("term_id", term.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("review_schedule").insert({
          user_id: user.id,
          term_id: term.id,
          target_type: "term",
          next_review_at: today,
          interval_days: 1,
          ease_factor: 2.5,
          rep_count: 0,
        });
      }
    }
  }

  return { nextLesson };
}

/** Save practice score from local or AI evaluation (no OpenAI call) */
export async function savePracticeResponse(
  qaPairId: number,
  evaluation: {
    transcript: string
    scores: { fluency: number; grammar: number; vocabulary: number }
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" as const };

  const avg =
    (evaluation.scores.fluency +
      evaluation.scores.grammar +
      evaluation.scores.vocabulary) /
    3;
  const score = Math.max(1, Math.min(5, Math.round(avg / 2)));

  await supabase.from("qa_responses").insert({
    user_id: user.id,
    qa_pair_id: qaPairId,
    score,
    user_transcript: evaluation.transcript,
  });

  return { ok: true as const };
}
