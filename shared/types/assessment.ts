export interface AssessmentQuestion {
  roundIndex: number
  lessonNum: number
  sceneLabel: string
  question: string
  referenceAnswer: string
  imageUrl: string | null
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
  bookNum: number
  lessonId: number | null
  stageName: string
  stageEmoji: string
  vocabPreview: string | null
  practiceScore: number
  readinessHint: string
}
