import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import { MePageClient } from "@/components/me/me-page-client";
import { getAccuracyPercent, getUserPlan } from "@/lib/user-stats";
import { normalizePlan } from "@/lib/subscription";

type SessionRecordRow = { created_at: string };

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

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { count: weekLessons } = await supabase
    .from("session_records")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", weekAgo);

  const [accuracy, userPlan, { data: subscription }] = await Promise.all([
    getAccuracyPercent(supabase, userId),
    getUserPlan(supabase, userId),
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", userId)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const tier = subscription?.plan
    ? normalizePlan(subscription.plan as string)
    : userPlan;

  return { streak, weekLessons: weekLessons ?? 0, accuracy, tier };
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
        weekLessons={stats.weekLessons}
        accuracy={stats.accuracy}
        tier={stats.tier}
      />
    </Suspense>
  );
}
