import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import { DashboardContent } from "@/components/dashboard-content";

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

type Stage = {
  index: number;
  name: string;
  emoji: string;
  start: number;
  end: number;
};

const STAGES: Stage[] = [
  { index: 1, name: "入门",     emoji: "🌱", start: 1,   end: 24  },
  { index: 2, name: "日常对话", emoji: "💬", start: 25,  end: 77  },
  { index: 3, name: "职场流利", emoji: "💼", start: 78,  end: 126 },
  { index: 4, name: "高级表达", emoji: "🎯", start: 127, end: 191 },
];

function getStageInfo(lessonNum: number): Stage {
  return STAGES.find((s) => lessonNum >= s.start && lessonNum <= s.end) ?? STAGES[0];
}

function getStagePct(lessonsDoneArr: number[], stage: Stage): number {
  const done = lessonsDoneArr.filter((l) => l >= stage.start && l <= stage.end).length;
  return Math.round((done / (stage.end - stage.start + 1)) * 100);
}

export default async function DashboardPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const { data: progress } = await supabase
    .from("user_progress")
    .select("current_lesson_id, lessons_done")
    .eq("user_id", user.id)
    .single();

  let currentLesson: {
    id: string;
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

  const today = new Date().toISOString();
  const { count: reviewCount } = await supabase
    .from("review_schedule")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .lte("next_review_at", today);

  const lessonsDone = progress?.lessons_done?.length ?? 0;
  const hasProgress = !!currentLesson;

  const resumeHref = currentLesson
    ? `/${locale}/protected/learn/${currentLesson.book_num}/${currentLesson.lesson_num}`
    : `/${locale}/protected/learn/1/1`;

  const vocabPreview = currentLesson?.vocab
    ? currentLesson.vocab.split(" | ").slice(0, 3).join(" · ")
    : null;

  const displayName = user.email?.split("@")[0] ?? "同学";

  const lessonNum = currentLesson?.lesson_num ?? 1;
  const stage = getStageInfo(lessonNum);
  const rawDone = progress?.lessons_done;
  const lessonsDoneArr: number[] = Array.isArray(rawDone) ? (rawDone as number[]) : [];
  const stagePct = getStagePct(lessonsDoneArr, stage);

  return (
    <DashboardContent
      displayName={displayName}
      hasProgress={hasProgress}
      lessonsDone={lessonsDone}
      reviewCount={reviewCount ?? 0}
      currentLesson={currentLesson?.lesson_num}
      vocabPreview={vocabPreview}
      resumeHref={resumeHref}
      onboardingHref={`/${locale}/onboarding`}
      reviewHref={`/${locale}/protected/review`}
      greeting={getGreeting()}
      dateStr={formatDate()}
      stageName={stage.name}
      stageEmoji={stage.emoji}
      stagePct={stagePct}
      stageIndex={stage.index}
      locale={locale}
    />
  );
}
