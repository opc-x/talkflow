import type { SupabaseClient } from "@supabase/supabase-js"
import { getOpenAIClient } from "../lib/openai.js"
import { buildAssessmentResult } from "../../../shared/assessment/placement.js"
import type {
  AssessmentQuestion,
  AssessmentResult,
  RoundEvaluation,
  RoundScores,
} from "../../../shared/types/assessment.js"

export const ASSESSMENT_LESSON_NUMS = [8, 35] as const

const FALLBACK_QUESTIONS = [
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
] as const

const SCENE_LABELS: Record<number, string> = {
  8: "入门场景",
  35: "日常对话",
  70: "职场场景",
}

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

export async function getAssessmentQuestions(
  supabase: SupabaseClient
): Promise<AssessmentQuestion[]> {
  const questions: AssessmentQuestion[] = []

  for (let i = 0; i < ASSESSMENT_LESSON_NUMS.length; i++) {
    const lessonNum = ASSESSMENT_LESSON_NUMS[i]
    const fallback = FALLBACK_QUESTIONS[i]

    const { data: lesson } = await supabase
      .from("lessons")
      .select("id, lesson_num")
      .eq("lesson_num", lessonNum)
      .maybeSingle()

    const { data: qa } = await supabase
      .from("qa_pairs")
      .select("question, answer")
      .eq("lesson_num", lessonNum)
      .eq("qa_category", "lesson")
      .not("answer", "is", null)
      .order("pair_index", { ascending: true })
      .limit(1)
      .maybeSingle()

    let imageUrl: string | null = null
    if (lesson?.id) {
      const { data: scene } = await supabase
        .from("scenes")
        .select("image_url")
        .eq("lesson_id", lesson.id)
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle()
      imageUrl = scene?.image_url ?? null
    }

    questions.push({
      roundIndex: i,
      lessonNum,
      sceneLabel: SCENE_LABELS[lessonNum] ?? fallback.sceneLabel,
      question: qa?.question?.trim() || fallback.question,
      referenceAnswer: qa?.answer?.trim() || fallback.referenceAnswer,
      imageUrl,
    })
  }

  return questions
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
  rounds: RoundEvaluation[]
): Promise<AssessmentResult> {
  const preview = buildAssessmentResult(rounds, null, null)

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, book_num, lesson_num")
    .eq("lesson_num", preview.suggestedLessonNum)
    .maybeSingle()

  let vocabPreview: string | null = null
  if (lesson?.id) {
    const { data: terms } = await supabase
      .from("terms")
      .select("term")
      .eq("lesson_id", lesson.id)
      .order("position", { ascending: true })
      .limit(4)

    if (terms && terms.length > 0) {
      vocabPreview = terms.map((t: { term: string }) => t.term).join(" · ")
    }
  }

  const result = buildAssessmentResult(rounds, lesson, vocabPreview)

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
