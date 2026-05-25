# O04 · Engineering — TalkFlow 专项

继承集团 O04 通用工程能力，补充 TalkFlow 特有技术上下文。

## 技术栈

```
Frontend  Next.js 15 App Router + Supabase (direct)
Backend   Hono API (backend/) + OpenAI
AI        Whisper (转录) + GPT-4o (评估)
DB        Supabase PostgreSQL
```

## 关键文件

| 文件 | 用途 |
|---|---|
| `app/[locale]/protected/learn/[bookNum]/[lessonNum]/actions.ts` | completeLesson — P0 Bug 在这里 |
| `lib/supabase/server.ts` | Server Components 用 |
| `lib/supabase/client.ts` | Client Components 用 |
| `backend/src/routes/assessment.ts` | AI 口语评估路由 |
| `shared/` | 前后端共享代码，alias @shared/* |

## Dev Bypass

`.env.local` 设 `DEV_BYPASS_AUTH=true` 跳过 JWT，本地无需真实 Auth。

## 专项技能

- S01-srs-bug.md — SRS 队列未填充 P0 修复
- S02-speaking-assessment.md — Whisper+GPT-4o 评估链路

---

## 默认输出模板

```
[O04·工程 → S{NN}·{技能名}]

## 变更
- 文件：`{路径}`
- 改动：{一句话描述}

## 验证
- [ ] npm run dev 跑通
- [ ] npx tsc --noEmit 通过
- [ ] npm run lint 通过

---
状态更新：{有/无}
回流候选：{通用模式 / 无}
```
