import { loadEnv } from "./_env.js";
import { withClient } from "./_db.js";

loadEnv();

async function main() {
  await withClient(async (client) => {
    const { rows: terms } = await client.query<{
      id: number;
      term: string;
      normalized: string;
      lesson_id: number;
    }>(`select id, term, normalized, lesson_id from public.terms`);

    const issues: string[] = [];

    const empty = terms.filter((t) => !t.term?.trim());
    if (empty.length) issues.push(`空值词项：${empty.length} 个`);

    const tooLong = terms.filter((t) => t.term.length > 60);
    if (tooLong.length) {
      issues.push(
        `超长词项：${tooLong.map((t) => `"${t.term.slice(0, 30)}..."`).join(", ")}`,
      );
    }

    const ligatures = terms.filter((t) => /[\uFB00-\uFB04ﬁﬂﬀﬃﬄ]/.test(t.term));
    if (ligatures.length) issues.push(`连字符残留：${ligatures.length} 个`);

    const byLesson = new Map<number, string[]>();
    for (const t of terms) {
      const list = byLesson.get(t.lesson_id) ?? [];
      list.push(t.normalized.toLowerCase());
      byLesson.set(t.lesson_id, list);
    }

    for (const [lessonId, lessonTerms] of byLesson) {
      const dupes = [...new Set(lessonTerms.filter((t, i) => lessonTerms.indexOf(t) !== i))];
      if (dupes.length) {
        issues.push(`lesson_id=${lessonId} 重复词项：${dupes.join(", ")}`);
      }
    }

    if (issues.length) {
      console.log(issues.join("\n"));
      process.exitCode = 1;
      return;
    }

    console.log("✅ 词项合法性全部通过");
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
