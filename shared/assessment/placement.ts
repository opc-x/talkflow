import { getStageForLesson } from "../stages"
import type { RoundEvaluation, AssessmentResult } from "../types/assessment"

const CEFR_TO_LESSON: Record<string, number> = {
  A1: 1,
  A2: 13,
  B1: 25,
  "B1+": 50,
  B2: 78,
  C1: 127,
  "C1+": 127,
  C2: 127,
}

export function cefrToStartLesson(level: string): number {
  return CEFR_TO_LESSON[level] ?? 1
}

export function averageRoundScore(rounds: RoundEvaluation[]): number {
  if (rounds.length === 0) return 4
  const total = rounds.reduce((sum, r) => {
    const { fluency, grammar, vocabulary } = r.scores
    return sum + (fluency + grammar + vocabulary) / 3
  }, 0)
  return total / rounds.length
}

export function scoreToLessonNum(avgScore: number): number {
  const normalized = Math.max(0, Math.min(10, avgScore))
  const lesson = Math.round((normalized / 10) * 190) + 1
  return Math.max(1, Math.min(191, lesson))
}

export function deriveCefrLevel(finalDifficulty: number, avgScore: number): string {
  if (finalDifficulty <= 1) return "A1"
  if (finalDifficulty <= 2) return "A2"
  if (finalDifficulty <= 3) return avgScore >= 7 ? "B1+" : "B1"
  if (finalDifficulty <= 4) return avgScore >= 8 ? "C1+" : "B2"
  return "C1+"
}

function readinessHint(stageIndex: number, avgScore: number): string {
  if (avgScore < 4) return "先从入门场景练嘴，把开口练顺"
  if (stageIndex >= 3) return "可以直接挑战更高阶场景"
  if (stageIndex >= 2) return "日常对话开练刚刚好"
  return "按节奏练，每天 15 分钟就够"
}

export function buildAssessmentResult(
  rounds: RoundEvaluation[],
  lesson: { id: number; book_num: number; lesson_num: number } | null,
  vocabPreview: string | null,
  finalDifficulty = 3
): AssessmentResult {
  const avgScore = averageRoundScore(rounds)
  const cefrLevel = deriveCefrLevel(finalDifficulty, avgScore)
  const startingLessonNum = cefrToStartLesson(cefrLevel)
  const suggestedLessonNum = lesson?.lesson_num ?? startingLessonNum
  const stage = getStageForLesson(suggestedLessonNum)

  return {
    suggestedLessonNum,
    startingLessonNum,
    cefrLevel,
    bookNum: lesson?.book_num ?? 1,
    lessonId: lesson?.id ?? null,
    stageName: stage.name,
    stageEmoji: stage.emoji,
    vocabPreview,
    practiceScore: Math.round(avgScore * 10) / 10,
    readinessHint: readinessHint(stage.index, avgScore),
  }
}

export function roundAverageScore(evaluation: RoundEvaluation): number {
  const { fluency, grammar, vocabulary } = evaluation.scores
  return (fluency + grammar + vocabulary) / 3
}

export function shouldContinueAssessment(
  roundCount: number,
  avgScore: number,
  difficulty: number
): boolean {
  if (roundCount < 3) return true
  if (roundCount >= 5) return false
  return avgScore >= 4 && avgScore < 7 && difficulty >= 2 && difficulty <= 4
}

export function nextDifficulty(currentDifficulty: number, lastScore: number): number {
  if (lastScore >= 7) return Math.min(5, currentDifficulty + 1)
  if (lastScore < 4) return Math.max(1, currentDifficulty - 1)
  return currentDifficulty
}
