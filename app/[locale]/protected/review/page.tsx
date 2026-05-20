import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewClient } from "./review-client";
import { getStageForLesson } from "@/lib/stages";

export default async function ReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const today = new Date().toISOString().slice(0, 10);

  // Due review items joined with qa_pairs
  const { data: due } = await supabase
    .from("review_schedule")
    .select(
      `id, interval_days, ease_factor, rep_count,
       qa_pairs!review_schedule_qa_pair_id_fkey(
         id, book_num, lesson_num,
         content_blocks!qa_pairs_block_id_fkey(text)
       )`
    )
    .eq("user_id", user.id)
    .eq("target_type", "qa_pair")
    .lte("next_review_at", today)
    .not("qa_pair_id", "is", null)
    .limit(20);

  interface ReviewItem {
    id: number;
    question: string;
    answer: string;
    book_num: number;
    lesson_num: number;
    interval_days: number;
    ease_factor: number;
    rep_count: number;
    stageLabel: string;
    daysSince: number;
  }

  interface QaRow {
    id: number;
    book_num: number;
    lesson_num: number;
    content_blocks: { text: string } | { text: string }[] | null;
  }

  const items: ReviewItem[] = [];
  for (const row of due ?? []) {
    const qaRaw = row.qa_pairs as QaRow | QaRow[] | null;
    const qa = Array.isArray(qaRaw) ? qaRaw[0] ?? null : qaRaw;
    const cbRaw = qa?.content_blocks;
    const cb = Array.isArray(cbRaw) ? cbRaw[0] ?? null : cbRaw;
    if (!cb?.text || !qa) continue;

    const raw = cb.text.split(" | Q: ")[0];
    const body = raw.startsWith("Q: ") ? raw.slice(3) : raw;
    const aIdx = body.indexOf(" A: ");
    if (aIdx === -1) continue;

    const stage = getStageForLesson(qa.lesson_num);
    items.push({
      id: row.id as number,
      question: body.slice(0, aIdx).trim(),
      answer: body.slice(aIdx + 4).trim(),
      book_num: qa.book_num,
      lesson_num: qa.lesson_num,
      interval_days: row.interval_days as number,
      ease_factor: row.ease_factor as number,
      rep_count: row.rep_count as number,
      stageLabel: `${stage.emoji} ${stage.name}`,
      daysSince: row.interval_days as number,
    });
  }

  return <ReviewClient items={items} />;
}
