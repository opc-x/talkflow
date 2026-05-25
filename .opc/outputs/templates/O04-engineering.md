# O04·工程 — TalkFlow 输出模板

> 覆盖集团默认：验证命令替换为 TalkFlow 专用。

```
[O04·工程 → S{NN}·{技能名}]

## 变更
- 文件：`{路径}`
- 改动：{一句话描述}

## 验证
- [ ] npm run dev:all 跑通（frontend :3000 + backend :4000）
- [ ] npx tsc --noEmit 通过
- [ ] npm run lint 通过
- [ ] DEV_BYPASS_AUTH=true 本地功能验证

---
状态更新：{有/无}
回流候选：{通用模式 / 无}
```
