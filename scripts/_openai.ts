import OpenAI from "openai";
import { loadEnv, requireEnv } from "./_env.js";

loadEnv();

export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? "gpt-5.2";

export function createOpenAI() {
  return new OpenAI({
    apiKey: requireEnv("OPENAI_API_KEY"),
    baseURL: process.env.OPENAI_BASE_URL,
  });
}

export async function chatJson<T>(
  openai: OpenAI,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  maxTokens = 400,
): Promise<T> {
  const resp = await openai.chat.completions.create({
    model: CHAT_MODEL,
    response_format: { type: "json_object" },
    messages,
    max_completion_tokens: Math.max(maxTokens, 16),
  });
  return JSON.parse(resp.choices[0]?.message?.content ?? "{}") as T;
}
