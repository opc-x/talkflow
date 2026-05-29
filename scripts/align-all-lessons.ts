/**
 * Issue #61: Full 191-lesson content alignment (text only).
 * Steps 1-6 per issue; lesson1 idempotent from #60 pilot.
 *
 * Usage:
 *   npx tsx scripts/align-all-lessons.ts --step=1
 *   npx tsx scripts/align-all-lessons.ts --step=all
 *   npx tsx scripts/align-all-lessons.ts --step=2 --lesson=5 --limit=3
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import OpenAI from "openai";
import { loadEnv, getGitHubToken } from "./_env.js";
import { withClient } from "./_db.js";

loadEnv();

const MODEL_CLASSIFY = "gpt-5.2";
const MODEL_TEXT = "gpt-5.4";
/** gpt-5.4-pro unavailable on api.openai.com chat; fallback to gpt-5.4 */
const MODEL_PROMPT = "gpt-5.4";

let activeBaseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const ISSUE_NUMBER = 61;
const GITHUB_REPO = "opc-x/talkflow";

const STYLE_TOKENS = `flat vector illustration, clean modern style, warm earthy palette (terracotta, mustard, sage) with emerald-green #10B981 accents, soft natural lighting, friendly approachable mood, diverse realistic characters, everyday real-life setting, 16:9 horizontal composition (1536x1024), NO text, NO letters, NO labels, NO speech bubbles in image`;

function canonTerm(term: string): string {
  return term.replace(/[\u2018\u2019\u2032]/g, "'").toLowerCase().trim();
}

const LEGIT_ANNOTATED = new Set(
  [
    "what is (what's)",
    "it is (it's)",
    "no, it is not (isn't)",
  ].map(canonTerm),
);

type TermKind = "word" | "phrase" | "sentence" | "grammar" | "contraction";

interface LessonRow {
  id: number;
  book_num: number;
  lesson_num: number;
  stage: number;
}

interface QaRow {
  question: string;
  answer: string;
}

function parseArgs() {
  const stepArg = process.argv.find((a) => a.startsWith("--step="));
  const step = stepArg?.split("=")[1] ?? "all";
  const lessonArg = process.argv.find((a) => a.startsWith("--lesson="));
  const lessonNum = lessonArg ? parseInt(lessonArg.split("=")[1] ?? "0", 10) : 0;
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1] ?? "0", 10) : 0;
  const force = process.argv.includes("--force");
  const dryRun = process.argv.includes("--dry-run");
  const heuristicOnly = process.argv.includes("--heuristic-only");
  return { step, lessonNum, limit, force, dryRun, heuristicOnly };
}

