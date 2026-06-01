// 【可展开实现】数据 checklist —— 机器查：数量/空值/计数一致。
// 主流程在 ../lesson1.test.ts。改具体检查项，改这里。

import type { LessonData } from "../_lesson-fixture"

/**
 * 数据验证清单（与报告逐条对应）：
 *   【课程元信息】1.入门阶段(stage=1)  2.难度A1  3.标准课
 *   【课文块】    4.有课文块  5.无空块  6.块类型有层次
 *   【问答对】    7.有问答对  8.问答无残缺
 *   【术语】      9.有术语  10.全有释义  11.全有音标
 *   【计数一致】  12.block_count  13.qa_count(⚠️当前62vs59)  14.term_count
 */
export function dataChecklist(d: LessonData): Array<[string, unknown, boolean]> {
  return [
    // ── 课程元信息 ──
    ["是入门阶段（stage=1）", d.meta.stage, Number(d.meta.stage) === 1],
    ["难度 A1", d.meta.cefr_level, /A1/.test(d.meta.cefr_level)],
    ["标准课", d.meta.lesson_type, d.meta.lesson_type === "standard"],
    // ── 课文块 ──
    ["有课文块", d.blocks, d.blocks > 0],
    ["无空块", d.blocks_empty, d.blocks_empty === 0],
    ["块类型有层次（>1种）", d.block_types, d.block_types > 1],
    // ── 问答对 ──
    ["有问答对", d.qa, d.qa > 0],
    ["问答无残缺", d.qa_incomplete, d.qa_incomplete === 0],
    // ── 术语单词卡 ──
    ["有术语", d.terms, d.terms > 0],
    ["术语全有释义", `${d.terms_with_def}/${d.terms}`, d.terms_with_def === d.terms],
    ["术语全有音标", `${d.terms_with_phonetic}/${d.terms}`, d.terms_with_phonetic === d.terms],
    // ── 计数一致性（表记录 vs 实际） ──
    ["block_count 一致", `${d.meta.block_count} vs ${d.blocks}`, d.meta.block_count === d.blocks],
    ["qa_count 一致", `${d.meta.qa_count} vs ${d.qa}`, d.meta.qa_count === d.qa],
    ["term_count 一致", `${d.meta.term_count} vs ${d.terms}`, d.meta.term_count === d.terms],
  ]
}
