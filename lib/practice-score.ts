import type { RoundEvaluation } from "@shared/types/assessment"
import { roundAverageScore } from "@shared/assessment/placement"

/** Map 1–10 composite score to qa_responses 1–5 scale */
export function evaluationToQaScore(evaluation: RoundEvaluation): number {
  const avg = roundAverageScore(evaluation)
  return Math.max(1, Math.min(5, Math.round(avg / 2)))
}

export const PRACTICE_PASS_SCORE = 5

export function practicePassed(evaluation: RoundEvaluation): boolean {
  return roundAverageScore(evaluation) >= PRACTICE_PASS_SCORE
}
