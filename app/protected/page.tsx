import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

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
    ? `/protected/learn/${currentLesson.book_num}/${currentLesson.lesson_num}`
    : "/protected/learn/1/1";

  const vocabPreview = currentLesson?.vocab
    ? currentLesson.vocab.split(" | ").slice(0, 3).join(" · ")
    : null;

  // lesson progress within the session (placeholder 0% if fresh)
  const lessonProgress = 0;

  const displayName = user.email?.split("@")[0] ?? "同学";

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6 pb-20 md:pb-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {getGreeting()}，{displayName} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{formatDate()}</p>
      </div>

      {/* Main CTA card */}
      {hasProgress ? (
        <Card className="rounded-2xl border-2 border-primary bg-primary/5 p-6">
          <div className="flex items-start justify-between mb-3">
            <Badge className="bg-primary/10 text-primary text-xs border-0 font-normal">
              上次练习
            </Badge>
          </div>
          <p className="text-xl font-semibold text-foreground mb-1">
            Book {currentLesson!.book_num} · Lesson {currentLesson!.lesson_num}
          </p>
          {vocabPreview && (
            <p className="text-sm text-muted-foreground mb-4">{vocabPreview}</p>
          )}
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>进度</span>
            <span>{lessonProgress}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${lessonProgress}%` }}
            />
          </div>
          <Button asChild size="lg" className="w-full rounded-xl">
            <Link href={resumeHref}>
              继续练习
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </Card>
      ) : (
        <Card className="rounded-2xl border-2 border-primary bg-primary/5 p-6 text-center">
          <p className="text-xl font-semibold text-foreground mb-2">
            欢迎来到 TalkFlow
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            从 Stage 3 开始你的口语训练
          </p>
          <Button asChild size="lg" className="w-full rounded-xl">
            <Link href="/onboarding">
              开始第一课
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </Card>
      )}

      {/* Today tasks */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          今日待办
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-xl border border-border p-4">
            <BookOpen className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs text-muted-foreground">今日新课</p>
            <p className="text-sm font-medium text-foreground mt-0.5">
              {currentLesson
                ? `Lesson ${currentLesson.lesson_num}`
                : "从 L1 开始"}
            </p>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="w-full mt-3 rounded-lg"
            >
              <Link href={resumeHref}>开始学习</Link>
            </Button>
          </Card>

          <Card className="rounded-xl border border-border p-4">
            <RotateCcw
              className={`w-5 h-5 mb-2 ${
                (reviewCount ?? 0) > 0 ? "text-destructive" : "text-primary"
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
                href="/protected/review"
                aria-disabled={(reviewCount ?? 0) === 0}
              >
                开始复习
              </Link>
            </Button>
          </Card>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-3">
          我的成就
        </p>
        <Link href="/protected/progress">
          <div className="flex gap-3 flex-wrap">
            <AchievBadge icon={<Flame className="w-4 h-4" />} value={`${streak}`} label="连续天数" />
            <AchievBadge icon={<BookOpen className="w-4 h-4" />} value={`${lessonsDone}`} label="已学课时" />
            <AchievBadge icon={<MessageCircle className="w-4 h-4" />} value="—" label="掌握词汇" />
          </div>
        </Link>
      </div>
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
    <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3 hover:bg-muted/80 transition-colors">
      <span className="text-primary">{icon}</span>
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
