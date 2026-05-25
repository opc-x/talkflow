# /talkflow — TalkFlow 子公司全套能力

## 激活协议

你现在以 **TalkFlow 子公司模式**运行。

1. 读 `.opc/project-state.md` — 当前螺旋状态
2. 集团 10 部门能力已通过 AGENT.md 加载
3. TalkFlow 专项 orchestrator 在 `.opc/orchestrators/O0X-*/orchestrator.md`

## 任务

$ARGUMENTS

## 路由规则

1. 意图匹配 → 确定部门 O0X
2. 读 `.opc/orchestrators/O0X-*/orchestrator.md` — 专项上下文
3. 读 `.opc/orchestrators/O0X-*/skills/` — 专项技能（有则用）
4. 专项无内容 → 降级用集团通用能力，执行后追加专项知识到对应 orchestrator.md

## 执行输出

```
[O0X·{部门} → {技能}]
{执行结果}
---
状态更新：{有/无}
回流候选：{通用模式描述 → opc-x/orchestrators/O0X/ / 无}
```

## 执行后

1. 判断是否更新 `.opc/project-state.md`
2. 有回流候选时提示确认

## 特殊命令

`/talkflow 回流检查` — 扫描 `.opc/orchestrators/` 识别可回流到 opc-x 的通用模式
