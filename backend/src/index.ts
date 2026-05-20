import { serve } from "@hono/node-server"
import { createApp } from "./app.js"
import { config } from "./env.js"

const app = createApp()

serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  (info) => {
    console.log(`TalkFlow API listening on http://localhost:${info.port}`)
    console.log(`  Health:  http://localhost:${info.port}/health`)
    console.log(`  API base: http://localhost:${info.port}/api/v1`)
  }
)
