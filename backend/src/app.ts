import { Hono } from "hono"
import { cors } from "hono/cors"
import { config } from "./env.js"
import { authMiddleware } from "./middleware/auth.js"
import { assessment } from "./routes/assessment.js"
import { search } from "./routes/search.js"
import { checkout } from "./routes/checkout.js"

export function createApp() {
  const app = new Hono()

  app.use(
    "*",
    cors({
      origin: config.corsOrigins,
      allowHeaders: ["Authorization", "Content-Type"],
      allowMethods: ["GET", "POST", "OPTIONS"],
    })
  )

  app.get("/health", (c) =>
    c.json({ ok: true, service: "talkflow-api", version: "1.0.0" })
  )

  const api = new Hono()
  api.use("*", authMiddleware)
  api.route("/assessment", assessment)
  api.route("/search", search)
  api.route("/checkout", checkout)

  app.route("/api/v1", api)

  return app
}
