import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import { MePageClient } from "@/components/me/me-page-client";
import { getWeekAccuracy, getUserPlan } from "@/lib/user-stats";
import { getStageForLesson, type Stage } from "@/lib/stages";
import { normalizePlan } from "@/lib/subscription";

type SessionRecordRow = { created_at: string };

async function getLessonNumById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  lessonId: number
): Promise<number | null> {
  const { data } = await supabase
    .from("lessons")
    .select("lesson_num")
    .eq("id", lessonId)
    .maybeSingle();
  return data?.lesson_num ?? null;
}

async function getUserStats(userId: string) {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("session_records")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(60);

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

  const [
    { count: masteredCount },
    thisWeekAccuracy,
    lastWeekAccuracy,
    userPlan,
    { data: subscription },
    { data: progress },
  ] = await Promise.all([
    supabase
      .from("review_schedule")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("rep_count", 3),
    getWeekAccuracy(supabase, userId, 0),
    getWeekAccuracy(supabase, userId, 1),
    getUserPlan(supabase, userId),
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", userId)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("user_progress")
      .select("current_lesson_id")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  let cefrStage: Stage | null = null;
  if (progress?.current_lesson_id) {
    const lessonNum = await getLessonNumById(
      supabase,
      progress.current_lesson_id
    );
    if (lessonNum) cefrStage = getStageForLesson(lessonNum);
  }

  const tier = subscription?.plan
    ? normalizePlan(subscription.plan as string)
    : userPlan;

  return {
    streak,
    masteredCount: masteredCount ?? 0,
    thisWeekAccuracy,
    lastWeekAccuracy,
    cefrStage,
    tier,
  };
}

export default async function MePage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  const [{ data: profile }, stats] = await Promise.all([
    supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle(),
    getUserStats(user.id),
  ]);

  const displayName =
    profile?.nickname?.trim() ||
    user.email?.split("@")[0] ||
    "用户";

  return (
    <Suspense>
      <MePageClient
        locale={locale}
        userId={user.id}
        email={user.email ?? ""}
        displayName={displayName}
        streak={stats.streak}
        masteredCount={stats.masteredCount}
        thisWeekAccuracy={stats.thisWeekAccuracy}
        lastWeekAccuracy={stats.lastWeekAccuracy}
        cefrStage={stats.cefrStage}
        tier={stats.tier}
      />
    </Suspense>
  );
}
