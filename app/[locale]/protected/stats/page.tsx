import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { Flame, BookOpen, Target, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAccuracyPercent, getWeakTerms } from "@/lib/user-stats";

type SessionRecordRow = { created_at: string };

async function getDetailedStats(userId: string) {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: sessions } = await supabase
    .from("session_records")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false });

  let streak = 0;
  if (sessions && sessions.length > 0) {
    const sessionRows = sessions as SessionRecordRow[];
    const dates = [
      ...new Set(sessionRows.map((s) => s.created_at.slice(0, 10))),
    ].sort((a: string, b: string) => b.localeCompare(a));
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

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { count: weekLessons } = await supabase
    .from("session_records")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", weekAgo);

  const today = new Date().toISOString();
  const tomorrow = new Date(Date.now() + 86400000).toISOString();

  const { count: todayReviews } = await supabase
    .from("review_schedule")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .lte("next_review_at", today);

  const { count: tomorrowReviews } = await supabase
    .from("review_schedule")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gt("next_review_at", today)
    .lte("next_review_at", tomorrow);

  const heatmapData: Record<string, number> = {};
  if (sessions) {
    (sessions as SessionRecordRow[]).forEach((s) => {
      const date = s.created_at.slice(0, 10);
      heatmapData[date] = (heatmapData[date] || 0) + 1;
    });
  }

  const [accuracy, weakWords] = await Promise.all([
    getAccuracyPercent(supabase, userId),
    getWeakTerms(supabase, userId),
  ]);

  return {
    streak,
    weekLessons: weekLessons ?? 0,
    todayReviews: todayReviews ?? 0,
    tomorrowReviews: tomorrowReviews ?? 0,
    heatmapData,
    accuracy,
    weakWords,
  };
}

function generateHeatmapDays() {
  const days = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 29);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  for (let i = 0; i < 35; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    days.push(date.toISOString().slice(0, 10));
  }

  return days;
}

export default async function StatsPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  const stats = await getDetailedStats(user.id);
  const heatmapDays = generateHeatmapDays();
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="min-h-full" style={{ backgroundColor: "#111111" }}>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/${locale}/protected/me`}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">学习数据</h1>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-border p-4 flex flex-col items-center" style={{ backgroundColor: "#1a1a1a" }}>
            <Flame className="w-5 h-5 text-orange-500 mb-2" />
            <div className="text-2xl font-bold text-foreground">{stats.streak}</div>
            <div className="text-xs text-muted-foreground">连续天</div>
          </div>
          <div className="rounded-xl border border-border p-4 flex flex-col items-center" style={{ backgroundColor: "#1a1a1a" }}>
            <BookOpen className="w-5 h-5 text-primary mb-2" />
            <div className="text-2xl font-bold text-foreground">{stats.weekLessons}</div>
            <div className="text-xs text-muted-foreground">本周课时</div>
          </div>
          <div className="rounded-xl border border-border p-4 flex flex-col items-center" style={{ backgroundColor: "#1a1a1a" }}>
            <Target className="w-5 h-5 text-primary mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {stats.accuracy !== null ? `${stats.accuracy}%` : "--"}
            </div>
            <div className="text-xs text-muted-foreground">正确率</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border p-5 mb-6" style={{ backgroundColor: "#1a1a1a" }}>
          <div className="text-sm text-muted-foreground mb-4">过去 5 周练习记录</div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs text-muted-foreground">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {heatmapDays.map((date) => {
              const count = stats.heatmapData[date] || 0;
              const today = new Date().toISOString().slice(0, 10);
              const isFuture = date > today;
              let bgColor = "rgba(255,255,255,0.05)";
              if (!isFuture && count > 0) {
                if (count === 1) bgColor = "rgba(16,185,129,0.3)";
                else if (count === 2) bgColor = "rgba(16,185,129,0.5)";
                else bgColor = "rgba(16,185,129,0.8)";
              }
              return (
                <div
                  key={date}
                  className="aspect-square rounded-sm"
                  style={{ backgroundColor: isFuture ? "transparent" : bgColor }}
                  title={`${date}: ${count} 次练习`}
                />
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border p-5 mb-6" style={{ backgroundColor: "#1a1a1a" }}>
          <div className="text-sm text-muted-foreground mb-4">待复习</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-foreground">
                今日 <span className="font-bold text-primary">{stats.todayReviews}</span> 词 · 明日 {stats.tomorrowReviews} 词
              </div>
            </div>
            {stats.todayReviews > 0 && (
              <Button size="sm" className="bg-primary text-primary-foreground" asChild>
                <Link href={`/${locale}/protected/review`}>
                  去复习
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border p-5" style={{ backgroundColor: "#1a1a1a" }}>
          <div className="text-sm text-muted-foreground mb-4">需要加强</div>
          {stats.weakWords.length > 0 ? (
            <p className="text-foreground text-sm">{stats.weakWords.join(" · ")}</p>
          ) : (
            <p className="text-muted-foreground text-sm">
              完成更多课程后，这里会显示你需要重点复习的词汇。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
