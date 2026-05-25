# S01 · SRS 队列未填充（P0 Bug）

## 问题

`completeLesson()` 完成课程后未写入 `review_schedule` → SRS 复习队列永远为空。

## 位置

`app/[locale]/protected/learn/[bookNum]/[lessonNum]/actions.ts`

## 修复步骤

1. 查询当前 lesson 的所有 `qa_pairs`（通过 `lesson_id`）
2. 对每个 qa_pair，若 `review_schedule` 不存在则 INSERT：
   - `next_review_at = now + 1 day`
   - `interval_days = 1`
   - `ease_factor = 2.5`
   - `rep_count = 0`

## SM-2 算法（后续复习更新用）

```
quality≥3 → interval=(rep=1?1 : rep=2?6 : round(prev×ease)), rep++
quality<3 → interval=1, rep=0
ease += 0.1-(5-q)×(0.08+(5-q)×0.02), 最小1.3
next_review_at = now + interval days
```
