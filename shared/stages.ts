export type Stage = {
  index: number
  name: string
  emoji: string
  start: number
  end: number
  plan: "free" | "basic" | "pro"
}

export const STAGES: Stage[] = [
  { index: 1, name: "入门", emoji: "🌱", start: 1, end: 24, plan: "free" },
  { index: 2, name: "日常对话", emoji: "💬", start: 25, end: 77, plan: "basic" },
  { index: 3, name: "职场流利", emoji: "💼", start: 78, end: 126, plan: "basic" },
  { index: 4, name: "高级表达", emoji: "🎯", start: 127, end: 191, plan: "pro" },
]

export function getStageForLesson(lessonNum: number): Stage {
  return STAGES.find((s) => lessonNum >= s.start && lessonNum <= s.end) ?? STAGES[0]
}

export function getStagePct(lessonsDone: number[], stage: Stage): number {
  const done = lessonsDone.filter((l) => l >= stage.start && l <= stage.end).length
  return Math.round((done / (stage.end - stage.start + 1)) * 100)
}
