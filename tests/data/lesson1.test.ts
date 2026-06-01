// ════════════════════════════════════════════════════════════════════════
//  🚪 lesson1 数据验证 · 总入口（看这一个文件就懂全流程）
// ════════════════════════════════════════════════════════════════════════
//
//  【这是干啥的】
//    验证 lesson1（第1课）在数据库里的内容到底对不对、好不好。
//    分两层查：机器查数量/格式（快），AI 查内容质量（慢），最后汇总裁决。
//
//  【整条流程一图看懂】每步一个 it，各自独立红绿灯
//
//    取数据 ──┬─► ① 数据检查 (机器) 数量/空值/计数   ─┐
//    (连库)   ├─► ② 术语对应内容 (机器) 揪孤词        ─┼─► 🏁 总裁决 ─► 📄 落盘
//             └─► ③ AI内容检查 (调AI) 难度/语义       ─┘   汇总三层    lesson1.md
//
//  【每一步在哪】
//    步骤          看流程          看具体检查项               实现细节
//    ───────────────────────────────────────────────────────────────
//    取数据        本文件 beforeAll —                         _lesson-fixture.ts
//    ① 数据检查    本文件 步骤①     ./checks/data-checks.ts    （14条checklist）
//    ② 术语对应内容 本文件 步骤②     ./checks/content-checks.ts （新词是否在问答里=揪孤词）
//    ③ AI检查      本文件 步骤③     ./checks/ai-checks.ts      （调AI判内容）
//    报告/落盘   本文件 总裁决       —                       _report.ts
//
//  【怎么跑】   npm run test:lesson   或点下方 it 旁边的 ▶️
//  【报告在哪】 tests/reports/lesson1.md（Markdown，VS Code 直接渲染）
//  【怎么改】
//    · 改流程（加一层/改顺序）→ 改下面 runLesson1Checks()
//    · 改数据检查项           → 改 ./checks/data-checks.ts
//    · 改 AI 判定规则         → 改 ./checks/ai-checks.ts
// ════════════════════════════════════════════════════════════════════════

import { describe, it, beforeAll } from "vitest"
import { loadLessonData, loadLessonQa, loadLessonTermsAndQa, type LessonData } from "./_lesson-fixture"
import { dataChecklist } from "./checks/data-checks"
import { contentChecklist } from "./checks/content-checks"
import { aiChecklist } from "./checks/ai-checks"
import { softReport, saveReport } from "./_report"

const LESSON_ID = 1

// ───────────── 验证流程主体（要看/要改流程，只看这个函数） ─────────────
// 每个步骤一个 it（各自独立红绿灯），report 有挂就抛错。
// softReport 用在总裁决：只汇总不中断。

type Qa = { question: string; answer: string }

describe(`🚪 lesson${LESSON_ID} 验证流程`, () => {
  // 取数：所有步骤共用（beforeAll 跑一次）
  let d: LessonData
  let qa: Qa[]
  let termsQa: { terms: string[]; qaText: string }
  const result: Record<string, boolean> = {}

  beforeAll(async () => {
    d = await loadLessonData(LESSON_ID)
    qa = await loadLessonQa(LESSON_ID, 15)
    termsQa = await loadLessonTermsAndQa(LESSON_ID)
  }, 30_000)

  // 步骤①：机器查数据（数量/空值/计数一致）—— 14 条 checklist 见 data-checks.ts
  it("① 数据检查", () => {
    result.data = softReport("①📦 数据检查", dataChecklist(d))
    if (!result.data) throw new Error("数据检查未全过")
  })

  // 步骤②：术语-内容对应（新词是否都出现在本课问答里，揪孤词）—— 见 content-checks.ts
  it("② 术语对应内容", () => {
    result.content = softReport("②🔗 术语对应内容", contentChecklist(termsQa.terms, termsQa.qaText))
    if (!result.content) throw new Error("有孤词：新词在问答里找不到")
  })

  // 步骤③：AI 查内容质量（难度/语义）—— 真实调本地 AI CLI，慢；规则见 ai-checks.ts
  it("③ AI 内容检查", () => {
    result.ai = softReport("③🤖 AI 内容检查", aiChecklist(qa))
    if (!result.ai) throw new Error("AI 内容检查未全过")
  }, 180_000)

  // 步骤🏁：汇总裁决 + 落盘报告（放最后，确保前面步骤都跑过）
  it("🏁 总裁决（汇总 + 落盘报告）", () => {
    softReport("🏁 总裁决", [
      ["① 数据检查", result.data ? "通过" : "有未通过", !!result.data],
      ["② 术语对应内容", result.content ? "通过" : "有未通过", !!result.content],
      ["③ AI 内容检查", result.ai ? "通过" : "有未通过", !!result.ai],
    ])
    saveReport(`lesson${LESSON_ID}`) // 落盘 tests/reports/lesson1.md
  })
})
