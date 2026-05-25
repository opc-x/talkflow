# TalkFlow 战术板（协议指针）

战术板活在 GitHub Issues，每轮螺旋一个，指挥官管生命周期。

## 操作

```bash
# 找当前战术板
gh issue list --label strategy-board --state open --limit 1

# 新开一圈
gh issue create --label strategy-board \
  --title "🗺️ TalkFlow 战术板 · 第N圈" \
  --body "..."

# 查历史
gh issue list --label strategy-board --state closed
```
