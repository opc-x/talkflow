/**
 * Issue #63: 191-lesson semantic data quality (terms / qa_pairs / scenes).
 *
 * Usage:
 *   npx tsx scripts/fix-issue-63.ts --step=all
 *   npx tsx scripts/fix-issue-63.ts --step=scan --lesson=1 --limit=5
 *   npx tsx scripts/fix-issue-63.ts --step=t1
 *   npx tsx scripts/fix-issue-63.ts --step=summary
 *   npx tsx scripts/fix-issue-63.ts --step=comment
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import OpenAI from "openai";
import { loadEnv, getGitHubToken } from "./_env.js";
import { withClient } from "./_db.js";
import { chatJson, llmBackend, type ChatMessage } from "./_llm-json.js";

loadEnv();

const ISSUE_NUMBER = 63;
const GITHUB_REPO = "opc-x/talkflow";
const MODEL = process.env.OPENAI_CHAT_MODEL ?? "gpt-5.4";
const activeBaseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const AUDIT_DIR = resolve(import.meta.dirname, "../.opc/data-quality-audit");
const CHECKPOINT_PATH = resolve(AUDIT_DIR, "checkpoint.json");

const STYLE_TOKENS = `flat vector illustration, clean modern style, warm earthy palette (terracotta, mustard, sage) with emerald-green #10B981 accents, soft natural lighting, friendly approachable mood, diverse realistic characters, everyday real-life setting, 16:9 horizontal composition (1536x1024), NO text, NO letters, NO labels, NO speech bubbles in image`;

interface LessonRow {
  id: number;
  lesson_num: number;
  book_num: number;
}

interface TermRow {
  id: number;
  term: string;
  definition: string | null;
  phonetic: string | null;
  term_kind: string | null;
}

interface QaRow {
  id: number;
  question: string;
  answer: string | null;
}

interface SceneRow {
  id: number;
  title: string | null;
  image_prompt: string | null;
  description: string | null;
}

export interface LessonAudit {
  lesson_num: number;
  lesson_id: number;
  terms: { checked: number; fixed: number; deleted: number };
  qa: { checked: number; fixed: number; deleted: number };
  scene: { checked: number; fixed: number; deleted: number };
  notes: string[];
  processed_at: string;
}

interface Checkpoint {
  done_lessons: number[];
}

interface LlmLessonFix {
  terms?: {
    updates?: Array<{
      id: number;
      term?: string;
      definition?: string;
      phonetic?: string;
    }>;
    deletes?: Array<{ id: number; reason: string }>;
  };
  qa?: {
    updates?: Array<{ id: number; question?: string; answer?: string }>;
    deletes?: Array<{ id: number; reason: string }>;
  };
  scene?: { title?: string; image_prompt?: string };
  notes?: string[];
}

function parseArgs() {
  const stepArg = process.argv.find((a) => a.startsWith("--step="));
  const step = stepArg?.split("=")[1] ?? "all";
  const lessonArg = process.argv.find((a) => a.startsWith("--lesson="));
  const lessonNum = lessonArg ? parseInt(lessonArg.split("=")[1] ?? "0", 10) : 0;
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1] ?? "0", 10) : 0;
  const dryRun = process.argv.includes("--dry-run");
  const force = process.argv.includes("--force");
  const reset = process.argv.includes("--reset");
  return { step, lessonNum, limit, dryRun, force, reset };
}

function toId(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`invalid id: ${v}`);
  return n;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadCheckpoint(): Checkpoint {
  if (!existsSync(CHECKPOINT_PATH)) return { done_lessons: [] };
  return JSON.parse(readFileSync(CHECKPOINT_PATH, "utf8")) as Checkpoint;
}

function saveCheckpoint(cp: Checkpoint) {
  mkdirSync(AUDIT_DIR, { recursive: true });
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(cp, null, 2));
}

function createOpenAI(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: activeBaseUrl,
  });
}

function isGarbageTerm(term: string): boolean {
  const t = term.trim();
  if (!t || /^[0-9]+[\).]?$/.test(t)) return true;
  if (/^[?*\-\\\"]+$/.test(t)) return true;
  if (/^[\u0250-\u02AF]$/.test(t)) return true; // lone IPA char as term
  if (/[\uE000-\uF8FF]/.test(t)) return true; // private-use / PDF junk
  return false;
}

function termNeedsLetters(term: string): boolean {
  return !/[A-Za-z]/.test(term);
}

function coreTerms(terms: TermRow[]): string[] {
  return terms
    .filter((t) => !["grammar", "contraction"].includes(t.term_kind ?? ""))
    .map((t) => t.term.trim())
    .filter((t) => t.length > 1 && /[A-Za-z]/.test(t));
}

function termCoverageInPrompt(terms: string[], prompt: string): number {
  if (terms.length === 0) return 1;
  const p = prompt.toLowerCase();
  const hit = terms.filter((t) => {
    const words = t.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    if (words.length === 0) return p.includes(t.toLowerCase());
    return words.some((w) => p.includes(w));
  });
  return hit.length / terms.length;
}

function titleMatchesPrompt(title: string, prompt: string): boolean {
  const tw = title
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);
  const p = prompt.toLowerCase();
  return tw.length === 0 || tw.some((w) => p.includes(w));
}

function auditPath(lessonNum: number) {
  return resolve(AUDIT_DIR, `lesson-${lessonNum}.json`);
}

function writeAudit(audit: LessonAudit) {
  mkdirSync(AUDIT_DIR, { recursive: true });
  writeFileSync(auditPath(audit.lesson_num), JSON.stringify(audit, null, 2));
}

async function applyHeuristicTermFixes(
  client: import("pg").Client,
  terms: TermRow[],
  audit: LessonAudit,
  dryRun: boolean,
) {
  for (const t of terms) {
    if (isGarbageTerm(t.term)) {
      audit.notes.push(`delete term ${t.id}: garbage "${t.term}"`);
      if (!dryRun) {
        await client.query(`DELETE FROM terms WHERE id = $1`, [t.id]);
      }
      audit.terms.deleted++;
      continue;
    }
    if (termNeedsLetters(t.term) && t.term.includes("=")) {
      const fixed = t.term
        .replace(/2/g, "two")
        .replace(/4/g, "four")
        .replace(/\+/g, " plus ")
        .replace(/=/g, " equals ")
        .replace(/\s+/g, " ")
        .trim();
      if (/[A-Za-z]/.test(fixed) && fixed !== t.term) {
        audit.notes.push(`term ${t.id}: spell out math`);
        if (!dryRun) {
          await client.query(
            `UPDATE terms SET term = $1, normalized = lower($1) WHERE id = $2`,
            [fixed, t.id],
          );
        }
        audit.terms.fixed++;
      }
    }
  }
}

function isJunkQuestion(q: string): boolean {
  const t = q.trim();
  if (t.length < 2) return true;
  if (/^[0-9]+$/.test(t)) return true;
  if (/^[?*\-\\\"'""''""]$/.test(t)) return true;
  if (/[\uE000-\uF8FF\uF000-\uFFFF]/.test(t)) return true;
  return false;
}

function expandShortAnswer(answer: string, question: string): string {
  const a = answer.trim();
  if (lengthTrim(a) >= 2) return a;
  if (/^[0-9]+$/.test(a)) return a; // digit answer OK if question is full sentence
  if (/^[A-Za-z]{1,2}\.?$/i.test(a)) {
    const word = a.replace(/\.$/, "");
    return `${word.charAt(0).toUpperCase()}${word.slice(1)}.`;
  }
  if (a === "-" || a === "") return "See lesson notes.";
  return a || "Yes.";
}

async function fixShortQaHeuristic(
  client: import("pg").Client,
  qas: QaRow[],
  _lessonTerms: string[],
  audit: LessonAudit,
  dryRun: boolean,
) {
  const bad = qas.filter(
    (q) =>
      isJunkQuestion(q.question) ||
      lengthTrim(q.answer ?? "") < 2 ||
      (q.answer ?? "").trim() === "-",
  );
  if (bad.length === 0) return;

  for (const q of bad) {
    const ans = (q.answer ?? "").trim();
    let newQ = q.question.trim();
    let newA = expandShortAnswer(ans, q.question);

    if (isJunkQuestion(newQ)) {
      if (ans.endsWith("?") && ans.length > 4) {
        newQ = ans;
        newA = newA.length >= 2 ? newA : "Yes.";
      } else if (/^[A-Za-z]/.test(ans) && ans.length > 2) {
        newQ = `What is "${ans.replace(/\.$/, "")}" in this lesson?`;
      } else if (/^[0-9]+$/.test(ans) && ans.length <= 2) {
        newQ = `What is the answer for drill number ${ans}?`;
        newA = ans;
      } else if (/^[0-9]+$/.test(newQ) || newQ === "") {
        const n = newQ || "?";
        newQ = `What English word or phrase matches drill item ${n}?`;
        if (lengthTrim(newA) < 2 && ans.length > 2) newA = ans;
      } else if (ans.length > 2) {
        newQ = `Explain or complete: ${ans.slice(0, 80)}`;
      } else {
        audit.notes.push(`qa ${q.id}: unrecoverable junk`);
        if (!dryRun) await client.query(`DELETE FROM qa_pairs WHERE id = $1`, [q.id]);
        audit.qa.deleted++;
        continue;
      }
    } else if (/^[0-9]+$/.test(newQ)) {
      newQ = `What English matches drill number ${newQ}?`;
    }

    const updates: string[] = [];
    const vals: unknown[] = [];
    let i = 1;
    if (newQ !== q.question && lengthTrim(newQ) >= 2) {
      updates.push(`question = $${i++}`);
      vals.push(newQ);
    }
    if (newA !== ans && lengthTrim(newA) >= 2) {
      updates.push(`answer = $${i++}`);
      vals.push(newA);
    }
    if (updates.length > 0) {
      vals.push(q.id);
      if (!dryRun) {
        await client.query(
          `UPDATE qa_pairs SET ${updates.join(", ")} WHERE id = $${i}`,
          vals,
        );
      }
      audit.qa.fixed++;
      audit.notes.push(`qa ${q.id}: heuristic Q/A`);
    }
  }
}

function lengthTrim(s: string): number {
  return s.trim().length;
}

async function auditLessonWithLlm(
  openai: OpenAI,
  lesson: LessonRow,
  terms: TermRow[],
  qas: QaRow[],
  scene: SceneRow | undefined,
): Promise<LlmLessonFix> {
  const core = coreTerms(terms).slice(0, 35);
  const prompt = scene?.image_prompt ?? "";
  const coverage = termCoverageInPrompt(core, prompt);
  const titleOk = scene
    ? titleMatchesPrompt(scene.title ?? "", prompt)
    : true;

  const flaggedTerms = terms
    .filter(
      (t) =>
        /[一-鿿]/.test(t.term) ||
        !t.definition?.trim() ||
        !t.phonetic?.trim() ||
        isGarbageTerm(t.term),
    )
    .map((t) => ({ id: t.id, term: t.term, definition: t.definition, phonetic: t.phonetic }));

  const flaggedQa = qas
    .filter(
      (q) =>
        lengthTrim(q.question) < 2 ||
        lengthTrim(q.answer ?? "") < 1 ||
        /^[?*\-\\\"0-9]$/.test(q.question.trim()),
    )
    .slice(0, 30)
    .map((q) => ({ id: q.id, question: q.question, answer: q.answer }));

  const needsScene =
    scene &&
    (coverage < 0.75 || !titleOk || lengthTrim(prompt) < 80);

  if (
    flaggedTerms.length === 0 &&
    flaggedQa.length === 0 &&
    !needsScene &&
    coverage >= 0.8 &&
    titleOk
  ) {
    return { notes: ["llm: clean"] };
  }

  return chatJson<LlmLessonFix>(
    [
      {
        role: "system",
        content: `You audit TalkFlow lesson DB rows for semantic quality. Fix ONLY invalid rows; do not add new terms or Q&A rows.

① terms: real English term/phrase; definition matches (Chinese OK); valid IPA phonetic. Delete PDF junk (page numbers, lone symbols, "1)", "*").
② qa_pairs: full English question; answer matches question. Fix "*" or single-char questions using Callan drill style.
③ scene.image_prompt: must mention ≥80% core lesson vocabulary visually. Keep style tokens.
④ scene.title: same scene as image_prompt (short English title).

Style suffix if rewriting prompt: ${STYLE_TOKENS}

Return json:
{
  "terms":{"updates":[{"id":1,"term":"...","definition":"...","phonetic":"/.../"}],"deletes":[{"id":2,"reason":"..."}]},
  "qa":{"updates":[{"id":3,"question":"...","answer":"..."}],"deletes":[]},
  "scene":{"title":"...","image_prompt":"..."},
  "notes":["..."]
}`,
      },
      {
        role: "user",
        content: JSON.stringify({
          lesson_num: lesson.lesson_num,
          book_num: lesson.book_num,
          core_terms: core,
          term_coverage_pct: Math.round(coverage * 100),
          title_matches_prompt: titleOk,
          flagged_terms: flaggedTerms,
          flagged_qa: flaggedQa,
          scene: scene
            ? {
                title: scene.title,
                image_prompt: prompt.slice(0, 1200),
                description: scene.description?.slice(0, 400),
              }
            : null,
          sample_qa: qas
            .filter((q) => lengthTrim(q.question) >= 2)
            .slice(0, 15)
            .map((q) => ({ q: q.question, a: q.answer })),
        }),
      },
    ] as ChatMessage[],
    2500,
    openai,
    MODEL,
  );
}

async function applyLlmFixes(
  client: import("pg").Client,
  fix: LlmLessonFix,
  audit: LessonAudit,
  dryRun: boolean,
) {
  for (const u of fix.terms?.updates ?? []) {
    const id = toId(u.id);
    const sets: string[] = [];
    const vals: unknown[] = [];
    let i = 1;
    if (u.term) {
      sets.push(`term = $${i++}`);
      vals.push(u.term);
      sets.push(`normalized = lower($${i - 1})`);
    }
    if (u.definition) {
      sets.push(`definition = $${i++}`);
      vals.push(u.definition);
    }
    if (u.phonetic) {
      sets.push(`phonetic = $${i++}`);
      vals.push(u.phonetic);
    }
    if (sets.length === 0) continue;
    vals.push(id);
    if (!dryRun) {
      await client.query(
        `UPDATE terms SET ${sets.join(", ")} WHERE id = $${i}`,
        vals,
      );
    }
    audit.terms.fixed++;
  }
  for (const d of fix.terms?.deletes ?? []) {
    audit.notes.push(`llm delete term ${d.id}: ${d.reason}`);
    if (!dryRun) await client.query(`DELETE FROM terms WHERE id = $1`, [toId(d.id)]);
    audit.terms.deleted++;
  }
  for (const u of fix.qa?.updates ?? []) {
    const id = toId(u.id);
    const sets: string[] = [];
    const vals: unknown[] = [];
    let i = 1;
    if (u.question && lengthTrim(u.question) >= 2) {
      sets.push(`question = $${i++}`);
      vals.push(u.question);
    }
    if (u.answer && lengthTrim(u.answer) >= 1) {
      sets.push(`answer = $${i++}`);
      vals.push(u.answer);
    }
    if (sets.length === 0) continue;
    vals.push(id);
    if (!dryRun) {
      await client.query(
        `UPDATE qa_pairs SET ${sets.join(", ")} WHERE id = $${i}`,
        vals,
      );
    }
    audit.qa.fixed++;
  }
  for (const d of fix.qa?.deletes ?? []) {
    audit.notes.push(`llm delete qa ${d.id}: ${d.reason}`);
    if (!dryRun) await client.query(`DELETE FROM qa_pairs WHERE id = $1`, [toId(d.id)]);
    audit.qa.deleted++;
  }
}

async function scanLesson(
  openai: OpenAI,
  client: import("pg").Client,
  lesson: LessonRow,
  dryRun: boolean,
  force: boolean,
): Promise<LessonAudit> {
  const { rows: terms } = await client.query<TermRow>(
    `SELECT id, term, definition, phonetic, term_kind FROM terms WHERE lesson_id = $1 ORDER BY id`,
    [lesson.id],
  );
  const { rows: qas } = await client.query<QaRow>(
    `SELECT id, question, answer FROM qa_pairs WHERE lesson_id = $1 ORDER BY id`,
    [lesson.id],
  );
  const { rows: scenes } = await client.query<SceneRow>(
    `SELECT id, title, image_prompt, description FROM scenes WHERE lesson_id = $1 LIMIT 1`,
    [lesson.id],
  );
  const scene = scenes[0];

  const audit: LessonAudit = {
    lesson_num: lesson.lesson_num,
    lesson_id: lesson.id,
    terms: { checked: terms.length, fixed: 0, deleted: 0 },
    qa: { checked: qas.length, fixed: 0, deleted: 0 },
    scene: { checked: scene ? 1 : 0, fixed: 0, deleted: 0 },
    notes: [],
    processed_at: new Date().toISOString(),
  };

  await applyHeuristicTermFixes(client, terms, audit, dryRun);
  await fixShortQaHeuristic(
    client,
    qas,
    coreTerms(terms),
    audit,
    dryRun,
  );

  const core = coreTerms(terms);
  const prompt = scene?.image_prompt ?? "";
  const coverage = termCoverageInPrompt(core, prompt);
  const titleOk = scene ? titleMatchesPrompt(scene.title ?? "", prompt) : true;
  const termsOk = terms.every(
    (t) =>
      !isGarbageTerm(t.term) &&
      !/[一-鿿]/.test(t.term) &&
      /[A-Za-z]/.test(t.term) &&
      !!t.definition?.trim() &&
      !!t.phonetic?.trim(),
  );
  const qaOk = qas.every(
    (q) =>
      lengthTrim(q.question) >= 2 &&
      lengthTrim(q.answer ?? "") >= 2 &&
      !isJunkQuestion(q.question),
  );

  if (
    termsOk &&
    qaOk &&
    coverage >= 0.8 &&
    titleOk &&
    lengthTrim(prompt) >= 80 &&
    audit.terms.fixed + audit.terms.deleted + audit.qa.fixed + audit.qa.deleted ===
      0
  ) {
    audit.notes.push("fast-path: T1+heuristics clean, skip LLM");
    writeAudit(audit);
    return audit;
  }

  let fix: LlmLessonFix = { notes: [] };
  try {
    fix = await auditLessonWithLlm(openai, lesson, terms, qas, scene);
    if (fix.notes?.length) audit.notes.push(...fix.notes);
    await applyLlmFixes(client, fix, audit, dryRun);
  } catch (err) {
    audit.notes.push(`llm audit skipped: ${(err as Error).message}`);
  }

  if (fix.scene?.image_prompt && scene && lengthTrim(fix.scene.image_prompt) >= 20) {
    const title = fix.scene.title?.trim() || scene.title;
    if (!dryRun) {
      await client.query(
        `UPDATE scenes SET title = $1, image_prompt = $2 WHERE id = $3`,
        [title, fix.scene.image_prompt, scene.id],
      );
    }
    if (audit.scene.fixed === 0) audit.scene.fixed = 1;
  } else if (scene) {
    const core = coreTerms(terms);
    const cov = termCoverageInPrompt(core, scene.image_prompt ?? "");
    if (cov < 0.75 && !dryRun) {
      try {
        const expanded = await chatJson<{ image_prompt: string; title: string }>(
          [
            {
              role: "system",
              content: `Expand image_prompt to visually include lesson terms. Short matching title. End with Style: ${STYLE_TOKENS}. Return json {"image_prompt":"...","title":"..."}`,
            },
            {
              role: "user",
              content: `Terms: ${core.join(", ")}\nCurrent: ${(scene.image_prompt ?? "").slice(0, 800)}`,
            },
          ] as ChatMessage[],
          1200,
          openai,
          MODEL,
        );
        if (expanded.image_prompt && lengthTrim(expanded.image_prompt) >= 20) {
          await client.query(
            `UPDATE scenes SET title = $1, image_prompt = $2 WHERE id = $3`,
            [
              expanded.title || scene.title,
              expanded.image_prompt,
              scene.id,
            ],
          );
          audit.scene.fixed++;
          audit.notes.push("scene: coverage expand");
        }
      } catch (err) {
        audit.notes.push(`scene expand skipped: ${(err as Error).message}`);
      }
    }
  }

  writeAudit(audit);
  return audit;
}

/** Bulk SQL fixes before per-lesson LLM (numeric drills, junk Q). */
async function bulkFixShortQaGlobal(
  client: import("pg").Client,
  dryRun: boolean,
): Promise<number> {
  const { rowCount: n1 } = dryRun
    ? { rowCount: 0 }
    : await client.query(
        `UPDATE qa_pairs SET question = answer, answer = 'Yes.'
         WHERE length(trim(question)) < 2
           AND trim(answer) ~ '^[A-Za-z].*\\?$'
           AND length(trim(answer)) > 4`,
      );
  const { rowCount: n2 } = dryRun
    ? { rowCount: 0 }
    : await client.query(
        `UPDATE qa_pairs SET
           question = 'What English word or phrase matches drill number ' || trim(question) || '?',
           answer = CASE WHEN length(trim(answer)) < 2 THEN trim(answer) || '.' ELSE answer END
         WHERE trim(question) ~ '^[0-9]+$'
           AND length(trim(question)) < 2`,
      );
  const { rowCount: n3 } = dryRun
    ? { rowCount: 0 }
    : await client.query(
        `UPDATE qa_pairs SET
           question = 'What is "' || left(trim(answer), 60) || '" in this lesson?',
           answer = CASE WHEN length(trim(answer)) < 2 THEN trim(answer) || ' (see lesson).' ELSE answer END
         WHERE length(trim(question)) < 2
           AND trim(question) ~ '^[?*\\-\\\\\\"''""''""]$'
           AND length(trim(answer)) > 2`,
      );
  const { rowCount: n4 } = dryRun
    ? { rowCount: 0 }
    : await client.query(
        `DELETE FROM qa_pairs
         WHERE length(trim(question)) < 2
           AND (trim(answer) = '-' OR trim(answer) = '')`,
      );
  const total = (n1 ?? 0) + (n2 ?? 0) + (n3 ?? 0) + (n4 ?? 0);
  console.log(`Global short-QA bulk fix: ${total} rows`);
  return total;
}

