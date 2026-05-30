import OpenAI from "openai";
import { loadEnv, requireEnv } from "./_env.js";
import { withClient } from "./_db.js";

const FETCH_BATCH = 25;
const CONCURRENCY = 5;
const MODEL_CANDIDATES = (
  process.env.OPENAI_GRAMMAR_MODEL
    ? [process.env.OPENAI_GRAMMAR_MODEL]
    : ["gpt-4o", "gpt-5.2"]
) as string[];
const MAX_RETRIES = 4;

loadEnv();

interface GrammarRow {
  id: string;
  text: string;
}

const SYSTEM_PROMPT =
  "你是英语学习助手。以下是一段英语语法示例文本，请用中文写一条简洁的核心讲解（2-3句），" +
  "说明这个语法点是什么、怎么理解、怎么用。不要翻译原文，直接讲语法规律。";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateExplanation(
  openai: OpenAI,
  text: string,
  model: string,
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const resp = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `原文：${text}` },
        ],
        max_completion_tokens: 400,
        temperature: 0.4,
      });
      const content = resp.choices[0]?.message?.content?.trim() ?? "";
      if (!content) throw new Error("Empty AI response");
      return content;
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const retryable =
        msg.includes("503") || msg.includes("429") || msg.includes("timeout");
      if (!retryable || attempt === MAX_RETRIES - 1) break;
      await sleep(1000 * 2 ** attempt);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function resolveModel(openai: OpenAI): Promise<string> {
  for (const model of MODEL_CANDIDATES) {
    try {
      await openai.chat.completions.create({
        model,
        messages: [{ role: "user", content: "reply ok" }],
        max_completion_tokens: 16,
      });
      if (model !== MODEL_CANDIDATES[0]) {
        console.warn(`Model ${MODEL_CANDIDATES[0]} unavailable; using ${model}`);
      }
      return model;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Model ${model} probe failed: ${msg.slice(0, 120)}`);
    }
  }
  throw new Error(`No working model in: ${MODEL_CANDIDATES.join(", ")}`);
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;

  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function countRemaining(): Promise<number> {
  return withClient(async (client) => {
    const { rows } = await client.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM public.content_blocks
       WHERE block_type = 'grammar_note' AND ai_explanation IS NULL`,
    );
    return rows[0]?.n ?? 0;
  });
}

async function main() {
  const openai = new OpenAI({
    apiKey: requireEnv("OPENAI_API_KEY"),
    baseURL: process.env.OPENAI_BASE_URL ?? "https://api.aihubcli.com/v1",
  });

  const model = await resolveModel(openai);
  console.log(`Using model: ${model}`);

  const initial = await countRemaining();
  console.log(`grammar_note without ai_explanation: ${initial}`);

  let totalFilled = 0;
  let batchNum = 0;
  const maxBatches = process.env.MAX_BATCHES ? Number(process.env.MAX_BATCHES) : Infinity;

  while (true) {
    const rows = await withClient(async (client) => {
      const { rows: fetched } = await client.query<GrammarRow>(
        `SELECT id, text FROM public.content_blocks
         WHERE block_type = 'grammar_note' AND ai_explanation IS NULL
         ORDER BY id
         LIMIT $1`,
        [FETCH_BATCH],
      );
      return fetched;
    });

    if (rows.length === 0) break;

    batchNum++;
    console.log(
      `Batch ${batchNum}: ${rows.length} rows (${rows[0].id} … ${rows[rows.length - 1].id})`,
    );

    const explanations = await mapWithConcurrency(rows, CONCURRENCY, async (row) => {
      const text = row.text?.trim() ?? "";
      if (!text) return { id: row.id, explanation: null as string | null, error: "empty text" };
      try {
        const explanation = await generateExplanation(openai, text, model);
        return { id: row.id, explanation, error: null as string | null };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { id: row.id, explanation: null, error: msg };
      }
    });

    await withClient(async (client) => {
      for (const item of explanations) {
        if (!item.explanation) {
          console.warn(`  skip ${item.id}: ${item.error ?? "no explanation"}`);
          continue;
        }
        await client.query(
          `UPDATE public.content_blocks SET ai_explanation = $1 WHERE id = $2`,
          [item.explanation, item.id],
        );
        totalFilled++;
      }
    });

    const batchFilled = explanations.filter((e) => e.explanation).length;
    const remaining = await countRemaining();
    console.log(`  filled ${totalFilled} total; ${remaining} remaining`);

    if (batchFilled === 0) {
      throw new Error(
        `Batch ${batchNum} filled 0 rows (API errors). Fix model/proxy and re-run.`,
      );
    }

    if (batchNum >= maxBatches) break;
  }

  const remaining = await countRemaining();
  const { total } = await withClient(async (client) => {
    const { rows } = await client.query<{ total: number }>(
      `SELECT count(*)::int AS total FROM public.content_blocks WHERE block_type = 'grammar_note'`,
    );
    return rows[0] ?? { total: 0 };
  });

  console.log(
    `✅ Done. Filled this run: ${totalFilled}. Remaining NULL: ${remaining} / ${total} grammar_note`,
  );

  if (remaining > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
