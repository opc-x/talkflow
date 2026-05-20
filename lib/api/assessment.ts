import { apiFetch } from "./client"
import type {
  AssessmentQuestion,
  AssessmentResult,
  RoundEvaluation,
} from "@shared/types/assessment"

export async function getAssessmentQuestions() {
  return apiFetch<{ questions: AssessmentQuestion[] }>("/assessment/questions")
}

export async function evaluateAssessmentRound(formData: FormData) {
  return apiFetch<RoundEvaluation>("/assessment/evaluate", {
    method: "POST",
    body: formData,
  })
}

export async function completeAssessment(rounds: RoundEvaluation[]) {
  return apiFetch<AssessmentResult>("/assessment/complete", {
    method: "POST",
    body: JSON.stringify({ rounds }),
  })
}