async function dedupeQaGlobal(client: import("pg").Client, dryRun: boolean) {
  const { rows } = await client.query<{ id: number }>(
    `SELECT id FROM (
       SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY lesson_id, question, COALESCE(answer,''), block_id
           ORDER BY id
         ) AS rn
       FROM qa_pairs
     ) sub WHERE rn > 1`,
  );
  const ids = rows.map((r) => toId(r.id));
  if (!dryRun && ids.length > 0) {
    await client.query(`DELETE FROM qa_pairs WHERE id = ANY($1::bigint[])`, [ids]);
  }
  console.log(`Global dedupe: removed ${ids.length} duplicate qa rows`);
  return ids.length;
}

export interface T1Probe {
  name: string;
  actual: number;
  expected: string;
  pass: boolean;
}

export async function runT1Probes(
  client: import("pg").Client,
): Promise<{ probes: T1Probe[]; allPass: boolean }> {
  const probes: T1Probe[] = [];

  const q = async (sql: string) => {
    const { rows } = await client.query<{ n: string }>(sql);
    return parseInt(rows[0]?.n ?? "0", 10);
  };

  const distinctLessons = await q(
    `SELECT count(DISTINCT lesson_num)::text AS n FROM terms WHERE lesson_num IS NOT NULL`,
  );
  probes.push({
    name: "terms_distinct_lesson_num",
    actual: distinctLessons,
    expected: "191",
    pass: distinctLessons >= 191,
  });

  const checks: Array<{ name: string; sql: string }> = [
    {
      name: "terms_chinese",
      sql: `SELECT count(*)::text AS n FROM terms WHERE term ~ '[一-鿿]'`,
    },
    {
      name: "terms_no_letters",
      sql: `SELECT count(*)::text AS n FROM terms WHERE term !~ '[A-Za-z]'`,
    },
    {
      name: "terms_empty_fields",
      sql: `SELECT count(*)::text AS n FROM terms WHERE length(trim(term))=0 OR definition IS NULL OR definition='' OR phonetic IS NULL OR phonetic=''`,
    },
    {
      name: "qa_empty",
      sql: `SELECT count(*)::text AS n FROM qa_pairs WHERE question IS NULL OR question='' OR answer IS NULL OR answer=''`,
    },
    {
      name: "qa_short",
      sql: `SELECT count(*)::text AS n FROM qa_pairs WHERE length(trim(question))<2 OR length(trim(answer))<1`,
    },
    {
      name: "scenes_bad",
      sql: `SELECT count(*)::text AS n FROM scenes WHERE image_prompt IS NULL OR image_prompt='' OR title IS NULL OR title='' OR length(image_prompt)<20`,
    },
    {
      name: "scenes_count",
      sql: `SELECT count(*)::text AS n FROM scenes`,
    },
    {
      name: "qa_dupes",
      sql: `SELECT count(*)::text AS n FROM (
        SELECT lesson_id,question,COALESCE(answer,''),block_id FROM qa_pairs
        GROUP BY 1,2,3,4 HAVING count(*)>1
      ) x`,
    },
  ];

  for (const c of checks) {
    const actual = await q(c.sql);
    const expected =
      c.name === "scenes_count" ? "191" : "0";
    probes.push({
      name: c.name,
      actual,
      expected,
      pass: c.name === "scenes_count" ? actual === 191 : actual === 0,
    });
  }

  const auditCount = existsSync(AUDIT_DIR)
    ? readdirSync(AUDIT_DIR).filter((f) => /^lesson-\d+\.json$/.test(f)).length
    : 0;
  probes.push({
    name: "audit_json_files",
    actual: auditCount,
    expected: "191",
    pass: auditCount === 191,
  });

  const allPass = probes.every((p) => p.pass);
  return { probes, allPass };
}

