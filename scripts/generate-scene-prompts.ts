import { loadEnv } from "./_env.js";
import { withClient } from "./_db.js";
import { createOpenAI, chatJson } from "./_openai.js";

loadEnv();

const openai = createOpenAI();

interface SceneMeta {
  scene_title: string;
  scene_description: string;
  image_prompt: string;
  image_type: "scene" | "action" | "concept";
}

async function generateSceneMeta(lesson: {
  book_num: number;
  lesson_num: number;
  cefr_level: string | null;
  terms: string[];
  qas: string[];
}): Promise<SceneMeta> {
  return chatJson<SceneMeta>(openai, [
    {
      role: "system",
      content: `You are a content designer for an English learning app.
Create scene titles that feel like short story titles—evocative, real-life, and curiosity-inducing.
Avoid generic textbook labels like "Classroom Objects" or "Daily Actions".
Output valid JSON only.`,
    },
    {
      role: "user",
      content: `Book ${lesson.book_num}, Lesson ${lesson.lesson_num} (${lesson.cefr_level ?? "A1"})
Terms: ${lesson.terms.join(", ")}
Q&A samples: ${lesson.qas.slice(0, 5).join(" | ")}

Output JSON:
{
  "scene_title": "evocative 3-6 word title, makes learner curious, feels like a real-life moment",
  "scene_description": "2 sentences describing the scene",
  "image_prompt": "Detailed prompt ending with: flat illustration style, warm colors with hints of emerald green, 4:3 horizontal composition, no text or labels in image",
  "image_type": "scene|action|concept"
}`,
    },
  ], 500);
}

async function classifyImageType(lesson: {
  book_num: number;
  lesson_num: number;
  cefr_level: string | null;
  terms: string[];
  qas: string[];
}): Promise<"scene" | "action" | "concept"> {
  const result = await chatJson<{ image_type: "scene" | "action" | "concept" }>(openai, [
    {
      role: "system",
      content: `You are classifying English lesson content into one of three image types.
Respond with JSON only: {"image_type": "scene"|"action"|"concept"}

Rules:
- "scene": lesson vocabulary is mostly nouns/objects/places (furniture, animals, food, rooms, clothing)
- "action": lesson vocabulary is mostly verbs/movement words (running, cooking, working, physical actions)
- "concept": lesson vocabulary is mostly grammar, time words, abstract ideas, prepositions, adjectives of feeling`,
    },
    {
      role: "user",
      content: `Book ${lesson.book_num}, Lesson ${lesson.lesson_num}
Terms: ${lesson.terms.slice(0, 20).join(", ")}
Sample Q&A: ${lesson.qas.slice(0, 3).join(" | ")}`,
    },
  ], 50);
  return result.image_type ?? "scene";
}

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1] ?? "0", 10) : 0;
  const reclassify = process.argv.includes("--reclassify");

  await withClient(async (client) => {
    const { rows: lessons } = await client.query<{
      id: number;
      book_num: number;
      lesson_num: number;
      cefr_level: string | null;
    }>(
      `select id, book_num, lesson_num, cefr_level from public.lessons order by lesson_num`,
    );

    let done = 0;

    if (reclassify) {
      console.log("🔄 --reclassify mode: only updating image_type");
      for (const lesson of lessons) {
        if (limit > 0 && done >= limit) break;
        const { rows: termRows } = await client.query<{ term: string }>(
          `select term from public.terms where lesson_id = $1 order by position nulls last, id limit 30`,
          [lesson.id],
        );
        const { rows: qaRows } = await client.query<{ question: string }>(
          `select question from public.qa_pairs where lesson_id = $1 and qa_category = 'lesson' order by pair_index limit 10`,
          [lesson.id],
        );
        const imageType = await classifyImageType({
          book_num: lesson.book_num,
          lesson_num: lesson.lesson_num,
          cefr_level: lesson.cefr_level,
          terms: termRows.map((t) => t.term),
          qas: qaRows.map((q) => q.question),
        });
        await client.query(
          `update public.scenes set image_type = $1 where lesson_id = $2`,
          [imageType, lesson.id],
        );
        done++;
        console.log(`✅ L${lesson.lesson_num} → ${imageType}`);
        await new Promise((r) => setTimeout(r, 200));
      }
      const { rows: dist } = await client.query<{ image_type: string; n: number }>(
        `select image_type, count(*)::int as n from public.scenes group by image_type order by image_type`,
      );
      console.log("📊 image_type distribution:", dist);
      return;
    }

    for (const lesson of lessons) {
      if (limit > 0 && done >= limit) break;

      const { rows: existing } = await client.query<{ image_prompt: string | null }>(
        `select image_prompt from public.scenes where lesson_id = $1 and image_prompt is not null limit 1`,
        [lesson.id],
      );
      if (existing.length > 0) {
        console.log(`⏭ L${lesson.lesson_num} — already has prompt`);
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

      const meta = await generateSceneMeta({
        book_num: lesson.book_num,
        lesson_num: lesson.lesson_num,
        cefr_level: lesson.cefr_level,
        terms: termRows.map((t) => t.term),
        qas: qaRows.map((q) => q.question),
      });

      if (!meta.scene_title || !meta.image_prompt || !meta.image_type) {
        throw new Error(`Invalid scene meta for L${lesson.lesson_num}`);
      }

      await client.query(
        `insert into public.scenes (lesson_id, image_url, title, description, image_prompt, image_type, position)
         values ($1, 'pending', $2, $3, $4, $5, 1)
         on conflict (lesson_id) do update set
           title = excluded.title,
           description = excluded.description,
           image_prompt = excluded.image_prompt,
           image_type = excluded.image_type,
           image_url = case when public.scenes.image_url is null or public.scenes.image_url = '' then 'pending' else public.scenes.image_url end`,
        [
          lesson.id,
          meta.scene_title,
          meta.scene_description,
          meta.image_prompt,
          meta.image_type,
        ],
      );

      done++;
      console.log(
        `✅ L${lesson.lesson_num} — ${meta.scene_title} [${meta.image_type}]`,
      );
      await new Promise((r) => setTimeout(r, 400));
    }

    const { rows: counts } = await client.query<{
      has_prompt: number;
      pending: number;
      total: number;
    }>(
      `select
         count(*) filter (where image_prompt is not null)::int as has_prompt,
         count(*) filter (where image_url = 'pending')::int as pending,
         count(*)::int as total
       from public.scenes`,
    );
    console.log("📊 scenes:", counts[0]);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
