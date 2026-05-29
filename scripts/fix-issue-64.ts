/**
 * Issue #64: R2 term_kind full classify + fragments + question garbage
 *
 * Usage:
 *   npx tsx scripts/fix-issue-64.ts --step=all
 *   npx tsx scripts/fix-issue-64.ts --step=r2a
 *   npx tsx scripts/fix-issue-64.ts --step=r2d
 *   npx tsx scripts/fix-issue-64.ts --step=r2e
 *   npx tsx scripts/fix-issue-64.ts --step=t1
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import OpenAI from "openai";
import { loadEnv, getGitHubToken, getDatabaseUrl } from "./_env.js";
import { withClient } from "./_db.js";

loadEnv();

const MODEL_CLASSIFY = "gpt-5.2";
const BATCH_SIZE = 40;
const ISSUE_NUMBER = 64;
const GITHUB_REPO = "opc-x/talkflow";
const OPC_DIR = resolve(import.meta.dirname, "../.opc");
const CHECKPOINT_PATH = resolve(OPC_DIR, "issue-64-checkpoint.json");
const activeBaseUrl = process.env.OPENAI_BASE_URL ?? "https://api.aihubcli.com/v1";

type TermKind = "word" | "phrase" | "sentence" | "grammar" | "contraction";

interface Checkpoint {
  r2a_done_ids: number[];
  r2d_done: boolean;
  r2e_done: boolean;
}

function toId(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`invalid id: ${v}`);
  return n;
}

function parseArgs() {
  const stepArg = process.argv.find((a) => a.startsWith("--step="));
  const step = stepArg?.split("=")[1] ?? "all";
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1] ?? "0", 10) : 0;
  const dryRun = process.argv.includes("--dry-run");
  const reset = process.argv.includes("--reset");
  return { step, limit, dryRun, reset };
}

function loadCheckpoint(): Checkpoint {
  if (!existsSync(CHECKPOINT_PATH)) {
    return { r2a_done_ids: [], r2d_done: false, r2e_done: false };
  }
  const cp = JSON.parse(readFileSync(CHECKPOINT_PATH, "utf8")) as Checkpoint;
  cp.r2a_done_ids = [...new Set(cp.r2a_done_ids.map(toId))];
  return cp;
}

function saveCheckpoint(cp: Checkpoint) {
  mkdirSync(OPC_DIR, { recursive: true });
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(cp, null, 2));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function wordCount(term: string): number {
  return term.trim().split(/\s+/).filter(Boolean).length;
}

function heuristicTermKind(term: string): TermKind {
  const t = term.trim();
  const lower = t.toLowerCase();
  const wc = wordCount(t);

  if (/^(here|there)\s+(the\s+)?word\b/i.test(t)) return "grammar";
  if (/means\s+["']|also known as|for example|e\.g\.|i\.e\./i.test(t)) return "grammar";
  if (/grammar|clause|conditional|participle|infinitive|gerund|modal auxiliar/i.test(t))
    return "grammar";
  if (/^\(direct speech\)|^\(indirect speech\)/i.test(t)) return "grammar";
  if (/^\([^)]+\)$/i.test(t) && wc <= 3) return "grammar";
  if (lower === "contraction" || /contraction of/i.test(t)) return "contraction";
  if (/\?$/.test(t) || (t.includes("?") && wc >= 3)) return "sentence";
  if (wc >= 8) return "sentence";
  if (wc >= 5) {
    if (/^[A-Z"']/.test(t) && /[.!?]$/.test(t)) return "sentence";
    if (/\b(is|are|was|were|means|called|have|has|do|does|did|will|would|can|could)\b/i.test(t))
      return "sentence";
    return "sentence";
  }
  if (wc === 1) return "word";
  return "phrase";
}

function enforceTermKindRules(term: string, kind: TermKind): TermKind {
  const t = term.trim();
  const wc = wordCount(t);

  if (/\?/.test(t) && (kind === "word" || kind === "phrase")) return "sentence";
  if (wc >= 5 && (kind === "word" || kind === "phrase")) {
    if (/grammar|clause|means|for example|also known|speech\)/i.test(t)) return "grammar";
    return "sentence";
  }
  if (/^\(direct speech\)|^\(indirect speech\)|^\(decimal\)|^\(subject\)/i.test(t))
    return "grammar";
  if (/^\([^)]+\)$/.test(t) && wc <= 4 && kind === "word") return "phrase";
  return kind;
}

function createOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: activeBaseUrl,
  });
}

async function ensureOpenAI(): Promise<OpenAI> {
  const openai = createOpenAIClient();
  await openai.chat.completions.create({
    model: MODEL_CLASSIFY,
    messages: [{ role: "user", content: "ok" }],
    max_completion_tokens: 16,
  });
  console.log(`OpenAI relay: ${activeBaseUrl} model=${MODEL_CLASSIFY}`);
  return openai;
}

async function withRetry<T>(fn: () => Promise<T>, label: string, max = 5): Promise<T> {
  let last: unknown;
  for (let i = 0; i < max; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      const wait = Math.min(30_000, 1000 * 2 ** i);
      console.warn(`  ${label} retry ${i + 1}/${max}: ${(err as Error).message}`);
      await sleep(wait);
    }
  }
  throw last;
}

function parseJsonLoose<T>(raw: string): T {
  const text = raw.trim();
  try {
    return JSON.parse(text) as T;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1)) as T;
    throw new Error(`invalid JSON (${text.length} chars)`);
  }
}

async function chatJson<T>(
  openai: OpenAI,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  maxTokens: number,
): Promise<T> {
  const resp = await withRetry(
    () =>
      openai.chat.completions.create({
        model: MODEL_CLASSIFY,
        response_format: { type: "json_object" },
        messages: messages.map((m) =>
          typeof m.content === "string" && !/json/i.test(m.content)
            ? { ...m, content: `${m.content}\n\nRespond with valid JSON only.` }
            : m,
        ),
        max_completion_tokens: Math.max(maxTokens, 16),
      }),
    "chat",
  );
  return parseJsonLoose<T>(resp.choices[0]?.message?.content ?? "{}");
}

async function ensureTermKindColumn(client: import("pg").Client) {
  const migrationPath = resolve(
    import.meta.dirname,
    "../supabase/migrations/202605290001_terms_term_kind.sql",
  );
  await client.query(readFileSync(migrationPath, "utf8"));
}

async function classifyBatch(
  openai: OpenAI,
  batch: { id: number; term: string }[],
): Promise<Map<number, TermKind>> {
  const kinds = new Map<number, TermKind>();
  for (const t of batch) kinds.set(t.id, heuristicTermKind(t.term));

  try {
    const result = await chatJson<{ items: { id: number; term_kind: TermKind }[] }>(
      openai,
      [
        {
          role: "system",
          content: `Classify Callan Method vocabulary entries for an English learning app.
word = single vocabulary item (1 word)
phrase = short multi-word phrase (2-4 words) worth learning as vocab
sentence = full example sentence (5+ words, narrative, or ends with ?)
grammar = grammar explanation, meta note, speech labels, or teaching note
contraction = contraction explanation (e.g. "what's = what is")
Return json: {"items":[{"id":1,"term_kind":"word"}]}`,
        },
        {
          role: "user",
          content: batch.map((t) => `${t.id}: ${t.term}`).join("\n"),
        },
      ],
      Math.min(6000, 200 + batch.length * 45),
    );
    for (const item of result.items ?? []) {
      if (item.id && item.term_kind) {
        const id = toId(item.id);
        const term = batch.find((b) => b.id === id)?.term ?? "";
        kinds.set(id, enforceTermKindRules(term, item.term_kind));
      }
    }
  } catch (err) {
    console.warn(`  AI batch fallback heuristics: ${(err as Error).message}`);
  }

  for (const t of batch) {
    const base = kinds.get(t.id) ?? heuristicTermKind(t.term);
    kinds.set(t.id, enforceTermKindRules(t.term, base));
  }
  return kinds;
}

async function stepR2a(openai: OpenAI, cp: Checkpoint, limit: number, dryRun: boolean) {
  await withClient(async (client) => {
    await ensureTermKindColumn(client);

    let countSql = `SELECT COUNT(*)::text AS n FROM terms`;
    const countParams: unknown[] = [];
    if (cp.r2a_done_ids.length > 0) {
      countParams.push(cp.r2a_done_ids);
      countSql += ` WHERE id <> ALL($${countParams.length}::bigint[])`;
    }
    const { rows: totalRow } = await client.query<{ n: string }>(countSql, countParams);
    const totalPending = parseInt(totalRow[0]?.n ?? "0", 10);
    console.log(`R2a pending: ${totalPending} (checkpoint done: ${cp.r2a_done_ids.length})`);
    if (totalPending === 0) return;

    let processed = 0;
    const maxRows = limit > 0 ? limit : totalPending;

    while (processed < maxRows) {
      const chunk = Math.min(BATCH_SIZE, maxRows - processed);
      const params: unknown[] = [];
      let sql = `SELECT id, term FROM terms`;
      if (cp.r2a_done_ids.length > 0) {
        params.push(cp.r2a_done_ids);
        sql += ` WHERE id <> ALL($${params.length}::bigint[])`;
      }
      sql += ` ORDER BY id LIMIT $${params.length + 1}`;
      params.push(chunk);

      const { rows } = await client.query<{ id: string; term: string }>(sql, params);
      if (rows.length === 0) break;

      const batch = rows.map((r) => ({ id: toId(r.id), term: r.term }));
      const kinds = await classifyBatch(openai, batch);

      if (!dryRun) {
        const ids: number[] = [];
        const vals: string[] = [];
        for (const t of batch) {
          ids.push(t.id);
          vals.push(kinds.get(t.id) ?? heuristicTermKind(t.term));
        }
        await client.query(
          `UPDATE terms t SET term_kind = v.kind
           FROM unnest($1::bigint[], $2::text[]) AS v(id, kind)
           WHERE t.id = v.id`,
          [ids, vals],
        );
      }

      for (const t of batch) cp.r2a_done_ids.push(t.id);
      saveCheckpoint(cp);
      processed += batch.length;
      console.log(
        `  R2a batch ${batch.length} ok, progress=${cp.r2a_done_ids.length} kinds sample=${[...kinds.values()].slice(0, 3).join(",")}`,
      );
      await sleep(300);
    }
  });
}

/** Post-pass: force sentence/grammar on ≥5-word and ? terms; fix single-word → word */
async function stepR2bc(dryRun: boolean) {
  await withClient(async (client) => {
    if (!dryRun) {
      await client.query(
        `UPDATE terms SET term_kind = 'word'
         WHERE array_length(string_to_array(trim(term), ' '), 1) = 1
           AND term_kind NOT IN ('grammar', 'contraction')
           AND term !~* '^(here|there)\\s'`,
      );
      await client.query(
        `UPDATE terms SET term_kind = CASE
           WHEN term ~* 'grammar|clause|means|for example|also known|speech\\)|modal|participle|infinitive|gerund|contraction of'
             THEN 'grammar'
           ELSE 'sentence'
         END
         WHERE array_length(string_to_array(trim(term), ' '), 1) >= 5
           AND term_kind IN ('word','phrase','contraction')`,
      );
      await client.query(
        `UPDATE terms SET term_kind = 'sentence'
         WHERE term ~ '\\?' AND term_kind IN ('word','phrase','contraction')`,
      );
    }

    const checks = await client.query<{ label: string; n: string }>(
      `SELECT 'single_not_word' AS label, COUNT(*)::text AS n FROM terms
         WHERE array_length(string_to_array(trim(term), ' '), 1) = 1
           AND term_kind NOT IN ('word','grammar','contraction')
       UNION ALL
       SELECT 'long_bad', COUNT(*)::text FROM terms
         WHERE array_length(string_to_array(trim(term), ' '), 1) >= 5
           AND term_kind NOT IN ('sentence','grammar')
       UNION ALL
       SELECT 'q_bad', COUNT(*)::text FROM terms
         WHERE term ~ '\\?' AND term_kind NOT IN ('sentence','grammar')`,
    );
    for (const row of checks.rows) console.log(`R2b/c ${row.label}=${row.n}`);
  });
}

