"use client"

import { RotateCcw, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { RoundEvaluation } from "@shared/types/assessment"
import { practicePassed } from "@/lib/practice-score"
import { speakEnglish } from "@/lib/speech"
import type { PracticeEvalMode } from "@/lib/practice-evaluate-client"

interface EvaluationFeedbackProps {
  evaluation: RoundEvaluation
  mode?: PracticeEvalMode
  modeNote?: string | null
  onRetry: () => void
  onContinue: () => void
  continueLabel?: string
  skipLabel?: string
  pending?: boolean
}

export function EvaluationFeedback({
  evaluation,
  mode = "local",
  modeNote,
  onRetry,
  onContinue,
  continueLabel = "看答案 →",
  skipLabel = "先看答案，跳过再练",
  pending,
}: EvaluationFeedbackProps) {
  const passed = practicePassed(evaluation)

  return (
    <div className="flex flex-col flex-1">
      {(mode === "local" || modeNote) && (
        <p className="text-xs text-muted-foreground mb-3 text-center">
          {modeNote ??
            (mode === "local"
              ? "浏览器免费评分（未调用 OpenAI）· 精度不如 AI"
              : null)}
        </p>
      )}
      <p className="text-sm text-muted-foreground mb-2">你说的：</p>
      <div className="rounded-xl border border-border bg-card px-4 py-3 mb-4 text-foreground">
        &ldquo;{evaluation.transcript}&rdquo;
      </div>

      <p className="text-sm text-muted-foreground mb-2">这样说更自然：</p>
      <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 mb-2">
        <p className="text-foreground flex items-start gap-2">
          <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          {evaluation.suggestion}
        </p>
        <p className="text-xs text-primary mt-2">{evaluation.feedback}</p>
      </div>

      {!passed && (
        <p className="text-xs text-amber-600 dark:text-amber-400/90 mb-auto mt-2">
          再说一遍会更顺。练到脱口而出再往下？
        </p>
      )}
      {passed && <div className="mb-auto" />}

      <div className="flex gap-3 mt-6">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1 rounded-xl h-12"
          disabled={pending}
          onClick={async () => {
            await speakEnglish(evaluation.suggestion)
            onRetry()
          }}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          再练一遍
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1 rounded-xl h-12"
          disabled={pending}
          onClick={onContinue}
        >
          {continueLabel}
        </Button>
      </div>
      {!passed && (
        <button
          type="button"
          className="mt-3 text-xs text-muted-foreground underline"
          disabled={pending}
          onClick={onContinue}
        >
          {skipLabel}
        </button>
      )}
    </div>
  )
}