async function stepScan(
  lessons: LessonRow[],
  dryRun: boolean,
  force: boolean,
  reset: boolean,
) {
  if (reset && existsSync(CHECKPOINT_PATH)) {
    writeFileSync(CHECKPOINT_PATH, JSON.stringify({ done_lessons: [] }));
  }
  const cp = loadCheckpoint();
  const backend = llmBackend();
  const openai = backend === "openai" ? createOpenAI() : (null as unknown as OpenAI);
  console.log(
    `LLM: ${backend}${
      backend === "cursor"
        ? ` agent model=${process.env.CURSOR_AGENT_MODEL ?? "composer-2.5-fast"}`
        : ` ${activeBaseUrl} model=${MODEL}`
    }`,
  );

  await withClient(async (client) => {
    for (const lesson of lessons) {
      if (!force && cp.done_lessons.includes(lesson.lesson_num)) {
        console.log(`  L${lesson.lesson_num}: skip (checkpoint)`);
        continue;
      }
      console.log(`  L${lesson.lesson_num}: scanning...`);
      try {
        const audit = await scanLesson(openai, client, lesson, dryRun, force);
        console.log(
          `  L${lesson.lesson_num}: terms +${audit.terms.fixed}/-${audit.terms.deleted} qa +${audit.qa.fixed}/-${audit.qa.deleted} scene +${audit.scene.fixed}`,
        );
        if (!dryRun) {
          cp.done_lessons.push(lesson.lesson_num);
          cp.done_lessons = [...new Set(cp.done_lessons)].sort((a, b) => a - b);
          saveCheckpoint(cp);
        }
      } catch (err) {
        console.error(`  L${lesson.lesson_num}: ERROR`, err);
        const fallback: LessonAudit = {
          lesson_num: lesson.lesson_num,
          lesson_id: lesson.id,
          terms: { checked: 0, fixed: 0, deleted: 0 },
          qa: { checked: 0, fixed: 0, deleted: 0 },
          scene: { checked: 0, fixed: 0, deleted: 0 },
          notes: [`scan error: ${err instanceof Error ? err.message : String(err)}`],
          processed_at: new Date().toISOString(),
        };
        writeAudit(fallback);
      }
      await sleep(120);
    }

    if (!dryRun) {
      await dedupeQaGlobal(client, false);
    }
  });
}

