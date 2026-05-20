# Cursor × v0 MCP

项目已配置 `.cursor/mcp.json` → `https://mcp.v0.dev`（与 Claude Code `~/.claude/mcp.json` 同源）。

## 在 Cursor 里确认生效

设置 → MCP 列表出现 **v0**，工具包含：

- `createChat`
- `findChats`
- `getChat`
- `sendChatMessage`

下拉菜单里带 **v0** 图标的 MCP 即此项（与 Vercel 插件无关）。

## 调用顺序（省额度）

1. `createChat` — `responseMode: "async"`，不传 `modelConfiguration`
2. `findChats` — 等到 `latestVersion.status === "completed"`
3. `getChat` — 取 `files[]` 里合并后的 `source`

详见 `.agents/skills/v0/SKILL.md`（本地 skill，未进 git）。
