/**
 * Sync terms ↔ qa_pairs from content_blocks (source of truth).
 * - Trim terms not listed in lexical_block text
 * - Rebuild qa_pairs rows from qa_block text
 * - Backfill terms.position and terms.qa_pair_id
 * - Refresh lessons.qa_count / term_count
 *
 * Usage:
 *   npx tsx scripts/sync-terms-qa-links.ts --lesson=1
 *   npx tsx scripts/sync-terms-qa-links.ts --all
 *   npx tsx scripts/sync-terms-qa-links.ts --lesson=1 --dry-run
 */
import { loadEnv } from "./_env.js";
import { withClient } from "./_db.js";

loadEnv();

interface BlockRow {
  id: string;
  block_type: string;
  text: string | null;
  book_id: number;
  lesson_id: number;
  book_page_id: number | null;
  book_num: number;
  lesson_num: number;
  stage: number;
  pdf_page: number;
  book_page: number | null;
}

interface QaPair {
  question: string;
  answer: string;
}

function parseArgs() {
  const lessonArg = process.argv.find((a) => a.startsWith("--lesson="));
  const lessonNum = lessonArg ? parseInt(lessonArg.split("=")[1] ?? "0", 10) : 0;
  const fromArg = process.argv.find((a) => a.startsWith("--from-lesson="));
  const fromLesson = fromArg ? parseInt(fromArg.split("=")[1] ?? "0", 10) : 0;
  const all = process.argv.includes("--all");
  const dryRun = process.argv.includes("--dry-run");
  return { lessonNum, fromLesson, all, dryRun };
}

