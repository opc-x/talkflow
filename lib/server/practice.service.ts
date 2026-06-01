import type { SupabaseClient } from "@supabase/supabase-js"
import type { RoundEvaluation } from "@shared/types/assessment"
import { evaluationToQaScore } from "@/lib/practice-score"

export async function saveQaResponse(
  supabase: SupabaseClient,
  userId: string,
  qaPairId: number,
  evaluation: RoundEvaluation
) {
  const score = evaluationToQaScore(evaluation)
  await supabase.from("qa_responses").insert({
    user_id: userId,
    qa_pair_id: qaPairId,
    score,
    user_transcript: evaluation.transcript,
  })
}
