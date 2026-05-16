# TalkFlow Figma Design Schema

> 本文件是 Figma 设计稿的本地镜像，用于 AI 辅助修改设计。
> 修改此文件后，通过 Figma MCP 写操作（无限次）同步回 Figma。
>
> **Figma 文件**: `https://www.figma.com/design/RXTvucAjOyaOu41iX79Zu2`
> **File Key**: `RXTvucAjOyaOu41iX79Zu2`
> **设备**: 390×844px（iPhone 14）
> **布局**: 所有屏幕在同一 Page，竖向排列，间距 80px

---

## Design Tokens

### 颜色
```json
{
  "primary": "#10B981",
  "primary-foreground": "#FFFFFF",
  "accent": "#F59E0B",
  "background": "#FAFBFC",
  "card": "#FFFFFF",
  "foreground": "#1F2937",
  "muted-foreground": "#6B7280",
  "border": "#E5E7EB",
  "divider": "#F3F4F6",
  "success": "#10B981",
  "error": "#EF4444",
  "warning": "#F59E0B",
  "info": "#3B82F6"
}
```

### 字体
```json
{
  "family": "Inter, system-ui, sans-serif",
  "mono": "JetBrains Mono, monospace",
  "sizes": {
    "xs": "12px",
    "sm": "14px",
    "base": "16px",
    "xl": "20px",
    "2xl": "24px",
    "3xl": "30px",
    "4xl": "36px"
  },
  "weights": {
    "normal": 400,
    "semibold": 600,
    "bold": 700
  }
}
```

### 间距 & 圆角
```json
{
  "spacing": {
    "xs": "8px",
    "sm": "12px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px",
    "page-horizontal": "16px"
  },
  "radius": {
    "sm": "6px",
    "md": "8px",
    "lg": "12px",
    "xl": "16px"
  }
}
```

---

## 屏幕清单（10 个）

### 01 · Dashboard（首页）
**路由**: `/protected`

**组件结构**:
- Nav Bar：Logo（左）+ 头像图标（右）
- 今日任务卡片：CTA 按钮"开始练习"，primary 色
- 进度摘要：当前 Stage/Book/Lesson，进度条
- 成就条：连续打卡天数
- Tab Bar（底部）：首页 / 地图 / 练习 / 复习 / 我的

**待迭代**:
- [ ] 今日任务卡片内容细化
- [ ] 成就条样式

---

### 02 · Onboarding Step 1 — 选起点
**路由**: `/onboarding`

**组件结构**:
- 步骤指示器：3步，当前第1步
- 标题："你现在在哪个阶段？"
- 选项列表：Stage 1–12 卡片选择，选中态 primary 边框
- 底部按钮："继续" primary 按钮

**待迭代**:
- [ ] 选中态高亮样式

---

### 03 · Onboarding Step 2 — 方法介绍
**路由**: `/onboarding`

**组件结构**:
- 步骤指示器：第2步
- 标题："Callan Method 是什么？"
- 说明文本 + 插图
- 底部按钮："我知道了" / "继续"

---

### 04 · Onboarding Step 3 — 确认开始
**路由**: `/onboarding`

**组件结构**:
- 步骤指示器：第3步
- 总结卡片：起点确认
- 底部按钮："开始学习" primary 按钮（全宽）

---

### 05 · 知识地图
**路由**: `/protected/map`

**组件结构**:
- Nav Bar：Logo + 标题"知识地图"
- Stage 列表：竖向滚动，每个 Stage 是一个折叠区块
- Stage 区块：Stage 标题 + 进度条 + Book 列表
- Book 卡片：Book 编号、完成百分比、锁定/解锁状态
- Tab Bar

**待迭代**:
- [ ] Stage 进度视觉层次优化

---

### 06 · 学习 Session
**路由**: `/protected/learn/[book]/[lesson]`

**组件结构**:
- Nav Bar：返回箭头 + "Book X · Lesson Y" + 进度百分比
- 问答卡片（主体）：
  - 英文问题文本（大，Inter mono）
  - 发音按钮（喇叭图标）
  - 用户回答区域
  - AI 反馈提示
- 底部操作栏：上一题 / 下一题

**待迭代**:
- [ ] 问答卡片样式细化
- [ ] 进度条位置确认
- [ ] 发音按钮样式

---

### 07 · 间隔复习
**路由**: `/protected/review`

**组件结构**:
- Nav Bar：返回箭头 + "间隔复习"
- 复习卡片：问题 + 答案（翻转效果）
- SM2 评分按钮（4个）：再来一遍 / 困难 / 良好 / 简单
  - 颜色：error / warning / info / success
- 进度：已复习 X / 今日总数 Y

**待迭代**:
- [ ] SM2 按钮样式（4个难度颜色区分）

---

### 08 · 进度追溯
**路由**: `/protected/progress`

**组件结构**:
- Nav Bar：Logo + "进度"
- 14天柱状图：每日学习量
- 成就徽章区：已解锁徽章列表
- 数据统计：总学习时间 / 完成课时 / 单词量
- Tab Bar

**待迭代**:
- [ ] 14天柱状图组件
- [ ] 成就徽章样式

---

### 09 · 辅助工具
**路由**: `/protected/tools`

**组件结构**:
- Nav Bar：Logo + "工具"
- 3个 Tab：发音练习 / 词汇查询 / 语法参考
- Tab 内容区：根据选中 Tab 切换
- Tab Bar

**待迭代**:
- [ ] 3 Tab 切换动画
- [ ] 各 Tab 内容占位 → 真实内容

---

### 10 · 设置
**路由**: `/protected/settings`

**组件结构**:
- Nav Bar：返回箭头 + "设置"
- 用户信息卡：头像 + 名字 + 当前 Stage
- 设置列表：
  - 学习提醒开关
  - 发音速度滑块
  - 深色模式开关
  - 退出登录（error 色文字）
- Tab Bar

**待迭代**:
- [ ] 各开关状态视觉

---

## 全局组件

### Tab Bar（底部导航）
5个 Tab：首页 / 地图 / 练习 / 复习 / 我的

```
待做：
- [ ] 每个 Tab 加图标（Lucide React）
- [ ] 激活态：图标+文字变 primary 色，下方加短横线指示器
- [ ] 非激活态：muted-foreground 色
```

### Nav Bar（顶部导航）
- **一级页面**：Logo（左）+ 功能图标（右，头像或设置）
- **二级页面**：返回箭头（左）+ 页面标题（中）+ 可选操作（右）

---

## 如何修改并写回 Figma

1. 在本文件修改设计描述
2. 告诉 Claude："按照 figma-design-schema.md 的最新描述，更新 Figma 中的 [屏幕名] 屏幕"
3. Claude 调用 `use_figma` 或 `generate_figma_design`（写操作，无限次）
4. 在 Figma 网页版确认效果

> 读操作（截图/拉 schema）：Starter 6次/月，省着用。
> 写操作：无限次，随便改。
