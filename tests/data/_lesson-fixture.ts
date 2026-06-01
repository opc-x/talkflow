// 取数装置（与测试点无关，一般不用动）—— 连 Supabase 把一节课各维度数据查全。
// 测试文件只 import loadLessonData()，专心写功能点。

import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import pg from "pg"

export type LessonMeta = {
  id?: number
  cefr_level: string
  stage: number
  lesson_type: string
  block_count: number
  qa_count: number
  term_count: number
}

export type LessonData = {
  meta: LessonMeta
  blocks: number
  block_types: number
  blocks_empty: number
  qa: number
  qa_incomplete: number
  terms: number
  terms_with_def: number
  terms_with_phonetic: number
}

function loadDbUrl(): string {
  const root = resolve(__dirname, "../..")
  const envPath = resolve(root, ".env.local")
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const t = line.trim()
      if (!t || t.startsWith("#")) continue
      const eq = t.indexOf("=")
      if (eq <= 0) continue
      const k = t.slice(0, eq).trim()
      if (!process.env[k]) process.env[k] = t.slice(eq + 1).trim()
    }
  }
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  const pwd = process.env.SUPABASE_DB_PASSWORD
  const ref = process.env.SUPABASE_PROJECT_REF ?? "frhtkmpsfyyidqijuijp"
  if (!pwd) throw new Error("缺 DATABASE_URL 或 SUPABASE_DB_PASSWORD（.env.local）")
  return `postgresql://postgres.${ref}:${encodeURIComponent(pwd)}@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres`
}

/** 取指定课的问答文本（给 AI 裁判用）。返回 [{question, answer}] 数组。 */
export async function loadLessonQa(lessonId: number, limit = 20): Promise<Array<{ question: string; answer: string }>> {
  const client = new pg.Client({ connectionString: loadDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    const { rows } = await client.query(
      `SELECT question, answer FROM qa_pairs WHERE lesson_id=$1 ORDER BY pair_index LIMIT $2`,
      [lessonId, limit]
    )
    return rows
  } finally {
    await client.end()
  }
}

/** 取指定课的「术语列表」+「问答全文」，给「术语是否对应课文内容」检查用。 */
export async function loadLessonTermsAndQa(lessonId: number): Promise<{ terms: string[]; qaText: string }> {
  const client = new pg.Client({ connectionString: loadDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    const t = await client.query(
      `SELECT term FROM terms WHERE lesson_id=$1 AND term_kind IN ('word','phrase') ORDER BY id`,
      [lessonId]
    )
    const q = await client.query(
      `SELECT string_agg(lower(question||' '||answer), ' ') AS txt FROM qa_pairs WHERE lesson_id=$1`,
      [lessonId]
    )
    return {
      terms: t.rows.map((r) => r.term as string),
      qaText: (q.rows[0]?.txt as string) ?? "",
    }
  } finally {
    await client.end()
  }
}

/** 连库，查指定课的各维度数据，返回一个扁平对象供功能点断言。用完自动断连。 */
export async function loadLessonData(lessonId: number): Promise<LessonData> {
  const client = new pg.Client({ connectionString: loadDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    const { rows } = await client.query(`
      SELECT
        (SELECT row_to_json(l) FROM (SELECT id, cefr_level, stage, lesson_type, block_count, qa_count, term_count
          FROM lessons WHERE id=$1) l)                                          AS meta,
        (SELECT count(*)::int FROM content_blocks WHERE lesson_id=$1)           AS blocks,
        (SELECT count(DISTINCT block_type)::int FROM content_blocks WHERE lesson_id=$1) AS block_types,
        (SELECT count(*)::int FROM content_blocks WHERE lesson_id=$1 AND (text IS NULL OR text='')) AS blocks_empty,
        (SELECT count(*)::int FROM qa_pairs WHERE lesson_id=$1)                 AS qa,
        (SELECT count(*)::int FROM qa_pairs WHERE lesson_id=$1 AND (question IS NULL OR answer IS NULL)) AS qa_incomplete,
        (SELECT count(*)::int FROM terms WHERE lesson_id=$1)                    AS terms,
        (SELECT count(*)::int FROM terms WHERE lesson_id=$1 AND definition IS NOT NULL) AS terms_with_def,
        (SELECT count(*)::int FROM terms WHERE lesson_id=$1 AND phonetic IS NOT NULL)   AS terms_with_phonetic
    `, [lessonId])
    return rows[0]
  } finally {
    await client.end()
  }
}
