/**
 * Survey qa_pairs corpus: pattern counts, question types, rule coverage.
 *
 * Usage: tsx scripts/survey-qa-corpus.ts [--json]
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnv } from "./_env.js";
import { withClient } from "./_db.js";
import { inferVisualState } from "../lib/parse-qa-visual.js";
import {
  detectQuestionType,
  resolveSceneTemplate,
  type QuestionType,
} from "../lib/scene-template-registry.js";
import { isValidVisualState, SPRITE_REGISTRY } from "../lib/visual-state.js";

loadEnv();

type Row = {
  id: number;
  question: string;
  answer: string | null;
  lesson_num: number;
  book_num: number;
};

type PatternDef = { id: string; label: string; re: RegExp };

const PATTERNS: PatternDef[] = [
  { id: "whats_this", label: "What's this", re: /what'?s this|what is this/i },
  { id: "is_this_a", label: "Is this a", re: /is this a[n]?\s/i },
  { id: "wheres", label: "Where's", re: /\bwhere'?s\b/i },
  { id: "spatial_on_under_in", label: "on/under/in spatial", re: /\b(on|under|in)\s+(the\s+)?(book|box|table|floor|room)\b/i },
  { id: "short_long", label: "short/long/size", re: /\b(short|long|large|small)\b/i },
  { id: "colour", label: "What colour", re: /what colour/i },
  { id: "negation", label: "No/isn't answer", re: /^no\b|\bisn'?t\b/i },
  { id: "yes_answer", label: "Yes answer", re: /^yes\b/i },
  { id: "how_many", label: "How many", re: /\bhow many\b/i },
  { id: "who", label: "Who", re: /\bwho\b/i },
  { id: "what_name", label: "What's his/her name", re: /what'?s (his|her|your) name/i },
  { id: "look_at", label: "Look at", re: /\blook at\b/i },
  { id: "give_me", label: "Give me", re: /\bgive me\b/i },
  { id: "repeat", label: "Repeat/Say again", re: /\b(repeat|say again|once more)\b/i },
  { id: "empty_q", label: "Empty question", re: /^$/ },
  { id: "star_q", label: "Star/placeholder Q", re: /^\*+$/ },
  { id: "single_word_q", label: "Single-word Q", re: /^[a-z]+$/i },
];

function normQ(q: string): string {
  return q
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^\w\s'?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function questionTemplate(q: string): string {
  let t = normQ(q);
  t = t.replace(/\ba[n]?\s+[a-z]+\b/g, "a {noun}");
  t = t.replace(/\bthe\s+[a-z]+'s\b/g, "the {noun}'s");
  t = t.replace(/\b(on|under|in)\s+the\s+[a-z]+\b/g, "$1 the {place}");
  t = t.replace(/\bwhere'?s\s+the\s+[a-z]+\b/g, "where's the {noun}");
  t = t.replace(/\bis this a[n]?\s+[a-z]+\b/g, "is this a {noun}");
  t = t.replace(/\bwhat'?s this\b/g, "what's this");
  t = t.replace(/\bwhat colour\b/g, "what colour");
  t = t.replace(/\bhow many\b/g, "how many");
  t = t.replace(/\bwho\b/g, "who");
  t = t.replace(/\blook at\b/g, "look at");
  t = t.replace(/\bgive me\b/g, "give me");
  return t.slice(0, 80);
}

function focusInRegistry(focus: string): boolean {
  return SPRITE_REGISTRY.has(focus);
}

async function main() {
  const jsonOut = process.argv.includes("--json");

  const stats = await withClient(async (client) => {
    const { rows } = await client.query<Row>(`
      select q.id, q.question, q.answer, l.lesson_num, b.book_num
      from public.qa_pairs q
      join public.lessons l on l.id = q.lesson_id
      join public.books b on b.id = l.book_id
      where q.qa_category = 'lesson'
        and q.question is not null
      order by b.book_num, l.lesson_num, q.pair_index, q.id
    `);

    const total = rows.length;
    const lessonNums = new Set(rows.map((r) => r.lesson_num));
    const patternCounts: Record<string, number> = {};
    const templateCounts: Record<string, number> = {};
    const qTypeCounts: Record<QuestionType, number> = {} as Record<QuestionType, number>;
    const animCounts: Record<string, number> = {};
    const focusCounts: Record<string, number> = {};

    let emptyQ = 0;
    let invalidVisual = 0;
    let focusFallbackPen = 0;
    let conceptCard = 0;
    let unmatchedSpriteFocus = 0;

    const unmatchedSamples: { lesson: number; q: string; a: string; focus: string }[] = [];
    const gapSamples: { lesson: number; q: string; a: string; qType: QuestionType }[] = [];

    for (const p of PATTERNS) patternCounts[p.id] = 0;

    for (const row of rows) {
      const q = (row.question ?? "").trim();
      const a = (row.answer ?? "").trim();
      const text = `${q} ${a}`;

      if (!q) emptyQ++;

      for (const p of PATTERNS) {
        if (p.id === "empty_q") {
          if (!q) patternCounts[p.id]!++;
        } else if (p.id === "negation") {
          if (p.re.test(a)) patternCounts[p.id]!++;
        } else if (p.re.test(q) || (p.id !== "yes_answer" && p.re.test(text))) {
          if (p.id === "yes_answer" && p.re.test(a)) patternCounts[p.id]!++;
          else if (p.id !== "yes_answer" && p.re.test(q)) patternCounts[p.id]!++;
          else if (p.id === "spatial_on_under_in" && p.re.test(text)) patternCounts[p.id]!++;
        }
      }

      if (PATTERNS.find((p) => p.id === "spatial_on_under_in")!.re.test(text)) {
        patternCounts.spatial_on_under_in!++;
      }
      if (/^yes\b/i.test(a)) patternCounts.yes_answer! = (patternCounts.yes_answer ?? 0) + 1;
      if (!q) patternCounts.empty_q!++;
      if (/^\*+$/.test(q)) patternCounts.star_q!++;
      if (/^[a-z]+$/i.test(q) && q.length < 20) patternCounts.single_word_q!++;

      const tpl = questionTemplate(q);
      templateCounts[tpl] = (templateCounts[tpl] ?? 0) + 1;

      const qType = detectQuestionType(q, a);
      qTypeCounts[qType] = (qTypeCounts[qType] ?? 0) + 1;

      const sceneTpl = resolveSceneTemplate(q, a);
      const vs = inferVisualState(q, a);

      animCounts[vs.animation] = (animCounts[vs.animation] ?? 0) + 1;
      focusCounts[vs.focus] = (focusCounts[vs.focus] ?? 0) + 1;

      if (!isValidVisualState(vs)) invalidVisual++;
      if (vs.template === "concept_card" || vs.animation === "none") conceptCard++;
      if (vs.focus === "pen" && !/\bpen\b/i.test(`${q} ${a}`) && q) {
        const nounsInText = /\b(pen|pencil|book|table|chair|box|clock|door|window|light|man|woman|boy|girl)\b/i.test(text);
        if (!nounsInText) focusFallbackPen++;
      }
      if (vs.focus && !focusInRegistry(vs.focus)) unmatchedSpriteFocus++;

      const registryTypes = new Set([
        "identify_what",
        "identify_is_a",
        "spatial_where",
        "spatial_relation",
        "negation",
        "size_contrast",
        "colour",
      ]);
      if (
        q &&
        !registryTypes.has(qType) &&
        gapSamples.length < 30
      ) {
        gapSamples.push({ lesson: row.lesson_num, q, a, qType });
      }

      if (
        vs.focus === "pen" &&
        focusFallbackPen > 0 &&
        unmatchedSamples.length < 25 &&
        !/\bpen\b/i.test(text)
      ) {
        unmatchedSamples.push({ lesson: row.lesson_num, q, a, focus: vs.focus });
      }
    }

    const topTemplates = Object.entries(templateCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25);

    const lessonBuckets: Record<string, Row[]> = {
      "1-3": [],
      "4-10": [],
      "11-50": [],
      "51-100": [],
      "101+": [],
    };
    for (const row of rows) {
      const n = row.lesson_num;
      if (n <= 3) lessonBuckets["1-3"]!.push(row);
      else if (n <= 10) lessonBuckets["4-10"]!.push(row);
      else if (n <= 50) lessonBuckets["11-50"]!.push(row);
      else if (n <= 100) lessonBuckets["51-100"]!.push(row);
      else lessonBuckets["101+"]!.push(row);
    }

    function bucketStats(bucket: Row[]) {
      const types: Record<string, number> = {};
      const pats: Record<string, number> = {};
      for (const p of PATTERNS) pats[p.id] = 0;
      for (const row of bucket) {
        const q = row.question.trim();
        const a = (row.answer ?? "").trim();
        const qType = detectQuestionType(q, a);
        types[qType] = (types[qType] ?? 0) + 1;
        for (const p of PATTERNS) {
          if (p.id === "empty_q" && !q) pats[p.id]!++;
          else if (p.id === "negation" && p.re.test(a)) pats[p.id]!++;
          else if (p.id !== "empty_q" && p.id !== "negation" && p.re.test(q)) pats[p.id]!++;
        }
      }
      return { count: bucket.length, qTypes: types, patterns: pats };
    }

    const deepDive = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((ln) => {
      const subset = rows.filter((r) => r.lesson_num === ln);
      const types: Record<string, number> = {};
      const samples: { q: string; a: string; qType: QuestionType; templateId: string }[] = [];
      for (const row of subset.slice(0, 5)) {
        const q = row.question.trim();
        const a = (row.answer ?? "").trim();
        const qType = detectQuestionType(q, a);
        types[qType] = (types[qType] ?? 0) + 1;
        samples.push({
          q: q.slice(0, 60),
          a: a.slice(0, 60),
          qType,
          templateId: resolveSceneTemplate(q, a).id,
        });
      }
      for (const row of subset) {
        const qType = detectQuestionType(row.question.trim(), (row.answer ?? "").trim());
        types[qType] = (types[qType] ?? 0) + 1;
      }
      return { lesson_num: ln, total: subset.length, qTypes: types, sample: samples };
    });

    const ruleCoveragePct =
      total > 0
        ? Math.round(((total - invalidVisual - emptyQ) / total) * 1000) / 10
        : 0;

    const typedCoveragePct =
      total > 0
        ? Math.round(((total - (qTypeCounts.concept ?? 0)) / total) * 1000) / 10
        : 0;

    return {
      total,
      lessonCount: lessonNums.size,
      bookRange: {
        min: Math.min(...rows.map((r) => r.book_num)),
        max: Math.max(...rows.map((r) => r.book_num)),
      },
      emptyQ,
      invalidVisual,
      conceptCard,
      focusFallbackPen,
      ruleCoveragePct,
      typedCoveragePct,
      patternCounts,
      qTypeCounts,
      animCounts,
      focusCounts: Object.entries(focusCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20),
      topTemplates,
      lessonBuckets: Object.fromEntries(
        Object.entries(lessonBuckets).map(([k, v]) => [k, bucketStats(v)])
      ),
      deepDive,
      gapSamples: gapSamples.slice(0, 20),
      focusFallbackSamples: unmatchedSamples.slice(0, 15),
    };
  });

  const outPath = resolve(import.meta.dirname, "../docs/_qa_corpus_survey.json");
  writeFileSync(outPath, JSON.stringify(stats, null, 2));

  if (jsonOut) {
    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  console.log("=== QA Corpus Survey ===\n");
  console.log(`Total qa_pairs (lesson): ${stats.total}`);
  console.log(`Lessons with Q&A: ${stats.lessonCount}`);
  console.log(`Rule visual valid coverage: ~${stats.ruleCoveragePct}%`);
  console.log(`detectQuestionType non-concept: ~${stats.typedCoveragePct}%`);
  console.log(`Focus fallback to pen (no noun in text): ${stats.focusFallbackPen}`);
  console.log(`Empty questions: ${stats.emptyQ}`);
  console.log("\n--- Question types ---");
  for (const [k, v] of Object.entries(stats.qTypeCounts).sort(
    (a, b) => (b[1] as number) - (a[1] as number)
  )) {
    console.log(`  ${k}: ${v}`);
  }
  console.log("\n--- Pattern counts ---");
  for (const [k, v] of Object.entries(stats.patternCounts).sort(
    (a, b) => (b[1] as number) - (a[1] as number)
  )) {
    console.log(`  ${k}: ${v}`);
  }
  console.log("\n--- Top 20 question templates ---");
  for (const [t, c] of stats.topTemplates.slice(0, 20)) {
    console.log(`  ${c}\t${t}`);
  }
  console.log(`\nFull JSON: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
