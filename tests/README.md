# tests — 单元测试包

所有单元测试集中在这里，按 `unit/` 组织。改了源码逻辑就来这加/改对应 `*.test.ts`。

## 跑

```bash
npm test          # 跑一次
npm run test:watch  # 监听模式，改文件自动重跑
```

## 结构

```
tests/
└─ unit/
   ├─ placement.test.ts     ← shared/assessment/placement.ts（分级算法）
   └─ subscription.test.ts  ← lib/subscription.ts（套餐/解锁逻辑）
```

## 约定

- 文件名 `<被测模块>.test.ts`，放在 `tests/unit/` 下
- 导入用路径别名：`@/lib/xxx`、`@shared/xxx`（已在 vitest.config.ts 配好）
- 只测**纯逻辑**：算法、转换、判断函数。`lib/server/*.service.ts`、`shared/` 是首选靶子
- 碰 DB/OpenAI/网络的不在这测（那是 e2e/集成的事，本工程暂无）

## 优先补测清单

- [ ] `shared/stages.ts` — getStageForLesson 边界
- [ ] `lib/server/assessment.service.ts` — 服务层（需 mock supabase）
- [ ] `shared/assessment/placement.ts` 的 buildAssessmentResult 整合路径
