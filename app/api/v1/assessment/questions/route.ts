import { getApiAuthContext, isAuthResponse } from "@/lib/server/api-auth"
import { getAssessmentQuestions } from "@/lib/server/assessment.service"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const context = await getApiAuthContext(request)
  if (isAuthResponse(context)) return context

  const questions = await getAssessmentQuestions(context.supabase)
  return Response.json({ questions })
}
