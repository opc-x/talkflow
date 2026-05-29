import type { SupabaseClient } from "@supabase/supabase-js"
import { getOpenAIClient } from "../lib/openai.js"
import {
  buildAssessmentResult,
  nextDifficulty,
} from "../../../shared/assessment/placement.js"
import type {
  AssessmentQuestion,
  AssessmentResult,
  RoundEvaluation,
  RoundScores,
} from "../../../shared/types/assessment.js"

const FALLBACK_QUESTIONS = [
  {
    roundIndex: 0,
    lessonNum: 0,
    sceneLabel: "B1",
    question: "What do you think about learning English? Is it important?",
    referenceAnswer:
      "I think it is essential nowadays, especially for work and international communication.",
    imageUrl: null,
    difficultyScore: 3,
  },
] as const

interface RawEvaluation {
  transcript: string
  suggestion: string
  feedback: string
  fluency: number
  grammar: number
  vocabulary: number
}

function clampScore(n: number): number {
  return Math.max(1, Math.min(10, Math.round(n)))
}

function mapQuestionRow(
  q: {
    id: string
    cefr_level: string
    difficulty_score: number
    question: string
    reference_answer: string
    image_url: string | null
  },
  roundIndex: number
): AssessmentQuestion {
  return {
    id: q.id,
    roundIndex,
    lessonNum: 0,
    sceneLabel: q.cefr_level,
    question: q.question,
    referenceAnswer: q.reference_answer,
    imageUrl: q.image_url ?? null,
    difficultyScore: q.difficulty_score,
  }
}

export async function getAssessmentQuestions(
  supabase: SupabaseClient
): Promise<AssessmentQuestion[]> {
  const { data } = await supabase
    .from("assessment_questions")
    .select("*")
    .eq("difficulty_score", 3)
    .order("created_at", { ascending: false })
    .limit(1)

  if (!data || data.length === 0) {
    return FALLBACK_QUESTIONS.map((q, i) => ({ ...q, roundIndex: i }))
  }

  return data.map((q, i) => mapQuestionRow(q, i))
}

export async function getNextQuestion(
  supabase: SupabaseClient,
  currentDifficulty: number,
  lastScore: number,
  usedIds: string[]
): Promise<AssessmentQuestion | null> {
  const targetDifficulty = nextDifficulty(currentDifficulty, lastScore)

  let query = supabase
    .from("assessment_questions")
    .select("*")
    .eq("difficulty_score", targetDifficulty)

  if (usedIds.length > 0) {
    query = query.not("id", "in", `(${usedIds.join(",")})`)
  }

  const { data } = await query.limit(1)

  if (!data || data.length === 0) return null
  return mapQuestionRow(data[0], 0)
}

export async function transcribeAudio(audio: File): Promise<string> {
  const openai = getOpenAIClient()
  const transcription = await openai.audio.transcriptions.create({
    file: audio,
    model: "whisper-1",
    language: "en",
  })
  return transcription.text.trim()
}

export async function evaluateTranscript(
  question: string,
  referenceAnswer: string,
  transcript: string,
  roundIndex: number
): Promise<RoundEvaluation> {
  const openai = getOpenAIClient()

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You evaluate spoken English for TalkFlow, a speaking-practice app (not a level test). Return JSON only:
{
  "transcript": "cleaned user transcript in English",
  "suggestion": "one natural improved sentence answering the question",
  "feedback": "one short encouraging correction in Chinese — focus on saying it out loud, not grammar lecture",
  "fluency": 1-10,
  "grammar": 1-10,
  "vocabulary": 1-10
}
Score honestly. Empty or off-topic answers score 1-3. Good enough to continue scores 5+.`,
      },
      {
        role: "user",
        content: `Question: ${question}
Reference answer: ${referenceAnswer}
User said (transcript): ${transcript || "(empty or unclear)"}`,
      },
    ],
  })

  const raw = response.choices[0]?.message?.content
  if (!raw) throw new Error("Empty evaluation response")

  let parsed: RawEvaluation
  try {
    parsed = JSON.parse(raw) as RawEvaluation
  } catch {
    throw new Error("Invalid evaluation JSON")
  }

  const scores: RoundScores = {
    fluency: clampScore(parsed.fluency),
    grammar: clampScore(parsed.grammar),
    vocabulary: clampScore(parsed.vocabulary),
  }

  return {
    roundIndex,
    transcript: parsed.transcript?.trim() || transcript || "（未识别到语音）",
    suggestion: parsed.suggestion?.trim() || referenceAnswer,
    feedback: parsed.feedback?.trim() || "继续练，多说几遍就会顺。",
    scores,
  }
}

export async function completeAssessment(
  supabase: SupabaseClient,
  userId: string,
  rounds: RoundEvaluation[],
  finalDifficulty = 3
): Promise<AssessmentResult> {
  const preview = buildAssessmentResult(rounds, null, null, finalDifficulty)
  const lessonNum = preview.startingLessonNum

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, book_num, lesson_num")
    .eq("lesson_num", lessonNum)
    .maybeSingle()

  let vocabPreview: string | null = null
  if (lesson?.id) {
    const { data: terms } = await supabase
      .from("terms")
      .select("term")
      .eq("lesson_id", lesson.id)
      .in("term_kind", ["word", "phrase"])
      .order("position", { ascending: true })
      .limit(4)

    if (terms && terms.length > 0) {
      vocabPreview = terms.map((t: { term: string }) => t.term).join(" · ")
    }
  }

  const result = buildAssessmentResult(rounds, lesson, vocabPreview, finalDifficulty)

  if (lesson?.id) {
    await supabase.from("user_progress").upsert(
      {
        user_id: userId,
        current_lesson_id: lesson.id,
        lessons_done: [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
  }

  return result
}
