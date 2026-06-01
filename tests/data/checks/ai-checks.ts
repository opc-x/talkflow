// 【可展开实现】AI 内容 checklist —— 调本地 AI CLI 判内容质量（机器判不了的）。
// 主流程在 ../lesson1.test.ts。改判定规则，改这里。
// ⚠️ 真实调 AI：慢、非确定、烧 token。

import { aiJudge } from "../_ai-judge"

type Qa = { question: string; answer: string }

/**
 * AI 内容验证清单（与报告逐条对应）：
 *   1. 问答符合 A1 入门难度（用词简单、句短、无复杂从句）
 *   2. 问答语义匹配（answer 确实在回答 question）
 */
export function aiChecklist(qa: Qa[]): Array<[string, unknown, boolean]> {
  const difficulty = aiJudge("这些英语问答是否都符合 A1 入门难度（用词简单、句子短、无复杂从句）", qa)
  const relevance = aiJudge("每条问答的 answer 是否确实在回答对应的 question（语义匹配）", qa)
  return [
    ["问答符合 A1 难度", difficulty.reason, difficulty.pass],
    ["问答语义匹配", relevance.reason, relevance.pass],
  ]
}