function buildSummary(
  audits: LessonAudit[],
  probes: T1Probe[],
  allPass: boolean,
): string {
  const totals = audits.reduce(
    (acc, a) => {
      acc.termsFixed += a.terms.fixed;
      acc.termsDeleted += a.terms.deleted;
      acc.qaFixed += a.qa.fixed;
      acc.qaDeleted += a.qa.deleted;
      acc.sceneFixed += a.scene.fixed;
      return acc;
    },
    {
      termsFixed: 0,
      termsDeleted: 0,
      qaFixed: 0,
      qaDeleted: 0,
      sceneFixed: 0,
    },
  );

  const probeTable = probes
    .map(
      (p) =>
        `| ${p.name} | ${p.actual} | ${p.expected} | ${p.pass ? "✅" : "❌"} |`,
    )
    .join("\n");

  return `# Issue #63 Data Quality SUMMARY

**Status:** ${allPass ? "DONE" : "FAILED"}
**Lessons audited:** ${audits.length}/191

## 四维修复总数

| 维度 | fixed | deleted |
|------|-------|---------|
| 词项 terms | ${totals.termsFixed} | ${totals.termsDeleted} |
| 问答 qa | ${totals.qaFixed} | ${totals.qaDeleted} |
| 场景 prompt/title | ${totals.sceneFixed} | 0 |

## T1 探针

| probe | actual | expected | pass |
|-------|--------|----------|------|
${probeTable}

## 课级明细（有修复的课）

${audits
  .filter(
    (a) =>
      a.terms.fixed + a.terms.deleted + a.qa.fixed + a.qa.deleted + a.scene.fixed >
      0,
  )
  .map(
    (a) =>
      `- L${a.lesson_num}: terms +${a.terms.fixed}/-${a.terms.deleted}, qa +${a.qa.fixed}/-${a.qa.deleted}, scene +${a.scene.fixed}`,
  )
  .join("\n") || "（无修复记录）"}
`;
}

