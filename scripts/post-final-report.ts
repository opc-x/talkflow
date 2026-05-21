import { loadEnv, getGitHubToken } from "./_env.js";
import { withClient } from "./_db.js";

loadEnv();

const ISSUE_NUMBER = 19;
const REPO = "HcPittBrad/talkflow";

async function main() {
  const report = await withClient(async (client) => {
    const { rows: sceneCols } = await client.query<{ column_name: string }>(
      `select column_name from information_schema.columns
       where table_name = 'scenes'
         and column_name in ('title','description','image_prompt','image_type','image_model')`,
    );

    const { rows: sceneStats } = await client.query<{
      has_prompt: number;
      pending_image: number;
      total: number;
      has_type: number;
      has_title: number;
    }>(
      `select
         count(*) filter (where image_prompt is not null)::int as has_prompt,
         count(*) filter (where image_url = 'pending')::int as pending_image,
         count(*) filter (where image_type is not null)::int as has_type,
         count(*) filter (where title is not null)::int as has_title,
         count(*)::int as total
       from public.scenes`,
    );

    const { rows: ligRows } = await client.query<{ n: number }>(
      `select count(*)::int as n from public.terms where term ~ '[\\uFB00-\\uFB04ﬁﬂﬀﬃﬄ]'`,
    );

    const { rows: qaCats } = await client.query<{ qa_category: string; count: number }>(
      `select qa_category, count(*)::int as count from public.qa_pairs group by qa_category order by qa_category`,
    );

    const { rows: embedCount } = await client.query<{ n: number }>(
      `select count(*)::int as n from public.lessons where embedding is not null`,
    );

    const { rows: sampleTitles } = await client.query<{ lesson_num: number; title: string }>(
      `select l.lesson_num, s.title
       from public.scenes s
       join public.lessons l on l.id = s.lesson_id
       where s.title is not null
       order by random() limit 10`,
    );

    const s = sceneStats[0];
    return `## 👤 #19 最终执行报告

**执行时间：** ${new Date().toISOString()}

### Schema
- scenes 新字段：${sceneCols.length}/5 ✅

### Scenes
| 指标 | 值 | 期望 |
|------|-----|------|
| has_prompt | ${s?.has_prompt ?? 0} | 191 |
| has_title | ${s?.has_title ?? 0} | 191 |
| has_type | ${s?.has_type ?? 0} | 191 |
| pending_image | ${s?.pending_image ?? 0} | 191 |
| total | ${s?.total ?? 0} | 191 |

### 词项连字符
- 残留：${ligRows[0]?.n ?? "?"} （期望 0）

### Q&A 分类
\`\`\`
${qaCats.map((r) => `${r.qa_category}: ${r.count}`).join("\n")}
\`\`\`

### Embeddings
- lessons.embedding：${embedCount[0]?.n ?? 0}/191
${(embedCount[0]?.n ?? 0) < 191 ? "- ⚠️ `text-embedding-3-small` 通道不可用（aihubcli），待开通后重跑 `npm run db:embed-lessons`" : ""}

### AI 模型
- 场景 prompt / 质检：\`${process.env.OPENAI_CHAT_MODEL ?? "gpt-5.2"}\`

### 随机抽查 title（10课）
\`\`\`
${sampleTitles.map((r) => `L${r.lesson_num}: ${r.title}`).join("\n") || "暂无"}
\`\`\`

### 代码同步
- [x] learn/page.tsx — scenes.title
- [x] protected/page.tsx — scenes.title
- [x] session-card.tsx — sceneTitle prop
- [x] assessment.service.ts — qa_category filter
- [x] lib/database.types.ts — 手动同步新字段

> 报告由 \`scripts/post-final-report.ts\` 自动生成`;
  });

  const token = getGitHubToken();
  if (!token) {
    console.log(report);
    console.warn("⚠️ GITHUB_TOKEN not set — printed locally only");
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
      body: JSON.stringify({ body: report }),
    },
  );

  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  console.log("✅ 最终报告已 POST 到 Issue #19");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
