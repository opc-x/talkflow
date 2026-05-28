import type { SupabaseClient } from "@supabase/supabase-js"

export async function getAccuracyPercent(
  supabase: SupabaseClient,
  userId: string
): Promise<number | null> {
  const { data } = await supabase
    .from("qa_responses")
    .select("score")
    .eq("user_id", userId)
    .limit(200)

  if (!data?.length) return null
  const correct = data.filter((r) => (r.score as number) >= 3).length
  return Math.round((correct / data.length) * 100)
}

export async function getWeakTerms(
  supabase: SupabaseClient,
  userId: string,
  limit = 6
): Promise<string[]> {
  const { data } = await supabase
    .from("review_schedule")
    .select(
      `ease_factor, terms!review_schedule_term_id_fkey(term)`
    )
    .eq("user_id", userId)
    .eq("target_type", "term")
    .not("term_id", "is", null)
    .order("ease_factor", { ascending: true })
    .limit(limit)

  const words: string[] = []
  for (const row of data ?? []) {
    const termRaw = row.terms as { term: string } | { term: string }[] | null
    const term = Array.isArray(termRaw) ? termRaw[0] : termRaw
    if (term?.term) words.push(term.term)
  }
  return words
}

export async function getUserPlan(
  supabase: SupabaseClient,
  userId: string
): Promise<import("@/lib/subscription").UserPlan> {
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const { normalizePlan } = await import("@/lib/subscription")
  if (process.env.DEV_UNLOCK_ALL === "true") return "pro"
  if (!data || data.status !== "active") return "free"
  return normalizePlan(data.plan as string)
}
