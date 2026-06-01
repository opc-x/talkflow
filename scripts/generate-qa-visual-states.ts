/**
 * Batch-generate qa_pairs.visual_state from Q+A (rule-based).
 *
 * Usage:
 *   npm run db:qa-visual-states -- --lesson=1
 *   npm run db:qa-visual-states -- --lessons=1-3 --force
 *   npm run db:qa-visual-states -- --limit=50
 *   npm run db:qa-visual-states -- --dry-run
 */
import { loadEnv } from "./_env.js";
import { withClient } from "./_db.js";
import { inferVisualState } from "../lib/parse-qa-visual.js";
import { isValidVisualState } from "../lib/visual-state.js";

loadEnv();

async function main() {
  const args = process.argv.slice(2);
  const lessonArg = args.find((a) => a.startsWith("--lesson="));
  const lessonsArg = args.find((a) => a.startsWith("--lessons="));
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");

  const lessonNum = lessonArg ? parseInt(lessonArg.split("=")[1]!, 10) : null;
  const lessonsRange = lessonsArg ? lessonsArg.split("=")[1]! : null;
  const limit = limitArg ? parseInt(limitArg.split("=")[1]!, 10) : 0;

  let lessonNums: number[] | null = null;
  if (lessonsRange) {
    const [fromStr, toStr] = lessonsRange.split("-");
    const from = parseInt(fromStr!, 10);
    const to = parseInt(toStr ?? fromStr!, 10);
    lessonNums = [];
    for (let n = from; n <= to; n++) lessonNums.push(n);
  }

  await withClient(async (client) => {
    let sql = `
      select q.id, q.question, q.answer, q.visual_state, l.lesson_num
      from public.qa_pairs q
      join public.lessons l on l.id = q.lesson_id
      where q.question is not null and q.question <> ''
        and q.qa_category = 'lesson'
    `;
    const params: unknown[] = [];
    if (lessonNum) {
      params.push(lessonNum);
      sql += ` and l.lesson_num = $${params.length}`;
    } else if (lessonNums && lessonNums.length > 0) {
      params.push(lessonNums);
      sql += ` and l.lesson_num = any($${params.length}::int[])`;
    }
    sql += ` order by l.lesson_num, q.pair_index, q.id`;
    if (limit > 0) {
      params.push(limit);
      sql += ` limit $${params.length}`;
    }

    const { rows } = await client.query<{
      id: number;
      question: string;
      answer: string | null;
      visual_state: unknown;
      lesson_num: number;
    }>(sql, params);

    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      if (row.visual_state && !force) {
        skipped++;
        continue;
      }
      const answer = row.answer ?? "";
      const state = inferVisualState(row.question, answer);
      if (!isValidVisualState(state)) {
        console.warn(`⚠ L${row.lesson_num} #${row.id} invalid state`);
        continue;
      }
      if (dryRun) {
        console.log(`DRY L${row.lesson_num} Q: ${row.question.slice(0, 40)} → focus=${state.focus} anim=${state.animation}`);
        updated++;
        continue;
      }
      await client.query(
        `update public.qa_pairs
         set visual_state = $1::jsonb, visual_state_status = 'rule'
         where id = $2`,
        [JSON.stringify(state), row.id]
      );
      updated++;
    }

    console.log(`✅ visual_state: updated=${updated} skipped=${skipped} total=${rows.length}${dryRun ? " (dry-run)" : ""}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
