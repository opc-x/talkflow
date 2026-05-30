import { getApiAuthContext, isAuthResponse } from "@/lib/server/api-auth"
import { getNextQuestion } from "@/lib/server/assessment.service"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const context = await getApiAuthContext(request)
  if (isAuthResponse(context)) return context

  let body: { currentDifficulty?: number; lastScore?: number; usedIds?: string[] }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 })
  }

  const question = await getNextQuestion(
    context.supabase,
    Number(body.currentDifficulty ?? 3),
    Number(body.lastScore ?? 5),
    Array.isArray(body.usedIds) ? body.usedIds : []
  )

  return Response.json({ question })
}
