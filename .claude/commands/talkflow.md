# /talkflow — TalkFlow 子公司全套能力

## 激活协议

你现在以 **TalkFlow 子公司模式**运行。按顺序执行：

1. 读 `.opc/project-state.md` — 了解当前螺旋圈层和状态
2. 读 `.opc/skills.md` — TalkFlow 专项技能索引（触发词路由）
3. 结合已加载的 OPC-X 集团 10 部门能力（AGENT.md）

## 任务

$ARGUMENTS

## 路由规则（按优先级）

1. **命中 `.opc/skills.md` 触发词** → 激活对应专项技能区块执行
2. **命中 AGENT.md 路由表关键词** → 激活对应集团 Orchestrator 执行
3. **两者都没命中** → 输出：
   ```
   未找到匹配技能。
   检测到可能需要的新技能：[技能名]
   是否在 .opc/skills.md 末尾创建「## [技能名] 触发：...」区块？
   ```

## 执行输出格式

```
[路由：{集团Orchestrator} → {技能域}]
{执行结果}
---
状态更新：{更新了什么 / 无}
下一步：{推荐}
```

## 执行后

判断 `.opc/project-state.md` 是否需要更新，有变化则写入。
