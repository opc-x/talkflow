/**
 * Issue #62: R1 Q/A field swap + R2 term_kind + R3 dedupe
 *
 * Usage:
 *   npx tsx scripts/fix-issue-62.ts --step=all
 *   npx tsx scripts/fix-issue-62.ts --step=r1 --limit=50
 *   npx tsx scripts/fix-issue-62.ts --step=r2
 *   npx tsx scripts/fix-issue-62.ts --step=r3
 *   npx tsx scripts/fix-issue-62.ts --step=t1
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";
import OpenAI from "openai";
import { loadEnv, getGitHubToken, getDatabaseUrl } from "./_env.js";
import { withClient } from "./_db.js";

loadEnv();

const MODEL = "gpt-5.4";
const MODEL_CLASSIFY = "gpt-5.2";
const BATCH_SIZE = 40;
const ISSUE_NUMBER = 62;
const GITHUB_REPO = "opc-x/talkflow";
const OPC_DIR = resolve(import.meta.dirname, "../.opc");
const CHECKPOINT_PATH = resolve(OPC_DIR, "issue-62-checkpoint.json");
const BACKUP_PATH = resolve(OPC_DIR, "issue-62-backup-r1.jsonl");

const activeBaseUrl = process.env.OPENAI_BASE_URL ?? "https://api.aihubcli.com/v1";

type TermKind = "word" | "phrase" | "sentence" | "grammar" | "contraction";

interface Checkpoint {
  r1_done_ids: number[];
  r1_a_done: number;
  r1_b_done: number;
  r2_done: boolean;
  r3_done: boolean;
}

interface QaMisaligned {
  id: number;
  lesson_id: number;
  question: string;
  answer: string;
}

type QaType = "drill" | "open";

interface R1Update {
  question: string;
  answer: string;
  kind: "A" | "B";
  qa_type: QaType;
}

/** pg returns bigint ids as string — normalize for Map keys */
function toId(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`invalid id: ${v}`);
  return n;
}

const QUALITY_GATES = `Picture-talk app quality (ALL generated Q/A must pass):
1) Grammatical standard English Q or statement A
2) Anchor to drawable lesson scene (people/objects/actions the image can show)
3) Clear referents for it/this/that (name the thing when several objects exist)
4) Single definite answer (except true open opinion items)
5) Keep Callan open drills (Do you think...?) as qa_type "open"; routine drills as "drill"`;

function isOpenQuestion(q: string): boolean {
  return /^(do you think|what do you think|would you say|in your opinion)/i.test(q.trim());
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
    return { r1_done_ids: [], r1_a_done: 0, r1_b_done: 0, r2_done: false, r3_done: false };
  }
  const cp = JSON.parse(readFileSync(CHECKPOINT_PATH, "utf8")) as Checkpoint;
  cp.r1_a_done ??= 0;
  cp.r1_b_done ??= 0;
  cp.r1_done_ids = [...new Set(cp.r1_done_ids.map((id) => toId(id)))];
  return cp;
}

/** Drop checkpoint ids that still need R1 (bad prior run) */
async function reconcileCheckpoint(cp: Checkpoint): Promise<void> {
  if (cp.r1_done_ids.length === 0) return;
  await withClient(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `SELECT id::text FROM qa_pairs
       WHERE id = ANY($1::bigint[])
         AND length(trim(question)) <= 3 AND trim(question) ~ '^[0-9]+$'`,
      [cp.r1_done_ids],
    );
    const stillBroken = new Set(rows.map((r) => toId(r.id)));
    if (stillBroken.size === 0) return;
    const before = cp.r1_done_ids.length;
    cp.r1_done_ids = cp.r1_done_ids.filter((id) => !stillBroken.has(id));
    saveCheckpoint(cp);
    console.log(`checkpoint: dropped ${before - cp.r1_done_ids.length} ids still numeric-Q`);
  });
}

function saveCheckpoint(cp: Checkpoint) {
  mkdirSync(OPC_DIR, { recursive: true });
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(cp, null, 2));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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
    model: MODEL,
    messages: [{ role: "user", content: "ok" }],
    max_completion_tokens: 16,
  });
  console.log(`OpenAI relay: ${activeBaseUrl} model=${MODEL}`);
  return openai;
}

