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

export default async function DashboardPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  // user_progress
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

  // today's due reviews
  const today = new Date().toISOString();
  const { count: reviewCount } = await supabase
    .from("review_schedule")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .lte("next_review_at", today);

  // streak + total lessons
  const { data: sessions } = await supabase
    .from("session_records")
    .select("created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60);

  let streak = 0;
  if (sessions && sessions.length > 0) {
    const dates = [
      ...new Set(sessions.map((s) => s.created_at.slice(0, 10))),
    ].sort((a, b) => b.localeCompare(a));
    const todayStr = new Date().toISOString().slice(0, 10);
    const yestStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (dates[0] === todayStr || dates[0] === yestStr) {
      for (let i = 0; i < dates.length; i++) {
        const exp = new Date(Date.now() - i * 86400000)
          .toISOString()
          .slice(0, 10);
        if (dates[i] === exp) streak++;
        else break;
      }
    }
  }

  const lessonsDone = progress?.lessons_done?.length ?? 0;
  const hasProgress = !!currentLesson;
  const resumeHref = currentLesson
    ? `/${locale}/protected/learn/${currentLesson.book_num}/${currentLesson.lesson_num}`
    : `/${locale}/protected/learn/1/1`;

  const vocabPreview = currentLesson?.vocab
    ? currentLesson.vocab.split(" | ").slice(0, 3).join(" · ")
    : null;

  const displayName = user.email?.split("@")[0] ?? "同学";

  return (
    <DashboardContent
      displayName={displayName}
      hasProgress={hasProgress}
      streak={streak}
      lessonsDone={lessonsDone}
      reviewCount={reviewCount ?? 0}
      currentBook={currentLesson?.book_num}
      currentLesson={currentLesson?.lesson_num}
      vocabPreview={vocabPreview}
      resumeHref={resumeHref}
      onboardingHref={`/${locale}/onboarding`}
      reviewHref={`/${locale}/protected/review`}
      greeting={getGreeting()}
      dateStr={formatDate()}
    />
  );
}
