# TalkFlow TODO

## P0 — 核心循环（已落地）

- [x] **Learn 开口 + AI 反馈**：`session-card` 接 Mic → `/api/v1/practice/evaluate` → 反馈 → 看答案
- [x] **qa_responses 落库**：练习评分写入 `qa_responses`
- [x] **Review 开口复习**：复习页录音 + AI 反馈后再自评
- [x] **SRS terms 入队**：`completeLesson()` 写入 vocab terms 到 `review_schedule`
- [x] **TTS 基础**：`playUtterance` + Web Speech voice 优选；`npm run db:generate-audio` 批量预生成

---

## P1 — 下一步

- [ ] **全库 TTS 预生成**：`npm run db:generate-audio`（需 Supabase `audio` bucket + OPENAI_API_KEY）
- [ ] **grammar_note AI 讲解（#48）**：跑 `npm run db:grammar-explanations`，UI 已读 `ai_explanation`
- [ ] **Stripe 支付**：checkout 路由仍是 stub
- [ ] **OPENAI_BASE_URL 中继 TTS smoke test**：确认 aihubcli 是否支持 `/audio/speech`

---

## 已完成（历史）

- [x] README 更新：补充产品核心定位
- [x] SRS qa_pair 入队（`completeLesson`）
- [x] 配置索引 `docs/CONFIG.md`
