import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: progress }, { data: sessions }, { data: books }] =
    await Promise.all([
      supabase
        .from("user_progress")
        .select("current_lesson_id, lessons_done")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("session_records")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(60),
      supabase
        .from("books")
        .select("id, book_num, stage, cefr_level, lesson_start, lesson_end")
        .order("book_num"),
    ]);

  const doneIds = new Set<number>(progress?.lessons_done ?? []);
  const lessonsDone = doneIds.size;

  // Streak
  let streak = 0;
  let practiceDays = 0;
  const dateCounts: Record<string, number> = {};
  if (sessions) {
    for (const s of sessions) {
      const d = s.created_at.slice(0, 10);
      dateCounts[d] = (dateCounts[d] ?? 0) + 1;
    }
    const dates = Object.keys(dateCounts).sort((a, b) => b.localeCompare(a));
    practiceDays = dates.length;
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

  // Recent 14 days bar
  const last14: { date: string; count: number }[] = Array.from(
    { length: 14 },
    (_, i) => {
      const d = new Date(Date.now() - (13 - i) * 86400000)
        .toISOString()
        .slice(0, 10);
      return { date: d, count: dateCounts[d] ?? 0 };
    }
  );

  // B2 distance (lesson-based)
  const totalLessons = 191;
  const vocabCoverPct = Math.round((lessonsDone / totalLessons) * 100);

  // Stage breakdown (simplified: each book = 1 stage, ~30 lessons)
  const stageRows = (books as Array<{ id: string; book_num: number; stage: number; lesson_start: number; lesson_end: number; cefr_level?: string | null }> | null)?.map((book) => {
    // Estimate lessons done in this book range
    // We don't have per-lesson book mapping here easily, use lesson range
    const bookDone = progress?.lessons_done?.filter(
      (id: number) => id >= book.lesson_start && id <= book.lesson_end
    ).length ?? 0;
    const bookTotal = book.lesson_end - book.lesson_start + 1;
    const pct = bookTotal > 0 ? Math.round((bookDone / bookTotal) * 100) : 0;
    return { ...book, bookDone, bookTotal, pct };
  }) ?? [];

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-6 pb-20 md:pb-6">
      <h1 className="text-2xl font-bold text-foreground">我的进度</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: `${lessonsDone}`, sub: `/ ${totalLessons}`, label: "已学课时" },
          { value: "—", sub: "", label: "掌握词汇" },
          { value: `${practiceDays}`, sub: "天", label: "练习天数" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card rounded-2xl border border-border p-4 text-center"
          >
            <p className="text-2xl font-bold text-foreground">
              {s.value}
              {s.sub && (
                <span className="text-sm text-muted-foreground ml-1">
                  {s.sub}
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* B2 distance */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          口语 B2 目标距离
        </h2>
        <p className="text-4xl font-bold text-primary mb-1">
          {vocabCoverPct}%
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          已完成 {vocabCoverPct}%，继续加油
        </p>
        {[
          { label: "课程进度", value: lessonsDone, total: totalLessons },
        ].map((row) => (
          <div key={row.label} className="mb-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{row.label}</span>
              <span>
                {row.value} / {row.total}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{
                  width: `${Math.round((row.value / row.total) * 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Stage list */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          按 Stage 分布
        </p>
        <div className="flex flex-col divide-y divide-border border border-border rounded-2xl overflow-hidden">
          {stageRows.map((row) => (
            <Link
              key={row.id}
              href={`/protected/map?stage=${row.stage}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <span
                className={`text-xs px-2 py-1 rounded-lg font-medium shrink-0 ${
                  row.pct === 100
                    ? "bg-primary/10 text-primary"
                    : row.bookDone > 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {row.pct === 100 ? "✓ " : ""}Stage {row.stage}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground mb-1">
                  Book {row.book_num}
                  {row.cefr_level ? ` · ${row.cefr_level}` : ""}
                </p>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {row.bookDone}/{row.bookTotal}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent 14 days */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          最近练习
        </p>
        <div className="flex gap-1 items-end h-12">
          {last14.map(({ date, count }, i) => {
            const isToday = date === new Date().toISOString().slice(0, 10);
            const h = count > 0 ? Math.min(48, 8 + count * 12) : 4;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  className={`w-full rounded-sm transition-all ${
                    count > 0 ? "bg-primary" : "bg-muted"
                  } ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}`}
                  style={{ height: h }}
                />
                {i % 7 === 0 && (
                  <span className="text-[9px] text-muted-foreground">
                    {date.slice(5)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          成就徽章
        </p>
        <div className="flex flex-wrap gap-2">
          {streak >= 7 && (
            <span className="bg-muted rounded-full px-3 py-1.5 text-sm">
              🔥 连续 {streak} 天
            </span>
          )}
          {lessonsDone >= 1 && (
            <span className="bg-muted rounded-full px-3 py-1.5 text-sm">
              📖 开始学习
            </span>
          )}
          {lessonsDone >= 30 && (
            <span className="bg-muted rounded-full px-3 py-1.5 text-sm">
              📖 完成 Stage 1
            </span>
          )}
          {lessonsDone === 0 && (
            <span className="text-sm text-muted-foreground">
              完成第一课后解锁成就
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
