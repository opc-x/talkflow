import { Hono } from "hono"
import { config } from "../env.js"
import {
  completeAssessment,
  evaluateTranscript,
  getAssessmentQuestions,
  transcribeAudio,
} from "../services/assessment.service.js"
import type { AuthVariables } from "../middleware/auth.js"
import type { RoundEvaluation } from "../../../shared/types/assessment.js"

const assessment = new Hono<{ Variables: AuthVariables }>()

assessment.get("/questions", async (c) => {
  const supabase = c.get("supabase")
  const questions = await getAssessmentQuestions(supabase)
  return c.json({ questions })
})

assessment.post("/evaluate", async (c) => {
  if (!config.openaiApiKey()) {
    return c.json({ error: "OPENAI_API_KEY 未配置，无法运行口语测评" }, 503)
  }

  const formData = await c.req.formData()
  const audio = formData.get("audio")
  const question = String(formData.get("question") ?? "").trim()
  const referenceAnswer = String(formData.get("referenceAnswer") ?? "").trim()
  const roundIndex = Number(formData.get("roundIndex") ?? 0)

  if (!(audio instanceof File) || audio.size === 0) {
    return c.json({ error: "audio is required" }, 400)
  }
  if (!question) {
    return c.json({ error: "question is required" }, 400)
  }

  try {
    const ext = audio.type.includes("webm") ? "webm" : "mp4"
    const buffer = new Uint8Array(await audio.arrayBuffer())
    const file = new File([buffer], `round-${roundIndex}.${ext}`, {
      type: audio.type || "audio/webm",
    })

    const transcript = await transcribeAudio(file)
    const evaluation = await evaluateTranscript(
      question,
      referenceAnswer,
      transcript,
      roundIndex
    )
    return c.json(evaluation)
  } catch (err) {
    const message = err instanceof Error ? err.message : "evaluation failed"
    return c.json({ error: message }, 500)
  }
})

assessment.post("/complete", async (c) => {
  const user = c.get("user")
  const supabase = c.get("supabase")

  let body: { rounds?: RoundEvaluation[] }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "invalid json" }, 400)
  }

  const rounds = body.rounds
  if (!Array.isArray(rounds) || rounds.length === 0) {
    return c.json({ error: "rounds is required" }, 400)
  }

  const result = await completeAssessment(supabase, user.id, rounds)
  return c.json(result)
})

export { assessment }