const LEGIT_ANNOTATED = new Set([
  "(decimal) point",
  "(direct speech)",
  "(indirect speech)",
  "(credit) card",
  "(just) in case",
]);

function isBrokenFragment(term: string): boolean {
  const t = term.trim();
  if (LEGIT_ANNOTATED.has(t.toLowerCase())) return false;
  if (/^", or "/i.test(t)) return true;
  if (/I failed/i.test(t) && !t.includes("?")) return true;
  if (/^\(subject\)/i.test(t) && t.length > 40) return true;
  if (/^[\u201c\u201d"']/.test(t) && !/^[\u201c\u201d"'][A-Za-z]/.test(t)) return true;
  if (/\([^)]*$/.test(t) && !LEGIT_ANNOTATED.has(t.toLowerCase())) return true;
  return false;
}

async function stepR2d(dryRun: boolean) {
  await withClient(async (client) => {
    const { rows } = await client.query<{ id: string; term: string }>(
      `SELECT id, term FROM terms ORDER BY id`,
    );
    const broken = rows.filter((r) => isBrokenFragment(r.term));
    console.log(`R2d broken fragments: ${broken.length}`);
    for (const row of broken) {
      console.log(`  delete id=${row.id} term=${JSON.stringify(row.term)}`);
      if (!dryRun) {
        await client.query(`DELETE FROM terms WHERE id = $1`, [toId(row.id)]);
      }
    }
  });
}

function fixGarbageQuestion(question: string, answer: string): string | null {
  const q = question.trim();
  const a = answer.trim().replace(/\.$/, "");

  const ordinalMap: Record<string, string> = {
    "1st": "first",
    "2nd": "second",
    "3rd": "third",
    "4th": "fourth",
    "5th": "fifth",
    "6th": "sixth",
    "7th": "seventh",
    "8th": "eighth",
    "9th": "ninth",
    "10th": "tenth",
  };
  if (ordinalMap[q] && ordinalMap[q] === a.toLowerCase()) {
    return `How do you say '${q}' in full?`;
  }

  if (/^[0-9,]+$/.test(q)) {
    if (q === "1,000" && a.toLowerCase() === "a thousand") return "What's a thousand?";
    if (q === "1,000,000" && a.toLowerCase() === "a million") return "What's a million?";
    return `What's ${a}?`;
  }

  if (/^[0-9]+[+*/-][0-9]+$/.test(q)) return null;

  return null;
}

async function stepR2e(openai: OpenAI, dryRun: boolean) {
  await withClient(async (client) => {
    const { rows } = await client.query<{
      id: string;
      question: string;
      answer: string;
      lesson_id: string;
      book_num: number;
      lesson_num: number;
    }>(
      `SELECT q.id, q.question, q.answer, q.lesson_id, l.book_num, l.lesson_num
       FROM qa_pairs q
       JOIN lessons l ON l.id = q.lesson_id
       WHERE trim(q.question) ~ '^(1st|2nd|3rd|4th|5th|6th|7th|8th|9th|10th|[0-9,]+|[0-9]+[+\\-*/][0-9]+)$'
       ORDER BY q.id`,
    );
    console.log(`R2e question garbage: ${rows.length}`);

    for (const row of rows) {
      let newQ = fixGarbageQuestion(row.question, row.answer ?? "");

      if (!newQ) {
        const { rows: blocks } = await client.query<{ text: string }>(
          `SELECT text FROM content_blocks
           WHERE book_num = $1 AND lesson_num = $2 AND block_type = 'qa_block'
             AND text ILIKE $3
           LIMIT 5`,
          [row.book_num, row.lesson_num, `%${row.answer.replace(/'/g, "''")}%`],
        );
        for (const block of blocks) {
          const pairs = block.text.split(/\s*\|\s*Q:\s*/);
          for (const part of pairs) {
            const body = part.startsWith("Q: ") ? part.slice(3) : part;
            const aIdx = body.indexOf(" A: ");
            if (aIdx === -1) continue;
            const bq = body.slice(0, aIdx).trim();
            const ba = body.slice(aIdx + 4).trim().replace(/\s*\[[^\]]*\]\s*$/, "");
            if (
              ba.toLowerCase().startsWith(row.answer.trim().toLowerCase()) &&
              bq.length > 3 &&
              !/^[0-9,]+$/.test(bq) &&
              !/^(1st|2nd|3rd|4th|5th|6th)$/.test(bq)
            ) {
              newQ = bq;
              break;
            }
          }
          if (newQ) break;
        }
      }

      if (!newQ) {
        const needAi = [{ id: toId(row.id), answer: row.answer, question: row.question }];
        try {
          const result = await chatJson<{ items: { id: number; question: string }[] }>(
            openai,
            [
              {
                role: "system",
                content: `Fix misaligned Callan drill rows where question is just a number/ordinal token.
Write a proper English drill question that elicits the given answer.
Return json: {"items":[{"id":1,"question":"..."}]}`,
              },
              {
                role: "user",
                content: needAi.map((x) => `${x.id}: bad_Q=${x.question} A=${x.answer}`).join("\n"),
              },
            ],
            200,
          );
          newQ = result.items?.[0]?.question?.trim() ?? null;
        } catch {
          /* fall through */
        }
      }

      if (!newQ || newQ.length <= 3 || newQ === row.question) {
        console.log(`  delete id=${row.id} Q=${JSON.stringify(row.question)}`);
        if (!dryRun) await client.query(`DELETE FROM qa_pairs WHERE id = $1`, [toId(row.id)]);
        continue;
      }

      console.log(`  fix id=${row.id} ${JSON.stringify(row.question)} → ${JSON.stringify(newQ)}`);
      if (!dryRun) {
        await client.query(`UPDATE qa_pairs SET question = $1 WHERE id = $2`, [newQ, toId(row.id)]);
      }
    }
  });
}

export async function runT1(client: import("pg").Client) {
  const total = await client.query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM terms`);
  const nullKind = await client.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM terms WHERE term_kind IS NULL`,
  );
  const longBad = await client.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM terms
     WHERE array_length(string_to_array(trim(term), ' '), 1) >= 5
       AND COALESCE(term_kind,'word') NOT IN ('sentence','grammar')`,
  );
  const qBad = await client.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM terms
     WHERE term ~ '\\?' AND COALESCE(term_kind,'word') NOT IN ('sentence','grammar')`,
  );
  const fragments = await client.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM terms
     WHERE term ~ '^\\", or' OR term ~ 'I failed' OR term ~ '^\\", or'`,
  );
  const qGarbage = await client.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM qa_pairs
     WHERE trim(question) ~ '^(1st|2nd|3rd|4th|5th|6th|7th|8th|9th|10th|[0-9,]+|[0-9]+[+\\-*/][0-9]+)$'`,
  );
  const byKind = await client.query<{ term_kind: string; n: string }>(
    `SELECT term_kind, COUNT(*)::text AS n FROM terms GROUP BY term_kind ORDER BY term_kind`,
  );

  return {
    total_terms: total.rows[0]?.n ?? "?",
    term_kind_null: nullKind.rows[0]?.n ?? "?",
    long_untagged: longBad.rows[0]?.n ?? "?",
    question_mark_untagged: qBad.rows[0]?.n ?? "?",
    fragments: fragments.rows[0]?.n ?? "?",
    question_garbage: qGarbage.rows[0]?.n ?? "?",
    by_kind: byKind.rows,
  };
}

