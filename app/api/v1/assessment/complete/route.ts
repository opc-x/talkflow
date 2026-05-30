import { getApiAuthContext, isAuthResponse } from "@/lib/server/api-auth"
import { completeAssessment } from "@/lib/server/assessment.service"
import type { RoundEvaluation } from "@shared/types/assessment"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const context = await getApiAuthContext(request)
  if (isAuthResponse(context)) return context

  let body: { rounds?: RoundEvaluation[]; finalDifficulty?: number }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 })
  }

  const rounds = body.rounds
  if (!Array.isArray(rounds) || rounds.length === 0) {
    return Response.json({ error: "rounds is required" }, { status: 400 })
  }

  const result = await completeAssessment(
    context.supabase,
    context.user.id,
    rounds,
    Number(body.finalDifficulty ?? 3)
  )

  return Response.json(result)
}
