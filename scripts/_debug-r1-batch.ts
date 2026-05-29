import OpenAI from "openai";
import { loadEnv } from "./_env.js";
import { withClient } from "./_db.js";
import { generateAnswers, inferQuestions, isClassA } from "./fix-issue-62.js";

loadEnv();

async function main() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    baseURL: process.env.OPENAI_BASE_URL,
  });
  await withClient(async (c) => {
    const { rows } = await c.query(
      `SELECT id, question, answer FROM qa_pairs
       WHERE id BETWEEN 358 AND 377 ORDER BY id`,
    );
    const a = rows.filter((r) => isClassA(r.answer));
    const b = rows.filter((r) => !isClassA(r.answer));
    console.log("A", a.length, "B", b.length);
    if (a.length) {
      const m = await generateAnswers(
        openai,
        a.map((r) => ({ id: r.id, question: String(r.answer).trim() })),
      );
      console.log("answers got", m.size, "of", a.length, [...m.entries()].slice(0, 2));
    }
    if (b.length) {
      const m = await inferQuestions(
        openai,
        b.slice(0, 5).map((r) => ({ id: r.id, answer: r.answer })),
      );
      console.log("questions got", m.size, [...m.entries()]);
    }
  });
}
main().catch(console.error);
