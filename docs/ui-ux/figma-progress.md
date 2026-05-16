# TalkFlow Figma 设计进度

## 文件信息
- **文件名**: TalkFlow UI/UX Design
- **File Key**: `RXTvucAjOyaOu41iX79Zu2`
- **直链**: https://www.figma.com/design/RXTvucAjOyaOu41iX79Zu2
- **设备尺寸**: 390×844px（iPhone 14）
- **布局**: 所有屏幕在同一 Page，竖向排列，间距 80px

---

## 已完成的屏幕（8个）

| # | 屏幕名 | 对应路由 | 状态 |
|---|--------|----------|------|
| 01 | Dashboard（首页） | `/protected` | ✅ 已生成 |
| 02 | Onboarding Step 1 — 选起点 | `/onboarding` | ✅ 已生成 |
| 03 | Onboarding Step 2 — 方法介绍 | `/onboarding` | ✅ 已生成 |
| 04 | Onboarding Step 3 — 确认开始 | `/onboarding` | ✅ 已生成 |
| 05 | 知识地图 | `/protected/map` | ✅ 已生成 |
| 06 | 学习 Session | `/protected/learn/[book]/[lesson]` | ✅ 已生成 |
| 07 | 间隔复习 | `/protected/review` | ✅ 已生成 |
| 08 | 进度追溯 | `/protected/progress` | ✅ 已生成 |
| 09 | 辅助工具 | `/protected/tools` | ✅ 已生成 |
| 10 | 设置 | `/protected/settings` | ✅ 已生成 |

---

## 导航结构设计

### Tab Bar（底部导航）— 核心入口，权重最高
- **当前设计**：5 个文字 tab — 首页 / 地图 / 练习 / 复习 / 我的
- **问题**：只有文字，没有图标，太素
- **待做**：加图标 + 激活态高亮样式
- **原则**：用户 80% 的时间在这几个页面转，必须认真打磨

### Nav Bar（顶部导航）— 待补充
- **一级页面**（首页/地图/复习等）：左侧 Logo，右侧头像或设置图标，简洁
- **二级页面**（学习Session/复习详情等）：左侧返回箭头 + 页面标题，右侧可放进度或操作按钮
- **当前状态**：所有屏幕顶部为空，需要补上
- **待做**：逐屏确认顶部需要什么，统一风格后更新 Figma

---

## 待迭代 / 已知问题

### 整体设计
- 所有屏幕为初版骨架，内容占位居多
- 需要基于真实数据逐屏 review 和细化
- 颜色体系：Primary `#6366F1`（靛蓝），背景白，border `#E5E7EB`

---

## 工具 & 限制说明

| 工具 | 状态 |
|------|------|
| Figma MCP（创建/修改设计） | 写操作无限制，免费 |
| Figma MCP（读取/截图） | Starter 席位 **6次/月**，用完当月无法再读 |
| VS Code Figma 插件 | 需要 Dev Mode（付费），免费版只显示两个按钮 |
| VS Code Simple Browser | ✅ 免费可用，`Cmd+Shift+P` → Simple Browser: Show → 粘贴 Figma 链接 |
| Figma 网页版 | ✅ 免费查看，浏览器直接打开 |

---

## 迭代计划

### 第一优先级
- [ ] Tab Bar 加图标，设计激活态
- [ ] Nav Bar 补全 — 逐屏确认顶部内容（一级页 vs 二级页区分处理）
- [ ] Dashboard 首页细化（CTA 卡片、今日任务、成就条）
- [ ] 学习 Session 屏幕细化（问答卡片、进度条、发音按钮）

### 第二优先级
- [ ] 复习屏幕：SM2 评分按钮样式（4个难度）
- [ ] 知识地图：Stage 进度视觉层次
- [ ] Onboarding：3步流程交互细节

### 第三优先级
- [ ] 进度页：14天柱状图、成就徽章
- [ ] 工具页：3个 Tab 切换动画
- [ ] 设置页：各项开关状态

---

## 设计 → 代码对应关系

设计稿确定后按此顺序写代码：

```
Figma 屏幕        →    Next.js 文件
Dashboard         →    app/protected/page.tsx
Onboarding        →    app/onboarding/page.tsx
知识地图          →    app/protected/map/page.tsx
学习Session       →    components/learn/session-card.tsx
间隔复习          →    app/protected/review/review-client.tsx
进度追溯          →    app/protected/progress/page.tsx
辅助工具          →    app/protected/tools/page.tsx
设置              →    app/protected/settings/page.tsx
```
