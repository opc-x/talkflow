import { Hono } from "hono"
import { searchContent } from "../services/search.service.js"
import type { AuthVariables } from "../middleware/auth.js"
import type { SearchRequest } from "../../../shared/types/search.js"

const search = new Hono<{ Variables: AuthVariables }>()

search.post("/", async (c) => {
  let body: SearchRequest
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "invalid json" }, 400)
  }

  if (!body.query || typeof body.query !== "string" || body.query.trim().length === 0) {
    return c.json({ error: "query is required" }, 400)
  }

  const supabase = c.get("supabase")
  const result = await searchContent(supabase, body)
  return c.json(result)
})

export { search }
