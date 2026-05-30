import { getApiAuthContext, isAuthResponse } from "@/lib/server/api-auth"
import { createCheckoutSession } from "@/lib/server/checkout.service"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const context = await getApiAuthContext(request)
  if (isAuthResponse(context)) return context

  const body = await request.json().catch(() => ({}))
  const plan = body.plan === "pro" ? "pro" : "basic"
  const result = await createCheckoutSession(plan)

  return Response.json(result)
}
