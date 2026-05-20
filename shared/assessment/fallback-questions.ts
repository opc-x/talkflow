import type { AssessmentQuestion } from "../types/assessment"

/** API 不可用时的演示题，与 backend assessment.service FALLBACK_QUESTIONS 一致 */
export const PLACEMENT_FALLBACK_QUESTIONS: AssessmentQuestion[] = [
  {
    roundIndex: 0,
    lessonNum: 8,
    sceneLabel: "入门场景",
    question: "What do you do for work?",
    referenceAnswer: "I'm a software engineer.",
    imageUrl: null,
  },
  {
    roundIndex: 1,
    lessonNum: 35,
    sceneLabel: "日常对话",
    question: "What would you like to drink?",
    referenceAnswer: "I'd like a coffee with no sugar, please.",
    imageUrl: null,
  },
]
