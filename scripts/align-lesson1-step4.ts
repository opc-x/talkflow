import type OpenAI from "openai";
import { loadEnv } from "./_env.js";
import { withClient } from "./_db.js";
import { createOpenAI } from "./_openai.js";

loadEnv();

const LESSON_ID = 1;
const STYLE_TOKENS = `flat vector illustration, clean modern style, warm earthy palette (terracotta, mustard, sage) with emerald-green #10B981 accents, soft natural lighting, friendly approachable mood, diverse realistic characters, everyday real-life setting, 16:9 horizontal composition (1536x1024), NO text, NO letters, NO labels, NO speech bubbles in image`;

async function main() {
  const openai = createOpenAI();
  await withClient(async (client) => {
    const { rows: terms } = await client.query<{ term: string }>(
      `SELECT term FROM terms WHERE lesson_id = $1 ORDER BY id`,
      [LESSON_ID],
    );
    const { rows: qas } = await client.query<{ q: string }>(
      `SELECT question || ' / ' || answer as q FROM qa_pairs
       WHERE lesson_id = $1 AND answer <> '' LIMIT 15`,
      [LESSON_ID],
    );
    const { rows: scene } = await client.query<{ description: string }>(
      `SELECT description FROM scenes WHERE lesson_id = $1`,
      [LESSON_ID],
    );

    const resp = await openai.chat.completions.create({
      model: "gpt-5.4-pro",
      response_format: { type: "json_object" },
      max_completion_tokens: 1500,
      messages: [
        {
          role: "system",
          content: `Write an image generation prompt for an A1 English "picture talk" lesson.
Return json: {"image_prompt":"..."}
Format: Scene: <who doing what in a cozy room>. Must visually include: <list drawable nouns from lesson>.
End with exactly: Style: ${STYLE_TOKENS}`,
        },
        {
          role: "user",
          content: `Output json only.
Terms: ${terms.map((t) => t.term).join(", ")}
Q&A samples: ${qas.map((q) => q.q).join(" | ")}
Description: ${scene[0]?.description}`,
        },
      ],
    });

    const raw = resp.choices[0]?.message?.content ?? "";
    console.log("response length:", raw.length);
    const parsed = JSON.parse(raw || "{}") as { image_prompt?: string };
    let prompt = (parsed.image_prompt ?? raw).trim();
    if (!prompt.toLowerCase().includes("no text")) {
      prompt = `${prompt}\nStyle: ${STYLE_TOKENS}`;
    }

    await client.query(`UPDATE scenes SET image_prompt = $1 WHERE lesson_id = $2`, [
      prompt,
      LESSON_ID,
    ]);
    console.log("Updated. len=", prompt.length);
    console.log("has flat:", prompt.includes("flat"));
    console.log("has NO text:", prompt.includes("NO text"));
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
