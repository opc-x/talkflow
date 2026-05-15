import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Lock } from "lucide-react";

const CEFR: Record<number, string> = {
  1: "A1", 2: "A1", 3: "A2", 4: "A2", 5: "B1", 6: "B1",
  7: "B1+", 8: "B2", 9: "B2", 10: "B2", 11: "B2+", 12: "C1",
};

interface Props {
  searchParams: Promise<{ stage?: string }>;
}

export default async function MapPage({ searchParams }: Props) {
  const { stage: stageParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // All books
  const { data: books } = await supabase
    .from("books")
    .select("id, book_num, stage, cefr_level, lesson_start, lesson_end")
    .order("book_num");

  const activeStage = stageParam ? parseInt(stageParam) : 3;
  const activeBook = books?.find((b) => b.stage === activeStage);

  // Lessons for active stage/book
  const { data: lessons } = activeBook
    ? await supabase
        .from("lessons")
        .select("id, lesson_num, vocab")
        .eq("book_num", activeBook.book_num)
        .order("lesson_num")
    : { data: [] };

  // User progress
  const { data: progress } = await supabase
    .from("user_progress")
    .select("current_lesson_id, lessons_done")
    .eq("user_id", user.id)
    .single();

  const doneIds = new Set<number>(progress?.lessons_done ?? []);
  const currentId = progress?.current_lesson_id;

  const doneInStage = lessons?.filter((l) => doneIds.has(l.id)).length ?? 0;
  const total = lessons?.length ?? 0;
  const pct = total > 0 ? Math.round((doneInStage / total) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto w-full pb-20 md:pb-0">
      {/* Page header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">知识地图</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Callan Method · 12册 · 191课 · 7,250词
        </p>
      </div>

      {/* Stage tabs */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-2 px-4 pb-4 w-max">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((s) => {
            const book = books?.find((b) => b.stage === s);
            const isDone =
              book &&
              lessons &&
              s !== activeStage &&
              lessons.every((l) => doneIds.has(l.id));
            return (
              <Link
                key={s}
                href={`/protected/map?stage=${s}`}
                className={`rounded-xl px-4 py-2 whitespace-nowrap flex flex-col items-center transition-colors ${
                  s === activeStage
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-sm font-medium">Stage {s}</span>
                <span className="text-xs opacity-70">
                  {book?.cefr_level ?? CEFR[s]}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stage summary */}
      {activeBook && (
        <div className="mx-4 mb-2 px-4 py-3 bg-muted/50 rounded-xl flex justify-between items-center">
          <span className="text-sm font-medium text-foreground">
            Stage {activeStage} · Book {activeBook.book_num} ·{" "}
            {activeBook.cefr_level ?? CEFR[activeStage]}
          </span>
          <span className="text-sm text-muted-foreground">
            {doneInStage} / {total} 课
          </span>
        </div>
      )}
      {activeBook && (
        <div className="mx-4 mb-4 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Lesson list */}
      <div className="border-t border-border">
        {lessons?.map((lesson) => {
          const isDone = doneIds.has(lesson.id);
          const isCurrent = lesson.id === currentId;
          const vocabPreview = lesson.vocab
            ? lesson.vocab.split(" | ").slice(0, 4).join(" · ")
            : `Lesson ${lesson.lesson_num}`;

          return (
            <Link
              key={lesson.id}
              href={`/protected/learn/${activeBook?.book_num}/${lesson.lesson_num}`}
              className={`flex items-center gap-4 px-4 py-4 border-b border-border hover:bg-muted/30 transition-colors ${
                isCurrent ? "bg-primary/5" : ""
              }`}
            >
              {/* Status circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-medium ${
                  isDone
                    ? "bg-primary/10 text-primary"
                    : isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isCurrent ? (
                  <ArrowRight className="w-5 h-5" />
                ) : (
                  <span className="text-xs">L{lesson.lesson_num}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {vocabPreview}
                </p>
                <p className="text-xs text-muted-foreground">
                  Lesson {lesson.lesson_num}
                </p>
              </div>

              {/* Status label */}
              <span
                className={`text-xs shrink-0 ${
                  isDone
                    ? "text-primary"
                    : isCurrent
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {isDone ? "已完成" : isCurrent ? "进行中" : ""}
              </span>
            </Link>
          );
        })}

        {!lessons?.length && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">该 Stage 暂无课程数据</p>
          </div>
        )}
      </div>

      {/* Bottom stats */}
      {activeBook && (
        <div className="px-4 py-4 text-sm text-muted-foreground border-t border-border">
          Stage {activeStage} 进度：已完成 {doneInStage}/{total} 课
        </div>
      )}
    </div>
  );
}
