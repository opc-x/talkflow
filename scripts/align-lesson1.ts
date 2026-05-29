/**
 * Issue #60: lesson1 content alignment (pilot)
 */
import type OpenAI from "openai";
import { loadEnv } from "./_env.js";
import { withClient } from "./_db.js";
import { createOpenAI } from "./_openai.js";

loadEnv();

const LESSON_ID = 1;
const MODEL_TEXT = "gpt-5.4";
const MODEL_PROMPT = "gpt-5.4-pro";

const STYLE_TOKENS = `flat vector illustration, clean modern style, warm earthy palette (terracotta, mustard, sage) with emerald-green #10B981 accents, soft natural lighting, friendly approachable mood, diverse realistic characters, everyday real-life setting, 16:9 horizontal composition (1536x1024), NO text, NO letters, NO labels, NO speech bubbles in image`;

const LEGIT_ANNOTATED = new Set([
  "what is (what's)",
  "it is (it's)",
  "no, it is not (isn't)",
]);

interface QaRow {
  question: string;
  answer: string;
}

async function chatJson<T>(
  openai: OpenAI,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  maxTokens: number,
  model: string,
): Promise<T> {
  const resp = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages,
    max_completion_tokens: Math.max(maxTokens, 16),
  });
  return JSON.parse(resp.choices[0]?.message?.content ?? "{}") as T;
}

async function getOrphanTerms(
  client: import("pg").Client,
): Promise<{ id: number; term: string }[]> {
  const { rows } = await client.query<{ id: number; term: string }>(
    `WITH lesson_terms AS (
       SELECT id, lower(term) as term_lower, term
       FROM terms WHERE lesson_id = $1
     ),
     qa_text AS (
       SELECT lower(question || ' ' || answer) as qa_lower
       FROM qa_pairs WHERE lesson_id = $1
     )
     SELECT t.id, t.term
     FROM lesson_terms t
     WHERE NOT EXISTS (
       SELECT 1 FROM qa_text q
       WHERE q.qa_lower LIKE '%' || t.term_lower || '%'
     )
     ORDER BY t.term`,
    [LESSON_ID],
  );
  return rows;
}

async function cleanDirtyTerms(client: import("pg").Client): Promise<number> {
  const { rows } = await client.query<{ id: number; term: string }>(
    `SELECT id, term FROM terms WHERE lesson_id = $1
     AND (term ~ '\\([^)]*$' OR term ~ '^[""")\\)]')`,
    [LESSON_ID],
  );
  let deleted = 0;
  for (const row of rows) {
    if (LEGIT_ANNOTATED.has(row.term)) continue;
    await client.query(`DELETE FROM terms WHERE id = $1`, [row.id]);
    deleted++;
  }
  return deleted;
}

async function generateOrphanQas(
  openai: OpenAI,
  orphans: { term: string }[],
  existingSamples: string[],
): Promise<QaRow[]> {
  const result = await chatJson<{ pairs: QaRow[] }>(
    openai,
    [
      {
        role: "system",
        content: `You write Callan Method drill Q&A for A1 English learners.
Rules:
- Callan patterns: What's this? / Is this a...? / Is the X large? / Where's the X?
- Colloquial, everyday, drawable in a room scene
- Short answers with contractions
- One pair per orphan term; term MUST appear in question or answer
- Numbers: counting drills; grammar terms: natural drills
Return valid json: {"pairs":[{"question":"...","answer":"..."}]}`,
      },
      {
        role: "user",
        content: `Output json only. Samples:\n${existingSamples.slice(0, 8).join("\n")}\n\nGenerate ${orphans.length} pairs:\n${orphans.map((o) => `- ${o.term}`).join("\n")}`,
      },
    ],
    2500,
    MODEL_TEXT,
  );
  return result.pairs;
}

async function generateTitle(
  openai: OpenAI,
  terms: string[],
  qas: string[],
  description: string,
): Promise<string> {
  const result = await chatJson<{ title: string }>(
    openai,
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
    MODEL_TEXT,
  );
  return result.title;
}

