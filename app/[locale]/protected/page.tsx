import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import { DashboardContent } from "@/components/dashboard-content";
import { getStageForLesson, getStagePct } from "@/lib/stages";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "早上好";
  if (h < 18) return "下午好";
  return "晚上好";
}

function formatDate() {
  const d = new Date();
  const days = ["日", "一", "二", "三", "四", "五", "六"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 · 周${days[d.getDay()]}`;
}

export default async function DashboardPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const [{ data: progress }, { data: profile }] = await Promise.all([
    supabase
      .from("user_progress")
      .select("current_lesson_id, lessons_done")
      .eq("user_id", user.id)
      .single(),
    supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle(),
  ]);

  let currentLesson: {
    id: number;
    book_num: number;
    lesson_num: number;
    vocab?: string | null;
  } | null = null;

  if (progress?.current_lesson_id) {
    const { data } = await supabase
      .from("lessons")
      .select("id, book_num, lesson_num, vocab")
      .eq("id", progress.current_lesson_id)
      .single();
    currentLesson = data;
  }

  let sceneImageUrl: string | null = null;
  if (currentLesson?.id) {
    const { data: scene } = await supabase
      .from("scenes")
      .select("image_url")
      .eq("lesson_id", currentLesson.id)
      .order("position")
      .limit(1)
      .maybeSingle();
    sceneImageUrl = scene?.image_url ?? null;
  }

  const today = new Date().toISOString();
  const { count: reviewCount } = await supabase
    .from("review_schedule")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .lte("next_review_at", today);

  const hasProgress = !!currentLesson;
  const resumeHref = currentLesson
    ? `/${locale}/protected/learn/${currentLesson.book_num}/${currentLesson.lesson_num}`
    : `/${locale}/protected/learn/1/1`;

  const vocabPreview = currentLesson?.vocab
    ? currentLesson.vocab.split(" | ").slice(0, 4).join(" · ")
    : null;

  const displayName =
    profile?.nickname?.trim() ||
    user.email?.split("@")[0] ||
    "同学";

  const lessonNum = currentLesson?.lesson_num ?? 1;
  const stage = getStageForLesson(lessonNum);
  const rawDone = progress?.lessons_done;
  const lessonsDoneArr: number[] = Array.isArray(rawDone) ? (rawDone as number[]) : [];
  const stagePct = getStagePct(lessonsDoneArr, stage);

  return (
    <DashboardContent
      displayName={displayName}
      hasProgress={hasProgress}
      reviewCount={reviewCount ?? 0}
      currentLesson={currentLesson?.lesson_num}
      vocabPreview={vocabPreview}
      sceneImageUrl={sceneImageUrl}
      resumeHref={resumeHref}
      onboardingHref={`/${locale}/onboarding`}
      reviewHref={`/${locale}/protected/review`}
      mapHref={`/${locale}/protected/map`}
      greeting={getGreeting()}
      dateStr={formatDate()}
      stageName={stage.name}
      stageEmoji={stage.emoji}
      stagePct={stagePct}
      stageIndex={stage.index}
    />
  );
}
