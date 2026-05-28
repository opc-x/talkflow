/**
 * generate-scene-images.ts
 *
 * 用 gpt-image-1 给每节课生成场景图，上传到 Supabase Storage (bucket: scenes)，
 * 然后把 public URL 写回 scenes.image_url。
 *
 * Usage:
 *   npx tsx scripts/generate-scene-images.ts              # 全量（跳过已有图）
 *   npx tsx scripts/generate-scene-images.ts --limit=10   # 只跑前10课
 *   npx tsx scripts/generate-scene-images.ts --force      # 强制重新生成所有
 *   npx tsx scripts/generate-scene-images.ts --lesson=5   # 单课
 */

import fs from "fs";
import path from "path";
import { loadEnv, requireEnv } from "./_env.js";
import { withClient } from "./_db.js";
loadEnv();

const OPENAI_API_KEY = requireEnv("OPENAI_API_KEY");
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_KEY = requireEnv("SUPABASE_ANON_KEY");
const BUCKET = "scenes";
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1`;

// 直接 fetch 而非 SDK，避免 proxy 的 SDK 兼容性问题
const IMAGE_API = `${OPENAI_BASE_URL}/images/generations`;

// ─── Supabase Storage 上传 ──────────────────────────────────────────────────

async function uploadToStorage(filename: string, buf: Buffer, mime = "image/png"): Promise<string> {
  const url = `${STORAGE_BASE}/object/${BUCKET}/${filename}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      apikey: SUPABASE_SERVICE_KEY,
      "Content-Type": mime,
      "x-upsert": "true",
    },
    body: buf,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Storage upload failed (${res.status}): ${body}`);
  }
  return `${STORAGE_BASE}/object/public/${BUCKET}/${filename}`;
}

// ─── 图片生成 ───────────────────────────────────────────────────────────────

async function generateImage(prompt: string): Promise<Buffer> {
  const res = await fetch(IMAGE_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: IMAGE_MODEL, prompt, n: 1, size: "1536x1024" }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Image API ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json() as { data?: Array<{ b64_json?: string }> };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error(`No b64_json in response`);
  return Buffer.from(b64, "base64");
}

// ─── 主流程 ─────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const lessonArg = args.find((a) => a.startsWith("--lesson="));
  const force = args.includes("--force");
  const limit = limitArg ? parseInt(limitArg.split("=")[1]!) : 0;
  const targetLesson = lessonArg ? parseInt(lessonArg.split("=")[1]!) : null;

  await withClient(async (client) => {
    const { rows: scenes } = await client.query<{
      lesson_id: number;
      lesson_num: number;
      image_prompt: string;
      image_url: string;
      title: string;
    }>(
      `SELECT s.lesson_id, l.lesson_num, s.image_prompt, s.image_url, s.title
       FROM public.scenes s
       JOIN public.lessons l ON l.id = s.lesson_id
       WHERE s.image_prompt IS NOT NULL
       ORDER BY l.lesson_num`
    );

    let done = 0;
    let skipped = 0;
    let failed = 0;

    for (const scene of scenes) {
      if (targetLesson && scene.lesson_num !== targetLesson) continue;

      const alreadyDone = scene.image_url && scene.image_url !== "pending" && scene.image_url !== "";
      if (alreadyDone && !force) {
        skipped++;
        continue;
      }

      const filename = `lesson-${scene.lesson_num}.png`;
      process.stdout.write(`⏳ L${scene.lesson_num} "${scene.title}" ... `);

      try {
        const buf = await generateImage(scene.image_prompt);
        const publicUrl = await uploadToStorage(filename, buf, "image/png");

        await client.query(
          `UPDATE public.scenes SET image_url = $1 WHERE lesson_id = $2`,
          [publicUrl, scene.lesson_id]
        );

        done++;
        console.log(`✅ ${publicUrl}`);
      } catch (err) {
        failed++;
        console.log(`❌ ${err instanceof Error ? err.message : err}`);
      }

      // limit 按总尝试次数算（done+failed），不只算成功
      if (limit > 0 && done + failed >= limit) break;

      // 避免 rate limit，每张图间隔 1.5s
      await new Promise((r) => setTimeout(r, 1500));
    }

    console.log(`\n📊 完成: ${done}  跳过: ${skipped}  失败: ${failed}`);

    const { rows: summary } = await client.query<{ pending: number; done: number; total: number }>(
      `SELECT
         COUNT(*) FILTER (WHERE image_url = 'pending')::int AS pending,
         COUNT(*) FILTER (WHERE image_url != 'pending' AND image_url != '')::int AS done,
         COUNT(*)::int AS total
       FROM public.scenes`
    );
    console.log(`📈 DB 状态: ${JSON.stringify(summary[0])}`);
  });
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
