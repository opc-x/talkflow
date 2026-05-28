export interface AssessmentQuestion {
  id?: string
  roundIndex: number
  lessonNum: number
  sceneLabel: string
  question: string
  referenceAnswer: string
  imageUrl: string | null
  difficultyScore?: number
}

export interface RoundScores {
  fluency: number
  grammar: number
  vocabulary: number
}

export interface RoundEvaluation {
  roundIndex: number
  transcript: string
  suggestion: string
  feedback: string
  scores: RoundScores
}

export interface AssessmentResult {
  suggestedLessonNum: number
  startingLessonNum: number
  cefrLevel: string
  bookNum: number
  lessonId: number | null
  stageName: string
  stageEmoji: string
  vocabPreview: string | null
  practiceScore: number
  readinessHint: string
}
