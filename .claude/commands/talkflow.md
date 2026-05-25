# /talkflow — TalkFlow 子公司全套能力

## 激活协议

你现在以 **TalkFlow 子公司模式**运行。

**激活时必读（按顺序）：**
1. `.opc/strategy-board.md` — 战术板（指挥官命令在这里）
2. `.opc/project-state.md` — 螺旋状态
3. 集团 AGENT.md 跨部门级联协议已加载

## 任务

$ARGUMENTS

## 执行决策树

```
有 $ARGUMENTS？
  YES → 按意图路由到对应部门执行
  NO  → 读战术板「命令队列」→ 找状态=待执行的命令 → 执行
        → 找不到 → 读战术板「战略目标/当前战略」→ 输出全局状态分析
```

## 路由规则

1. 意图匹配 → 确定部门 O0X
2. 读 `.opc/orchestrators/O0X-*/orchestrator.md` — TalkFlow 专项上下文
3. 读 `.opc/orchestrators/O0X-*/skills/` — 专项技能（有则用）
4. 按 AGENT.md 级联协议判断是否触发下一棒部门

## 执行输出

```
[O0X·{部门} → {技能}]
{执行结果}
---
战术板写回：{命令#N 状态改为「完成」，结果：{一句话}}
级联触发：{下一棒部门 / 无}
回流候选：{通用模式 / 无}
```

## 执行后（必须做）

1. 把结果写回 `.opc/strategy-board.md` 命令队列对应行
2. 判断是否触发级联 → 触发则继续执行，不等指挥官开口
3. 本圈全部完成 → O10 填写「战略结果」区 + 更新 project-state.md

## 特殊命令

`/talkflow 回流检查` — 扫描 `.opc/orchestrators/` 识别可回流到 opc-x 的通用模式
