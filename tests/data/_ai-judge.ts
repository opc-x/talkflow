// AI 裁判 — 默认 Cursor Agent CLI（订阅额度），可选 OpenAI / claude。
// Env: LLM_BACKEND=cursor|openai|claude

import { execFileSync } from "node:child_process"
import { chatJsonCursor, llmBackend, type ChatMessage } from "../../scripts/_llm-json"

export type AiVerdict = { pass: boolean; reason: string; failures?: string[] }

function claudeJudge(prompt: string): string {
  return execFileSync("claude", ["-p", prompt], {
    encoding: "utf8",
    timeout: 120_000,
    maxBuffer: 10 * 1024 * 1024,
  }).trim()
}

/**
 * 让 AI 按规则判定一批内容。
 */
export function aiJudge(rule: string, content: unknown): AiVerdict {
  const prompt = [
    `你是内容审查员。规则：${rule}`,
    `内容（JSON）：`,
    JSON.stringify(content, null, 2),
    ``,
    `只返回一行 JSON，不要任何解释或代码块包裹，格式：`,
    `{"pass": true/false, "reason": "一句话结论", "failures": ["不合格项1", ...]}`,
  ].join("\n")

  let raw: string
  try {
    const backend = process.env.LLM_BACKEND?.toLowerCase() ?? llmBackend()
    if (backend === "claude") {
      raw = claudeJudge(prompt)
    } else if (backend === "cursor") {
      const result = chatJsonCursor<AiVerdict>([
        { role: "system", content: "你是内容审查员。只返回 JSON。" },
        { role: "user", content: prompt },
      ] as ChatMessage[])
      return result
    } else {
      // openai path — sync scripts not wired in vitest; fall back to cursor
      const result = chatJsonCursor<AiVerdict>([
        { role: "system", content: "你是内容审查员。只返回 JSON。" },
        { role: "user", content: prompt },
      ] as ChatMessage[])
      return result
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { pass: false, reason: `调用 AI 失败：${msg}` }
  }

  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) return { pass: false, reason: `AI 返回非 JSON：${raw.slice(0, 200)}` }
  try {
    return JSON.parse(m[0]) as AiVerdict
  } catch {
    return { pass: false, reason: `AI JSON 解析失败：${m[0].slice(0, 200)}` }
  }
}