function blockNum(id: string): number {
  const m = id.match(/_block(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

function normTerm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseLexicalTerms(text: string): string[] {
  return text
    .split("|")
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseQaBlock(text: string): QaPair[] {
  const raw = text.trim();
  if (!raw) return [];
  const rawPairs = raw.split(" | Q: ");
  return rawPairs.map((chunk) => {
    const body = chunk.startsWith("Q: ") ? chunk.slice(3) : chunk;
    const aIdx = body.indexOf(" A: ");
    if (aIdx === -1) return { question: body.trim(), answer: "" };
    return {
      question: body.slice(0, aIdx).trim(),
      answer: body.slice(aIdx + 4).trim(),
    };
  });
}

function termInText(term: string, haystack: string): boolean {
  const key = normTerm(term);
  if (!key) return false;
  const text = normTerm(haystack);
  return text.includes(key);
}

function matchesLexical(term: string, expected: string[]): boolean {
  const key = normTerm(term);
  return expected.some((e) => {
    const ek = normTerm(e);
    return ek === key || ek.includes(key) || key.includes(ek);
  });
}

function numberWordDrill(term: string): QaPair | null {
  const map: Record<string, string> = {
    one: "1", two: "2", three: "3", four: "4", five: "5",
    six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
  };
  const key = normTerm(term);
  if (!(key in map)) return null;
  const label = term.trim();
  return { question: `What's ${label}?`, answer: `${label.charAt(0).toUpperCase()}${label.slice(1)}.` };
}

function orphanDrill(term: string): QaPair {
  const t = term.trim();
  const numbered = numberWordDrill(t);
  if (numbered) return numbered;
  const lower = t.toLowerCase();
  if (lower.includes("what is") || lower.includes("what's")) {
    return { question: "What is this?", answer: "It is a pen." };
  }
  if (lower.includes("it is") || lower.includes("it's")) {
    return { question: "What is this?", answer: "It is a book." };
  }
  if (t.split(/\s+/).length === 1) {
    return { question: "What's this?", answer: `It's a ${t}.` };
  }
  return { question: `What does "${t}" mean?`, answer: `It means ${t}.` };
}

async function getOrphanVocabTerms(
  client: import("pg").Client,
  lessonId: number,
): Promise<{ id: number; term: string }[]> {
  const { rows } = await client.query<{ id: number; term: string }>(
    `WITH qa_text AS (
       SELECT lower(string_agg(question || ' ' || coalesce(answer, ''), ' ')) AS txt
       FROM qa_pairs WHERE lesson_id = $1
     ),
     vocab AS (
       SELECT id, term FROM terms
       WHERE lesson_id = $1 AND term_kind IN ('word', 'phrase')
     )
     SELECT v.id, v.term
     FROM vocab v, qa_text q
     WHERE NOT q.txt LIKE '%' || lower(regexp_replace(trim(regexp_replace(v.term, '[^a-zA-Z0-9 ]', ' ', 'g')), '\\s+', ' ', 'g')) || '%'
     ORDER BY v.id`,
    [lessonId],
  );
  return rows;
}

async function supplementOrphanTerms(
  client: import("pg").Client,
  lessonId: number,
  dryRun: boolean,
): Promise<number> {
  const orphans = await getOrphanVocabTerms(client, lessonId);
  if (orphans.length === 0) return 0;

  const { rows: meta } = await client.query<{
    book_id: number;
    book_num: number;
    lesson_num: number;
    stage: number;
  }>(`SELECT book_id, book_num, lesson_num, stage FROM lessons WHERE id = $1`, [lessonId]);
  const m = meta[0]!;

  const { rows: anchor } = await client.query<{
    book_page_id: number | null;
    pdf_page: number;
    book_page: number | null;
  }>(
    `SELECT book_page_id, pdf_page, book_page FROM qa_pairs WHERE lesson_id = $1 LIMIT 1`,
    [lessonId],
  );
  const bm = anchor[0]!;

  const blockId = `book${m.book_num}_lesson${m.lesson_num}_orphan_drills`;
  const pairs = orphans.map((o) => orphanDrill(o.term));
  const blockText = pairs.map((p) => `Q: ${p.question} A: ${p.answer}`).join(" | ");

  if (!dryRun) {
    await client.query(
      `INSERT INTO content_blocks (
         id, book_id, lesson_id, book_page_id, book_num, lesson_num, stage,
         pdf_page, book_page, block_type, text, source, metadata
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'qa_block',$10,$11,$12)
       ON CONFLICT (id) DO UPDATE SET text = excluded.text`,
      [
        blockId,
        m.book_id,
        lessonId,
        bm.book_page_id,
        m.book_num,
        m.lesson_num,
        m.stage,
        bm.pdf_page,
        bm.book_page,
        blockText,
        JSON.stringify({ origin: "sync-terms-qa-links", note: "orphan vocab drills" }),
        JSON.stringify({ terms: orphans.map((o) => o.term) }),
      ],
    );
    await client.query(`DELETE FROM qa_pairs WHERE block_id = $1`, [blockId]);

    const { rows: maxIdx } = await client.query<{ max_idx: number }>(
      `SELECT COALESCE(MAX(pair_index), 0) AS max_idx FROM qa_pairs WHERE lesson_id = $1`,
      [lessonId],
    );
    let idx = (maxIdx[0]?.max_idx ?? 0) + 1;

    for (const pair of pairs) {
      await client.query(
        `INSERT INTO qa_pairs (
           block_id, book_id, lesson_id, book_page_id, book_num, lesson_num, stage,
           pdf_page, book_page, pair_index, question, answer, qa_type, qa_category
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'drill','lesson')`,
        [
          blockId,
          m.book_id,
          lessonId,
          bm.book_page_id,
          m.book_num,
          m.lesson_num,
          m.stage,
          bm.pdf_page,
          bm.book_page,
          idx++,
          pair.question,
          pair.answer,
        ],
      );
    }

    await client.query(`UPDATE terms SET qa_pair_id = NULL WHERE lesson_id = $1`, [lessonId]);
  }

  console.log(`  + orphan drills ×${orphans.length}: ${orphans.map((o) => o.term).join(", ")}`);
  return orphans.length;
}

async function syncLesson(
  client: import("pg").Client,
  lessonId: number,
  dryRun: boolean,
): Promise<void> {
  const { rows: blocks } = await client.query<BlockRow>(
    `SELECT id, block_type, text, book_id, lesson_id, book_page_id,
            book_num, lesson_num, stage, pdf_page, book_page
     FROM content_blocks
     WHERE lesson_id = $1
       AND block_type IN ('lexical_block', 'qa_block')
     ORDER BY pdf_page, id`,
    [lessonId],
  );

  const sorted = [...blocks].sort((a, b) => {
    if (a.pdf_page !== b.pdf_page) return a.pdf_page - b.pdf_page;
    return blockNum(a.id) - blockNum(b.id);
  });

  let termsDeleted = 0;
  let termsPositionUpdated = 0;
  let qaDeleted = 0;
  let qaInserted = 0;
  let qaLinksUpdated = 0;

  // ── 1. Align terms with lexical_block pipe lists ──
  for (const block of sorted) {
    if (block.block_type !== "lexical_block") continue;
    const expected = parseLexicalTerms(block.text ?? "");
    const { rows: terms } = await client.query<{ id: number; term: string }>(
      `SELECT id, term FROM terms WHERE block_id = $1`,
      [block.id],
    );

    for (const row of terms) {
      if (!matchesLexical(row.term, expected)) {
        if (!dryRun) await client.query(`DELETE FROM terms WHERE id = $1`, [row.id]);
        termsDeleted++;
        console.log(`  − term [${row.term}] not in ${block.id}`);
      }
    }

    for (let i = 0; i < expected.length; i++) {
      const label = expected[i]!;
      const { rows: hit } = await client.query<{ id: number; position: number | null }>(
        `SELECT id, position FROM terms
         WHERE block_id = $1
           AND (
             lower(trim(term)) = lower(trim($2))
             OR lower(trim(normalized)) = lower(trim($2))
           )
         LIMIT 1`,
        [block.id, label],
      );
      if (hit[0]) {
        if (hit[0].position !== i + 1) {
          if (!dryRun) {
            await client.query(`UPDATE terms SET position = $1 WHERE id = $2`, [i + 1, hit[0].id]);
          }
          termsPositionUpdated++;
        }
      } else {
        const kind = label.split(/\s+/).length >= 3 ? "phrase" : label.includes(" ") ? "phrase" : "word";
        if (!dryRun) {
          await client.query(
            `INSERT INTO terms (
               block_id, book_id, lesson_id, book_page_id, term, normalized, term_type,
               book_num, stage, lesson_num, pdf_page, book_page, position, term_kind, metadata
             ) VALUES ($1,$2,$3,$4,$5,$6,'vocabulary',$7,$8,$9,$10,$11,$12,$13,$14)`,
            [
              block.id,
              block.book_id,
              block.lesson_id,
              block.book_page_id,
              label,
              normTerm(label),
              block.book_num,
              block.stage,
              block.lesson_num,
              block.pdf_page,
              block.book_page,
              i + 1,
              kind,
              JSON.stringify({ block_type: "lexical_block", source: "sync-terms-qa-links" }),
            ],
          );
        }
        console.log(`  + term [${label}] → ${block.id} pos=${i + 1}`);
        termsPositionUpdated++;
      }
    }
  }

  // ── 2. Rebuild qa_pairs from qa_block text ──
  for (const block of sorted) {
    if (block.block_type !== "qa_block") continue;
    const pairs = parseQaBlock(block.text ?? "");
    const { rows: existing } = await client.query<{ id: number; question: string }>(
      `SELECT id, question FROM qa_pairs WHERE block_id = $1 ORDER BY pair_index, id`,
      [block.id],
    );

    const needsRebuild =
      pairs.length !== existing.length ||
      pairs.some((p, i) => {
        const e = existing[i];
        return !e || normTerm(e.question) !== normTerm(p.question);
      });

    if (!needsRebuild) continue;

    if (!dryRun) {
      await client.query(`DELETE FROM qa_pairs WHERE block_id = $1`, [block.id]);
    }
    qaDeleted += existing.length;

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i]!;
      if (!pair.question && !pair.answer) continue;
      if (!dryRun) {
        await client.query(
          `INSERT INTO qa_pairs (
             block_id, book_id, lesson_id, book_page_id, book_num, lesson_num, stage,
             pdf_page, book_page, pair_index, question, answer, qa_type, qa_category
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'drill','lesson')`,
          [
            block.id,
            block.book_id,
            block.lesson_id,
            block.book_page_id,
            block.book_num,
            block.lesson_num,
            block.stage,
            block.pdf_page,
            block.book_page,
            i,
            pair.question,
            pair.answer,
          ],
        );
      }
      qaInserted++;
    }
    console.log(`  ↻ qa block ${block.id}: ${existing.length} → ${pairs.length} pairs`);
  }

  // ── 3. Backfill qa_pair_id per segment ──
  if (!dryRun) {
    await client.query(`UPDATE terms SET qa_pair_id = NULL WHERE lesson_id = $1`, [lessonId]);
  }

  let i = 0;
  while (i < sorted.length) {
    const block = sorted[i]!;
    if (block.block_type !== "lexical_block") {
      i++;
      continue;
    }

    const segmentQaIds: number[] = [];
    let j = i + 1;
    while (j < sorted.length && sorted[j]!.block_type !== "lexical_block") {
      if (sorted[j]!.block_type === "qa_block") {
        const { rows: qas } = await client.query<{ id: number; question: string; answer: string | null }>(
          `SELECT id, question, answer FROM qa_pairs WHERE block_id = $1 ORDER BY pair_index, id`,
          [sorted[j]!.id],
        );
        segmentQaIds.push(...qas.map((q) => q.id));
      }
      j++;
    }

    const { rows: segTerms } = await client.query<{ id: number; term: string }>(
      `SELECT id, term FROM terms WHERE block_id = $1 AND term_kind IN ('word','phrase')`,
      [block.id],
    );

    if (segmentQaIds.length > 0 && segTerms.length > 0) {
      const { rows: qasFull } = await client.query<{ id: number; question: string; answer: string | null }>(
        `SELECT id, question, answer FROM qa_pairs WHERE id = ANY($1::bigint[]) ORDER BY pair_index, id`,
        [segmentQaIds],
      );

      for (const t of segTerms) {
        const match = qasFull.find((q) => termInText(t.term, `${q.question} ${q.answer ?? ""}`));
        if (match) {
          if (!dryRun) {
            await client.query(`UPDATE terms SET qa_pair_id = $1 WHERE id = $2`, [match.id, t.id]);
          }
          qaLinksUpdated++;
        }
      }
    }

    i = j;
  }

  // ── 3b. Drills for vocab not yet appearing in any Q&A ──
  const orphanCount = await supplementOrphanTerms(client, lessonId, dryRun);
  if (orphanCount > 0 && !dryRun) {
    // Re-link qa_pair_id after supplement
    let si = 0;
    while (si < sorted.length) {
      const block = sorted[si]!;
      if (block.block_type !== "lexical_block") {
        si++;
        continue;
      }
      const segmentQaIds: number[] = [];
      let sj = si + 1;
      while (sj < sorted.length && sorted[sj]!.block_type !== "lexical_block") {
        if (sorted[sj]!.block_type === "qa_block") {
          const { rows: qas } = await client.query<{ id: number }>(
            `SELECT id FROM qa_pairs WHERE block_id = $1 ORDER BY pair_index, id`,
            [sorted[sj]!.id],
          );
          segmentQaIds.push(...qas.map((q) => q.id));
        }
        sj++;
      }
      const { rows: segTerms } = await client.query<{ id: number; term: string }>(
        `SELECT id, term FROM terms WHERE block_id = $1 AND term_kind IN ('word','phrase')`,
        [block.id],
      );
      if (segmentQaIds.length > 0) {
        const { rows: qasFull } = await client.query<{ id: number; question: string; answer: string | null }>(
          `SELECT id, question, answer FROM qa_pairs WHERE id = ANY($1::bigint[]) ORDER BY pair_index, id`,
          [segmentQaIds],
        );
        for (const t of segTerms) {
          const match = qasFull.find((q) => termInText(t.term, `${q.question} ${q.answer ?? ""}`));
          if (match) {
            await client.query(`UPDATE terms SET qa_pair_id = $1 WHERE id = $2`, [match.id, t.id]);
            qaLinksUpdated++;
          }
        }
      }
      si = sj;
    }
    // Global pass for orphan_drills block
    const { rows: globalOrphans } = await client.query<{ id: number; term: string }>(
      `SELECT id, term FROM terms WHERE lesson_id = $1 AND qa_pair_id IS NULL AND term_kind IN ('word','phrase')`,
      [lessonId],
    );
    const { rows: lessonMeta } = await client.query<{ book_num: number; lesson_num: number }>(
      `SELECT book_num, lesson_num FROM lessons WHERE id = $1`,
      [lessonId],
    );
    const lm = lessonMeta[0]!;
    const { rows: drillQas } = await client.query<{ id: number; question: string; answer: string | null }>(
      `SELECT id, question, answer FROM qa_pairs
       WHERE block_id = $1 ORDER BY pair_index`,
      [`book${lm.book_num}_lesson${lm.lesson_num}_orphan_drills`],
    );
    for (const t of globalOrphans) {
      const match = drillQas.find((q) => termInText(t.term, `${q.question} ${q.answer ?? ""}`));
      if (match) {
        await client.query(`UPDATE terms SET qa_pair_id = $1 WHERE id = $2`, [match.id, t.id]);
        qaLinksUpdated++;
      }
    }
  }

  // ── 4. Refresh lesson counters ──
  const { rows: counts } = await client.query<{ qa: string; terms: string }>(
    `SELECT
       (SELECT count(*)::text FROM qa_pairs WHERE lesson_id = $1) AS qa,
       (SELECT count(*)::text FROM terms WHERE lesson_id = $1) AS terms`,
    [lessonId],
  );
  if (!dryRun) {
    await client.query(
      `UPDATE lessons SET qa_count = $1::int, term_count = $2::int WHERE id = $3`,
      [counts[0]!.qa, counts[0]!.terms, lessonId],
    );
  }

  console.log(
    `  lesson ${lessonId}: terms −${termsDeleted}, position ~${termsPositionUpdated}, qa −${qaDeleted}/+${qaInserted}, links ${qaLinksUpdated}, counts qa=${counts[0]!.qa} terms=${counts[0]!.terms}`,
  );
}

async function ensureMigration(client: import("pg").Client) {
  await client.query(`
    ALTER TABLE public.terms
      ADD COLUMN IF NOT EXISTS qa_pair_id bigint REFERENCES public.qa_pairs(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_terms_qa_pair_id ON public.terms (qa_pair_id);
  `);
}

async function main() {
  const { lessonNum, fromLesson, all, dryRun } = parseArgs();
  if (!all && !lessonNum) {
    console.error("Usage: --lesson=N | --all [--from-lesson=N]");
    process.exit(1);
  }

  await withClient(async (client) => {
    await ensureMigration(client);

    let lessonIds: number[];
    if (all) {
      const { rows } = await client.query<{ id: number; lesson_num: number }>(
        `SELECT id, lesson_num FROM lessons ORDER BY lesson_num`,
      );
      lessonIds = rows
        .filter((r) => (fromLesson > 0 ? r.lesson_num >= fromLesson : true))
        .map((r) => r.id);
    } else {
      const { rows } = await client.query<{ id: number }>(
        `SELECT id FROM lessons WHERE lesson_num = $1`,
        [lessonNum],
      );
      if (!rows[0]) throw new Error(`lesson ${lessonNum} not found`);
      lessonIds = [rows[0].id];
    }

    console.log(`${dryRun ? "[dry-run] " : ""}Syncing ${lessonIds.length} lesson(s)...`);
    for (const id of lessonIds) {
      console.log(`\n— lesson_id=${id} —`);
      await syncLesson(client, id, dryRun);
    }
  });

  console.log("\n✅ Done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