async function generateImagePrompt(
  openai: OpenAI,
  terms: string[],
  qas: string[],
  description: string,
): Promise<string> {
  const result = await chatJson<{ image_prompt: string }>(
    openai,
    [
      {
        role: "system",
        content: `Image prompt for picture-talk lesson. Format:
"Scene: <sentence>. Must visually include: <nouns>."
End with: Style: ${STYLE_TOKENS}
Return json: {"image_prompt":"..."}`,
      },
      {
        role: "user",
        content: `Output json only. A1 room lesson. Terms: ${terms.join(", ")}\nQ&A: ${qas.slice(0, 10).join(" | ")}\n${description}`,
      },
    ],
    800,
    MODEL_PROMPT,
  );
  let prompt = result.image_prompt.trim();
  if (!prompt.toLowerCase().includes("no text")) {
    prompt = `${prompt}\nStyle: ${STYLE_TOKENS}`;
  }
  return prompt;
}

async function runT1(client: import("pg").Client) {
  const coverage = await client.query<{ total: string; covered: string }>(
    `WITH lesson_terms AS (
       SELECT lower(term) as term_lower FROM terms WHERE lesson_id = $1
     ),
     qa_text AS (
       SELECT lower(question || ' ' || answer) as qa_lower FROM qa_pairs WHERE lesson_id = $1
     )
     SELECT
       (SELECT COUNT(*)::text FROM lesson_terms) as total,
       (SELECT COUNT(*)::text FROM lesson_terms t WHERE EXISTS (
         SELECT 1 FROM qa_text q WHERE q.qa_lower LIKE '%' || t.term_lower || '%'
       )) as covered`,
    [LESSON_ID],
  );

  const dirty = await client.query<{ n: string }>(
    `SELECT COUNT(*)::text as n FROM terms WHERE lesson_id = $1
     AND (term ~ '\\([^)]*$' OR term ~ '^[""")\\)]')`,
    [LESSON_ID],
  );

  const promptCheck = await client.query<{
    has_flat: boolean;
    has_no_text: boolean;
    title: string;
  }>(
    `SELECT
       image_prompt ILIKE '%flat%' as has_flat,
       image_prompt ILIKE '%NO text%' as has_no_text,
       title
     FROM scenes WHERE lesson_id = $1`,
    [LESSON_ID],
  );

  const termPromptCoverage = await client.query<{ pct: string }>(
    `WITH t AS (SELECT lower(term) term_lower FROM terms WHERE lesson_id = $1),
     p AS (SELECT lower(image_prompt) prompt FROM scenes WHERE lesson_id = $1)
     SELECT ROUND(100.0 * COUNT(*) FILTER (
       WHERE EXISTS (SELECT 1 FROM p WHERE p.prompt LIKE '%' || t.term_lower || '%')
     ) / NULLIF(COUNT(*), 0), 1)::text as pct FROM t`,
    [LESSON_ID],
  );

  return {
    coverage: coverage.rows[0],
    dirty_truncated: dirty.rows[0]?.n ?? "0",
    prompt: promptCheck.rows[0],
    term_in_prompt_pct: termPromptCoverage.rows[0]?.pct ?? "0",
  };
}