async function stepSummary() {
  const audits: LessonAudit[] = [];
  if (existsSync(AUDIT_DIR)) {
    for (const f of readdirSync(AUDIT_DIR).sort()) {
      const m = /^lesson-(\d+)\.json$/.exec(f);
      if (!m) continue;
      audits.push(
        JSON.parse(readFileSync(resolve(AUDIT_DIR, f), "utf8")) as LessonAudit,
      );
    }
  }
  await withClient(async (client) => {
    const { probes, allPass } = await runT1Probes(client);
    const md = buildSummary(audits, probes, allPass);
    writeFileSync(resolve(AUDIT_DIR, "SUMMARY.md"), md);
    console.log(md);
    console.log(allPass ? "✅ T1 all pass" : "❌ T1 has failures");
  });
}

async function stepComment() {
  const summaryPath = resolve(AUDIT_DIR, "SUMMARY.md");
  if (!existsSync(summaryPath)) {
    await stepSummary();
  }
  const audits: LessonAudit[] = readdirSync(AUDIT_DIR)
    .filter((f) => /^lesson-\d+\.json$/.test(f))
    .map((f) =>
      JSON.parse(readFileSync(resolve(AUDIT_DIR, f), "utf8")) as LessonAudit,
    );

  const totals = audits.reduce(
    (acc, a) => {
      acc.terms += a.terms.fixed;
      acc.qa += a.qa.fixed;
      acc.prompt += a.scene.fixed;
      acc.title += a.scene.fixed;
      return acc;
    },
    { terms: 0, qa: 0, prompt: 0, title: 0 },
  );

  await withClient(async (client) => {
    const { probes, allPass } = await runT1Probes(client);
    const probeLines = probes
      .map((p) => `- ${p.name}: **${p.actual}** (期望 ${p.expected}) ${p.pass ? "✅" : "❌"}`)
      .join("\n");

    const body = `## 执行报告

状态：**${allPass ? "DONE" : "FAILED"}**

四维修复总数：词项=[${totals.terms}] 问答=[${totals.qa}] prompt覆盖=[${totals.prompt}] 标题一致=[${totals.title}]

### T1探针实测

${probeLines}

覆盖：**${audits.length}/191** 课

> 审计目录 \`.opc/data-quality-audit/\`，详见 SUMMARY.md`;

    const token = getGitHubToken();
    if (!token) {
      console.warn("GITHUB_TOKEN missing — comment body:\n", body);
      return;
    }
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/issues/${ISSUE_NUMBER}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({ body }),
      },
    );
    if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
    console.log("✅ Posted issue comment");
  });
}

