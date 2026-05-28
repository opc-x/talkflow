import { apiFetch } from "./client"
import type {
  AssessmentQuestion,
  AssessmentResult,
  RoundEvaluation,
} from "@shared/types/assessment"

export async function getAssessmentQuestions() {
  return apiFetch<{ questions: AssessmentQuestion[] }>("/assessment/questions")
}

export async function getNextAssessmentQuestion(payload: {
  currentDifficulty: number
  lastScore: number
  usedIds: string[]
}) {
  return apiFetch<{ question: AssessmentQuestion | null }>("/assessment/next-question", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function evaluateAssessmentRound(formData: FormData) {
  return apiFetch<RoundEvaluation>("/assessment/evaluate", {
    method: "POST",
    body: formData,
  }, 20_000)
}

export async function completeAssessment(
  rounds: RoundEvaluation[],
  finalDifficulty?: number
) {
  return apiFetch<AssessmentResult>("/assessment/complete", {
    method: "POST",
    body: JSON.stringify({ rounds, finalDifficulty }),
  })
}
