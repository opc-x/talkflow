import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { 
  Flame, 
  BookOpen, 
  Target, 
  ArrowRight, 
  Search, 
  BookText, 
  FileText,
  KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";

async function getUserStats(userId: string) {
  const supabase = await createClient();
  
  // Get streak
  const { data: sessions } = await supabase
    .from("session_records")
    .select("created_at")
    .eq("user_id", userId)
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

  // Get lessons done this week
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { count: weekLessons } = await supabase
    .from("session_records")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", weekAgo);

  // Get user progress
  const { data: progress } = await supabase
    .from("user_progress")
    .select("lessons_done")
    .eq("user_id", userId)
    .single();

  // Get subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier")
    .eq("user_id", userId)
    .single();

  return {
    streak,
    weekLessons: weekLessons ?? 0,
    totalLessons: progress?.lessons_done?.length ?? 0,
    tier: subscription?.tier ?? "free",
  };
}

export default async function MePage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  const stats = await getUserStats(user.id);
  const displayName = user.email?.split("@")[0] ?? "用户";

  const tierLabels: Record<string, string> = {
    free: "免费版",
    daily: "日常对话",
    full: "完整精通",
  };

  return (
    <div className="min-h-full" style={{ backgroundColor: "#111111" }}>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <h1 className="text-2xl font-bold text-foreground mb-6">我的</h1>

        {/* Profile Card */}
        <div
          className="rounded-2xl border border-border p-5 mb-4"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
              {displayName[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-semibold truncate">{user.email}</p>
              <p className="text-sm text-muted-foreground">昵称: {displayName}</p>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div
          className="rounded-2xl border border-border p-5 mb-4"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          <div className="text-sm text-muted-foreground mb-4">学习数据</div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-orange-500 mb-1">
                <Flame className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.streak}</div>
              <div className="text-xs text-muted-foreground">连续天</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-primary mb-1">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.weekLessons}</div>
              <div className="text-xs text-muted-foreground">本周课时</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-primary mb-1">
                <Target className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-foreground">--</div>
              <div className="text-xs text-muted-foreground">正确率</div>
            </div>
          </div>
          <Link
            href={`/${locale}/protected/stats`}
            className="flex items-center justify-between py-3 border-t border-border text-sm text-primary hover:opacity-80 transition-opacity"
          >
            <span>查看完整报告</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Subscription Card */}
        <div
          className="rounded-2xl border border-border p-5 mb-4"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">订阅</div>
              <div className="text-foreground font-medium">
                当前: {tierLabels[stats.tier] || stats.tier}
              </div>
            </div>
            {stats.tier === "free" && (
              <Button size="sm" className="bg-primary text-primary-foreground">
                升级 Pro
              </Button>
            )}
          </div>
        </div>

        {/* Tools Card */}
        <div
          className="rounded-2xl border border-border p-5 mb-4"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          <div className="text-sm text-muted-foreground mb-4">学习工具箱</div>
          <div className="grid grid-cols-3 gap-3">
            <Link
              href={`/${locale}/protected/tools`}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-background/50 transition-colors"
            >
              <Search className="w-5 h-5 text-primary" />
              <span className="text-xs text-muted-foreground">词汇搜索</span>
            </Link>
            <Link
              href={`/${locale}/protected/tools`}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-background/50 transition-colors"
            >
              <BookText className="w-5 h-5 text-primary" />
              <span className="text-xs text-muted-foreground">语法参考</span>
            </Link>
            <Link
              href={`/${locale}/protected/tools`}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-background/50 transition-colors"
            >
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-xs text-muted-foreground">教材原文</span>
            </Link>
          </div>
        </div>

        {/* Account Actions */}
        <div
          className="rounded-2xl border border-border overflow-hidden"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          <Link
            href={`/${locale}/protected/settings`}
            className="flex items-center gap-3 px-5 py-4 border-b border-border hover:bg-background/50 transition-colors"
          >
            <KeyRound className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground">修改密码</span>
          </Link>
          <div className="px-5 py-4 hover:bg-background/50 transition-colors">
            <LogoutButton variant="text" />
          </div>
        </div>
      </div>
    </div>
  );
}
