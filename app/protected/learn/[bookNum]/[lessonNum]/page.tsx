import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { groupIntoSegments } from "@/lib/learn";
import { SessionCard } from "@/components/learn/session-card";

interface Props {
  params: Promise<{ bookNum: string; lessonNum: string }>;
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

  const { data: blocks, error } = await supabase
    .from("content_blocks")
    .select("id, block_type, text, book_num, lesson_num, book_page, pdf_page, stage")
    .eq("book_num", bookNum)
    .eq("lesson_num", lessonNum)
    .in("block_type", ["lexical_block", "qa_block", "grammar_note"]);

  if (error || !blocks?.length) {
    redirect("/protected/learn/1/1");
  }

  const segments = groupIntoSegments(blocks);

  return (
    <SessionCard
      segments={segments}
      bookNum={bookNum}
      lessonNum={lessonNum}
    />
  );
}
