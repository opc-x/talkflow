import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { groupIntoSegments, VOCAB_TERM_KINDS, compareBlockIds, enrichSegmentsWithQaPairs } from "@/lib/learn";
import { SessionCard } from "@/components/learn/session-card";
import { getStageForLesson } from "@/lib/stages";
import type { VocabTerm } from "@/components/learn/vocab-list";
import { normalizeDisplayText } from "@/lib/normalize-display-text";
import { parseLearnViewState } from "@/lib/learn-url-state";

interface Props {
  params: Promise<{ locale: string; bookNum: string; lessonNum: string }>;
  searchParams: Promise<{ phase?: string; seg?: string; pair?: string }>;
}

function countSentences(segments: ReturnType<typeof groupIntoSegments>) {
  return segments.reduce(
    (n, seg) => n + seg.pairs.filter((p) => p.question !== "").length,
    0
  );
}

export default async function LessonPage({ params, searchParams }: Props) {
  const { locale, bookNum: bookNumStr, lessonNum: lessonNumStr } = await params;
  const sp = await searchParams;
  const learnView = parseLearnViewState(
    new URLSearchParams(
      Object.entries(sp).filter(([, v]) => v != null) as [string, string][],
    ),
  );
  const bookNum = parseInt(bookNumStr);
  const lessonNum = parseInt(lessonNumStr);

  if (isNaN(bookNum) || isNaN(lessonNum)) redirect(`/${locale}/protected/learn/1/1`);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const [{ data: lesson }, { data: blocks, error }] = await Promise.all([
    supabase
      .from("lessons")
      .select("id")
      .eq("book_num", bookNum)
      .eq("lesson_num", lessonNum)
      .single(),
    supabase
      .from("content_blocks")
      .select(
        "id, block_type, text, book_num, lesson_num, book_page, pdf_page, stage, ai_explanation",
      )
      .eq("book_num", bookNum)
      .eq("lesson_num", lessonNum)
      .in("block_type", ["lexical_block", "qa_block", "grammar_note"]),
  ]);

  if (error || !blocks?.length) {
    redirect(`/${locale}/protected/learn/1/1`);
  }

  const segmentsRaw = groupIntoSegments(blocks);
  let segments = segmentsRaw;

  if (lesson?.id) {
    const { data: qaRows } = await supabase
      .from("qa_pairs")
      .select("id, question, answer, audio_url, visual_state, scene_image_url")
      .eq("lesson_id", lesson.id);

    if (qaRows?.length) {
      segments = enrichSegmentsWithQaPairs(segmentsRaw, qaRows);
    }
  }

  const totalSentences = countSentences(segments);
  const stage = getStageForLesson(lessonNum);
  const stageLabel = `${stage.emoji} ${stage.name}`;

  let sceneImageUrl: string | null = null;
  let sceneTitle: string | null = null;
  let sceneImagePrompt: string | null = null;
  if (lesson?.id) {
    const { data: scene } = await supabase
      .from("scenes")
      .select("image_url, title, image_type, image_prompt")
      .eq("lesson_id", lesson.id)
      .order("position")
      .limit(1)
      .maybeSingle();
    sceneImageUrl = scene?.image_url ?? null;
    sceneTitle = scene?.title ?? null;
    sceneImagePrompt = scene?.image_prompt ?? null;
  }

  const { data: termsRows } = await supabase
    .from("terms")
    .select("term, normalized, definition, phonetic, block_id, position")
    .eq("book_num", bookNum)
    .eq("lesson_num", lessonNum)
    .in("term_kind", [...VOCAB_TERM_KINDS])
    .limit(80);

  type TermRow = {
    term: string;
    normalized: string;
    definition: string | null;
    phonetic: string | null;
    block_id: string;
    position: number | null;
  };
  const sortedTerms = [...((termsRows as TermRow[] | null) ?? [])].sort((a, b) => {
    const blockCmp = compareBlockIds(a.block_id, b.block_id);
    if (blockCmp !== 0) return blockCmp;
    return (a.position ?? 999) - (b.position ?? 999);
  });
  const vocabTerms: VocabTerm[] = sortedTerms.map((row) => {
    const rawTerm = (row.term || row.normalized) as string;
    return {
      term: normalizeDisplayText(rawTerm),
      definition: row.definition ? normalizeDisplayText(row.definition) : null,
      phonetic: row.phonetic ? normalizeDisplayText(row.phonetic) : null,
    };
  });

  return (
    <SessionCard
      segments={segments}
      bookNum={bookNum}
      lessonNum={lessonNum}
      lessonId={lesson?.id ?? null}
      stageLabel={stageLabel}
      sceneImageUrl={sceneImageUrl}
      sceneTitle={sceneTitle}
      sceneImagePrompt={sceneImagePrompt}
      vocabTerms={vocabTerms}
      totalSentences={Math.max(totalSentences, 1)}
      initialLearnView={learnView}
    />
  );
}
