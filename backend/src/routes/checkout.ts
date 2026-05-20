import { Hono } from "hono"
import { createCheckoutSession } from "../services/checkout.service.js"
import type { AuthVariables } from "../middleware/auth.js"

const checkout = new Hono<{ Variables: AuthVariables }>()

checkout.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const plan = body.plan === "pro" ? "pro" : "basic"
  const result = await createCheckoutSession(plan)
  return c.json(result)
})

export { checkout }