/** A: answer ends with ? (问句在 answer，需搬 question + AI 补答案) */
export function isClassA(answer: string): boolean {
  return answer.trim().endsWith("?");
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

function withJsonHint(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return messages.map((m) => {
    if (typeof m.content !== "string" || /json/i.test(m.content)) return m;
    return { ...m, content: `${m.content}\n\nRespond with valid JSON only.` };
  });
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
  model: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  maxTokens: number,
): Promise<T> {
  const resp = await withRetry(
    () =>
      openai.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        messages: withJsonHint(messages),
        max_completion_tokens: Math.max(maxTokens, 16),
      }),
    "chat",
  );
  const content = resp.choices[0]?.message?.content ?? "{}";
  return parseJsonLoose<T>(content);
}

/** R1 target: numeric index in question field */
export function isR1Candidate(question: string): boolean {
  const q = question.trim();
  return q.length <= 3 && /^[0-9]+$/.test(q);
}

export function answerLooksLikeQuestion(answer: string): boolean {
  const a = answer.trim();
  if (!a) return true;
  if (a.endsWith("?")) return true;
  return /^(what|is |are |do |does |did |can |could |will |would |shall |should |how |why |where |when |who |which |if |we call|it is true|tell me|give me|name |describe |explain )/i.test(
    a,
  );
}

const NUMBER_WORD =
  /^(a\s+)?(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)\.?$/i;

function countingDrillQuestion(_num: string, answer: string): string | null {
  const a = answer.trim().replace(/\.$/, "");
  const m = a.match(NUMBER_WORD);
  if (!m) return null;
  const word = m[2] ?? m[1];
  if (!word) return null;
  if (word === "hundred" && a.toLowerCase().startsWith("a ")) {
    return "What's a hundred?";
  }
  return `What's ${word.toLowerCase()}?`;
}

async function ensureTermKindColumn(client: import("pg").Client) {
  const migrationPath = resolve(
    import.meta.dirname,
    "../supabase/migrations/202605290001_terms_term_kind.sql",
  );
  await client.query(readFileSync(migrationPath, "utf8"));
}

