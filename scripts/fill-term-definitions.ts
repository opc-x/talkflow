import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import OpenAI from "openai";
import { loadEnv, requireEnv } from "./_env.js";
import { withClient } from "./_db.js";

const BATCH_SIZE = 50;
const MODEL = process.env.OPENAI_FILL_MODEL ?? "gpt-4o-mini";

function loadBackendEnv() {
  const path = resolve(import.meta.dirname, "../backend/.env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key === "OPENAI_API_KEY" || key === "OPENAI_BASE_URL") {
      process.env[key] = value;
    } else if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();
loadBackendEnv();

interface TermRow {
  id: number;
  term: string;
}

interface FillResult {
  items: Array<{ id: number; definition: string; phonetic: string }>;
}

async function fillBatch(openai: OpenAI, terms: TermRow[], model: string): Promise<FillResult> {
  const list = terms.map((t) => ({ id: t.id, term: t.term }));
  const resp = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an English-Chinese dictionary assistant for Callan Method vocabulary. " +
          "For each English term, provide a concise Chinese definition (1-6 chars for single words, longer for phrases) " +
          "and British English IPA phonetic in slashes like /wɒt/. " +
          'Return JSON object with key "items": [{"id":number,"definition":"中文释义","phonetic":"/ipa/"}]',
      },
      {
        role: "user",
        content: "Return json for these terms: " + JSON.stringify(list),
      },
    ],
    max_completion_tokens: 8000,
  });

  return JSON.parse(resp.choices[0]?.message?.content ?? '{"items":[]}') as FillResult;
}

function normalizeFillResult(raw: FillResult): Map<number, { definition: string; phonetic: string }> {
  const map = new Map<number, { definition: string; phonetic: string }>();
  for (const item of raw.items ?? []) {
    const id = Number(item.id);
    if (!Number.isFinite(id) || !item.definition || !item.phonetic) continue;
    map.set(id, { definition: item.definition, phonetic: item.phonetic });
  }
  return map;
}

async function main() {
  const openai = new OpenAI({
    apiKey: requireEnv("OPENAI_API_KEY"),
    baseURL: process.env.OPENAI_BASE_URL ?? "https://api.aihubcli.com/v1",
  });

  let model = MODEL;
  try {
    await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: "reply json ok" }],
      max_completion_tokens: 5,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("model_not_found") || msg.includes("model")) {
      model = "gpt-5.2";
      console.warn(`Model ${MODEL} unavailable on proxy; falling back to ${model}`);
    } else {
      throw err;
    }
  }

  let totalFilled = 0;
  let batchNum = 0;
  const maxBatches = process.env.MAX_BATCHES ? Number(process.env.MAX_BATCHES) : Infinity;

  while (true) {
    const terms = await withClient(async (client) => {
      const { rows } = await client.query<TermRow>(
        `SELECT id, term FROM public.terms
         WHERE definition IS NULL OR phonetic IS NULL
         ORDER BY id
         LIMIT $1`,
        [BATCH_SIZE],
      );
      return rows;
    });

    if (terms.length === 0) break;

    batchNum++;
    console.log(`Batch ${batchNum}: filling ${terms.length} terms (ids ${terms[0].id}–${terms[terms.length - 1].id})`);

    const result = await fillBatch(openai, terms, model);
    const byId = normalizeFillResult(result);

    console.log(`  AI returned ${result.items?.length ?? 0} items, mapped ${byId.size}`);
    if (byId.size === 0) {
      console.warn(`  batch ${batchNum}: empty AI response, raw=${JSON.stringify(result).slice(0, 400)}`);
    }

    await withClient(async (client) => {
      for (const row of terms) {
        const filled = byId.get(Number(row.id));
        if (!filled?.definition || !filled?.phonetic) {
          console.warn(`  skip #${row.id} "${row.term}" — missing in AI response`);
          continue;
        }
        await client.query(
          `UPDATE public.terms SET definition = $1, phonetic = $2 WHERE id = $3`,
          [filled.definition.trim(), filled.phonetic.trim(), row.id],
        );
        totalFilled++;
      }
    });

    const remaining = await withClient(async (client) => {
      const { rows } = await client.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM public.terms WHERE definition IS NULL OR phonetic IS NULL`,
      );
      return rows[0]?.n ?? 0;
    });
    console.log(`  filled ${totalFilled} total; ${remaining} remaining`);

    if (batchNum >= maxBatches) break;
  }

  const stats = await withClient(async (client) => {
    const { rows } = await client.query<{ total: number; unfilled: number }>(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE definition IS NULL OR phonetic IS NULL)::int AS unfilled
       FROM public.terms`,
    );
    return rows[0];
  });

  console.log(`✅ Done. Total filled: ${totalFilled}. Unfilled: ${stats?.unfilled ?? "?"} / ${stats?.total ?? "?"}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
