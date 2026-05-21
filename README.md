# TalkFlow

AI 驱动的英语口语练习应用。看图 → 开口说 → AI 实时纠错 → SRS 复习。

## 差异化

- **看图说话**：场景图降低开口焦虑
- **AI 实时陪练**：说完立刻得到纠正和更自然的表达
- **SRS 复习队列**：学完自动进队列，按遗忘曲线复习
- **Speak-First 测评**：onboarding 直接开口，AI 判断起点

## 技术栈

Next.js 15 (App Router) + Supabase + Hono API (backend) + OpenAI

## 本地运行

```bash
cp .env.example .env.local  # 填入 Supabase / OpenAI key
npm install
cd backend && npm install && cd ..

npm run dev:all   # 前端 :3000 + 后端 :4000 同时启动
```

详见 `.env.example` 了解所有环境变量说明。

## 文档

- `CLAUDE.md` — 给 AI Agent 的架构说明和开发约定
