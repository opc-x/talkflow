# TalkFlow — 项目领域知识

## 产品定位

AI驱动的英语口语练习应用。底层内容来自 Callan Method（191课、12册、CEFR A1→C2），但产品提炼为「开口优先」的 AI 体验——不是 Callan 复制品。

核心循环：**课程 → 开口 → AI实时反馈 → SRS复习队列**

## 目标用户

中国成年人英语学习者：
- 哑巴英语：会读写，不敢开口
- 考研/四六级/托福考生
- 职场英语需求者（外企、出海）
- 核心痛点：开不了口、怕出错、没有真实对话环境

## 技术栈

```
Frontend  Next.js 15 App Router + Supabase (direct)
Backend   Hono API (backend/) + OpenAI
AI        Whisper (语音转文字) + GPT-4o (评估反馈)
Auth      Supabase Auth
DB        Supabase PostgreSQL
Payment   Stripe (stub)
```

## 内容结构

- 12册 × ~16课 = 191课
- CEFR 覆盖：A1 → C2
- 每课包含：content_blocks → terms + qa_pairs + notes + exercises
- qa_pairs 是 SRS 的基础单元（完成课程后入队）

## 关键数据表

| 表 | 用途 |
|---|---|
| `books` / `lessons` / `content_blocks` | 静态教材内容（只读） |
| `qa_pairs` | SRS 题目来源 |
| `profiles` | 用户基础信息 |
| `subscriptions` | 订阅计划 (free/basic/pro) |
| `user_progress` | 当前课程进度 |
| `session_records` | 完成课程记录（连续学习/统计） |
| `qa_responses` | 每题得分 1-5（准确率统计） |
| `review_schedule` | SRS状态：next_review_at / interval_days / ease_factor / rep_count |

## 已知 Bug

`completeLesson()` (`app/[locale]/protected/learn/[bookNum]/[lessonNum]/actions.ts`) 完成课程后**未写入 review_schedule** — SRS 队列永远不填充。

## 竞品参考

- Cambly（真人外教，贵）
- 多邻国（碎片化，口语弱）
- italki（真人，门槛高）
- TalkFlow 差异化：AI + 结构化内容 + SRS = 高性价比系统训练

## 定价参考

| 计划 | 价格 | 定位 |
|---|---|---|
| 免费 | ¥0 | 前3课体验 |
| 基础 | ¥168/年 | 个人学习 |
| 专业 | ¥228/年 | 全功能+优先支持 |
