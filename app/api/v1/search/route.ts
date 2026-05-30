import { getApiAuthContext, isAuthResponse } from "@/lib/server/api-auth"
import { searchContent } from "@/lib/server/search.service"
import type { SearchRequest } from "@shared/types/search"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const context = await getApiAuthContext(request)
  if (isAuthResponse(context)) return context

  let body: SearchRequest
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 })
  }

  if (!body.query || typeof body.query !== "string" || body.query.trim().length === 0) {
    return Response.json({ error: "query is required" }, { status: 400 })
  }

  const result = await searchContent(context.supabase, body)
  return Response.json(result)
}
