import Link from "next/link";
import { Mic, Flame, Settings, Home, RotateCcw, User } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoutButton } from "@/components/logout-button";

async function getStreak(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("session_records")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (!data || data.length === 0) return 0;

  const dates = [
    ...new Set((data as { created_at: string }[]).map((r) => r.created_at.slice(0, 10))),
  ].sort((a: string, b: string) => b.localeCompare(a));

  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(Date.now() - i * 86400000)
      .toISOString()
      .slice(0, 10);
    if (dates[i] === expected) streak++;
    else break;
  }
  return streak;
}

async function getReviewCount(userId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString();
  const { count } = await supabase
    .from("review_schedule")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .lte("next_review_at", today);
  return count ?? 0;
}

async function getCurrentLesson(userId: string) {
  const supabase = await createClient();
  const { data: progress } = await supabase
    .from("user_progress")
    .select("current_lesson_id")
    .eq("user_id", userId)
    .single();

  if (!progress?.current_lesson_id) return null;

  const { data: lesson } = await supabase
    .from("lessons")
    .select("book_num, lesson_num")
    .eq("id", progress.current_lesson_id)
    .single();

  return lesson;
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const streak = user ? await getStreak(user.id) : 0;
  const reviewCount = user ? await getReviewCount(user.id) : 0;
  const currentLesson = user ? await getCurrentLesson(user.id) : null;
  const initials = (user?.email ?? "?")[0].toUpperCase();

  const micHref = currentLesson
    ? `/${locale}/protected/learn/${currentLesson.book_num}/${currentLesson.lesson_num}`
    : `/${locale}/onboarding`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="sticky top-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
          <Link
            href={`/${locale}/protected`}
            className="flex items-center gap-1.5 font-bold text-lg text-primary shrink-0"
          >
            <Mic className="w-4 h-4" />
            TalkFlow
          </Link>

          <div className="flex items-center gap-2">
            {streak > 0 && (
              <span className="flex items-center gap-1 bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 rounded-full px-2.5 py-1 text-xs font-medium">
                <Flame className="w-3.5 h-3.5" />
                {streak}天
              </span>
            )}
            <ThemeSwitcher />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center hover:opacity-90 transition-opacity outline-none">
                  {initials}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/protected/me`} className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      我的
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/protected/settings`} className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      设置
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <LogoutButton variant="menu" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col pb-20 md:pb-0">{children}</div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background">
        <div className="relative mx-auto flex h-16 max-w-[430px] items-center justify-around px-4">
          <Link
            href={`/${locale}/protected`}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-primary transition-colors"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">首页</span>
          </Link>

          <div className="flex-1" />

          <Link
            href={micHref}
            aria-label="开口练习"
            className="absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 -translate-y-5 animate-breathe items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_0_4px_hsl(var(--background)),0_0_24px_rgba(16,185,129,0.6)] transition-colors hover:bg-primary/90"
          >
            <Mic className="h-6 w-6" />
          </Link>

          <Link
            href={`/${locale}/protected/review`}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <div className="relative">
              <RotateCcw className="h-5 w-5" />
              {reviewCount > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {reviewCount > 99 ? "99+" : reviewCount}
                </span>
              )}
            </div>
            <span className="text-xs">复习</span>
          </Link>

          <Link
            href={`/${locale}/protected/me`}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <User className="h-5 w-5" />
            <span className="text-xs">我的</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