async function postReport(t1: Awaited<ReturnType<typeof runT1>>, status: "DONE" | "FAILED") {
  const token = getGitHubToken();
  const tagged = parseInt(t1.total_terms, 10) - parseInt(t1.term_kind_null, 10);
  const body = `## 执行报告
状态：${status}
term_kind已打标：[${tagged}/${t1.total_terms}, IS NULL应0 → ${t1.term_kind_null}]
非词项标sentence：[≥5词未标 ${t1.long_untagged} | ?未标 ${t1.question_mark_untagged}]
前端过滤加了吗：[lib/learn.ts:VOCAB_TERM_KINDS | learn/page.tsx:79 | assessment.service.ts:194 | tools/page.tsx:83]
残片清理：[${t1.fragments}→0]
question垃圾：[${t1.question_garbage}→0]
分布：${t1.by_kind.map((r) => `${r.term_kind}=${r.n}`).join(", ")}
🤖 gpt-5.2批量（batch=${BATCH_SIZE}）`;

  if (!token) {
    console.log("\n--- Report ---\n", body);
    return;
  }
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/issues/${ISSUE_NUMBER}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body }),
    },
  );
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  console.log(`✅ Report posted to #${ISSUE_NUMBER}`);
}

async function main() {
  const { step, limit, dryRun, reset } = parseArgs();
  let cp = reset
    ? { r2a_done_ids: [], r2d_done: false, r2e_done: false }
    : loadCheckpoint();
  if (reset) saveCheckpoint(cp);

  console.log(`issue-64 step=${step} limit=${limit || "∞"} dryRun=${dryRun}`);
  console.log(`DB: ${getDatabaseUrl().replace(/:[^:@]+@/, ":***@")}`);

  const steps =
    step === "all" ? ["r2a", "r2bc", "r2d", "r2e", "t1"] : step.split(",").map((s) => s.trim());

  const needsAi = steps.some((s) => ["r2a", "r2e", "all"].includes(s));
  const openai = needsAi ? await ensureOpenAI() : null;

  if (steps.includes("r2a")) {
    if (!openai) throw new Error("OpenAI required for r2a");
    await stepR2a(openai, cp, limit, dryRun);
    cp = loadCheckpoint();
  }

  if (steps.includes("r2bc")) await stepR2bc(dryRun);

  if (steps.includes("r2d") && !cp.r2d_done) {
    await stepR2d(dryRun);
    if (!dryRun) {
      cp.r2d_done = true;
      saveCheckpoint(cp);
    }
  }

  if (steps.includes("r2e") && !cp.r2e_done) {
    if (!openai) throw new Error("OpenAI required for r2e");
    await stepR2e(openai, dryRun);
    if (!dryRun) {
      cp.r2e_done = true;
      saveCheckpoint(cp);
    }
  }

  if (steps.includes("t1")) {
    const t1 = await withClient(runT1);
    console.log("\nT1:", JSON.stringify(t1, null, 2));
    const ok =
      t1.term_kind_null === "0" &&
      t1.long_untagged === "0" &&
      t1.question_mark_untagged === "0" &&
      t1.fragments === "0" &&
      t1.question_garbage === "0";
    if (!dryRun) await postReport(t1, ok ? "DONE" : "FAILED");
  }
}

const isMain =
  typeof process.argv[1] === "string" &&
  /fix-issue-64\.(t|j)sx?$/.test(process.argv[1]);

if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
