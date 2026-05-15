import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, CheckCircle2, Flame } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: progress } = await supabase
    .from("user_progress")
    .select("current_lesson_id, lessons_done")
    .eq("user_id", user.id)
    .single();

  let currentLesson: { book_num: number; lesson_num: number } | null = null;
  if (progress?.current_lesson_id) {
    const { data } = await supabase
      .from("lessons")
      .select("book_num, lesson_num")
      .eq("id", progress.current_lesson_id)
      .single();
    currentLesson = data;
  }

  const lessonsDone = progress?.lessons_done?.length ?? 0;
  const resumeHref = currentLesson
    ? `/protected/learn/${currentLesson.book_num}/${currentLesson.lesson_num}`
    : "/protected/learn/1/1";
  const resumeLabel = currentLesson
    ? `继续 Book ${currentLesson.book_num} · Lesson ${currentLesson.lesson_num}`
    : "从第一课开始";

  const displayName = user.email?.split("@")[0] ?? "同学";

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-12">
      {/* Hero */}
      <div className="mb-10">
        <p className="text-sm text-muted-foreground mb-1">
          欢迎回来，{displayName}
        </p>
        <h1 className="text-3xl font-bold text-foreground mb-6">
          继续你的英语练习
        </h1>
        <Button
          asChild
          size="lg"
          className="rounded-xl h-14 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Link href={resumeHref}>
            {resumeLabel}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-primary" />}
          value={lessonsDone}
          label="已完成课时"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-primary" />}
          value={`Book ${currentLesson?.book_num ?? 1}`}
          label="当前册"
        />
        <StatCard
          icon={<Flame className="w-5 h-5 text-accent" />}
          value="—"
          label="连续天数"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">{icon}</div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
