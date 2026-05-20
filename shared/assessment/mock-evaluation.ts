import type { AssessmentResult, RoundEvaluation } from "../types/assessment"
import { buildAssessmentResult } from "./placement"

/** API / OpenAI 不可用时的演示反馈，保证 onboarding 能走完 */
export function mockRoundEvaluation(
  roundIndex: number,
  referenceAnswer: string,
  reason?: string
): RoundEvaluation {
  return {
    roundIndex,
    transcript: "（演示模式，未连接口语服务）",
    suggestion: referenceAnswer,
    feedback:
      reason ??
      "演示反馈：另开终端运行 npm run dev:api 并配置 OPENAI_API_KEY 后，会换成真实语音识别。",
    scores: { fluency: 6, grammar: 6, vocabulary: 6 },
  }
}

export function mockCompleteResult(rounds: RoundEvaluation[]): AssessmentResult {
  return buildAssessmentResult(rounds, null, null)
}
