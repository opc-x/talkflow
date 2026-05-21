import { loadEnv, getGitHubToken } from "./_env.js";
import { withClient } from "./_db.js";
import { createOpenAI, chatJson } from "./_openai.js";

loadEnv();

const ISSUE_NUMBER = 19;
const REPO = "HcPittBrad/talkflow";

function stats(values: number[]) {
  const μ = values.reduce((a, b) => a + b, 0) / values.length;
  const σ = Math.sqrt(values.reduce((a, b) => a + (b - μ) ** 2, 0) / values.length);
  return { μ, σ, min: Math.min(...values), max: Math.max(...values) };
}

const openai = createOpenAI();

async function judgeAnomaly(lesson: {
  lesson_num: number;
  book_num: number;
  qa_count: number;
  term_count: number;
  qa_μ: number;
  qa_σ: number;
  term_μ: number;
  term_σ: number;
  sample_terms: string[];
  sample_qas: string[];
  qa_alignment_rate: number;
}): Promise<{ verdict: string; reason: string; action: string }> {
  return chatJson(openai, [
    {
      role: "user",
      content: `Callan Method lesson audit.
Book ${lesson.book_num}, Lesson ${lesson.lesson_num}
Q&A count: ${lesson.qa_count} (avg=${lesson.qa_μ.toFixed(0)}, σ=${lesson.qa_σ.toFixed(0)})
Term count: ${lesson.term_count} (avg=${lesson.term_μ.toFixed(0)}, σ=${lesson.term_σ.toFixed(0)})
Q&A-term alignment rate: ${(lesson.qa_alignment_rate * 100).toFixed(0)}%
Sample terms: ${lesson.sample_terms.slice(0, 10).join(", ")}
Sample Q&As: ${lesson.sample_qas.slice(0, 5).join(" | ")}

Is this anomaly a data error, accumulated review content, or actually normal?
Output JSON: {"verdict":"data_error|review_content|ok","reason":"one sentence","action":"mark_review|check_pdf|no_action"}`,
    },
  ], 150);
}

async function postToIssue(body: string) {
  const token = getGitHubToken();
  if (!token) {
    console.warn("⚠️ GITHUB_TOKEN not set — skipping Issue comment");
    console.log(body);
    return;
  }

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/issues/${ISSUE_NUMBER}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({ body }),
    },
  );

  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  }
  console.log("✅ 质检报告已追加到 Issue #19");
}

async function main() {
  await withClient(async (client) => {
    const { rows: lessons } = await client.query<{
      id: number;
      lesson_num: number;
      book_num: number;
      qa_count: number;
      term_count: number;
    }>(
      `select id, lesson_num, book_num, qa_count, term_count
       from public.lessons order by lesson_num`,
    );

    const qaCounts = lessons.map((l) => l.qa_count);
    const termCounts = lessons.map((l) => l.term_count);
    const qaStats = stats(qaCounts);
    const termStats = stats(termCounts);

    const anomalies = lessons.filter(
      (l) =>
        Math.abs(l.qa_count - qaStats.μ) > 2 * qaStats.σ ||
        Math.abs(l.term_count - termStats.μ) > 2 * termStats.σ,
    );

    const results: Array<{
      lesson_num: number;
      book_num: number;
      qa_count: number;
      term_count: number;
      qa_alignment_rate: number;
      verdict: string;
      reason: string;
      action: string;
    }> = [];

    let lowAlignmentLessons = 0;

    for (const lesson of lessons) {
      const { rows: termRows } = await client.query<{ term: string; normalized: string }>(
        `select term, normalized from public.terms where lesson_id = $1 limit 40`,
        [lesson.id],
      );
      const { rows: qaRows } = await client.query<{ question: string; answer: string | null }>(
        `select question, answer from public.qa_pairs
         where lesson_id = $1 and qa_category = 'lesson' order by pair_index limit 50`,
        [lesson.id],
      );

      const termSet = new Set(
        termRows.map((t) => (t.normalized || t.term).toLowerCase().trim()),
      );
      const aligned = qaRows.filter((qa) =>
        [...termSet].some(
          (t) =>
            t.length > 1 &&
            (qa.question.toLowerCase().includes(t) ||
              qa.answer?.toLowerCase().includes(t)),
        ),
      );
      const qa_alignment_rate =
        qaRows.length === 0 ? 1 : aligned.length / qaRows.length;

      if (qa_alignment_rate < 0.8) lowAlignmentLessons++;

      const isAnomaly = anomalies.some((a) => a.id === lesson.id);
      if (!isAnomaly && qa_alignment_rate >= 0.8) continue;

      const judgment = isAnomaly
        ? await judgeAnomaly({
            ...lesson,
            qa_μ: qaStats.μ,
            qa_σ: qaStats.σ,
            term_μ: termStats.μ,
            term_σ: termStats.σ,
            sample_terms: termRows.map((t) => t.term),
            sample_qas: qaRows.map((q) => q.question),
            qa_alignment_rate,
          })
        : {
            verdict: "data_error",
            reason: `Q&A-term alignment ${(qa_alignment_rate * 100).toFixed(0)}% below 80%`,
            action: "check_pdf",
          };

      results.push({
        lesson_num: lesson.lesson_num,
        book_num: lesson.book_num,
        qa_count: lesson.qa_count,
        term_count: lesson.term_count,
        qa_alignment_rate,
        ...judgment,
      });

      await new Promise((r) => setTimeout(r, 300));
    }

    const qaAnomalies = results.filter(
      (r) => Math.abs(r.qa_count - qaStats.μ) > 2 * qaStats.σ,
    );
    const termAnomalies = results.filter(
      (r) => Math.abs(r.term_count - termStats.μ) > 2 * termStats.σ,
    );

    const report = `## 👤 数据质检报告（自动执行）

**Q&A 统计：** μ=${qaStats.μ.toFixed(0)} σ=${qaStats.σ.toFixed(0)} min=${qaStats.min} max=${qaStats.max}
**词项统计：** μ=${termStats.μ.toFixed(0)} σ=${termStats.σ.toFixed(0)} min=${termStats.min} max=${termStats.max}
**Q&A 对齐率 < 80% 的课：** ${lowAlignmentLessons} 节

---

## 🎨 Q&A 异常课（共 ${qaAnomalies.length} 节）

\`\`\`
${qaAnomalies
  .map(
    (r) =>
      `L${r.lesson_num}(B${r.book_num})  Q&A=${r.qa_count}  对齐=${(r.qa_alignment_rate * 100).toFixed(0)}%  AI:${r.verdict}  → ${r.action}\n  原因：${r.reason}`,
  )
  .join("\n") || "无"}
\`\`\`

## 🎨 词项异常课（共 ${termAnomalies.length} 节）

\`\`\`
${termAnomalies
  .map(
    (r) =>
      `L${r.lesson_num}(B${r.book_num})  词项=${r.term_count}  AI:${r.verdict}  → ${r.action}\n  原因：${r.reason}`,
  )
  .join("\n") || "无"}
\`\`\`

---

**⚠️ 需要人工确认的课程：**
${
  results
    .filter((r) => r.action === "check_pdf")
    .map((r) => `- L${r.lesson_num}(B${r.book_num})：${r.reason}`)
    .join("\n") || "无"
}

> 报告由 \`scripts/audit-data-quality.ts\` 自动生成`;

    await postToIssue(report);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
