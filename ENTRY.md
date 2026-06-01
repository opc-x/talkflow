# ENTRY — 高频入口速查

> 找入口先看这里。改了目录结构记得回来更新。

## 🚀 一键命令

```bash
npm run dev          # 前端 + API，端口 3000
npx tsc --noEmit     # 类型检查（等于这工程的"测试"）
npm run lint         # ESLint
npm run build        # 构建
```

⚠️ 没有 `npm test` —— 本工程无测试框架。验证 = tsc + lint + 手动跑。

──────────────────────────────────────

## 🎨 前端入口

| 要找 | 在哪 |
|------|------|
| 根布局 | `app/layout.tsx` |
| 落地页 `/` | `app/[locale]/page.tsx` |
| 测评 onboarding | `app/[locale]/onboarding/` |
| 登录后所有页 | `app/[locale]/protected/` |
| └ 课程播放器 | `app/[locale]/protected/learn/[bookNum]/[lessonNum]/` |
| └ SRS 复习 | `app/[locale]/protected/review/` |
| └ 课程地图 | `app/[locale]/protected/map/` |
| └ 进度/统计 | `app/[locale]/protected/progress/` · `stats/` |
| └ 设置/我的 | `app/[locale]/protected/settings/` · `me/` |
| └ 开发工具页 | `app/[locale]/protected/tools/` |
| UI 组件 | `components/` |

## 🔌 后端入口

| 要找 | 在哪 |
|------|------|
| 全部 API | `app/api/v1/` |
| └ 测评(转写+评分) | `app/api/v1/assessment/` |
| └ 搜索 | `app/api/v1/search/` |
| └ Stripe(stub) | `app/api/v1/checkout/` |
| └ 健康检查 | `app/api/v1/health/` |
| **服务层(真逻辑在这)** | `lib/server/*.service.ts` |
| 鉴权 | `lib/server/api-auth.ts` |
| Server Actions(protected 写操作) | `app/[locale]/protected/**/actions.ts` |

## 🧠 共享 / 工具

| 要找 | 在哪 |
|------|------|
| 前后端共享类型/纯函数 | `shared/`(`@shared/*`) |
| └ 分级算法 | `shared/assessment/placement.ts` |
| Supabase client | `lib/supabase/server.ts`(服务端)· `client.ts`(客户端) |
| API 客户端 apiFetch | `lib/api/client.ts` |
| 订阅/套餐逻辑 | `lib/subscription.ts` |
| OpenAI | `lib/openai/` |

## 🗄️ 数据 / 脚本

| 要找 | 在哪 |
|------|------|
| DB 迁移 | `supabase/migrations/` |
| 一次性 DB/运维脚本 | `scripts/`（`tsx scripts/xxx.ts` 跑） |
| 环境变量 | `.env.local`（dev bypass 在这） |

## 🧪 测试（现状：无框架）

| 要找 | 在哪 |
|------|------|
| 单元测试 | ❌ 不存在 |
| 半成品 E2E 脚本 | `scripts/ui-smoke.ts` · `ui-full-interaction.ts` · `click-all-ui.mjs` |
| playwright | 装了未接线 |
