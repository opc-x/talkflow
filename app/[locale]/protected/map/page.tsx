import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { Lock } from "lucide-react";

type MapStage = {
  index: number;
  name: string;
  emoji: string;
  start: number;
  end: number;
  plan: string;
};

const STAGES: MapStage[] = [
  { index: 1, name: "入门",     emoji: "🌱", start: 1,   end: 24,  plan: "free"  },
  { index: 2, name: "日常对话", emoji: "💬", start: 25,  end: 77,  plan: "basic" },
  { index: 3, name: "职场流利", emoji: "💼", start: 78,  end: 126, plan: "basic" },
  { index: 4, name: "高级表达", emoji: "🎯", start: 127, end: 191, plan: "pro"   },
];

const PLAN_LEVELS: Record<string, number> = { free: 0, basic: 1, pro: 2 };

function getPhaseForLesson(lessonNum: number): number {
  return STAGES.find((s) => lessonNum >= s.start && lessonNum <= s.end)?.index ?? 1;
}

interface Props {
  searchParams: Promise<{ phase?: string }>;
}

export default async function MapPage({ searchParams }: Props) {
  const { phase: phaseParam } = await searchParams;
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  // User progress
  const { data: progress } = await supabase
    .from("user_progress")
    .select("current_lesson_id, lessons_done")
    .eq("user_id", user.id)
    .single();

  // Resolve current lesson_num
  let currentLessonNum: number | null = null;
  if (progress?.current_lesson_id) {
    const { data: cur } = await supabase
      .from("lessons")
      .select("lesson_num, book_num")
      .eq("id", progress.current_lesson_id)
      .single();
    currentLessonNum = cur?.lesson_num ?? null;
  }

  const defaultPhase = currentLessonNum ? getPhaseForLesson(currentLessonNum) : 1;
  const activePhase = phaseParam
    ? Math.max(1, Math.min(4, parseInt(phaseParam)))
    : defaultPhase;
  const phaseInfo = STAGES[activePhase - 1];

  // Lessons for active phase by lesson_num range
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, book_num, lesson_num, vocab")
    .gte("lesson_num", phaseInfo.start)
    .lte("lesson_num", phaseInfo.end)
    .order("lesson_num");

  const rawDone = progress?.lessons_done;
  const doneIds = new Set<number>(
    Array.isArray(rawDone) ? (rawDone as number[]) : []
  );

  type LessonRow = { id: string; book_num: number; lesson_num: number; vocab: string | null };
  const doneInPhase = (lessons as LessonRow[] | null)?.filter((l) => doneIds.has(l.lesson_num)).length ?? 0;
  const total = lessons?.length ?? 0;
  const pct = total > 0 ? Math.round((doneInPhase / total) * 100) : 0;

  // TODO(#12): Replace with real subscription check
  const userPlan = "pro";
  const userPlanLevel = PLAN_LEVELS[userPlan] ?? 0;
  const isLocked = PLAN_LEVELS[phaseInfo.plan] > userPlanLevel;

  return (
    <div className="max-w-2xl mx-auto w-full pb-20 md:pb-0">
      <style>{`
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.1); }
        }
        .node-current { animation: pulse-scale 2s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">我的学习路线图</h1>
        <p className="text-sm text-muted-foreground mt-1">191课 · 完整进阶体系</p>
      </div>

      {/* Phase tabs */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-2 px-4 pb-4">
          {STAGES.map((stage) => {
            const locked = PLAN_LEVELS[stage.plan] > userPlanLevel;
            const isActive = stage.index === activePhase;
            if (locked) {
              return (
                <Link
                  key={stage.index}
                  href={`/${locale}/protected/pricing`}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 bg-muted text-muted-foreground whitespace-nowrap opacity-60 text-sm font-medium"
                >
                  <Lock className="w-3 h-3" />
                  {stage.name}
                </Link>
              );
            }
            return (
              <Link
                key={stage.index}
                href={`/${locale}/protected/map?phase=${stage.index}`}
                className={`flex items-center gap-1 rounded-xl px-4 py-2 whitespace-nowrap transition-colors text-sm font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {stage.emoji} {stage.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Phase progress bar */}
      <div className="mx-4 mb-2 flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">
          {phaseInfo.emoji} {phaseInfo.name} · {total}课
        </span>
        <span className="text-sm text-muted-foreground">
          {doneInPhase}/{total}课 {pct}%
        </span>
      </div>
      <div className="mx-4 mb-4 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Lesson node grid */}
      {!isLocked && (
        <div className="grid grid-cols-6 gap-2 px-4 pb-4">
          {(lessons as LessonRow[] | null)?.map((lesson) => {
            const isDone = doneIds.has(lesson.lesson_num);
            const isCurrent = lesson.lesson_num === currentLessonNum;
            return (
              <Link
                key={lesson.id}
                href={`/${locale}/protected/learn/${lesson.book_num}/${lesson.lesson_num}`}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  isDone
                    ? "bg-primary/20 text-primary"
                    : isCurrent
                    ? "bg-primary text-primary-foreground node-current"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {isDone ? "✓" : isCurrent ? "▶" : lesson.lesson_num}
              </Link>
            );
          })}
        </div>
      )}

      {/* Lock banner */}
      {isLocked && (
        <div className="mx-4 bg-muted/50 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span>{phaseInfo.name}需升级 · 解锁更多课程</span>
            <Link
              href={`/${locale}/protected/pricing`}
              className="text-primary font-medium hover:underline"
            >
              查看套餐 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
