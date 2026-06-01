/**
 * Batch-generate TTS audio for qa_pairs questions via OpenAI-compatible API.
 *
 * Usage:
 *   npx tsx scripts/generate-audio.ts --limit=50
 *   npx tsx scripts/generate-audio.ts --lesson=1
 *   npx tsx scripts/generate-audio.ts --book=1 --force
 */
import { loadEnv, requireEnv } from "./_env.js";
import { withClient } from "./_db.js";
import OpenAI from "openai";

loadEnv();

const OPENAI_API_KEY = requireEnv("OPENAI_API_KEY");
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const TTS_MODEL = process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts";
const TTS_VOICE = process.env.OPENAI_TTS_VOICE ?? "nova";
const BUCKET = "audio";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY, baseURL: OPENAI_BASE_URL });

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(name.length + 3);
}

async function upload(filename: string, buf: Buffer, contentType: string) {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: new Uint8Array(buf),
    }
  );
  if (!res.ok) {
    throw new Error(`Upload failed ${res.status}: ${await res.text()}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}

async function synthesize(text: string): Promise<Buffer> {
  const resp = await openai.audio.speech.create({
    model: TTS_MODEL,
    voice: TTS_VOICE,
    input: text.slice(0, 4096),
    instructions:
      "Speak clearly as an English teacher. Use natural rising intonation for questions.",
  });
  return Buffer.from(await resp.arrayBuffer());
}

async function main() {
  const limit = Number(arg("limit") ?? "0");
  const lessonNum = arg("lesson") ? Number(arg("lesson")) : null;
  const bookNum = arg("book") ? Number(arg("book")) : null;
  const force = process.argv.includes("--force");

  let done = 0;
  let skipped = 0;
  let failed = 0;

  await withClient(async (client) => {
    let sql = `
      SELECT id, book_num, lesson_num, question, audio_url
      FROM qa_pairs
      WHERE question IS NOT NULL AND trim(question) <> ''
    `;
    const params: unknown[] = [];
    if (bookNum != null) {
      params.push(bookNum);
      sql += ` AND book_num = $${params.length}`;
    }
    if (lessonNum != null) {
      params.push(lessonNum);
      sql += ` AND lesson_num = $${params.length}`;
    }
    sql += ` ORDER BY book_num, lesson_num, id`;

    const { rows } = await client.query<{
      id: number;
      book_num: number;
      lesson_num: number;
      question: string;
      audio_url: string | null;
    }>(sql, params);

    for (const row of rows) {
      if (row.audio_url && !force) {
        skipped++;
        continue;
      }

      const filename = `qa-${row.id}.mp3`;
      process.stdout.write(`⏳ B${row.book_num}L${row.lesson_num} #${row.id} ... `);

      try {
        const buf = await synthesize(row.question);
        const url = await upload(filename, buf, "audio/mpeg");
        await client.query(`UPDATE qa_pairs SET audio_url = $1 WHERE id = $2`, [
          url,
          row.id,
        ]);
        done++;
        console.log("✅");
      } catch (err) {
        failed++;
        console.log(`❌ ${err instanceof Error ? err.message : err}`);
      }

      if (limit > 0 && done + failed >= limit) break;
      await new Promise((r) => setTimeout(r, 400));
    }
  });

  console.log(`\n📊 完成: ${done}  跳过: ${skipped}  失败: ${failed}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