function heuristicTermKind(term: string): TermKind {
  const t = term.trim();
  const lower = t.toLowerCase();
  const wc = t.split(/\s+/).filter(Boolean).length;

  if (/^(here|there)\s+(the\s+)?word\b/i.test(t)) return "grammar";
  if (/means\s+["']|also known as|for example|e\.g\.|i\.e\./i.test(t)) return "grammar";
  if (/grammar|clause|conditional|participle|infinitive|gerund|modal auxiliar/i.test(t))
    return "grammar";
  if (/^\(direct speech\)|^\(indirect speech\)/i.test(t)) return "grammar";
  if (lower === "contraction" || /contraction of/i.test(t)) return "contraction";
  if (wc >= 8) return "sentence";
  if (wc >= 5) {
    if (/^[A-Z]/.test(t) && /[.!?]$/.test(t)) return "sentence";
    if (/\b(is|are|was|were|means|called)\b/i.test(t)) return "grammar";
    return "sentence";
  }
  if (wc === 1) return "word";
  return "phrase";
}

async function fetchR1Pending(
  client: import("pg").Client,
  doneIds: number[],
  limit: number,
): Promise<QaMisaligned[]> {
  const params: unknown[] = [];
  let sql = `
    SELECT id, lesson_id, question, COALESCE(answer, '') AS answer
    FROM qa_pairs
    WHERE length(trim(question)) <= 3 AND trim(question) ~ '^[0-9]+$'`;
  if (doneIds.length > 0) {
    params.push(doneIds);
    sql += ` AND id <> ALL($${params.length}::bigint[])`;
  }
  sql += ` ORDER BY lesson_id, id`;
  if (limit > 0) {
    params.push(limit);
    sql += ` LIMIT $${params.length}`;
  }
  const { rows } = await client.query(sql, params);
  return rows.map((r: QaMisaligned) => ({
    ...r,
    id: toId(r.id),
    lesson_id: toId(r.lesson_id),
  }));
}

async function fetchSceneHints(
  client: import("pg").Client,
  lessonIds: number[],
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (lessonIds.length === 0) return map;
  const { rows } = await client.query<{
    lesson_id: string;
    title: string | null;
    description: string | null;
    image_prompt: string | null;
  }>(
    `SELECT lesson_id, title, description, image_prompt FROM scenes
     WHERE lesson_id = ANY($1::bigint[])`,
    [lessonIds],
  );
  for (const r of rows) {
    const lid = toId(r.lesson_id);
    const hint = [r.title, r.description, r.image_prompt]
      .filter(Boolean)
      .join(" — ")
      .slice(0, 400);
    if (hint) map.set(lid, hint);
  }
  return map;
}

function backupRow(row: QaMisaligned) {
  mkdirSync(OPC_DIR, { recursive: true });
  appendFileSync(BACKUP_PATH, `${JSON.stringify(row)}\n`);
}

export async function generateAnswers(
  openai: OpenAI,
  items: { id: number; question: string; scene?: string }[],
): Promise<Map<number, { answer: string; qa_type: QaType }>> {
  const result = await chatJson<{
    items: { id: number; answer: string; qa_type?: QaType }[];
  }>(
    openai,
    MODEL,
    [
      {
        role: "system",
        content: `You write Callan Method drill answers for a picture-talk English app.
Short, natural, contractions OK. Never repeat the question. Never end with "?".
${QUALITY_GATES}
Return json: {"items":[{"id":1,"answer":"...","qa_type":"drill"}]}`,
      },
      {
        role: "user",
        content: items
          .map((r) => {
            const scene = r.scene ? ` | scene: ${r.scene}` : "";
            return `${r.id}${scene}: Q=${r.question}`;
          })
          .join("\n"),
      },
    ],
    Math.min(8000, 400 + items.length * 80),
  );
  const map = new Map<number, { answer: string; qa_type: QaType }>();
  for (const item of result.items ?? []) {
    const id = toId(item.id);
    const ans = item.answer?.trim();
    if (!ans || ans.endsWith("?")) continue;
    const qa_type: QaType =
      item.qa_type === "open" || isOpenQuestion(items.find((x) => x.id === id)?.question ?? "")
        ? "open"
        : "drill";
    map.set(id, { answer: ans, qa_type });
  }
  return map;
}

export async function inferQuestions(
  openai: OpenAI,
  items: { id: number; answer: string; scene?: string }[],
): Promise<Map<number, { question: string; qa_type: QaType }>> {
  const result = await chatJson<{
    items: { id: number; question: string; qa_type?: QaType }[];
  }>(
    openai,
    MODEL,
    [
      {
        role: "system",
        content: `Given Callan Method drill answers, write the drill question that elicits each answer.
Use Callan patterns: What's...? / Is...? / Where's...? / How many...?
${QUALITY_GATES}
Return json: {"items":[{"id":1,"question":"...","qa_type":"drill"}]}`,
      },
      {
        role: "user",
        content: items
          .map((r) => {
            const scene = r.scene ? ` | scene: ${r.scene}` : "";
            return `${r.id}${scene}: A=${r.answer}`;
          })
          .join("\n"),
      },
    ],
    Math.min(8000, 400 + items.length * 90),
  );
  const map = new Map<number, { question: string; qa_type: QaType }>();
  for (const item of result.items ?? []) {
    const id = toId(item.id);
    const q = item.question?.trim();
    if (!q || q.length <= 3) continue;
    const qa_type: QaType =
      item.qa_type === "open" || isOpenQuestion(q) ? "open" : "drill";
    map.set(id, { question: q, qa_type });
  }
  return map;
}

async function stepR1(
  openai: OpenAI,
  cp: Checkpoint,
  limit: number,
  dryRun: boolean,
) {
  await withClient(async (client) => {
    let countSql = `SELECT COUNT(*)::text AS n FROM qa_pairs
       WHERE length(trim(question)) <= 3 AND trim(question) ~ '^[0-9]+$'`;
    const countParams: unknown[] = [];
    if (cp.r1_done_ids.length > 0) {
      countParams.push(cp.r1_done_ids);
      countSql += ` AND id <> ALL($${countParams.length}::bigint[])`;
    }
    const { rows: totalRow } = await client.query<{ n: string }>(countSql, countParams);
    const totalPending = parseInt(totalRow[0]?.n ?? "0", 10);
    console.log(`R1 remaining: ${totalPending} (checkpoint done: ${cp.r1_done_ids.length})`);
    if (totalPending === 0) return;

    let processed = 0;
    const maxRows = limit > 0 ? limit : totalPending;

    while (processed < maxRows) {
      const chunk = Math.min(BATCH_SIZE, maxRows - processed);
      const batch = await fetchR1Pending(client, cp.r1_done_ids, chunk);
      if (batch.length === 0) break;
      const lessonIds = [...new Set(batch.map((r) => r.lesson_id))];
      const scenes = await fetchSceneHints(client, lessonIds);
      const sceneOf = (lessonId: number) => scenes.get(lessonId);

      const classA: QaMisaligned[] = [];
      const classB: QaMisaligned[] = [];
      const counting: QaMisaligned[] = [];

      for (const row of batch) {
        const countQ = countingDrillQuestion(row.question.trim(), row.answer);
        if (countQ) {
          counting.push({ ...row, question: countQ });
        } else if (isClassA(row.answer)) {
          classA.push(row);
        } else {
          classB.push(row);
        }
      }

      const updates = new Map<number, R1Update>();

      for (const row of classA) {
        updates.set(row.id, {
          question: row.answer.trim(),
          answer: "",
          kind: "A",
          qa_type: isOpenQuestion(row.answer) ? "open" : "drill",
        });
      }

      for (const row of counting) {
        updates.set(row.id, {
          question: row.question,
          answer: row.answer,
          kind: "B",
          qa_type: "drill",
        });
      }

      const classBInfer = classB.filter((r) => !counting.some((c) => c.id === r.id));
      if (classBInfer.length > 0) {
        try {
          const qMap = await inferQuestions(
            openai,
            classBInfer.map((r) => ({
              id: r.id,
              answer: r.answer,
              scene: sceneOf(r.lesson_id),
            })),
          );
          for (const row of classBInfer) {
            const hit = qMap.get(row.id);
            if (hit) {
              updates.set(row.id, {
                question: hit.question,
                answer: row.answer,
                kind: "B",
                qa_type: hit.qa_type,
              });
            }
          }
        } catch (err) {
          console.warn(`  inferQuestions batch failed: ${(err as Error).message}`);
        }
      }

      const needAnswers = [...updates.entries()]
        .filter(([, v]) => v.kind === "A" && !v.answer.trim())
        .map(([id, v]) => ({
          id,
          question: v.question,
          scene: sceneOf(batch.find((r) => r.id === id)?.lesson_id ?? 0),
        }));

      if (needAnswers.length > 0) {
        try {
          const aMap = await generateAnswers(openai, needAnswers);
          for (const { id, question } of needAnswers) {
            const hit = aMap.get(id);
            if (hit) {
              updates.set(id, {
                question,
                answer: hit.answer,
                kind: "A",
                qa_type: hit.qa_type,
              });
            } else console.warn(`  missing AI answer id=${id}`);
          }
        } catch (err) {
          console.warn(`  generateAnswers batch failed: ${(err as Error).message}`);
        }
      }

      let batchOk = 0;
      for (const row of batch) {
        const upd = updates.get(row.id);
        if (!upd?.question || upd.question.length <= 3) {
          console.warn(`  skip id=${row.id} — no valid question`);
          continue;
        }
        if (!upd.answer?.trim() || upd.answer.trim().endsWith("?")) {
          console.warn(`  skip id=${row.id} — bad answer`);
          continue;
        }

        if (!dryRun) {
          backupRow(row);
          const res = await client.query(
            `UPDATE qa_pairs SET question = $1, answer = $2, qa_type = $4 WHERE id = $3
             AND length(trim(question)) <= 3 AND trim(question) ~ '^[0-9]+$'`,
            [upd.question, upd.answer, row.id, upd.qa_type],
          );
          if ((res.rowCount ?? 0) === 0) {
            console.warn(`  skip id=${row.id} — row no longer matches R1 filter`);
            continue;
          }
        }
        cp.r1_done_ids.push(row.id);
        if (upd.kind === "A") cp.r1_a_done++;
        else cp.r1_b_done++;
        batchOk++;
      }

      saveCheckpoint(cp);
      processed += batch.length;
      console.log(
        `  R1 batch ok=${batchOk} A=${classA.length} B=${classB.length} progress=${cp.r1_done_ids.length}/${totalPending + cp.r1_done_ids.length}`,
      );
      await sleep(400);
    }
  });
}

async function stepR2(dryRun: boolean) {
  await withClient(async (client) => {
    await ensureTermKindColumn(client);

    const { rows: terms } = await client.query<{ id: number; term: string; term_kind: string | null }>(
      `SELECT id, term, term_kind FROM terms
       WHERE array_length(string_to_array(trim(term), ' '), 1) >= 5
          OR term ~* '^(here|there)\\s+(the\\s+)?word'
          OR term ~* 'means\\s+["'']'
          OR term ~* 'also known as|for example'
       ORDER BY id`,
    );

    const needsAi: { id: number; term: string }[] = [];
    const kinds = new Map<number, TermKind>();

    for (const t of terms) {
      const tid = toId(t.id);
      const h = heuristicTermKind(t.term);
      if (h === "sentence" || h === "grammar") {
        kinds.set(tid, h);
      } else if (
        arrayWordCount(t.term) >= 5 &&
        !["sentence", "grammar"].includes(t.term_kind ?? "")
      ) {
        needsAi.push({ id: tid, term: t.term });
        kinds.set(tid, "phrase");
      }
    }

    if (needsAi.length > 0 && !dryRun) {
      const openai = await ensureOpenAI();
      const BATCH = 40;
      for (let i = 0; i < needsAi.length; i += BATCH) {
        const batch = needsAi.slice(i, i + BATCH);
        try {
          const result = await chatJson<{ items: { id: number; term_kind: TermKind }[] }>(
            openai,
            MODEL_CLASSIFY,
            [
              {
                role: "system",
                content: `Classify vocabulary entries for a Callan English course.
word = single vocabulary item
phrase = short multi-word phrase (2-4 words) worth learning
sentence = full example sentence (5+ words, narrative)
grammar = grammar explanation or meta note (e.g. "Here the word X means Y")
Return json: {"items":[{"id":1,"term_kind":"sentence"}]}`,
              },
              {
                role: "user",
                content: batch.map((t) => `${t.id}: ${t.term}`).join("\n"),
              },
            ],
            Math.min(4000, 200 + batch.length * 40),
          );
          for (const item of result.items ?? []) {
            if (item.id && item.term_kind) kinds.set(toId(item.id), item.term_kind);
          }
        } catch (err) {
          console.warn(`R2 AI batch skipped: ${(err as Error).message}`);
          for (const t of batch) kinds.set(toId(t.id), heuristicTermKind(t.term));
        }
        await sleep(200);
      }
    }

    if (!dryRun) {
      const ids: number[] = [];
      const vals: string[] = [];
      for (const [id, kind] of kinds) {
        ids.push(id);
        vals.push(kind);
      }
      if (ids.length > 0) {
        await client.query(
          `UPDATE terms t SET term_kind = v.kind
           FROM unnest($1::bigint[], $2::text[]) AS v(id, kind)
           WHERE t.id = v.id AND t.term_kind IS DISTINCT FROM v.kind`,
          [ids, vals],
        );
      }
    }
    console.log(`R2: classified ${kinds.size} terms (${needsAi.length} via AI assist)`);
  });
}

function arrayWordCount(term: string): number {
  return term.trim().split(/\s+/).filter(Boolean).length;
}

/** Rows where question was fixed but answer still equals question (R1 stragglers) */
async function stepBadAnswerDupes(openai: OpenAI, dryRun: boolean) {
  await withClient(async (client) => {
    const { rows } = await client.query<{ id: string; lesson_id: string; question: string }>(
      `SELECT id, lesson_id, question FROM qa_pairs
       WHERE length(trim(question)) > 3
         AND lower(trim(question)) = lower(trim(answer))
       ORDER BY id`,
    );
    console.log(`bad Q=A dupes: ${rows.length}`);
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const lessonIds = [...new Set(batch.map((r) => toId(r.lesson_id)))];
      const scenes = await fetchSceneHints(client, lessonIds);
      const aMap = await generateAnswers(
        openai,
        batch.map((r) => ({
          id: toId(r.id),
          question: r.question,
          scene: scenes.get(toId(r.lesson_id)),
        })),
      );
      let ok = 0;
      for (const r of batch) {
        const id = toId(r.id);
        const hit = aMap.get(id);
        if (!hit?.answer || hit.answer.endsWith("?")) continue;
        if (!dryRun) {
          await client.query(
            `UPDATE qa_pairs SET answer = $1, qa_type = $2 WHERE id = $3`,
            [hit.answer, hit.qa_type, id],
          );
        }
        ok++;
      }
      console.log(`  bad-A batch ok=${ok}/${batch.length}`);
      await sleep(300);
    }
  });
}

async function stepR3(dryRun: boolean) {
  await withClient(async (client) => {
    const { rows: dupRows } = await client.query<{ id: number }>(
      `SELECT id FROM (
         SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY lesson_id, lower(trim(question)), lower(trim(COALESCE(answer,'')))
             ORDER BY id
           ) AS rn
         FROM qa_pairs
         WHERE length(trim(question)) > 3
       ) sub WHERE rn > 1`,
    );
    const dupIds = dupRows.map((r) => r.id);

    if (!dryRun && dupIds.length > 0) {
      await client.query(`DELETE FROM qa_pairs WHERE id = ANY($1::bigint[])`, [dupIds]);
    }

    const { rowCount: emptyDupes } = dryRun
      ? { rowCount: 0 }
      : await client.query(
          `DELETE FROM qa_pairs q
           USING qa_pairs k
           WHERE q.lesson_id = k.lesson_id
             AND lower(trim(q.question)) = lower(trim(k.question))
             AND q.id > k.id
             AND COALESCE(trim(q.answer), '') = ''
             AND COALESCE(trim(k.answer), '') <> ''
             AND length(trim(q.question)) > 3`,
        );

    console.log(
      `R3: removed ${dupIds.length} exact Q+A dupes, ${emptyDupes ?? 0} empty-answer dupes`,
    );
  });
}

export async function runT1(client: import("pg").Client) {
  const numericQ = await client.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM qa_pairs
     WHERE length(trim(question)) <= 3 AND trim(question) ~ '^[0-9]+$'`,
  );
  const badAnswer = await client.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM qa_pairs
     WHERE length(trim(question)) > 3
       AND (COALESCE(trim(answer),'') = '' OR answer ~ '\\?$')`,
  );
  const r2Untagged = await client.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM terms
     WHERE array_length(string_to_array(trim(term), ' '), 1) >= 5
       AND COALESCE(term_kind,'word') NOT IN ('sentence','grammar')`,
  );
  const dupLessons = await client.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM (
       SELECT lesson_id FROM qa_pairs
       WHERE length(trim(question)) > 3
       GROUP BY lesson_id, lower(trim(question))
       HAVING COUNT(*) > 1
     ) x`,
  );
  const exactDupes = await client.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM (
       SELECT lesson_id, lower(trim(question)) AS q, lower(trim(COALESCE(answer,''))) AS a
       FROM qa_pairs WHERE length(trim(question)) > 3
       GROUP BY lesson_id, q, a HAVING COUNT(*) > 1
     ) x`,
  );

  return {
    numeric_question_index: numericQ.rows[0]?.n ?? "?",
    empty_or_question_answer: badAnswer.rows[0]?.n ?? "?",
    terms_long_untagged: r2Untagged.rows[0]?.n ?? "?",
    lessons_with_dup_questions: dupLessons.rows[0]?.n ?? "?",
    exact_qa_duplicate_groups: exactDupes.rows[0]?.n ?? "?",
  };
}

async function sampleQualityCheck(client: import("pg").Client): Promise<string> {
  const { rows } = await client.query<{ question: string; answer: string }>(
    `SELECT question, answer FROM qa_pairs
     WHERE length(trim(question)) > 3
     ORDER BY random() LIMIT 20`,
  );
  let ok = 0;
  for (const r of rows) {
    const q = r.question.trim();
    const a = r.answer?.trim() ?? "";
    if (q.length > 3 && a && !a.endsWith("?") && /^[A-Z]/.test(q)) ok++;
  }
  const pct = rows.length ? Math.round((ok / rows.length) * 100) : 0;
  return `抽检20条 ${ok}/${rows.length} 合语法+有答案+非问句答 (${pct}%)`;
}

async function postReport(
  t1: Awaited<ReturnType<typeof runT1>>,
  status: "DONE" | "FAILED",
  cp: Checkpoint,
  qualitySample: string,
) {
  const token = getGitHubToken();
  const body = `## 执行报告
