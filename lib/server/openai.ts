import OpenAI from "openai"
import { serverConfig } from "@/lib/server/config"

let client: OpenAI | null = null

export function hasOpenAIKey() {
  return Boolean(serverConfig.openaiApiKey())
}

export function getOpenAIClient(): OpenAI {
  if (!client) {
    const apiKey = serverConfig.openaiApiKey()
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set")
    const baseURL = process.env.OPENAI_BASE_URL?.trim()
    client = new OpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    })
  }
  return client
}

export async function embedQuery(text: string): Promise<number[]> {
  const response = await getOpenAIClient().embeddings.create({
    model: "text-embedding-3-small",
    input: text.trim(),
  })
  return response.data[0].embedding
}