async function main() {
  const openai = createOpenAI();

  await withClient(async (client) => {
    console.log("=== Step 1: Clean dirty term fragments ===");
    const deleted = await cleanDirtyTerms(client);
    console.log(`Deleted truncated fragments: ${deleted}`);

    console.log("\n=== Step 2: Add orphan term Q/A ===");
    const orphans = await getOrphanTerms(client);
    console.log(`Orphans: ${orphans.length}`);

    if (orphans.length > 0) {
      const { rows: samples } = await client.query<{ q: string }>(
        `SELECT question || ' → ' || answer as q FROM qa_pairs
         WHERE lesson_id = $1 AND answer <> '' AND question !~ '^[0-9]+$'
         ORDER BY id LIMIT 10`,
        [LESSON_ID],
      );

      const pairs = await generateOrphanQas(
        openai,
        orphans,
        samples.map((s) => s.q),
      );

      const { rows: maxIdx } = await client.query<{ max_idx: number }>(
        `SELECT COALESCE(MAX(pair_index), 0) as max_idx FROM qa_pairs WHERE lesson_id = $1`,
        [LESSON_ID],
      );
      let nextIdx = (maxIdx[0]?.max_idx ?? 0) + 1;

      const { rows: lessonMeta } = await client.query<{
        book_id: number;
        book_num: number;
        lesson_num: number;
        stage: number;
      }>(
        `SELECT book_id, book_num, lesson_num, stage FROM lessons WHERE id = $1`,
        [LESSON_ID],
      );
      const meta = lessonMeta[0]!;

      const { rows: blockMeta } = await client.query<{
        book_page_id: number;
        pdf_page: number;
        book_page: number;
      }>(
        `SELECT book_page_id, pdf_page, book_page
         FROM qa_pairs WHERE lesson_id = $1 LIMIT 1`,
        [LESSON_ID],
      );
      const bm = blockMeta[0]!;

      const supplementBlockId = `book${meta.book_num}_lesson${meta.lesson_num}_ai_orphan_supplement`;
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
          meta.book_id,
          LESSON_ID,
          bm.book_page_id,
          meta.book_num,
          meta.lesson_num,
          meta.stage,
          bm.pdf_page,
          bm.book_page,
          blockText,
          JSON.stringify({ origin: "issue-60", note: "orphan term Q/A supplement" }),
          JSON.stringify({ terms: orphans.map((o) => o.term) }),
        ],
      );

      for (let i = 0; i < orphans.length; i++) {
        const pair = pairs[i];
        if (!pair?.question || !pair?.answer) {
          throw new Error(`Missing pair for ${orphans[i]!.term}`);
        }
        await client.query(
          `INSERT INTO qa_pairs (
             block_id, lesson_id, book_id, book_page_id, book_num, lesson_num, stage,
             pdf_page, book_page, pair_index, question, answer, qa_type, qa_category
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'drill','lesson')`,
          [
            supplementBlockId,
            LESSON_ID,
            meta.book_id,
            bm.book_page_id,
            meta.book_num,
            meta.lesson_num,
            meta.stage,
            bm.pdf_page,
            bm.book_page,
            nextIdx++,
            pair.question,
            pair.answer,
          ],
        );
        console.log(`  + [${orphans[i]!.term}] ${pair.question}`);
      }
    }

    console.log("\n=== Step 3: Rewrite title ===");
    const { rows: termRows } = await client.query<{ term: string }>(
      `SELECT term FROM terms WHERE lesson_id = $1 ORDER BY id`,
      [LESSON_ID],
    );
    const { rows: qaRows } = await client.query<{ q: string }>(
      `SELECT question || ' / ' || answer as q FROM qa_pairs
       WHERE lesson_id = $1 AND answer <> '' LIMIT 20`,
      [LESSON_ID],
    );
    const { rows: sceneRows } = await client.query<{
      description: string;
      title: string;
    }>(`SELECT description, title FROM scenes WHERE lesson_id = $1`, [
      LESSON_ID,
    ]);

    const newTitle = await generateTitle(
      openai,
      termRows.map((t) => t.term),
      qaRows.map((q) => q.q),
      sceneRows[0]?.description ?? "",
    );
    await client.query(`UPDATE scenes SET title = $1 WHERE lesson_id = $2`, [
      newTitle,
      LESSON_ID,
    ]);
    console.log(`"${sceneRows[0]?.title}" → "${newTitle}"`);

    console.log("\n=== Step 4: image_prompt ===");
    const imagePrompt = await generateImagePrompt(
      openai,
      termRows.map((t) => t.term),
      qaRows.map((q) => q.q),
      sceneRows[0]?.description ?? "",
    );
    await client.query(
      `UPDATE scenes SET image_prompt = $1 WHERE lesson_id = $2`,
      [imagePrompt, LESSON_ID],
    );
    console.log(`len=${imagePrompt.length}, has NO text=${imagePrompt.includes("NO text")}`);

    console.log("\n=== Step 5: T1 ===");
    console.log(JSON.stringify(await runT1(client), null, 2));
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