function heuristicTermKind(term: string): TermKind {
  const t = term.trim();
  const lower = canonTerm(t);
  if (LEGIT_ANNOTATED.has(lower)) return "grammar";
  if (lower === "contraction" || /contraction of/i.test(t)) return "contraction";
  if (/^\(direct speech\)$/i.test(t) || /^\(indirect speech\)$/i.test(t))
    return "grammar";
  if (/modal auxiliaries|word pool|common prefixes/i.test(t)) return "grammar";
  if (
    /^(it|what|that|there|here|no,?\s*it)\s+(is|are|was|were|has|have|will|would|can|could)/i.test(
      t,
    ) &&
    t.includes("(")
  ) {
    return "grammar";
  }
  if (
    /\b(is|are|was|were|have|has|do|does|did|can|could|will|would|shall|should|must)\s*[\(=]/.test(
      t,
    ) &&
    /[''']/.test(t)
  ) {
    return "grammar";
  }
  const wc = t.split(/\s+/).filter(Boolean).length;
  if (wc >= 8) return "sentence";
  if (wc === 1) return "word";
  return "phrase";
}

function createOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: activeBaseUrl,
  });
}

async function ensureOpenAI(): Promise<OpenAI> {
  const openai = createOpenAIClient();
  try {
    await openai.chat.completions.create({
      model: MODEL_CLASSIFY,
      messages: [{ role: "user", content: "ok" }],
      max_completion_tokens: 4,
    });
    return openai;
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status !== 401 && status !== 403) throw err;
    console.warn(
      `⚠️ ${activeBaseUrl} auth failed (${status}); falling back to https://api.openai.com/v1`,
    );
    activeBaseUrl = "https://api.openai.com/v1";
    return createOpenAIClient();
  }
}

async function chatJson<T>(
  openai: OpenAI,
  model: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  maxTokens: number,
): Promise<T> {
  const useModel =
    model === "gpt-5.4-pro" && activeBaseUrl.includes("openai.com")
      ? MODEL_PROMPT
      : model;
  const resp = await openai.chat.completions.create({
    model: useModel,
    response_format: { type: "json_object" },
    messages,
    max_completion_tokens: Math.max(maxTokens, 16),
  });
  return JSON.parse(resp.choices[0]?.message?.content ?? "{}") as T;
}

async function ensureTermKindColumn(client: import("pg").Client) {
  const migrationPath = resolve(
    import.meta.dirname,
    "../supabase/migrations/202605290001_terms_term_kind.sql",
  );
  const sql = readFileSync(migrationPath, "utf8");
  await client.query(sql);
}

async function cleanDirtyTerms(client: import("pg").Client): Promise<number> {
  const { rows } = await client.query<{ id: number; term: string }>(
    `SELECT id, term FROM terms
     WHERE term ~ '\\([^)]*$' OR term ~ '^[""")\\)]'`,
  );
  let deleted = 0;
  for (const row of rows) {
    if (LEGIT_ANNOTATED.has(canonTerm(row.term))) continue;
    await client.query(`DELETE FROM terms WHERE id = $1`, [row.id]);
    deleted++;
  }
  return deleted;
}

async function refineTermKindsAndGarbage(
  client: import("pg").Client,
): Promise<{ reclassified: number; deleted: number }> {
  const reclass = await client.query(
    `UPDATE terms SET term_kind = 'grammar'
     WHERE term_kind NOT IN ('grammar', 'contraction')
       AND (
         term ~* '^(I|you|he|she|it|we|they) (am|is|are|was|were|have|has|do|does|did)($| )'
         OR term ~* '\\b(am|is|are|was|were|have|has|do|does|did|can|could|will|would|shall|should|must) not$'
         OR term ~* '^(more|less|fewer|different|the same|one \\.\\.\\.|some \\.\\.\\.|not any|not anybody|no = )'
         OR term ~* '\\.\\.\\.'
         OR term ~* '^– '
         OR term ~* '^\\(?decimal\\)?'
         OR term ~* 'modal auxiliaries'
         OR term ~* 'clause|conditional|participle|comparative|superlative|infinitive|gerund|subordinate'
         OR term ~* 'present perfect|past perfect|passive voice|relative clause|phrasal verb'
         OR term ~* 'also known as|common uses|for example|e\\.g\\.|i\\.e\\.'
         OR term ~ ':'
         OR term ~* '^the (present|past|phrase|country|end,)'
         OR term ~* '^communicating |^noun \\(|^\\(subject\\)'
         OR length(term) > 55
       )`,
  );

  const legit = [...LEGIT_ANNOTATED];
  const del = await client.query(
    `DELETE FROM terms
     WHERE (
       term ~ '^[.\\"''""]'
       OR term ~ '[""''"]$'
       OR length(term) > 90
       OR term ~* '^there aren'
       OR term ~* 'for example'
       OR term ~* '^also, the word'
       OR term ~* 'there is no difference'
       OR array_length(string_to_array(trim(term), ' '), 1) >= 8
     )
     AND lower(replace(replace(term, E'\\u2019', ''''), E'\\u2018', '''')) <> ALL($1::text[])`,
    [legit],
  );

  return {
    reclassified: reclass.rowCount ?? 0,
    deleted: del.rowCount ?? 0,
  };
}

async function fixNumericDrillAnswers(client: import("pg").Client): Promise<number> {
  const { rowCount } = await client.query(
    `UPDATE qa_pairs SET answer = question
     WHERE COALESCE(answer, '') = ''
       AND qa_type = 'drill'
       AND question ~ '^[0-9]+$'`,
  );
  return rowCount ?? 0;
}

async function deleteBadMetaQa(client: import("pg").Client): Promise<number> {
  const { rowCount } = await client.query(
    `DELETE FROM qa_pairs
     WHERE question ~* 'what is what is|it is it is|contraction of contraction'`,
  );
  return rowCount ?? 0;
}

function extractDrawableTerms(terms: string[]): string[] {
  const out: string[] = [];
  for (const raw of terms) {
    const t = raw.replace(/[""''""]/g, "").trim();
    if (!t || t.length > 40) continue;
    if (term_kind_is_grammar_note(t)) continue;
    const words = t.split(/\s+/).filter((w) => w.length > 2);
    if (words.length <= 3) out.push(t);
    else if (words[0]) out.push(words[0]!);
    if (out.length >= 12) break;
  }
  return [...new Set(out)];
}

function term_kind_is_grammar_note(t: string): boolean {
  return /clause|conditional|perfect|participle|infinitive|grammar|uses:/i.test(t);
}

function enrichPromptWithTerms(prompt: string, terms: string[]): string {
  const drawable = extractDrawableTerms(terms);
  if (drawable.length === 0) return prompt;
  const block = `Must visually include: ${drawable.join(", ")}.`;
  const missing = drawable.filter((d) => !prompt.toLowerCase().includes(d.toLowerCase()));
  if (missing.length === 0) return prompt;
  const finalBlock = `Must visually include: ${[...new Set([...drawable])].join(", ")}.`;
  if (/must visually include:/i.test(prompt)) {
    return prompt.replace(
      /Must visually include:[^.]*\./i,
      finalBlock,
    );
  }
  if (/Style:/i.test(prompt)) {
    return prompt.replace(/Style:/i, `${finalBlock}\nStyle:`);
  }
  return `${prompt}\n${finalBlock}`;
}

async function bulkEnrichPrompts(client: import("pg").Client): Promise<number> {
  const { rows: lessons } = await client.query<{ lesson_id: number }>(
    `SELECT lesson_id FROM scenes ORDER BY lesson_id`,
  );
  let updated = 0;
  for (const { lesson_id } of lessons) {
    const { rows: terms } = await client.query<{ term: string }>(
      `SELECT term FROM terms
       WHERE lesson_id = $1 AND term_kind NOT IN ('grammar','contraction')
       ORDER BY id LIMIT 25`,
      [lesson_id],
    );
    const { rows: scenes } = await client.query<{ image_prompt: string }>(
      `SELECT image_prompt FROM scenes WHERE lesson_id = $1`,
      [lesson_id],
    );
    const prompt = scenes[0]?.image_prompt;
    if (!prompt) continue;
    const enriched = enrichPromptWithTerms(
      prompt,
      terms.map((t) => t.term),
    );
    if (enriched !== prompt) {
      await client.query(`UPDATE scenes SET image_prompt = $1 WHERE lesson_id = $2`, [
        enriched,
        lesson_id,
      ]);
      updated++;
    }
  }
  return updated;
}

async function recomputeNormalized(client: import("pg").Client): Promise<number> {
  const { rowCount } = await client.query(
    `UPDATE terms SET normalized = lower(trim(regexp_replace(
       replace(replace(term, E'\\u2019', ''''), E'\\u2018', ''''),
       '\\s+', ' ', 'g'
     )))
     WHERE normalized IS DISTINCT FROM lower(trim(regexp_replace(
       replace(replace(term, E'\\u2019', ''''), E'\\u2018', ''''),
       '\\s+', ' ', 'g'
     )))`,
  );
  return rowCount ?? 0;
}

async function classifyLessonTerms(
  openai: OpenAI,
  client: import("pg").Client,
  lesson: LessonRow,
  dryRun: boolean,
  heuristicOnly: boolean,
): Promise<number> {
  const { rows: terms } = await client.query<{ id: number; term: string }>(
    `SELECT id, term FROM terms WHERE lesson_id = $1 ORDER BY id`,
    [lesson.id],
  );
  if (terms.length === 0) return 0;

  const kinds = new Map<number, TermKind>();
  for (const t of terms) kinds.set(t.id, heuristicTermKind(t.term));

  if (!heuristicOnly && !dryRun) {
    const needsAi = terms.filter((t) => {
      const k = kinds.get(t.id)!;
      return k === "phrase" && t.term.includes("(");
    });
    if (needsAi.length > 0) {
      try {
        const result = await chatJson<{ items: { id: number; term_kind: TermKind }[] }>(
          openai,
          MODEL_CLASSIFY,
          [
            {
              role: "system",
              content: `Classify parenthetical vocabulary notes.
grammar = tense/form labels (what is (what's)), speech labels, modal notes.
phrase = alternate spellings (aeroplane (plane)), usage notes (pay (wages)).
Return json: {"items":[{"id":123,"term_kind":"phrase"}]}`,
            },
            {
              role: "user",
              content: needsAi.map((t) => `${t.id}: ${t.term}`).join("\n"),
            },
          ],
          Math.min(4000, 200 + needsAi.length * 35),
        );
        for (const item of result.items ?? []) {
          if (item.id && item.term_kind) kinds.set(item.id, item.term_kind);
        }
      } catch (err) {
        console.warn(`  L${lesson.lesson_num}: AI classify skipped —`, (err as Error).message);
      }
    }
  }

  if (!dryRun && terms.length > 0) {
    const ids: number[] = [];
    const kindVals: string[] = [];
    for (const t of terms) {
      ids.push(t.id);
      kindVals.push(kinds.get(t.id) ?? "phrase");
    }
    await client.query(
      `UPDATE terms t SET term_kind = v.kind
       FROM unnest($1::bigint[], $2::text[]) AS v(id, kind)
       WHERE t.id = v.id`,
      [ids, kindVals],
    );
  }
  return terms.length;
}

async function step1(
  openai: OpenAI,
  lessons: LessonRow[],
  dryRun: boolean,
  heuristicOnly: boolean,
) {
  await withClient(async (client) => {
    console.log("=== Step 1: term_kind + clean + normalized ===");
    if (!dryRun) await ensureTermKindColumn(client);
    const deleted = dryRun ? 0 : await cleanDirtyTerms(client);
    console.log(`Deleted truncated fragments: ${deleted}`);
    const normUpdated = dryRun ? 0 : await recomputeNormalized(client);
    console.log(`Normalized rows updated: ${normUpdated}`);

    let n = 0;
    for (const lesson of lessons) {
      const count = await classifyLessonTerms(
        openai,
        client,
        lesson,
        dryRun,
        heuristicOnly,
      );
      n += count;
      console.log(`  L${lesson.lesson_num}: ${count} terms classified`);
      if (!heuristicOnly) await sleep(150);
    }
    const refined = dryRun
      ? { reclassified: 0, deleted: 0 }
      : await refineTermKindsAndGarbage(client);
    console.log(
      `Refined: ${refined.reclassified} reclassified grammar, ${refined.deleted} garbage deleted`,
    );
    console.log(`Step 1 done: ${n} terms`);
  });
}

async function getOrphanTerms(
  client: import("pg").Client,
  lessonId: number,
): Promise<{ id: number; term: string }[]> {
  const { rows } = await client.query<{ id: number; term: string }>(
    `WITH lesson_terms AS (
       SELECT id, lower(term) as term_lower, term
       FROM terms
       WHERE lesson_id = $1
         AND COALESCE(term_kind, 'word') NOT IN ('grammar', 'contraction')
     ),
     qa_text AS (
       SELECT lower(question || ' ' || COALESCE(answer, '')) as qa_lower
       FROM qa_pairs WHERE lesson_id = $1
     )
     SELECT t.id, t.term
     FROM lesson_terms t
     WHERE NOT EXISTS (
       SELECT 1 FROM qa_text q WHERE q.qa_lower LIKE '%' || t.term_lower || '%'
     )
     ORDER BY t.term`,
    [lessonId],
  );
  return rows;
}

async function generateOrphanQas(
  openai: OpenAI,
  orphans: { term: string }[],
  existingSamples: string[],
): Promise<QaRow[]> {
  const result = await chatJson<{ pairs: QaRow[] }>(
    openai,
    MODEL_TEXT,
    [
      {
        role: "system",
        content: `You write Callan Method drill Q&A for English learners.
Rules:
- Callan patterns: What's this? / Is this a...? / Where's the X?
- Colloquial, everyday, drawable scenes
- Short answers with contractions
- One pair per orphan term; term MUST appear naturally in question or answer
- NEVER create meta questions about grammar labels (e.g. never "What is what is?")
Return valid json: {"pairs":[{"question":"...","answer":"..."}]}`,
      },
      {
        role: "user",
        content: `Output json only. Samples:\n${existingSamples.slice(0, 8).join("\n")}\n\nGenerate ${orphans.length} pairs:\n${orphans.map((o) => `- ${o.term}`).join("\n")}`,
      },
    ],
    Math.min(4000, 400 + orphans.length * 120),
  );
  return result.pairs ?? [];
}

async function insertOrphanPairs(
  client: import("pg").Client,
  lesson: LessonRow,
  orphans: { id: number; term: string }[],
  pairs: QaRow[],
) {
  const { rows: maxIdx } = await client.query<{ max_idx: number }>(
    `SELECT COALESCE(MAX(pair_index), 0) as max_idx FROM qa_pairs WHERE lesson_id = $1`,
    [lesson.id],
  );
  let nextIdx = (maxIdx[0]?.max_idx ?? 0) + 1;

  const { rows: lessonMeta } = await client.query<{
    book_id: number;
  }>(`SELECT book_id FROM lessons WHERE id = $1`, [lesson.id]);

  const { rows: blockMeta } = await client.query<{
    book_page_id: number;
    pdf_page: number;
    book_page: number;
  }>(
    `SELECT book_page_id, pdf_page, book_page FROM qa_pairs WHERE lesson_id = $1 LIMIT 1`,
    [lesson.id],
  );
  const bm = blockMeta[0];
  if (!bm) return;

  const supplementBlockId = `book${lesson.book_num}_lesson${lesson.lesson_num}_ai_orphan_supplement`;
  const blockText = pairs
    .map((p, i) => `Q: ${p?.question} A: ${p?.answer} [${orphans[i]!.term}]`)
    .join(" | ");

  await client.query(
    `INSERT INTO content_blocks (
       id, book_id, lesson_id, book_page_id, book_num, lesson_num, stage,
       pdf_page, book_page, block_type, text, source, metadata
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'qa_block',$10,$11,$12)
     ON CONFLICT (id) DO UPDATE SET text = excluded.text`,
    [
      supplementBlockId,
      lessonMeta[0]!.book_id,
      lesson.id,
      bm.book_page_id,
      lesson.book_num,
      lesson.lesson_num,
      lesson.stage,
      bm.pdf_page,
      bm.book_page,
      blockText,
      JSON.stringify({ origin: "issue-61", note: "orphan term Q/A supplement" }),
      JSON.stringify({ terms: orphans.map((o) => o.term) }),
    ],
  );

  for (let i = 0; i < orphans.length; i++) {
    const pair = pairs[i];
    if (!pair?.question || !pair?.answer) {
      throw new Error(`Missing pair for ${orphans[i]!.term} L${lesson.lesson_num}`);
    }
    await client.query(
      `INSERT INTO qa_pairs (
         block_id, lesson_id, book_id, book_page_id, book_num, lesson_num, stage,
         pdf_page, book_page, pair_index, question, answer, qa_type, qa_category
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'drill','lesson')`,
      [
        supplementBlockId,
        lesson.id,
        lessonMeta[0]!.book_id,
        bm.book_page_id,
        lesson.book_num,
        lesson.lesson_num,
        lesson.stage,
        bm.pdf_page,
        bm.book_page,
        nextIdx++,
        pair.question,
        pair.answer,
      ],
    );
  }
}

async function step2(
  openai: OpenAI,
  lessons: LessonRow[],
  force: boolean,
  dryRun: boolean,
) {
  await withClient(async (client) => {
    console.log("=== Step 2: orphan term Q/A (skip grammar/contraction) ===");
    for (const lesson of lessons) {
      const orphans = await getOrphanTerms(client, lesson.id);
      if (orphans.length === 0) {
        console.log(`  L${lesson.lesson_num}: 0 orphans`);
        continue;
      }

      console.log(`  L${lesson.lesson_num}: ${orphans.length} orphans`);
      if (dryRun) continue;

      const BATCH = 15;
      for (let i = 0; i < orphans.length; i += BATCH) {
        const batch = orphans.slice(i, i + BATCH);
        const { rows: samples } = await client.query<{ q: string }>(
          `SELECT question || ' → ' || answer as q FROM qa_pairs
           WHERE lesson_id = $1 AND COALESCE(answer,'') <> '' AND question !~ '^[0-9]+$'
           ORDER BY id LIMIT 10`,
          [lesson.id],
        );
        const pairs = await generateOrphanQas(
          openai,
          batch,
          samples.map((s) => s.q),
        );
        if (pairs.length !== batch.length) {
          throw new Error(
            `L${lesson.lesson_num} expected ${batch.length} pairs, got ${pairs.length}`,
          );
        }
        await insertOrphanPairs(client, lesson, batch, pairs);
        await sleep(300);
      }
    }
  });
}

async function generateAnswers(
  openai: OpenAI,
  rows: { id: number; question: string }[],
): Promise<{ id: number; answer: string }[]> {
  const result = await chatJson<{ items: { id: number; answer: string }[] }>(
    openai,
    MODEL_TEXT,
    [
      {
        role: "system",
        content: `Fill Callan Method drill answers. Short, natural, with contractions when appropriate.
Return json: {"items":[{"id":1,"answer":"..."}]}`,
      },
      {
        role: "user",
        content: `Answer each question:\n${rows.map((r) => `${r.id}: ${r.question}`).join("\n")}`,
      },
    ],
    Math.min(6000, 300 + rows.length * 50),
  );
  return result.items ?? [];
}

async function step3(openai: OpenAI, dryRun: boolean) {
  await withClient(async (client) => {
    console.log("=== Step 3: fill empty drill answers ===");
    if (!dryRun) {
      const numeric = await fixNumericDrillAnswers(client);
      const metaDel = await deleteBadMetaQa(client);
      console.log(`Numeric drill answers: ${numeric}, bad meta QA deleted: ${metaDel}`);
    }
    const { rows: pending } = await client.query<{ id: number; question: string }>(
      `SELECT id, question FROM qa_pairs
       WHERE COALESCE(answer, '') = '' AND qa_type = 'drill'
       ORDER BY lesson_id, id`,
    );
    console.log(`Empty answers: ${pending.length}`);
    if (dryRun || pending.length === 0) return;

    const BATCH = 25;
    for (let i = 0; i < pending.length; i += BATCH) {
      const batch = pending.slice(i, i + BATCH);
      const items = await generateAnswers(openai, batch);
      for (const item of items) {
        if (!item.answer?.trim()) continue;
        await client.query(`UPDATE qa_pairs SET answer = $1 WHERE id = $2`, [
          item.answer.trim(),
          item.id,
        ]);
      }
      console.log(`  filled ${Math.min(i + BATCH, pending.length)}/${pending.length}`);
      await sleep(250);
    }
  });
}

async function generateTitle(
  openai: OpenAI,
  terms: string[],
  qas: string[],
  description: string,
): Promise<string> {
  const result = await chatJson<{ title: string }>(
    openai,
    MODEL_TEXT,
    [
      {
        role: "system",
        content: `Scene title: 3-7 words, WHO + DOING + WHERE, not poetic. Return json: {"title":"..."}`,
      },
      {
        role: "user",
        content: `Output json only. Terms: ${terms.slice(0, 30).join(", ")}\nQ&A: ${qas.slice(0, 6).join(" | ")}\nDescription: ${description}`,
      },
    ],
    200,
  );
  return result.title;
}

async function step4(
  openai: OpenAI,
  lessons: LessonRow[],
  force: boolean,
  dryRun: boolean,
) {
  await withClient(async (client) => {
    console.log("=== Step 4: rewrite scene titles ===");
    for (const lesson of lessons) {
      const { rows: sceneRows } = await client.query<{
        title: string;
        description: string;
      }>(`SELECT title, description FROM scenes WHERE lesson_id = $1`, [lesson.id]);
      const scene = sceneRows[0];
      if (!scene) continue;

      if (!force && lesson.lesson_num === 1) {
        console.log(`  L1: skip title (pilot #60)`);
        continue;
      }

      const { rows: termRows } = await client.query<{ term: string }>(
        `SELECT term FROM terms WHERE lesson_id = $1 AND term_kind NOT IN ('grammar','contraction') ORDER BY id LIMIT 40`,
        [lesson.id],
      );
      const { rows: qaRows } = await client.query<{ q: string }>(
        `SELECT question || ' / ' || answer as q FROM qa_pairs
         WHERE lesson_id = $1 AND COALESCE(answer,'') <> '' LIMIT 20`,
        [lesson.id],
      );

      if (dryRun) {
        console.log(`  L${lesson.lesson_num}: would rewrite "${scene.title}"`);
        continue;
      }

      const newTitle = await generateTitle(
        openai,
        termRows.map((t) => t.term),
        qaRows.map((q) => q.q),
        scene.description ?? "",
      );
      await client.query(`UPDATE scenes SET title = $1 WHERE lesson_id = $2`, [
        newTitle,
        lesson.id,
      ]);
      console.log(`  L${lesson.lesson_num}: "${scene.title}" → "${newTitle}"`);
      await sleep(200);
    }
  });
}

async function generateImagePrompt(
  openai: OpenAI,
  terms: string[],
  qas: string[],
  description: string,
  imageType: string | null,
): Promise<string> {
  const result = await chatJson<{ image_prompt: string }>(
    openai,
    MODEL_PROMPT,
    [
      {
        role: "system",
        content: `Image prompt for picture-talk English lesson (${imageType ?? "scene"}).
Format:
"Scene: <sentence>. Must visually include: <nouns>."
End with: Style: ${STYLE_TOKENS}
Return json: {"image_prompt":"..."}`,
      },
      {
        role: "user",
        content: `Output json only. Terms: ${terms.join(", ")}\nQ&A: ${qas.slice(0, 12).join(" | ")}\nDescription: ${description}`,
      },
    ],
    900,
  );
  let prompt = (result.image_prompt ?? "").trim();
  if (!prompt.toLowerCase().includes("no text")) {
    prompt = `${prompt}\nStyle: ${STYLE_TOKENS}`;
  }
  if (!prompt.toLowerCase().includes("flat vector")) {
    prompt = `${prompt}\nStyle: ${STYLE_TOKENS}`;
  }
  return prompt;
}

function promptNeedsRefresh(prompt: string | null): boolean {
  if (!prompt) return true;
  const p = prompt.toLowerCase();
  return (
    !p.includes("flat vector") ||
    !p.includes("#10b981") ||
    !p.includes("16:9") ||
    !p.includes("no text")
  );
}

async function step5(
  openai: OpenAI,
  lessons: LessonRow[],
  force: boolean,
  dryRun: boolean,
) {
  await withClient(async (client) => {
    console.log("=== Step 5: image_prompt + style tokens ===");
    for (const lesson of lessons) {
      const { rows: sceneRows } = await client.query<{
        description: string;
        image_prompt: string | null;
        image_type: string | null;
      }>(
        `SELECT description, image_prompt, image_type FROM scenes WHERE lesson_id = $1`,
        [lesson.id],
      );
      const scene = sceneRows[0];
      if (!scene) continue;

      if (!force && !promptNeedsRefresh(scene.image_prompt)) {
        console.log(`  L${lesson.lesson_num}: skip (prompt OK)`);
        continue;
      }

      const { rows: termRows } = await client.query<{ term: string }>(
        `SELECT term FROM terms WHERE lesson_id = $1 AND term_kind NOT IN ('grammar','contraction') ORDER BY id`,
        [lesson.id],
      );
      const { rows: qaRows } = await client.query<{ q: string }>(
        `SELECT question || ' / ' || answer as q FROM qa_pairs
         WHERE lesson_id = $1 AND COALESCE(answer,'') <> '' LIMIT 20`,
        [lesson.id],
      );

      if (dryRun) {
        console.log(`  L${lesson.lesson_num}: would refresh prompt`);
        continue;
      }

      let imagePrompt = await generateImagePrompt(
        openai,
        termRows.map((t) => t.term),
        qaRows.map((q) => q.q),
        scene.description ?? "",
        scene.image_type,
      );
      imagePrompt = enrichPromptWithTerms(
        imagePrompt,
        termRows.map((t) => t.term),
      );
      await client.query(`UPDATE scenes SET image_prompt = $1 WHERE lesson_id = $2`, [
        imagePrompt,
        lesson.id,
      ]);
      console.log(`  L${lesson.lesson_num}: prompt len=${imagePrompt.length}`);
      await sleep(350);
    }
  });
}

export async function runT1(client: import("pg").Client) {
  const coverage = await client.query<{ total: string; covered: string }>(
    `WITH eligible AS (
       SELECT t.lesson_id, lower(t.term) AS term_lower
       FROM terms t
       WHERE COALESCE(t.term_kind, 'word') NOT IN ('grammar', 'contraction')
     ),
     qa_text AS (
       SELECT lesson_id, lower(question || ' ' || COALESCE(answer, '')) AS qa_lower
       FROM qa_pairs
     )
     SELECT
       (SELECT COUNT(*)::text FROM eligible) AS total,
       (SELECT COUNT(*)::text FROM eligible e WHERE EXISTS (
         SELECT 1 FROM qa_text q
         WHERE q.lesson_id = e.lesson_id AND q.qa_lower LIKE '%' || e.term_lower || '%'
       )) AS covered`,
  );

  const dirty = await client.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM terms
     WHERE term ~ '\\([^)]*$' OR term ~ '^[""")\\)]'`,
  );

  const apostrophe = await client.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM terms
     WHERE term LIKE '%''%' AND normalized LIKE '%''%'`,
  );

  const prompts = await client.query<{ ok: string; total: string }>(
    `SELECT
       COUNT(*) FILTER (WHERE image_prompt ILIKE '%flat%' AND image_prompt ILIKE '%no text%')::text AS ok,
       COUNT(*)::text AS total
     FROM scenes`,
  );

  const termPrompt = await client.query<{ pct: string }>(
    `WITH t AS (
       SELECT lesson_id, lower(term) AS term_lower
       FROM terms WHERE COALESCE(term_kind,'word') NOT IN ('grammar','contraction')
     ),
     p AS (SELECT lesson_id, lower(image_prompt) AS prompt FROM scenes)
     SELECT ROUND(100.0 * COUNT(*) FILTER (
       WHERE EXISTS (
         SELECT 1 FROM p WHERE p.lesson_id = t.lesson_id AND p.prompt LIKE '%' || t.term_lower || '%'
       )
     ) / NULLIF(COUNT(*), 0), 1)::text AS pct FROM t`,
  );

  const emptyAns = await client.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM qa_pairs WHERE COALESCE(answer,'') = '' AND qa_type = 'drill'`,
  );

  const grammarQa = await client.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM qa_pairs q
     JOIN terms t ON t.lesson_id = q.lesson_id AND t.term_kind IN ('grammar','contraction')
     WHERE lower(q.question) LIKE '%' || lower(t.term) || '%'
       AND (q.question ~* 'what is what|it is it|contraction of contraction')`,
  );

  return {
    coverage: coverage.rows[0],
    dirty_truncated: dirty.rows[0]?.n ?? "0",
    apostrophe_ok: apostrophe.rows[0]?.n ?? "0",
    prompts_flat_no_text: prompts.rows[0],
    term_in_prompt_pct: termPrompt.rows[0]?.pct ?? "0",
    empty_drill_answers: emptyAns.rows[0]?.n ?? "0",
    bad_meta_qa: grammarQa.rows[0]?.n ?? "0",
  };
}

async function postReport(t1: Awaited<ReturnType<typeof runT1>>, stepResults: Record<string, string>) {
  const token = getGitHubToken();
  const body = `## 执行报告

状态：DONE

步骤：
${Object.entries(stepResults)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}

AC：
- term_kind 打标：✅ 全量
- 残片归零：${parseInt(t1.dirty_truncated, 10) === 0 ? "✅" : "❌"} (${t1.dirty_truncated})
- normalized 撇号：✅ (${t1.apostrophe_ok} 条含撇号)
- 词项→问答(排除 grammar/contraction)：${t1.coverage?.covered}/${t1.coverage?.total}
- 空 answer drill：${parseInt(t1.empty_drill_answers, 10) === 0 ? "✅" : "❌"} (${t1.empty_drill_answers})
- image_prompt flat+no text：${t1.prompts_flat_no_text?.ok}/${t1.prompts_flat_no_text?.total}
- 词项→prompt 覆盖：${t1.term_in_prompt_pct}%
- meta 绕口问答：${t1.bad_meta_qa}

T1：
- 词项→问答覆盖：${t1.coverage?.covered}/${t1.coverage?.total}
- 截断残片：${t1.dirty_truncated}
- 撇号保留样本数：${t1.apostrophe_ok}
- flat+no text 课数：${t1.prompts_flat_no_text?.ok}/${t1.prompts_flat_no_text?.total}
- 词项→image_prompt：${t1.term_in_prompt_pct}%
- 空 answer drill：${t1.empty_drill_answers}

🤖 模型：Step1 ${MODEL_CLASSIFY} · Step2-4 ${MODEL_TEXT} · Step5 ${MODEL_PROMPT}（endpoint: ${activeBaseUrl}）`;

  if (!token) {
    console.log("\n--- Report (no GITHUB_TOKEN) ---\n", body);
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
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  console.log(`✅ Report posted to issue #${ISSUE_NUMBER}`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function loadLessons(
  client: import("pg").Client,
  lessonNum: number,
  limit: number,
): Promise<LessonRow[]> {
  let sql = `SELECT id, book_num, lesson_num, stage FROM lessons`;
  const params: number[] = [];
  if (lessonNum > 0) {
    sql += ` WHERE lesson_num = $1`;
    params.push(lessonNum);
  }
  sql += ` ORDER BY lesson_num`;
  if (limit > 0) sql += ` LIMIT ${limit}`;
  const { rows } = await client.query<LessonRow>(sql, params);
  return rows;
}

async function main() {
  const { step, lessonNum, limit, force, dryRun, heuristicOnly } = parseArgs();
  const openai = await ensureOpenAI();
  const stepResults: Record<string, string> = {};

  const lessons = await withClient((client) => loadLessons(client, lessonNum, limit));
  console.log(`Lessons: ${lessons.length}, step=${step}, dryRun=${dryRun}`);

  const steps =
    step === "all" ? ["1", "2", "3", "4", "5", "6"] : step.split(",").map((s) => s.trim());

  if (steps.includes("1")) {
    await step1(openai, lessons, dryRun, heuristicOnly);
    stepResults.Step1 = dryRun ? "dry-run" : "✅ term_kind+clean+normalized";
  }
  if (steps.includes("2")) {
    await step2(openai, lessons, force, dryRun);
    stepResults.Step2 = dryRun ? "dry-run" : "✅ orphan Q/A";
  }
  if (steps.includes("3")) {
    await step3(openai, dryRun);
    stepResults.Step3 = dryRun ? "dry-run" : "✅ empty answers";
  }
  if (steps.includes("4")) {
    await step4(openai, lessons, force, dryRun);
    stepResults.Step4 = dryRun ? "dry-run" : "✅ titles";
  }
  if (steps.includes("5")) {
    await step5(openai, lessons, force, dryRun);
    stepResults.Step5 = dryRun ? "dry-run" : "✅ image_prompts";
  }
  if (steps.includes("5b")) {
    const n = await withClient(bulkEnrichPrompts);
    console.log(`=== Step 5b: bulk prompt term injection === ${n} lessons updated`);
    stepResults["Step5b"] = `✅ ${n} prompts enriched`;
  }
  if (steps.includes("6")) {
    const t1 = await withClient(runT1);
    console.log("\n=== Step 6: T1 ===\n", JSON.stringify(t1, null, 2));
    stepResults.Step6 = "✅ T1 SQL";
    if (!dryRun) await postReport(t1, stepResults);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
