"use client"

import type { RoundEvaluation } from "@shared/types/assessment"
import { evaluatePracticeRound } from "@/lib/api/practice"
import { ApiError } from "@/lib/api/client"
import { startRecording, AudioRecorderError } from "@/lib/audio-recorder"
import {
  evaluateLocally,
  isAiPracticeEnabled,
  startEnglishListening,
  SpeechRecognitionError,
  type ListeningHandle,
} from "@/lib/local-practice"
import { savePracticeResponse } from "@/app/[locale]/protected/learn/[bookNum]/[lessonNum]/actions"

export type PracticeEvalMode = "local" | "ai"

export interface PracticeEvalResult {
  evaluation: RoundEvaluation
  mode: PracticeEvalMode
  fallbackNote?: string
}

export interface PracticeEvalInput {
  question: string
  referenceAnswer: string
  roundIndex: number
  qaPairId?: number
  /** Narrower answer for local keyword scoring (e.g. identification drills) */
  scoringAnswer?: string
}

function persistResponse(qaPairId: number | undefined, evaluation: RoundEvaluation) {
  if (!qaPairId) return
  void savePracticeResponse(qaPairId, evaluation).catch(() => {})
}

export function beginLocalListening(maxMs = 12000): ListeningHandle {
  return startEnglishListening(maxMs)
}

export async function completeLocalPractice(
  input: PracticeEvalInput,
  transcript: string
): Promise<PracticeEvalResult> {
  const evaluation = evaluateLocally(
    input.question,
    input.referenceAnswer,
    transcript,
    input.roundIndex,
    input.scoringAnswer
  )
  persistResponse(input.qaPairId, evaluation)
  return { evaluation, mode: "local" }
}

export type AiRecordingHandle = ReturnType<typeof startRecording>

export function beginAiRecording(maxMs = 12000): AiRecordingHandle {
  return startRecording(maxMs)
}

async function runAiFromRecording(
  input: PracticeEvalInput,
  recording: AiRecordingHandle
): Promise<PracticeEvalResult> {
  recording.stop()
  const blob = await recording.promise
  const formData = new FormData()
  formData.append("audio", blob, "practice.webm")
  formData.append("question", input.question)
  formData.append("referenceAnswer", input.referenceAnswer)
  formData.append("roundIndex", String(input.roundIndex))
  if (input.qaPairId) {
    formData.append("qaPairId", String(input.qaPairId))
  }
  const evaluation = await evaluatePracticeRound(formData)
  return { evaluation, mode: "ai" }
}

export async function runPracticeFromListenHandle(
  input: PracticeEvalInput,
  listenHandle: ListeningHandle
): Promise<PracticeEvalResult> {
  const transcript = await listenHandle.promise
  return completeLocalPractice(input, transcript)
}

export async function runPracticeFromAiRecording(
  input: PracticeEvalInput,
  recording: AiRecordingHandle
): Promise<PracticeEvalResult> {
  try {
    return await runAiFromRecording(input, recording)
  } catch (err) {
    const apiFail =
      err instanceof ApiError &&
      (err.status === 401 || err.status === 403 || err.status === 503)

    if (apiFail || err instanceof AudioRecorderError) {
      throw err
    }
    throw err
  }
}

export { SpeechRecognitionError, AudioRecorderError, isAiPracticeEnabled }
