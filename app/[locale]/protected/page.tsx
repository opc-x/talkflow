import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  BookOpen,
  RotateCcw,
  Flame,
  MessageCircle,
  Mic,
} from "lucide-react";

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

  // lesson progress within the session (placeholder 0% if fresh)
  const lessonProgress = 0;

  const displayName = user.email?.split("@")[0] ?? "同学";

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6 pb-20 md:pb-8">
      {/* Greeting */}
      <div className="pt-2">
        <p className="text-sm text-muted-foreground mb-1">{formatDate()}</p>
        <h1 className="text-3xl font-bold text-foreground">
          {getGreeting()}，{displayName} 👋
        </h1>
      </div>

      {/* Main card */}
      {hasProgress ? (
        <Card className="rounded-2xl border border-border bg-card p-6">
          {/* Streak bar */}
          {streak > 0 && (
            <div className="flex items-center gap-1.5 mb-4">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-orange-500">{streak} 天连续练习</span>
              <span className="text-xs text-muted-foreground ml-1">保持住！</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">继续上次</p>
          <p className="text-2xl font-bold text-foreground mb-0.5">
            Book {currentLesson!.book_num} · Lesson {currentLesson!.lesson_num}
          </p>
          {vocabPreview && (
            <p className="text-sm text-muted-foreground mb-5">{vocabPreview}</p>
          )}
          <Button asChild size="lg" className="w-full rounded-xl h-12 text-base font-semibold">
            <Link href={resumeHref}>
              <Mic className="mr-2 w-4 h-4" />
              开口练习
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 p-8">
          <p className="text-3xl font-bold text-foreground mb-3 leading-tight">
            开口，<br />就现在。
          </p>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            AI 问，你答，说错立刻纠正。<br />
            不背单词，不学语法，张口就练。
          </p>
          <Button asChild size="lg" className="w-full rounded-xl h-12 text-base font-semibold">
            <Link href={`/${locale}/onboarding`}>
              <Mic className="mr-2 w-4 h-4" />
              开始第一课
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* Today tasks — only show when user has started */}
      {hasProgress && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            今日待办
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Card className="rounded-xl border border-border p-4">
              <BookOpen className="w-5 h-5 text-primary mb-2" />
              <p className="text-xs text-muted-foreground">今日新课</p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                Lesson {currentLesson!.lesson_num}
              </p>
              <Button asChild size="sm" variant="outline" className="w-full mt-3 rounded-lg">
                <Link href={resumeHref}>开始学习</Link>
              </Button>
            </Card>

            <Card className="rounded-xl border border-border p-4">
              <RotateCcw
                className={`w-5 h-5 mb-2 ${
                  (reviewCount ?? 0) > 0 ? "text-destructive" : "text-muted-foreground"
                }`}
              />
              <p className="text-xs text-muted-foreground">到期复习</p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {(reviewCount ?? 0) > 0 ? `${reviewCount} 个词汇` : "暂无"}
              </p>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="w-full mt-3 rounded-lg"
                disabled={(reviewCount ?? 0) === 0}
              >
                <Link
                  href={`/${locale}/protected/review`}
                  aria-disabled={(reviewCount ?? 0) === 0}
                >
                  开始复习
                </Link>
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* Achievements — only show when there's real data */}
      {(streak > 0 || lessonsDone > 0) && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            我的成就
          </p>
          <Link href={`/${locale}/protected/progress`}>
            <div className="grid grid-cols-3 gap-3">
              <AchievBadge icon={<Flame className="w-4 h-4" />} value={`${streak}`} label="连续天数" />
              <AchievBadge icon={<BookOpen className="w-4 h-4" />} value={`${lessonsDone}`} label="已学课时" />
              <AchievBadge icon={<MessageCircle className="w-4 h-4" />} value="—" label="掌握词汇" />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

function AchievBadge({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 bg-muted rounded-xl px-3 py-4 hover:bg-muted/80 transition-colors text-center">
      <span className="text-primary">{icon}</span>
      <span className="text-xl font-bold text-foreground leading-none">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
