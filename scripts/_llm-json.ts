/**
 * JSON LLM helper — OpenAI API or Cursor Agent CLI (`agent -p --trust`).
 *
 * Env:
 *   LLM_BACKEND=cursor|openai  (default: cursor if `agent` on PATH, else openai)
 *   CURSOR_AGENT_MODEL         (default composer-2.5)
 *   OPENAI_CHAT_MODEL          (default gpt-5.4 in fix-issue-63, gpt-5.2 in _openai)
 */
import { execFileSync } from "node:child_process";
import OpenAI from "openai";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function parseJsonLoose<T>(raw: string): T {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as T;
    }
    throw new Error(`invalid JSON (${trimmed.length} chars): ${trimmed.slice(0, 200)}`);
  }
}

export function llmBackend(): "cursor" | "openai" {
  const env = process.env.LLM_BACKEND?.toLowerCase();
  if (env === "openai") return "openai";
  if (env === "cursor") return "cursor";
  try {
    execFileSync("which", ["agent"], { encoding: "utf8" });
    return "cursor";
  } catch {
    return "openai";
  }
}

function messagesToPrompt(messages: ChatMessage[]): string {
  return messages
    .map((m) => `${m.role.toUpperCase()}:\n${m.content}`)
    .join("\n\n");
}

export function chatJsonCursor<T>(messages: ChatMessage[]): T {
  const model = process.env.CURSOR_AGENT_MODEL ?? "composer-2.5-fast";
  const prompt = [
    messagesToPrompt(messages),
    "",
    "Respond with valid JSON only. No markdown fences.",
  ].join("\n");

  const raw = execFileSync(
    "agent",
    [
      "-p",
      "--trust",
      "--mode",
      "ask",
      "--output-format",
      "text",
      "--model",
      model,
      prompt,
    ],
    {
      encoding: "utf8",
      timeout: 180_000,
      maxBuffer: 10 * 1024 * 1024,
      cwd: process.cwd(),
    },
  ).trim();

  return parseJsonLoose<T>(raw);
}

function withJsonHint(messages: ChatMessage[]): OpenAI.Chat.ChatCompletionMessageParam[] {
  return messages.map((m) => {
    if (/json/i.test(m.content)) return m;
    return { ...m, content: `${m.content}\n\nRespond with valid JSON only.` };
  });
}

export async function chatJsonOpenAI<T>(
  openai: OpenAI,
  messages: ChatMessage[],
  maxTokens: number,
  model: string,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await openai.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        messages: withJsonHint(messages),
        max_completion_tokens: Math.max(maxTokens, 64),
      });
      return parseJsonLoose<T>(resp.choices[0]?.message?.content ?? "{}");
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  throw lastErr;
}

/** Route to Cursor Agent CLI or OpenAI based on LLM_BACKEND. */
export async function chatJson<T>(
  messages: ChatMessage[],
  maxTokens: number,
  openai?: OpenAI,
  model?: string,
): Promise<T> {
  if (llmBackend() === "cursor") {
    return chatJsonCursor<T>(messages);
  }
  if (!openai) {
    throw new Error("chatJson(openai): LLM_BACKEND=openai but no OpenAI client");
  }
  return chatJsonOpenAI<T>(
    openai,
    messages,
    maxTokens,
    model ?? process.env.OPENAI_CHAT_MODEL ?? "gpt-5.2",
  );
}
