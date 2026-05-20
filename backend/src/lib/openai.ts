import OpenAI from "openai"
import { config } from "../env.js"

let client: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!client) {
    const apiKey = config.openaiApiKey()
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set")
    client = new OpenAI({ apiKey })
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