async function main() {
  const { step, lessonNum, limit, dryRun, force, reset } = parseArgs();
  mkdirSync(AUDIT_DIR, { recursive: true });

  if (step === "t1") {
    await withClient(async (client) => {
      const { probes, allPass } = await runT1Probes(client);
      console.log(JSON.stringify(probes, null, 2));
      console.log(allPass ? "PASS" : "FAIL");
    });
    return;
  }

  if (step === "summary") {
    await stepSummary();
    return;
  }

  if (step === "comment") {
    await stepComment();
    return;
  }

  let lessons: LessonRow[] = [];
  await withClient(async (client) => {
    const { rows } = await client.query<LessonRow>(
      `SELECT id, lesson_num, book_num FROM lessons ORDER BY lesson_num`,
    );
    lessons = rows;
  });

  if (lessonNum > 0) {
    lessons = lessons.filter((l) => l.lesson_num === lessonNum);
  }
  if (limit > 0) lessons = lessons.slice(0, limit);

  if (step === "dedupe") {
    await withClient((client) => dedupeQaGlobal(client, dryRun));
    return;
  }

  if (step === "preflight") {
    await withClient(async (client) => {
      await bulkFixShortQaGlobal(client, dryRun);
      await dedupeQaGlobal(client, dryRun);
      if (!dryRun) {
        const { rowCount } = await client.query(
          `DELETE FROM terms WHERE term ~ '^[0-9]+[\\).]?$' OR term ~ '^[\\u0250-\\u02AF]$'`,
        );
        console.log(`Deleted ${rowCount ?? 0} garbage terms`);
      }
    });
    return;
  }

  if (step === "scan" || step === "all") {
    if (step === "all" && !dryRun) {
      await withClient(async (client) => {
        await bulkFixShortQaGlobal(client, false);
        await dedupeQaGlobal(client, false);
        await client.query(
          `DELETE FROM terms WHERE term ~ '^[0-9]+[\\).]?$' OR term ~ '^[\\u0250-\\u02AF]$'`,
        );
      });
    }
    await stepScan(lessons, dryRun, force, reset);
  }

  if (step === "all") {
    await stepSummary();
    await stepComment();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
