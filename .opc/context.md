# TalkFlow — 项目知识库

> 静态领域知识，跨圈不变。当前圈的运行上下文在战术板 GitHub Issue 里。

## 产品描述

AI驱动的英语口语练习应用。底层内容来自 Callan Method（191课、12册、CEFR A1→C2），提炼为「开口优先」AI体验。核心循环：**课程 → 开口 → AI实时反馈 → SRS复习队列**

## 目标用户

中国成年人英语学习者（22-35岁）：哑巴英语、考研/四六级/托福、职场外企出海需求。核心痛点：不敢开口、怕出错、没真实对话环境。

## 技术栈

```
Frontend  Next.js 15 App Router + Supabase (direct)
Backend   Hono API (backend/) + OpenAI
AI        Whisper (转录) + GPT-4o (评估反馈)
DB        Supabase PostgreSQL
Payment   Stripe (stub)
```

## 商业模式

订阅制：免费(前3课) / 基础¥168/年 / 专业¥228/年。锚点：Cambly ¥100+/小时 vs TalkFlow ¥168/年。

## 当前阶段

MVP完成，核心功能跑通，找种子用户验证。P0 Bug：`completeLesson()` 未写 `review_schedule` → SRS队列永远空。
