import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { groupIntoSegments } from "@/lib/learn";
import { SessionCard } from "@/components/learn/session-card";
import { getStageForLesson } from "@/lib/stages";
import type { VocabTerm } from "@/components/learn/vocab-list";
import { normalizeDisplayText } from "@/lib/normalize-display-text";

interface Props {
  params: Promise<{ locale: string; bookNum: string; lessonNum: string }>;
}

function countSentences(segments: ReturnType<typeof groupIntoSegments>) {
  return segments.reduce(
    (n, seg) => n + seg.pairs.filter((p) => p.question !== "").length,
    0
  );
}

export default async function LessonPage({ params }: Props) {
  const { locale, bookNum: bookNumStr, lessonNum: lessonNumStr } = await params;
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

  const segments = groupIntoSegments(blocks);
  const totalSentences = countSentences(segments);
  const stage = getStageForLesson(lessonNum);
  const stageLabel = `${stage.emoji} ${stage.name}`;

  let sceneImageUrl: string | null = null;
  let sceneTitle: string | null = null;
  if (lesson?.id) {
    const { data: scene } = await supabase
      .from("scenes")
      .select("image_url, title, image_type")
      .eq("lesson_id", lesson.id)
      .order("position")
      .limit(1)
      .maybeSingle();
    sceneImageUrl = scene?.image_url ?? null;
    sceneTitle = scene?.title ?? null;
  }

  const { data: termsRows } = await supabase
    .from("terms")
    .select("term, normalized, definition, phonetic")
    .eq("book_num", bookNum)
    .eq("lesson_num", lessonNum)
    .limit(40);

  type TermRow = { term: string; normalized: string; definition: string | null; phonetic: string | null };
  const vocabTerms: VocabTerm[] = ((termsRows as TermRow[] | null) ?? []).map((row) => {
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
      vocabTerms={vocabTerms}
      totalSentences={Math.max(totalSentences, 1)}
    />
  );
}
