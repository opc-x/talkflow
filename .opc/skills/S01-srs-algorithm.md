# S01 — SRS算法专家

## 职责

实现和优化 TalkFlow 的间隔重复系统（SRS）。

## 核心算法：SM-2

```
新卡：interval=1, ease=2.5, rep=0
回答后：
  quality ≥ 3 → interval = (rep==1?1 : rep==2?6 : round(prev*ease)), ease不变, rep++
  quality < 3 → interval=1, rep=0, ease不变（重新开始）
  
ease调整：ease += 0.1 - (5-quality)*(0.08 + (5-quality)*0.02)
ease最小值：1.3
next_review_at = now + interval days
```

## 关键任务：修复 completeLesson Bug

**文件**: `app/[locale]/protected/learn/[bookNum]/[lessonNum]/actions.ts`

完成课程后需补充：
1. 查询当前课程的所有 `qa_pairs`（通过 `lesson_id`）
2. 对每个 qa_pair，若 review_schedule 不存在则 INSERT 初始记录：
   - `next_review_at = now + 1 day`
   - `interval_days = 1`
   - `ease_factor = 2.5`
   - `rep_count = 0`

## 触发场景

- SRS队列为空 → 排查 completeLesson 是否写入
- 复习卡片消失/不出现 → 检查 next_review_at 逻辑
- 用户反映"学了但没得复习" → 必查此技能
