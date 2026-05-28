# TalkFlow TODO

## P0 — 阻塞核心承诺

- [ ] **SRS bug**：`completeLesson()` 不写 `review_schedule`，SRS 队列永远为空
  - 文件：`app/[locale]/protected/learn/[bookNum]/[lessonNum]/actions.ts`
  - 修法：完课后为当前课所有 `qa_pairs` 写入初始 `review_schedule` 行
  - 影响：「学了不会忘」= 空头支票，长期可感知无法兑现

---

## P0 — 下一句流程断裂（#47）

- [ ] **「下一句」强插词汇屏**：每换 segment 回词汇屏，问答/知识点无法连续点击
  - 文件：`components/learn/session-card.tsx` → `nextPairOrSegment()` L163
  - 修法：跳过 `setPhase("vocab")`，直接进入下一 segment 的第一个 pair
  - 顺带：lesson 176、187 各有 7 个空 segment，需跳过处理

---

## P1 — 重要但不阻塞

- [ ] **grammar_note AI 讲解（#48）**：1,803 条语法注释只有原始英文，需预生成中文核心讲解
  - Step1: DB migration 加 `ai_explanation` 字段
  - Step2: `scripts/generate-grammar-explanations.ts` 批量跑 GPT-4o
  - Step3: UI 展示 ai_explanation，原文折叠

- [ ] **Stripe 支付**：checkout 路由是 stub，会员计划无法购买
  - 文件：`backend/src/routes/checkout.ts`

---

## 已完成

- [x] README 更新：补充产品核心定位（可感知的口语提升 App）
