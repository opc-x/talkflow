# TalkFlow — 螺旋状态

## 当前圈层：第1圈

```
决策 ✅ → 需求 ✅ → 执行 🔄 → 验收 ⏳ → 反馈 ⏳ → 第2圈
```

## 愿景

帮助10万中国成年人突破口语瓶颈，用AI把「哑巴英语」变成「敢开口的英语」。

## 当前状态（2026-05-25）

### 已完成
- 技术架构：Next.js 15 + Supabase + Hono + OpenAI
- 教材导入：191课 12册 全部 seed 入库
- 核心路由：onboarding / learn / review / stats / map / me
- AI评估：Whisper + GPT-4o 口语评分
- 落地页：已上线，占位数字待替换

### 进行中
- SRS系统：review_schedule 写入 bug 未修复（completeLesson未填充队列）
- 订阅支付：Stripe checkout stub，未实现

### 待启动
- 真实用户数据（DAU/留存/口语进步）
- 社区冷启动

## 关键 Bug

| 优先级 | 文件 | 描述 |
|---|---|---|
| P0 | `app/[locale]/protected/learn/[bookNum]/[lessonNum]/actions.ts` | completeLesson() 未写 review_schedule，SRS永远空 |

## 本圈目标

修复 SRS bug → 跑通完整学习循环（上课→复习→进步曲线）→ 找10个种子用户验证

---
最后更新：2026-05-25