状态：${status}
R1剩余序号question：[${t1.numeric_question_index}]
R1-A补答案/R1-B补问句：[${cp.r1_a_done}条 / ${cp.r1_b_done}条]
质量关:无歧义+合语法抽检：[${qualitySample}]
R2非词项/R3重复：[≥5词未标 ${t1.terms_long_untagged} | 同课重复课 ${t1.lessons_with_dup_questions} | 完全相同Q+A ${t1.exact_qa_duplicate_groups}]
T1：bad_ans=${t1.empty_or_question_answer}
🤖 gpt-5.4批量（batch=${BATCH_SIZE}）`;

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
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
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
    ? { r1_done_ids: [], r1_a_done: 0, r1_b_done: 0, r2_done: false, r3_done: false }
    : loadCheckpoint();
  if (reset) saveCheckpoint(cp);
  else await reconcileCheckpoint(cp);
  cp = loadCheckpoint();

  console.log(`issue-62 step=${step} limit=${limit || "∞"} dryRun=${dryRun}`);
  console.log(`DB: ${getDatabaseUrl().replace(/:[^:@]+@/, ":***@")}`);

  const steps =
    step === "all" ? ["r1", "bad-a", "r2", "r3", "t1"] : step.split(",").map((s) => s.trim());

  const openai = steps.some((s) => ["r1", "bad-a", "all"].includes(s))
    ? await ensureOpenAI()
    : null;

  if (steps.includes("r1")) {
    if (!openai) throw new Error("OpenAI required for R1");
    await stepR1(openai, cp, limit, dryRun);
    cp = loadCheckpoint();
  }

  if (steps.includes("bad-a")) {
    if (!openai) throw new Error("OpenAI required for bad-a");
    await stepBadAnswerDupes(openai, dryRun);
  }

  if (steps.includes("r2") && !cp.r2_done) {
    await stepR2(dryRun);
    if (!dryRun) {
      cp.r2_done = true;
      saveCheckpoint(cp);
    }
  }

  if (steps.includes("r3") && !cp.r3_done) {
    await stepR3(dryRun);
    if (!dryRun) {
      cp.r3_done = true;
      saveCheckpoint(cp);
    }
  }

  if (steps.includes("t1")) {
    cp = loadCheckpoint();
    const t1 = await withClient(async (client) => {
      const metrics = await runT1(client);
      const qualitySample = await sampleQualityCheck(client);
      return { metrics, qualitySample };
    });
    console.log("\nT1:", JSON.stringify(t1.metrics, null, 2));
    const ok =
      t1.metrics.numeric_question_index === "0" && t1.metrics.terms_long_untagged === "0";
    if (!dryRun) await postReport(t1.metrics, ok ? "DONE" : "FAILED", cp, t1.qualitySample);
  }
}

const isMain =
  typeof process.argv[1] === "string" &&
  /fix-issue-62\.(t|j)sx?$/.test(process.argv[1]);

if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
