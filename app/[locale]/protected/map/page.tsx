import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import { STAGES, getStageForLesson } from "@/lib/stages";
import { getUserPlan } from "@/lib/user-stats";
import { MapClient } from "@/components/map/map-client";

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

  const [{ data: progress }, userPlan] = await Promise.all([
    supabase
      .from("user_progress")
      .select("current_lesson_id, lessons_done")
      .eq("user_id", user.id)
      .single(),
    getUserPlan(supabase, user.id),
  ]);

  let currentLessonNum: number | null = null;
  if (progress?.current_lesson_id) {
    const { data: cur } = await supabase
      .from("lessons")
      .select("lesson_num")
      .eq("id", progress.current_lesson_id)
      .single();
    currentLessonNum = cur?.lesson_num ?? null;
  }

  const defaultPhase = currentLessonNum ? getStageForLesson(currentLessonNum).index : 1;
  const activePhase = phaseParam
    ? Math.max(1, Math.min(4, parseInt(phaseParam)))
    : defaultPhase;
  const phaseInfo = STAGES[activePhase - 1];

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, book_num, lesson_num")
    .gte("lesson_num", phaseInfo.start)
    .lte("lesson_num", phaseInfo.end)
    .order("lesson_num");

  const rawDone = progress?.lessons_done;
  const doneIds = Array.isArray(rawDone) ? (rawDone as number[]) : [];

  type LessonRow = { id: string; book_num: number; lesson_num: number };
  const lessonRows = (lessons as LessonRow[] | null) ?? [];
  const doneInPhase = lessonRows.filter((l) => doneIds.includes(l.lesson_num)).length;
  const total = lessonRows.length;
  const pct = total > 0 ? Math.round((doneInPhase / total) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto w-full pb-20 md:pb-0">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">我的学习路线图</h1>
        <p className="text-sm text-muted-foreground mt-1">191 课 · 完整进阶体系</p>
      </div>

      <MapClient
        locale={locale}
        stages={STAGES}
        activePhase={activePhase}
        lessons={lessonRows}
        doneIds={doneIds}
        currentLessonNum={currentLessonNum}
        userPlan={userPlan}
        phaseInfo={phaseInfo}
        doneInPhase={doneInPhase}
        total={total}
        pct={pct}
      />
    </div>
  );
}
