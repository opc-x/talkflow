import { loadEnv } from "./_env.js";
import { withClient, vectorLiteral } from "./_db.js";
import { createOpenAI } from "./_openai.js";

loadEnv();

const openai = createOpenAI();
const EMBED_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
let embedWarned = false;
let embedAvailable: boolean | null = null;

async function embedText(text: string): Promise<number[] | null> {
  if (embedAvailable === false) return null;
  try {
    const { data } = await openai.embeddings.create({ model: EMBED_MODEL, input: text });
    embedAvailable = true;
    return data[0]?.embedding ?? null;
  } catch {
    embedAvailable = false;
    if (!embedWarned) {
      console.warn(`⚠️ Embedding API unavailable (${EMBED_MODEL}) — skipping all lessons`);
      embedWarned = true;
    }
    return null;
  }
}

async function main() {
  await withClient(async (client) => {
    const { rows: lessons } = await client.query<{
      id: number;
      lesson_num: number;
      cefr_level: string | null;
      embedding: string | null;
    }>(
      `select id, lesson_num, cefr_level, embedding::text as embedding
       from public.lessons order by lesson_num`,
    );

    let done = 0;
    for (const lesson of lessons) {
      if (lesson.embedding) {
        console.log(`⏭ L${lesson.lesson_num} — already embedded`);
        continue;
      }

      const { rows: termRows } = await client.query<{ term: string }>(
        `select term from public.terms where lesson_id = $1 order by position nulls last, id limit 30`,
        [lesson.id],
      );
      const { rows: qaRows } = await client.query<{ question: string }>(
        `select question from public.qa_pairs
         where lesson_id = $1 and qa_category = 'lesson'
         order by pair_index limit 10`,
        [lesson.id],
      );

      const text = [
        `CEFR: ${lesson.cefr_level ?? "unknown"}`,
        `Vocabulary: ${termRows.map((t) => t.term).join(", ")}`,
        `Practice: ${qaRows.map((q) => q.question).join(" | ")}`,
      ].join("\n");

      const embedding = await embedText(text);
      if (!embedding) {
        if (embedAvailable === false && done === 0) {
          console.log("⏭ Stopping — embedding channel unavailable for all lessons");
          break;
        }
        continue;
      }

      await client.query(
        `update public.lessons set embedding = $1::vector where id = $2`,
        [vectorLiteral(embedding), lesson.id],
      );

      done++;
      console.log(`✅ L${lesson.lesson_num} embedded`);
      await new Promise((r) => setTimeout(r, 200));
    }

    const { rows: counts } = await client.query<{ n: number }>(
      `select count(*)::int as n from public.lessons where embedding is not null`,
    );
    console.log(`📊 lessons with embedding: ${counts[0]?.n ?? 0} (new: ${done})`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
