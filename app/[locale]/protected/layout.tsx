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
    ...new Set(data.map((r) => r.created_at.slice(0, 10))),
  ].sort((a, b) => b.localeCompare(a));

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

  // 中间麦克风按钮跳转到当前课程
  const micHref = currentLesson
    ? `/${locale}/protected/learn/${currentLesson.book_num}/${currentLesson.lesson_num}`
    : `/${locale}/onboarding`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Desktop Top Nav - 简化版，无导航链接 */}
      <nav className="sticky top-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
          {/* Logo */}
          <Link
            href={`/${locale}/protected`}
            className="flex items-center gap-1.5 font-bold text-lg text-primary shrink-0"
          >
            <Mic className="w-4 h-4" />
            TalkFlow
          </Link>

          {/* Right: streak + theme + avatar dropdown */}
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

      {/* Mobile Bottom Tab Bar - 3项：首页 + 中间凸起麦克风 + 复习 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
        <div className="flex items-end justify-around h-16 px-4">
          {/* 首页 */}
          <Link
            href={`/${locale}/protected`}
            className="flex flex-col items-center justify-center gap-1 py-2 px-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">首页</span>
          </Link>

          {/* 中间凸起麦克风按钮 */}
          <Link
            href={micHref}
            className="relative -top-4 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          >
            <Mic className="w-6 h-6" />
          </Link>

          {/* 复习（带 badge） */}
          <Link
            href={`/${locale}/protected/review`}
            className="relative flex flex-col items-center justify-center gap-1 py-2 px-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="relative">
              <RotateCcw className="w-5 h-5" />
              {reviewCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                  {reviewCount > 99 ? "99+" : reviewCount}
                </span>
              )}
            </div>
            <span className="text-xs">复习</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
