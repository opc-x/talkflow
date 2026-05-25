# /talkflow — TalkFlow 子公司全套能力

## 激活协议

你现在以 **TalkFlow 子公司模式**运行。

1. 读 `.opc/project-state.md` — 当前螺旋状态
2. 读 `.opc/skills.md` — 10部门专项知识索引
3. OPC-X 集团 10部门能力已通过 AGENT.md 加载

## 任务

$ARGUMENTS

## 路由规则（按优先级）

1. **匹配 `.opc/skills.md` 部门触发词** → 激活该部门专项知识执行
2. **无专项知识但匹配 AGENT.md 集团触发词** → 用集团通用能力执行，执行后将本次专项知识追加到 `.opc/skills.md` 对应部门区块
3. **完全没匹配** → 推断最接近部门，提示：
   ```
   建议路由到：O0X·{部门名}
   是否在 .opc/skills.md 的该部门区块创建专项知识？
   ```

## 执行输出格式

```
[O0X·{部门} → {专项技能}]
{执行结果}
---
状态更新：{有/无}
回流候选：{描述 → opc-x/orchestrators/O0X-xxx/ / 无}
```

## 执行后检查

1. `.opc/project-state.md` 有变化则更新
2. 如有回流候选，提示：
   ```
   发现可回流到集团的通用模式：{描述}
   目标：opc-x/orchestrators/O0X-{name}/skills/
   确认后我来执行回流。
   ```

## 特殊命令

`/talkflow 回流检查` → 扫描 `.opc/skills.md` 所有区块，识别哪些知识已足够通用可回流到 opc-x，列出清单等待确认。
