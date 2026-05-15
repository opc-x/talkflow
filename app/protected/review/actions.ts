"use server";

import { createClient } from "@/lib/supabase/server";

export async function rateReview(
  scheduleId: number,
  score: number,
  intervalDays: number,
  easeFactor: number,
  repCount: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  let newInterval: number;
  let newEase = easeFactor;
  const newRep = repCount + 1;

  if (score < 3) {
    newInterval = 1;
  } else {
    if (repCount === 0) newInterval = 1;
    else if (repCount === 1) newInterval = 3;
    else newInterval = Math.round(intervalDays * easeFactor);

    newEase = Math.max(1.3, easeFactor + 0.1 * (score - 5));
  }

  const nextDate = new Date(Date.now() + newInterval * 86400000)
    .toISOString()
    .slice(0, 10);

  await supabase
    .from("review_schedule")
    .update({
      next_review_at: nextDate,
      interval_days: newInterval,
      ease_factor: newEase,
      rep_count: newRep,
    })
    .eq("id", scheduleId)
    .eq("user_id", user.id);
}
