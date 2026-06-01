import { apiFetch } from "./client"
import type { RoundEvaluation } from "@shared/types/assessment"

export async function evaluatePracticeRound(formData: FormData) {
  return apiFetch<RoundEvaluation>("/practice/evaluate", {
    method: "POST",
    body: formData,
  }, 25_000)
}
