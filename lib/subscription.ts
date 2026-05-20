export type UserPlan = "free" | "basic" | "pro"

export const PLAN_LEVELS: Record<UserPlan, number> = {
  free: 0,
  basic: 1,
  pro: 2,
}

export function normalizePlan(raw: string | null | undefined): UserPlan {
  if (raw === "basic" || raw === "pro") return raw
  if (raw === "daily") return "basic"
  if (raw === "full") return "pro"
  return "free"
}

export function planLabel(plan: UserPlan): string {
  const labels: Record<UserPlan, string> = {
    free: "免费版",
    basic: "日常对话",
    pro: "完整精通",
  }
  return labels[plan]
}

export function isStageLocked(stagePlan: UserPlan, userPlan: UserPlan): boolean {
  return PLAN_LEVELS[stagePlan] > PLAN_LEVELS[userPlan]
}
