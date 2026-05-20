import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { groupIntoSegments } from "@/lib/learn";
import { SessionCard } from "@/components/learn/session-card";
import { getStageForLesson } from "@/lib/stages";
import type { VocabTerm } from "@/components/learn/vocab-list";

interface Props {
  params: Promise<{ bookNum: string; lessonNum: string }>;
}

function countSentences(segments: ReturnType<typeof groupIntoSegments>) {
  return segments.reduce(
    (n, seg) => n + seg.pairs.filter((p) => p.question !== "").length,
    0
  );
}

export default async function LessonPage({ params }: Props) {
  const { bookNum: bookNumStr, lessonNum: lessonNumStr } = await params;
  const bookNum = parseInt(bookNumStr);
  const lessonNum = parseInt(lessonNumStr);

  if (isNaN(bookNum) || isNaN(lessonNum)) redirect("/protected/learn/1/1");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: lesson }, { data: blocks, error }] = await Promise.all([
    supabase
      .from("lessons")
      .select("id")
      .eq("book_num", bookNum)
      .eq("lesson_num", lessonNum)
      .single(),
    supabase
      .from("content_blocks")
      .select("id, block_type, text, book_num, lesson_num, book_page, pdf_page, stage")
      .eq("book_num", bookNum)
      .eq("lesson_num", lessonNum)
      .in("block_type", ["lexical_block", "qa_block", "grammar_note"]),
  ]);

  if (error || !blocks?.length) {
    redirect("/protected/learn/1/1");
  }

  const segments = groupIntoSegments(blocks);
  const totalSentences = countSentences(segments);
  const stage = getStageForLesson(lessonNum);
  const stageLabel = `${stage.emoji} ${stage.name}`;

  let sceneImageUrl: string | null = null;
  if (lesson?.id) {
    const { data: scene } = await supabase
      .from("scenes")
      .select("image_url")
      .eq("lesson_id", lesson.id)
      .order("position")
      .limit(1)
      .maybeSingle();
    sceneImageUrl = scene?.image_url ?? null;
  }

  const { data: termsRows } = await supabase
    .from("terms")
    .select("term, metadata")
    .eq("book_num", bookNum)
    .eq("lesson_num", lessonNum)
    .limit(40);

  type TermRow = { term: string; metadata: unknown };
  const vocabTerms: VocabTerm[] = ((termsRows as TermRow[] | null) ?? []).map((row) => {
    const meta = row.metadata as { ipa?: string; zh_cn?: string } | null;
    return {
      term: row.term as string,
      ipa: meta?.ipa ?? null,
      zh_cn: meta?.zh_cn ?? null,
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
      vocabTerms={vocabTerms}
      totalSentences={Math.max(totalSentences, 1)}
    />
  );
}
