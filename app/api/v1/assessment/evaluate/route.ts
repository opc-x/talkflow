import { hasOpenAIKey } from "@/lib/server/openai"
import { getApiAuthContext, isAuthResponse } from "@/lib/server/api-auth"
import {
  evaluateTranscript,
  transcribeAudio,
} from "@/lib/server/assessment.service"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const context = await getApiAuthContext(request)
  if (isAuthResponse(context)) return context

  if (!hasOpenAIKey()) {
    return Response.json(
      { error: "OPENAI_API_KEY 未配置，无法运行口语测评" },
      { status: 503 }
    )
  }

  const formData = await request.formData()
  const audio = formData.get("audio")
  const question = String(formData.get("question") ?? "").trim()
  const referenceAnswer = String(formData.get("referenceAnswer") ?? "").trim()
  const roundIndex = Number(formData.get("roundIndex") ?? 0)

  if (!(audio instanceof File) || audio.size === 0) {
    return Response.json({ error: "audio is required" }, { status: 400 })
  }
  if (!question) {
    return Response.json({ error: "question is required" }, { status: 400 })
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
    return Response.json(evaluation)
  } catch (err) {
    const message = err instanceof Error ? err.message : "evaluation failed"
    return Response.json({ error: message }, { status: 500 })
  }
}
