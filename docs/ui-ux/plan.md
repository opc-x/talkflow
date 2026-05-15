# TalkFlow UI/UX 设计计划

> 版本：2026-05-15
> 产品定位：Callan Method 知识库 + AI 口语陪练，面向已完成 Stage 1–2 的学习者（从 Stage 3 开始）
> 用途：v0 出图 prompt + Figma 设计参考 + /goal 执行依据

---

## 一、产品支柱（9个）

| # | 支柱 | 说明 | 对应页面 |
|---|------|------|---------|
| 1 | 知识地图 | 可视化12册/191课的全貌，知道自己在哪、去哪 | `/protected/map` |
| 2 | 口语陪练 | AI 扮演 Callan 老师，快速提问，用户语音回答 | `/protected/practice` |
| 3 | 对应配图 | 每组词汇对应场景图 + 热区高亮，降低开口焦虑 | 学习页内嵌 |
| 4 | 实时反馈 | 语音识别 + AI 评估发音/语法，每次回答后即时给出 | 学习页 + 陪练页内嵌 |
| 5 | 进度追溯 | B2 距离、Stage 完成度、每周练习频率可视化 | `/protected/progress` |
| 6 | 辅助工具 | 词汇搜索、语法参考、教材原文查找 | `/protected/tools` |
| 7 | 使用手册 & 前置辅导 | 入门引导：确认 Stage 起点 + 3分钟学会用 App | `/onboarding` |
| 8 | 间隔复习（SM2）| 到期复习队列，让学过的不忘，靠算法而非意志力 | `/protected/review` |
| 9 | 激励 & 成就 | 连续天数、里程碑、词汇掌握里程碑，驱动留存 | Dashboard 内嵌 + 成就徽章 |

---

## 二、完整页面清单（10个功能区）

| 路由 | 功能区 | 对应支柱 | 状态 |
|------|--------|---------|------|
| `/` | 落地页 | — | ✅ 已完成 |
| `/auth/*` | 注册 / 登录 / 找回密码 | — | ✅ 主要完成，辅助页待统一 |
| `/onboarding` | 前置辅导 & Stage 起点设置 | #7 | ❌ 需新建 |
| `/protected` | Dashboard 首页 | #5 #8 #9 | ❌ 当前是 Supabase 调试页 |
| `/protected/map` | 知识地图 | #1 | ❌ 需新建 |
| `/protected/learn/[b]/[l]` | 学习 Session | #3 #4 | ✅ 基础版已有，需加配图和反馈 |
| `/protected/practice` | AI 口语陪练 | #2 #4 | ❌ 需新建 |
| `/protected/review` | 间隔复习（SM2）| #8 | ❌ 需新建 |
| `/protected/progress` | 进度追溯 | #5 | ❌ 需新建 |
| `/protected/tools` | 辅助工具 | #6 | ❌ 需新建 |
| `/protected/settings` | 设置 | — | ❌ 需新建 |

**需要新建或大改：9个。已完成：2个（落地页 + 学习基础页）。**

---

## 三、设计系统（所有页面严格遵守）

```
框架：Next.js App Router + Tailwind CSS + shadcn/ui
字体：Geist Sans
圆角：rounded-2xl（大卡片）/ rounded-xl（小组件）/ rounded-lg（按钮）
Dark mode：ThemeProvider，跟随系统，不得硬编码颜色

颜色语义（只用这些，不用 gray-*）：
  bg-background         页面底色
  bg-card               卡片底色
  bg-muted              浅灰区域/禁用态
  bg-primary            主色（按钮、进度条、强调）
  text-foreground       主文字
  text-muted-foreground 次要文字/标签
  border-border         分割线/卡片边框
  text-primary          主色文字
  bg-destructive        错误/删除

Logo：Mic 图标（lucide-react）+ "TalkFlow" 加粗文字
图标库：lucide-react（全部用这一个）
```

---

## 四、导航结构

```
顶部导航栏（所有 /protected/* 页面共用）

[🎤 TalkFlow]    地图  练习  复习  工具    [🔥3天] [头像 ↓]
                  ↑     ↑    ↑     ↑        连续天数  设置/退出

移动端：底部 Tab Bar
[首页] [地图] [练习] [复习] [我的]
```

---

## 五、每个页面详细设计

---

### P0 · Page 1：Onboarding 前置辅导 `/onboarding`

**触发时机**：新用户首次登录后，且无 user_progress 记录时

**流程（3步，不可跳过）：**

```
Step 1 / 3 — 确认你的起点
┌────────────────────────────────────┐
│  你现在学到 Callan Method 第几册？  │
│                                    │
│  ○ 我还没学过（从 Stage 1 开始）   │
│  ● 已完成 Stage 1–2（Book 1–2）   │  ← 推荐选项，本 App 主要面向这里
│  ○ 已完成 Stage 3–4               │
│  ○ 已完成 Stage 5 或以上           │
│                                    │
│            [ 下一步 → ]            │
└────────────────────────────────────┘

Step 2 / 3 — 学习方式说明
┌────────────────────────────────────┐
│  TalkFlow 怎么工作？               │
│                                    │
│  1. 看词汇 → 2. 听问题 → 3. 开口回答
│                                    │
│  重点：不要想太久，                │
│  Callan 要的是条件反射，不是翻译。 │
│                                    │
│  [← 上一步]      [ 我明白了 → ]   │
└────────────────────────────────────┘

Step 3 / 3 — 试学一课（learn-preview）
┌────────────────────────────────────┐
│  先来一课体验一下                  │
│                                    │
│  [开始体验课 →]                    │
│                                    │
│  或者直接跳到 Book 3 开始正式练习  │
│  [跳过，直接开始]                  │
└────────────────────────────────────┘
```

**数据写入**：完成后写 `user_progress`，设置 `current_lesson_id` 为对应 Stage 起点

---

### P0 · Page 2：Dashboard 首页 `/protected`

**核心目标**：一眼看到今天要做什么，一键开始

```
┌──────────────────────────────────────────────────┐
│ 🎤 TalkFlow    地图 练习 复习 工具   🔥3  [头像] │ 顶部导航
├──────────────────────────────────────────────────┤
│                                                  │
│  早上好，阿强 👋                                  │ 问候语
│  2026年5月15日 · 周四                            │ 日期
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ 继续上次                          [继续 →] │  │ 进度恢复卡（主 CTA）
│  │ Book 3 · Lesson 42                         │  │
│  │ 词汇：telephone, television, radio...      │  │
│  │ ████████░░░░░░░░░░░  38%                  │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  今日待办                                        │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ 📚 今日新课  │  │ 🔁 到期复习  │            │ 两个任务卡
│  │  Book 3 L42 │  │   8 个词汇   │            │
│  │  [开始学习] │  │  [开始复习] │            │
│  └──────────────┘  └──────────────┘            │
│                                                  │
│  我的成就                                        │
│  🔥 连续 3 天   📖 已学 47 课   💬 掌握 1240 词 │ 成就栏
│                                                  │
└──────────────────────────────────────────────────┘
```

**数据来源**
- `user_progress` → 当前课、已学课列表
- `review_schedule` → `next_review_at <= today` 的数量
- `session_records` → 连续天数（连续有记录的日期）
- `terms` + `qa_responses` → 掌握词汇数

**交互**
- 无 user_progress 时显示 Onboarding 引导卡
- "继续" 按钮跳到 `/protected/learn/{book}/{lesson}`
- 成就行点击跳到 `/protected/progress`

---

### P1 · Page 3：知识地图 `/protected/map`

**核心目标**：看到全局，知道自己走到了哪里

```
┌──────────────────────────────────────────────────┐
│  知识地图                                        │
│  Callan Method · 12册 · 191课 · 7250词          │
├──────────────────────────────────────────────────┤
│                                                  │
│  STAGE 1   STAGE 2   STAGE 3   STAGE 4  ...     │ 横向 Stage 导航
│  ────────  ────────  ────────  ────────          │
│                                                  │
│  当前选中：Stage 3（Book 3）A2+                  │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ Lesson 31   telephone, television, radio │ ✓ │ 已完成
│  │ Lesson 32   here, there, near, far       │ ✓ │
│  │ Lesson 33   give, take, bring, fetch     │ › │ ← 当前位置
│  │ Lesson 34   ask, answer, question        │   │ 未开始
│  │ Lesson 35   ...                          │   │
│  │ ...（共30课）                            │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  Stage 3 进度：7/30课  ██░░░░░░  23%           │
│  词汇：已学 210 / 本 Stage 580词                │
│                                                  │
└──────────────────────────────────────────────────┘
```

**交互**
- Stage 横向切换，列表滚动
- 点击某课 → 跳到 `/protected/learn/{book}/{lesson}`
- 已完成课显示 ✓，当前课高亮，未解锁课显示锁

**数据来源**
- `books`（12条）、`lessons`（191条）
- `user_progress.lessons_done[]` → 已完成标记

---

### P1 · Page 4：学习 Session `/protected/learn/[b]/[l]`（升级现有页面）

**当前状态**：基础词汇 → Q&A → 反馈流程已有，缺场景图和实时反馈

**升级内容：**

```
┌──────────────────────────────────────────────────┐
│ ← 退出    Book 3 · Lesson 42    ████░░░░ 38%    │ 顶部（已有）
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │                                          │   │
│  │         [场景图：客厅场景]               │   │ ← 新增：场景图
│  │                                          │   │   相关词汇热区高亮
│  │  📍telephone  📍television  📍radio      │   │   点击词汇播放读音
│  │                                          │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  词汇                                            │
│  telephone · television · radio · record player │ 词汇展示（已有）
│                                                  │
│  ────────────────────────────────────────        │ 分割线（已有）
│                                                  │
│  问题                                  1/5       │
│  Is there a telephone in this room?             │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  🎤  [按住说话]                          │   │ ← 新增：语音输入
│  │  或者  [看答案]                          │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  答案显示后 → 实时反馈区                         │ ← 新增：反馈
│  ┌──────────────────────────────────────────┐   │
│  │  ✅ 正确   发音：准确   用时：2.3秒      │   │
│  │  标准答案：Yes, there is a telephone...  │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  [没记住]              [记住了 ✓]               │ SM2 反馈（已有）
│                                                  │
└──────────────────────────────────────────────────┘
```

**升级要点**
- 场景图：从 `scenes` 表读，按 `lesson_id` 查，`hotspots` JSONB 渲染热区
- 语音输入：Whisper STT（阶段二再接，先做 [看答案] 流程）
- 实时反馈区：先做文字对比反馈，后期接 AI 评估
- 完成一课时调 Server Action 写 `user_progress` + `session_records`

---

### P1 · Page 5：AI 口语陪练 `/protected/practice`

**与学习页的区别**：学习页是顺序过教材；陪练页是 AI 自由提问，更像真实课堂

```
┌──────────────────────────────────────────────────┐
│  AI 口语陪练                     [结束练习]      │
├──────────────────────────────────────────────────┤
│                                                  │
│  练习范围：Stage 3 · 已学词汇随机抽取           │
│  模式：[ 快速模式 ] [ 标准模式 ]                │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │                                          │   │
│  │  🤖 AI 老师                              │   │ 对话气泡
│  │  "Is the telephone near the window       │   │
│  │   or far from the window?"               │   │
│  │                            ◉ 播放音频    │   │
│  │                                          │   │
│  │  👤 你                                   │   │
│  │  "It's near the window."                │   │ 用户回答（语音转文字后显示）
│  │                                          │   │
│  │  ✅ 很好！发音清晰，语法正确。           │   │ AI 反馈
│  │                                          │   │
│  │  🤖 AI 老师                              │   │
│  │  "What color is the telephone?"          │   │ 下一个问题
│  │                                          │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  🎤  按住说话                             │   │ 语音输入区（常驻底部）
│  │  或  [跳过这题]                          │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  本次：已练 12题  正确 10题  用时 4分12秒        │ 实时统计
│                                                  │
└──────────────────────────────────────────────────┘
```

**核心逻辑**
- 从 `qa_pairs` 随机抽取用户已学 Stage 的问题
- AI（Claude API）收到用户回答 + 标准答案 → 评估是否正确 + 给出纠正
- 问题音频：从 `qa_pairs.audio_url` 播放预生成 MP3
- 结束后写 `session_records` + `qa_responses`

---

### P1 · Page 6：间隔复习 `/protected/review`

**核心目标**：每天5分钟，靠算法而不是意志力确保不忘

```
┌──────────────────────────────────────────────────┐
│  今日复习                         8个待复习      │
│  ████████░░░░░░░░  3 / 8 完成                   │ 进度条
├──────────────────────────────────────────────────┤
│                                                  │
│  状态1 — 问题                                    │
│  ┌──────────────────────────────────────────┐   │
│  │  Book 2 · Lesson 18 · 词汇复习           │   │
│  │                                          │   │
│  │  Is the pencil long or short?            │   │ 大字问题
│  │                                    🔊   │   │ 播放音频
│  │                                          │   │
│  │         [ 想想看答案 ]                   │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  状态2 — 答案 + SM2 评分                         │
│  ┌──────────────────────────────────────────┐   │
│  │  Is the pencil long or short?            │   │
│  │  ─────────────────────────────────────   │   │
│  │  It's short. / No, it isn't long.        │   │ 答案
│  │                                          │   │
│  │  你记得吗？                               │   │
│  │  [完全忘了] [有点印象] [记得] [脱口而出] │   │ SM2 4档评分
│  └──────────────────────────────────────────┘   │
│                                                  │
│  完成态                                          │
│  ┌──────────────────────────────────────────┐   │
│  │  🏆 今日复习完成！                       │   │
│  │  正确率 87%  ·  用时 4分12秒            │   │
│  │  下次复习：明天  ·  届时 5个到期         │   │
│  │                [ 返回首页 ]              │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘
```

**SM2 评分映射**
| 按钮 | 含义 | 下次复习 |
|------|------|---------|
| 完全忘了 | score=0 | 明天重来 |
| 有点印象 | score=2 | 2天后 |
| 记得 | score=3 | 按算法 × ease_factor |
| 脱口而出 | score=5 | 间隔大幅拉长 |

---

### P2 · Page 7：进度追溯 `/protected/progress`

```
┌──────────────────────────────────────────────────┐
│  我的进度                                        │
├──────────────────────────────────────────────────┤
│                                                  │
│  总览                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ 已学课时 │  │ 掌握词汇 │  │ 练习天数 │      │
│  │ 47/191  │  │1240/7250│  │   23天   │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│  口语 B2 距离估算                                │
│  ──────────────────────────────────────          │
│  综合进度  ████████████░░░░░░░░░░  17%          │
│  词汇覆盖  1240 / 7250  ████░░░░░░  17%         │
│  问答熟练  2100 / 11412 ████░░░░░░  18%         │
│                                                  │
│  Stage 完成情况                                  │
│  Stage 1 (A1)  ████████████  30/30 ✓            │
│  Stage 2 (A2)  ████████████  30/30 ✓            │
│  Stage 3 (A2+) ████░░░░░░░░   7/30              │← 当前
│  Stage 4–12    ░░░░░░░░░░░░  未开始             │
│                                                  │
│  最近14天练习                                    │
│  [简单的每日 bar chart，有练习的日期填色]         │
│                                                  │
│  成就徽章                                        │
│  🔥 连续7天  📖 完成Stage1  💬 1000词  ...      │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### P2 · Page 8：辅助工具 `/protected/tools`

**三个子功能，Tab 切换**

```
[词汇搜索] [语法参考] [教材原文]

── 词汇搜索 ──────────────────────────────────────
搜索框：输入任意英文单词或中文意思
结果：词汇 · 所在 Book/Lesson/Page · 相关例句（来自 qa_pairs）

── 语法参考 ──────────────────────────────────────
按语法分类列出 notes 表中的语法注释
分类：时态 / 情态动词 / 冠词 / 介词 / 疑问词 / 其他
点击展开详细说明和例句

── 教材原文 ──────────────────────────────────────
输入自然语言问题（例：怎么问一个东西放在哪里）
混合检索（向量 + 全文）返回相关 content_blocks
显示教材位置：Book X · Lesson X · 第X页
```

**数据来源**
- `terms.normalized` → 词汇精确匹配
- `notes` → 语法参考
- `/api/search` → 教材原文的混合检索（已实现）

---

### P2 · Page 9：设置 `/protected/settings`

```
┌──────────────────────────────────────────────────┐
│  设置                                            │
├──────────────────────────────────────────────────┤
│                                                  │
│  账户                                            │
│  头像  [上传]                                    │
│  昵称  [阿强________________]  [保存]            │
│  邮箱  lijianya866@gmail.com  （不可修改）       │
│  密码  [修改密码 →]                              │
│                                                  │
│  偏好设置                                        │
│  主题    [跟随系统 ▼]  Light / Dark / System     │
│  日提醒  [每天 20:00 ▼]  提醒去复习             │
│  音频    [英式发音 ▼]  British / American        │
│                                                  │
│  订阅                                            │
│  当前计划：免费版                                │
│  [升级到专业版 →]                                │
│                                                  │
│  危险区                                          │
│  [退出登录]    [删除账户]                        │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 六、v0 出图 Prompt（直接复制使用）

> 所有 prompt 遵守同一设计系统。粘贴前无需修改。

---

### Prompt A — Dashboard 首页

```
Build a React dashboard page for "TalkFlow", a Callan Method English speaking practice app for Chinese learners.

DESIGN SYSTEM (strictly follow):
- Tailwind CSS with semantic CSS variables only: bg-background, bg-card, bg-muted, bg-primary, text-foreground, text-muted-foreground, text-primary, border-border
- No hardcoded colors (no gray-500, no #hex, no rgb())
- shadcn/ui components (Button, Card, Badge, Progress, Avatar, DropdownMenu)
- rounded-2xl for cards, rounded-xl for smaller elements
- Dark mode ready via CSS variables
- Font: Geist Sans
- Icons: lucide-react only

LAYOUT:
Sticky top nav: [🎤 TalkFlow logo] [地图 练习 复习 工具 nav links] [🔥3 streak badge] [Avatar dropdown]
Main content: max-w-4xl mx-auto px-4 py-8

SECTIONS (top to bottom):

1. GREETING (no card):
   "早上好，阿强 👋" — text-3xl font-bold
   "2026年5月15日 · 周四" — text-muted-foreground

2. RESUME CARD (prominent, primary-colored left border or ring):
   Top-left badge: "上次练习"
   Title: "Book 3 · Lesson 42"
   Subtitle text-muted-foreground: "telephone · television · radio · record player"
   Progress bar (bg-primary, 38% filled, labeled "38%")
   Right-aligned large button: "继续练习 →"

3. TODAY TASKS — title "今日待办", two side-by-side cards:
   Card A: BookOpen icon, "今日新课", "Book 3 Lesson 42", button "开始学习"
   Card B: RotateCcw icon, "到期复习", "8 个词汇", button "开始复习" (outline variant)

4. ACHIEVEMENTS ROW — title "我的成就", 3 inline stat badges:
   🔥 连续 3 天 | 📖 已学 47 课 | 💬 掌握 1,240 词

All UI text in Chinese. Clean, focused, no decorative clutter.
```

---

### Prompt B — 知识地图

```
Build a React curriculum map page for "TalkFlow" Callan Method app.

Same design system: Tailwind CSS variables only, shadcn/ui, rounded-2xl, dark mode ready, lucide-react icons, all text Chinese.

LAYOUT: Full width, sticky nav at top (same as dashboard)

PAGE TITLE SECTION:
"知识地图" — text-3xl font-bold
Subtitle: "Callan Method · 12册 · 191课 · 7,250词" — text-muted-foreground

STAGE SELECTOR (horizontal scrollable tab bar):
12 stage tabs: "Stage 1" through "Stage 12"
Active tab: bg-primary text-primary-foreground rounded-xl px-4 py-2
Inactive: text-muted-foreground hover:text-foreground
Below each: "A1" / "A2" / "B1" / "B2" CEFR badge

SELECTED STAGE DETAIL (Stage 3 shown as example):
Header card: "Stage 3 · Book 3 · A2+" with progress "7 / 30 课" and progress bar

LESSON LIST (scrollable, ~10 rows visible):
Each row is a card with:
  - Left: lesson number "L33" in muted circle
  - Center: lesson title (first vocab words) "telephone · television · radio"
  - Right: status icon
    ✓ completed (text-primary CheckCircle2)
    › current (text-primary ArrowRight, highlighted row with bg-primary/5 border-primary/20)
    locked (text-muted-foreground Lock icon)
Clicking a row navigates to /protected/learn/3/33

BOTTOM STATS BAR:
Stage 3: 已学词汇 210 / 580词 | 已完成课时 7/30
```

---

### Prompt C — AI 口语陪练

```
Build a React AI conversation practice page for "TalkFlow".

Same design system: CSS variables, shadcn/ui, rounded-2xl, dark mode, lucide-react, Chinese text.

LAYOUT: Full screen, no side padding clutter, focused on conversation

TOP BAR:
Left: "← 退出" link
Center: "AI 口语陪练" title
Right: session timer "04:32" and "结束练习" button (outline)

PRACTICE RANGE SELECTOR (below top bar, compact):
"练习范围：Stage 3 · 已学词汇" | Mode tabs: [快速模式] [标准模式]

CONVERSATION AREA (flex-1, scrollable, max-w-2xl mx-auto):

AI message bubble (left-aligned):
  - Small "🤖 AI 老师" label above
  - Bubble: bg-muted rounded-2xl rounded-tl-none px-5 py-4
  - Question text: "Is there a telephone in this room?"
  - Below bubble: small 🔊 audio play button

User message bubble (right-aligned):
  - Small "👤 你" label above  
  - Bubble: bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-5 py-4
  - "Yes, there is a telephone in the room."

AI feedback (right after user bubble, inline, not a separate bubble):
  - ✅ icon + "正确！发音清晰" text-primary text-sm
  OR
  - ⚠️ icon + "注意语序：It's a telephone, not..." text-amber-600 text-sm

BOTTOM INPUT AREA (fixed bottom, bg-background border-t):
Large mic button: circular, bg-primary, Mic icon — "按住说话"
Below: small "跳过这题" text button

SESSION STATS (above input area, one line):
"已练 12题 · 正确 10题 · 用时 04:32" text-muted-foreground text-sm center
```

---

### Prompt D — 间隔复习

```
Build a React spaced repetition review page for "TalkFlow".

Same design system. All text Chinese.

LAYOUT: Centered, max-w-lg mx-auto, focused single-card UI

TOP PROGRESS:
"今日复习" title with "8个待复习" badge (bg-primary/10 text-primary)
Progress bar: "3 / 8 完成" with percentage

MAIN REVIEW CARD (one at a time, large):

STATE 1 — Question:
  Small label: "Book 2 · Lesson 18 · 词汇复习" text-muted-foreground
  Large question: "Is the pencil long or short?" text-2xl font-medium
  Small 🔊 button to play audio
  Full-width button below: "想想看，再看答案" (outline)

STATE 2 — Answer revealed:
  Question shown smaller, dimmed (opacity-60)
  Divider line
  Answer text: "It's short. / No, it isn't long." text-xl
  
  Rating prompt: "你记得吗？" text-muted-foreground
  4 rating buttons in a row:
    [完全忘了] — destructive outline
    [有点印象] — outline, amber color suggestion
    [记得] — default outline
    [脱口而出] — bg-primary (filled)

EMPTY STATE (all done):
  Trophy icon (large, text-primary, centered)
  "今日复习完成！" text-2xl font-bold
  Stats: "正确率 87% · 用时 4分12秒" text-muted-foreground
  "下次复习：明天 · 届时 5个到期" small text
  Button: "返回首页"
```

---

### Prompt E — 前置辅导（Onboarding）

```
Build a React multi-step onboarding flow for "TalkFlow" Callan Method app. New users see this once after signup.

Same design system. Chinese text. Clean, minimal, no distractions.

LAYOUT: Full screen centered, max-w-md mx-auto, vertically centered

TOP PROGRESS: Step indicators "● ● ○" (3 dots, filled = done)

STEP 1 — 确认起点:
  Title: "你学到哪里了？" text-2xl font-bold
  Subtitle: "我们根据你的进度推荐合适的起点" text-muted-foreground
  
  4 radio option cards (full-width, border, rounded-2xl, selected has border-primary bg-primary/5):
    Option A: "还没学过 Callan" — 从 Stage 1 开始（适合完全新手）
    Option B: "已完成 Stage 1–2" — 从 Stage 3 开始（本 App 主要面向这里）★推荐
    Option C: "已完成 Stage 3–4" — 从 Stage 5 开始
    Option D: "Stage 5 或以上" — 自选起点
  
  "下一步 →" button (full-width, bg-primary)

STEP 2 — 学习方式:
  Title: "Callan Method 的关键" text-2xl font-bold
  
  3 step cards (vertical, numbered):
    1. "听到问题" — AI 老师快速提问，播放音频
    2. "立刻开口" — 不要停下来想，条件反射比翻译更重要
    3. "听取反馈" — AI 即时告诉你对不对，哪里要改
  
  Info box (bg-muted rounded-2xl p-4):
    "💡 Callan 法的核心是速度——老师语速是正常对话速度的两倍。
    不要怕说错，说错了改就行。"
  
  [← 上一步] [我明白了 →] two buttons

STEP 3 — 开始体验:
  Title: "准备好了！" text-2xl font-bold
  
  Summary card:
    "你的起点：Stage 3 · Book 3 · Lesson 31"
    "预计词汇：580个 | 问答：1,200条"
  
  Primary button: "开始第一课 →" (large, full-width)
  Secondary link: "先看一下体验课" (text button)
```

---

### Prompt F — 辅助工具

```
Build a React tools/reference page for "TalkFlow" with 3 tabbed sub-features.

Same design system. Chinese UI.

TABS (horizontal, full-width below page title):
[词汇搜索] [语法参考] [教材原文]

TAB 1 — 词汇搜索:
  Large search input: placeholder "搜索单词或中文意思..." with Search icon
  
  Results list (after typing):
  Each result card:
    - Word: "telephone" text-lg font-medium
    - Location badge: "Book 3 · Lesson 42 · 第8页"
    - Example from qa_pairs: "Q: Is there a telephone? A: Yes, there is."
    - [去练习这课 →] text button
  
  Empty state (no results): "没有找到匹配词汇" with suggestion

TAB 2 — 语法参考:
  Category chips (horizontal scroll): 时态 / 情态动词 / 冠词 / 介词 / 疑问词 / 比较级
  
  Accordion list of grammar notes from DB:
  Each item:
    - Title: grammar point name
    - Body: explanation text
    - Examples: 2-3 example sentences from the textbook
    - Location: "来自 Book 2, Lesson 15"

TAB 3 — 教材原文:
  Search input: placeholder "用中文或英文描述你想找的内容..."
  Subtitle: "例：怎么问东西在哪里 / how to ask where something is"
  
  Results (hybrid vector + fulltext search):
  Each result card:
    - Block type badge: "问答对" / "语法注释" / "词汇组"
    - Content text (highlighted keywords)
    - Location: "Book 10 · Lesson 147 · 第833页"
    - Similarity score as visual bar (optional)
```

---

## 七、/goal 执行计划

按优先级分3批执行。

### Batch 1（P0，本周）— 核心可用

```
目标：让用户登录后有一个真实的首页，而不是 Supabase 调试页

1. 修复 app/protected/layout.tsx
   - 替换 "Next.js Supabase Starter" 为 TalkFlow Logo + 真实导航
   - 导航链接：地图 /protected/map · 练习 /protected/learn · 复习 /protected/review · 工具 /protected/tools
   - 右侧：连续天数徽章 + 用户头像 dropdown（设置 / 退出登录）
   - 去掉 DeployButton、EnvVarWarning、底部 Supabase footer
   验收：导航栏显示 TalkFlow logo，无任何 Supabase 残留

2. 重写 app/protected/page.tsx（Dashboard）
   - 从 user_progress 读当前 lesson，显示进度恢复卡片
   - 从 review_schedule 读今日到期复习数量
   - 从 session_records 算连续天数和总学课数
   - 无进度时显示 Onboarding 引导（跳转 /onboarding）
   验收：登录后看到个人学习进度，不是 JSON debug 信息

3. 修复 app/protected/learn/page.tsx
   - 从 user_progress 读 current_lesson_id，跳到对应课
   - 无记录时 fallback /protected/learn/1/1
   验收：/protected/learn 跳到用户上次位置

4. 新建 Session 完成 Server Action
   - app/protected/learn/[bookNum]/[lessonNum]/actions.ts
   - completeLesson() → upsert user_progress + insert session_records
   - SessionCard LessonComplete 组件调用此 action
   验收：完成一课后刷新 dashboard 进度更新
```

### Batch 2（P1，下周）— 学习闭环

```
5. 新建 app/onboarding/page.tsx（3步引导）
   验收：新用户首次登录跳到引导，选完起点写入 user_progress

6. 新建 app/protected/map/page.tsx（知识地图）
   验收：可以看到 12 个 Stage，已学/未学状态正确

7. 升级 session-card.tsx（加场景图 + 实时反馈区）
   验收：学习页能显示场景图（暂用占位图），答案显示后有反馈区

8. 新建 app/protected/review/page.tsx（SM2 复习）
   验收：显示到期复习列表，点评分后更新 review_schedule

9. 统一 auth 辅助页面样式（forgot-password, sign-up-success, update-password, error）
   验收：4个页面与 login 视觉一致
```

### Batch 3（P2，第三周）— 功能完整

```
10. 新建 app/protected/progress/page.tsx
11. 新建 app/protected/practice/page.tsx（AI 口语陪练，需接 Whisper + Claude API）
12. 新建 app/protected/tools/page.tsx（词汇搜索 + 语法参考 + 教材原文）
13. 新建 app/protected/settings/page.tsx
```

---

## 八、核心痛点 & 卖点（落地页素材）

> 这一节给 v0 出落地页用。所有文案直接可以复制进 prompt 或 Figma。

### 目标用户画像

**是谁**：已经在线下 Callan 机构学完 Stage 1–2（或更多）的学习者
**他们想要什么**：继续练，但不想一直花钱买课，也找不到人随时陪练
**他们现在怎么做**：自己看教材、找语伴、或者干脆没练了

---

### 核心痛点（用户真实感受）

| # | 痛点 | 用户心声 |
|---|------|---------|
| 1 | 线下课太贵 | "一小时好几百，上不起" |
| 2 | 时间不自由 | "要提前约，请假上课，太麻烦" |
| 3 | 没人逼你开口 | "自学没有老师快速提问，根本找不到那种状态" |
| 4 | 学了容易忘 | "上周学的词，这周全忘了" |
| 5 | 看不见进步 | "不知道自己到底学到哪了，B2 还有多远" |
| 6 | 开口有心理障碍 | "怕说错，怕被笑，宁可不说" |

---

### 核心卖点（对应痛点的解法）

| 痛点 | TalkFlow 的解法 | 一句话版本 |
|------|--------------|-----------|
| 太贵 | 订阅制，比线下便宜 90%+ | "一顿饭的钱，练一个月" |
| 时间不自由 | 随时随地，手机就能练 | "通勤、睡前、碎片时间都能用" |
| 没人逼你开口 | AI 扮演 Callan 老师，快速提问不停歇 | "AI 老师比真人更有耐心，24小时待机" |
| 学了容易忘 | SM2 间隔复习，算法决定什么时候复习哪个词 | "不靠意志力，靠算法记住" |
| 看不见进步 | 知识地图 + B2 距离可视化 | "实时看到自己离 B2 还差多少" |
| 不敢开口 | 场景图 + AI 陪练，说错了不会被嘲笑 | "AI 不会嫌你烦，错了直接纠正继续" |

---

### 落地页核心文案（Hero Section）

**主标题（大字）：**
> 已经能开口，就差练够了

**副标题：**
> Callan Method Stage 3 开始，AI 替代真人老师陪练
> 随时随地，比线下便宜 90%，进度实时可见

**CTA 按钮：**
> 免费开始练习 →

**信任背书（Hero 下方小字）：**
> 基于 12 册 Callan Method 教材 · 7,250 词汇 · 11,412 句对话

---

### 三个功能亮点（Features Section）

**亮点 1：AI 陪练，随时开口**
> Callan 法的核心是快速问答不停歇。TalkFlow 的 AI 老师语速是正常速度，快速提问，不等你翻译，逼出条件反射。

**亮点 2：学了不忘，靠算法不靠意志力**
> SM2 间隔复习系统自动计算每个词最佳复习时机。今天学，明天复习，记住了三天后再来。越熟悉间隔越长，边际成本趋近于零。

**亮点 3：进度实时可见，知道自己在哪**
> 知识地图覆盖 Stage 1–12 全部 191 课。看到自己学到了哪，还差多少到 B2，每周练了几天，不再凭感觉学习。

---

### 竞品对比表（Why Us Section）

| | TalkFlow | 线下 Callan | Duolingo | Speak |
|-|----------|------------|---------|-------|
| Callan Method 内容 | ✅ 完整12册 | ✅ | ❌ | ❌ |
| AI 实时陪练 | ✅ | ❌ 真人贵 | ❌ | ✅ |
| 间隔复习 | ✅ | ❌ | ✅ | ❌ |
| 价格 | 💰 低 | 💰💰💰 贵 | 免费/低 | 💰💰 中 |
| 随时随地 | ✅ | ❌ 要约课 | ✅ | ✅ |
| 知识地图/进度可视化 | ✅ | ❌ | ⚠️ 有限 | ❌ |

---

## 九、核心用户入口

### TalkFlow 的唯一主入口

```
打开 App → Dashboard → 今天该做什么 → 一键开始
```

**设计原则：消灭决策成本。**
用户打开 app 不应该思考"我今天练什么"。Dashboard 替他做决定，给出一个最优先的任务，一个按钮开始。

**Dashboard 的优先级顺序（从上到下）：**
```
1. 今日复习（有到期复习时，优先级最高）
2. 继续上次的课（最常见状态）
3. 开始新课（上一课刚完成时）
4. 开始第一课（全新用户）
```

### 4条 UX 主流程

---

#### 流程 1：新用户第一次使用（只走一次）

```
落地页 /
  ↓ 点"免费开始练习"
注册页 /auth/sign-up
  ↓ 填邮箱+密码，提交
邮件确认页 /auth/sign-up-success
  ↓ 去邮箱点确认链接
  ↓ 自动跳回 app
Onboarding Step 1 /onboarding
  ↓ 选择当前 Stage（选"已完成 Stage 1-2"）
Onboarding Step 2
  ↓ 看学习方式说明，点"我明白了"
Onboarding Step 3
  ↓ 点"开始第一课"
  ↓ 写入 user_progress（book_num=3, lesson_num=31）
学习页 /protected/learn/3/31
  ↓ 看词汇 → 看问题 → 看答案 → 点"记住了"
  ↓ 循环直到一课结束
完成页（SessionCard LessonComplete 状态）
  ↓ 写入 session_records + 更新 user_progress
  ↓ 点"下一课"或"返回首页"
Dashboard /protected
  ↓ 看到进度更新，第一次看到自己的数据

关键设计决策：
- Onboarding 不可跳过 Step 1（必须选 Stage）
- Step 2 和 Step 3 可以快速过
- 注册到开始第一课，目标控制在 3 分钟以内
```

---

#### 流程 2：老用户每天打开（最高频，日常）

```
Dashboard /protected
  ↓ 看到今日任务卡（有复习 or 继续练习）

  分支 A：有到期复习
    ↓ 点"开始复习"
    复习页 /protected/review
      ↓ 一题一题过
      ↓ 每题点评分（完全忘了/有点印象/记得/脱口而出）
      ↓ 更新 review_schedule（SM2 算法计算下次时间）
    复习完成态
      ↓ 看正确率和用时
      ↓ 点"去练习新课" 或 "返回首页"

  分支 B：无到期复习，继续学新课
    ↓ 点"继续练习"
    学习页 /protected/learn/{b}/{l}
      ↓ 词汇 → 问答 → SM2 反馈
      ↓ 完成一课 → 写入进度
    ↓ 返回 Dashboard

关键设计决策：
- Dashboard 每次打开自动判断优先任务（复习 > 新课）
- 整个流程用户不需要导航，跟着系统走就行
- 目标：打开到开始练习，不超过 2 次点击
```

---

#### 流程 3：老用户想找某个词/内容（低频但重要）

```
Dashboard /protected
  ↓ 点顶部导航"工具"

辅助工具页 /protected/tools
  ↓ 默认显示"词汇搜索" Tab

  分支 A：搜索单词
    ↓ 输入单词（如"telephone"）
    ↓ 结果显示：所在 Book/Lesson/Page + 相关例句
    ↓ 点"去练习这课 →"
    学习页 /protected/learn/3/42
    ↓ 直接跳到对应课

  分支 B：搜索语法
    ↓ 切换到"语法参考" Tab
    ↓ 点分类（如"时态"）
    ↓ 展开对应语法注释和例句

  分支 C：自然语言搜教材原文
    ↓ 切换到"教材原文" Tab
    ↓ 输入"怎么问东西放在哪里"
    ↓ 向量 + 全文混合检索，返回相关 content_blocks
    ↓ 点某条结果 → 跳到对应课

关键设计决策：
- 默认落在词汇搜索（最高频的子功能）
- 每条搜索结果都带"去练习"入口，从工具回到学习的路径零摩擦
```

---

#### 流程 4：老用户查看自己进度（低频，留存辅助）

```
Dashboard /protected
  ↓ 点成就栏（或顶部导航"进度"）

进度页 /protected/progress
  ↓ 看总体数据（已学课/掌握词汇/练习天数）
  ↓ 看 B2 距离估算
  ↓ 看 Stage 完成情况
  ↓ 点某个 Stage → 跳到知识地图该 Stage

  分支：想从某课继续
    知识地图 /protected/map
      ↓ 切换到指定 Stage
      ↓ 点某课
      学习页 /protected/learn/{b}/{l}

关键设计决策：
- 进度页不是终点，是跳板——看完数据后有明确的"继续学"路径
- B2 距离要有正向激励感，不是"还差很多"，而是"已经完成17%"
```

---

## 十、每页视觉结构详细规格

> 比线框图更细，标注组件名、状态、边距、数据绑定。v0 和 Figma 直接参考。

---

### Page 1：Dashboard `/protected`

**布局：** 全屏，sticky 顶部导航 + 可滚动主内容区

**顶部导航（height: 64px，border-b border-border）**
```
左：Logo（Mic icon 32px + "TalkFlow" font-bold text-xl）
中：导航链接（地图 · 练习 · 复习 · 工具）text-sm，当前页下划线
右：🔥{streak}天 badge（bg-orange-100 text-orange-600 rounded-full px-2 py-1 text-xs）
    + Avatar（32px圆形，显示邮箱首字母，bg-primary text-primary-foreground）
    + DropdownMenu（设置 / 退出登录）
```

**主内容区（max-w-2xl mx-auto px-4 py-8，gap-6 flex-col）**

**区块 1 — 问候（无卡片，直接文字）**
```
text-2xl font-bold：早上好，{nickname} 👋
text-sm text-muted-foreground：{今日日期，格式：2026年5月15日 · 周四}
```

**区块 2 — 主任务卡（最重要，primary 边框）**
```
Card：rounded-2xl border-2 border-primary bg-primary/5 p-6
  内部：
    Badge：bg-primary/10 text-primary text-xs → "上次练习" or "今日复习 8个"
    Title：text-xl font-semibold → "Book 3 · Lesson 42"
    Subtitle：text-sm text-muted-foreground → 前3个词汇，逗号分隔
    Progress：
      div flex justify-between text-xs text-muted-foreground mb-1
        span："进度"
        span："{n}%"
      Progress bar：w-full h-2 bg-muted rounded-full，内部 div bg-primary rounded-full
    Button：w-full mt-4，size="lg" → "继续练习 →" or "开始复习 →"

状态A（有进度）：显示上述内容
状态B（全新用户，无进度）：
  Title 换成："欢迎来到 TalkFlow"
  Subtitle："从 Stage 3 开始你的口语训练"
  Button："开始第一课 →"
```

**区块 3 — 今日待办（两列并排卡片）**
```
Title：text-sm font-medium text-muted-foreground uppercase tracking-wide → "今日待办"
Grid：grid grid-cols-2 gap-3

卡片A（新课）：
  Card rounded-xl border border-border p-4
    Icon：BookOpen 20px text-primary
    Label：text-xs text-muted-foreground → "今日新课"
    Value：text-sm font-medium → "Lesson 42"
    Button：size="sm" variant="outline" w-full mt-3 → "开始学习"

卡片B（复习）：
  Card rounded-xl border border-border p-4
    Icon：RotateCcw 20px text-primary（有到期时 text-destructive 红色强调）
    Label：text-xs text-muted-foreground → "到期复习"
    Value：text-sm font-medium → "{n} 个词汇"（0个时灰色显示"暂无"）
    Button：size="sm" variant="outline" w-full mt-3 → "开始复习"（0个时 disabled）
```

**区块 4 — 成就栏（无卡片，横向排列）**
```
Title：text-sm font-medium text-muted-foreground → "我的成就"
Flex row gap-4 flex-wrap：
  Badge：🔥 连续{n}天
  Badge：📖 已学{n}课
  Badge：💬 掌握{n}词
  每个 Badge：bg-muted text-foreground text-sm px-3 py-1 rounded-full
点击整行跳到 /protected/progress
```

---

### Page 2：学习页 `/protected/learn/[b]/[l]`

**布局：** 全屏，sticky header + flex-1 主内容 + fixed 底部操作区

**Header（sticky，bg-background/80 backdrop-blur-sm border-b，height: 72px）**
```
左：Link "← 退出" text-sm text-muted-foreground → /protected
中：div flex items-center gap-2
      BookOpen 16px text-primary
      "Book {b} · Lesson {l}" text-sm font-medium
右：text-sm font-medium text-primary → "{progress}%"
底部：Progress bar（h-1.5 bg-muted，内部 bg-primary，transition-all duration-500）
```

**主内容区（max-w-2xl mx-auto px-4 py-6，flex flex-col gap-4）**

**场景图区（新增，条件显示）**
```
当 scenes 表有对应数据时显示：
  div relative rounded-2xl overflow-hidden aspect-video bg-muted
    img：场景图，object-cover w-full h-full
    热区高亮：absolute div，border-2 border-yellow-400 animate-pulse rounded，
              位置来自 hotspots JSONB（x, y, w, h）
    当前词汇热区高亮，其他词汇热区半透明

无场景图时：不显示此区块（不显示空白占位）
```

**词汇卡（始终显示）**
```
div rounded-2xl border p-6 transition-all duration-300
  active（phase=vocab）：bg-primary/5 border-primary/20
  inactive（phase≠vocab）：bg-card border-border opacity-60

  Header：div flex items-center gap-2 mb-4
    div rounded-lg w-8 h-8 bg-primary/10 flex items-center justify-center
      Volume2 16px text-primary
    span text-xs uppercase tracking-wider text-primary → "词汇"

  Content：text-2xl font-medium text-foreground leading-relaxed
    {vocab.split(" | ").join("  ·  ")}
```

**问答区（phase ≠ vocab 时显示）**
```
问题卡：
  div rounded-2xl border p-6
    active（phase=question）：border-2 border-primary shadow-sm
    inactive（phase=answer）：border-border opacity-80

  Header：div flex justify-between items-center mb-4
    左：Mic icon + "问题" label
    右（多题时）：Badge "{n}/{total}"
  Text：text-xl font-medium text-foreground

答案卡（phase=answer 时）：
  div rounded-2xl border-2 bg-primary/5 border-primary/30 p-6
    Header：CheckCircle2 icon + "答案" label（text-primary）
    Text：text-xl text-foreground

实时反馈区（answer 显示后，新增）：
  div rounded-xl bg-muted p-4 text-sm
    语音模式：✅ 发音准确 · 用时 2.3秒 or ⚠️ 注意：...
    文字模式：标准答案对比（暂时显示标准答案即可）
```

**底部操作区（fixed bottom-0，bg-background border-t，px-4 py-4）**
```
phase=vocab：
  Button size="lg" w-full → "开始提问 →"

phase=question：
  Button size="lg" w-full → "看答案"

phase=answer：
  div flex gap-3
    Button flex-1 variant="outline" → "没记住"
    Button flex-1 bg-primary → "记住了 ✓"

底部安全区：pb-safe（iOS 底部适配）
```

---

### Page 3：Onboarding `/onboarding`

**布局：** 全屏居中，max-w-md mx-auto，3步线性流程

**顶部进度点（3个）**
```
div flex justify-center gap-2 pt-8 pb-6
  3个 div：w-2 h-2 rounded-full
  当前及已过：bg-primary
  未到：bg-muted
```

**Step 1 — 选起点**
```
Title：text-2xl font-bold → "你学到哪里了？"
Subtitle：text-muted-foreground text-sm mb-6 → "根据你的进度推荐合适的起点"

4个选项卡（radio group）：
  每个：div rounded-2xl border p-4 cursor-pointer transition-all mb-3
    未选：border-border bg-card
    已选：border-primary bg-primary/5
    内部：div flex justify-between items-center
      左：
        text-sm font-medium → 选项标题
        text-xs text-muted-foreground → 说明文字
      右（推荐项）：Badge "推荐" bg-primary/10 text-primary

  选项A："还没学过 Callan" / "从 Stage 1 开始"
  选项B："已完成 Stage 1–2" / "从 Stage 3 开始" ← 推荐 Badge
  选项C："已完成 Stage 3–4" / "从 Stage 5 开始"
  选项D："Stage 5 或以上" / "自选起点"

Button：size="lg" w-full mt-6 bg-primary → "下一步 →"（未选时 disabled）
```

**Step 2 — 学习方式**
```
Title：text-2xl font-bold → "Callan 法的关键"

3个步骤卡（竖排）：
  div flex gap-4 mb-4
    圆形数字：w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex center
    右侧：
      text-sm font-semibold → 步骤标题
      text-sm text-muted-foreground → 步骤说明

  1. "听到问题" / "AI 老师快速提问，跟真实课堂一样快"
  2. "立刻开口" / "不要停下来翻译，条件反射比理解更重要"
  3. "听取反馈" / "说错了 AI 立刻纠正，不会嘲笑你"

提示框：div rounded-2xl bg-muted p-4 mt-4
  text-sm text-muted-foreground
  "💡 Callan 法的目标是让你不经过中文思考，直接用英文反应。
   一开始很难，坚持2周就会有明显变化。"

底部：div flex gap-3
  Button variant="outline" flex-1 → "← 上一步"
  Button flex-1 bg-primary → "我明白了 →"
```

**Step 3 — 确认开始**
```
图标：div w-20 h-20 rounded-full bg-primary/10 flex center mx-auto mb-6
  Mic 40px text-primary

Title：text-2xl font-bold text-center → "准备好了！"

汇总卡：div rounded-2xl bg-muted p-5 mb-6
  text-sm text-muted-foreground → "你的起点"
  text-lg font-semibold text-foreground → "Stage 3 · Book 3 · Lesson 31"
  mt-2 text-sm text-muted-foreground → "词汇 580个 · 问答 1,200条"

Button：size="lg" w-full bg-primary → "开始第一课 →"
Link：text-center text-sm text-muted-foreground mt-3 → "先看体验课"
```

---

### Page 4：知识地图 `/protected/map`

**布局：** 全屏，顶部导航 + Stage 横向 tab + 课程列表

**Page Header**
```
div px-4 pt-6 pb-4
  text-2xl font-bold → "知识地图"
  text-sm text-muted-foreground → "Callan Method · 12册 · 191课 · 7,250词"
```

**Stage 横向 Tab（overflow-x-auto，no-scrollbar）**
```
div flex gap-2 px-4 pb-4
  12个 Tab，每个：
    div rounded-xl px-4 py-2 cursor-pointer whitespace-nowrap
    激活：bg-primary text-primary-foreground
    未激活：bg-muted text-muted-foreground hover:text-foreground

  Tab 内：
    "Stage {n}" text-sm font-medium
    CEFR badge（A1/A2/B1/B2 小标签）

  完成的 Stage：右上角 ✓ 小标记
```

**选中 Stage 详情区**

**Stage 摘要条**
```
div px-4 py-3 bg-muted/50 flex justify-between items-center
  左：text-sm font-medium → "Stage 3 · Book 3 · A2+"
  右：text-sm text-muted-foreground → "7 / 30 课"
Progress bar：w-full h-1 bg-muted，内 bg-primary
```

**课程列表（可滚动，每课一行）**
```
每行：div flex items-center gap-4 px-4 py-4 border-b border-border cursor-pointer
  hover：bg-muted/30
  当前课：bg-primary/5

  左圆圈（40px）：
    已完成：bg-primary/10 text-primary → CheckCircle2 icon
    当前：bg-primary text-primary-foreground → ArrowRight icon
    未开始：bg-muted text-muted-foreground → "L{n}" 文字

  中间（flex-1）：
    text-sm font-medium text-foreground → 前4个词汇用 · 分隔
    text-xs text-muted-foreground → "Lesson {n}"

  右（状态文字）：
    已完成：text-xs text-primary → "已完成"
    当前：text-xs text-primary font-medium → "进行中"
    未开始：空
```

---

### Page 5：进度页 `/protected/progress`

**布局：** 顶部导航 + 可滚动内容，max-w-2xl mx-auto px-4

**区块 1 — 总览数字（3列 grid）**
```
grid grid-cols-3 gap-3

每个 Card rounded-2xl border p-4 text-center：
  text-2xl font-bold text-foreground → 数字
  text-xs text-muted-foreground mt-1 → 标签
  text-xs text-primary mt-1 → "/ {total}" 总数

卡片A：已学课时 / 47 / 191
卡片B：掌握词汇 / 1,240 / 7,250
卡片C：练习天数 / 23
```

**区块 2 — B2 距离（全宽卡片）**
```
Card rounded-2xl border p-6
  Title：text-lg font-semibold → "口语 B2 目标距离"
  大进度数字：text-4xl font-bold text-primary → "17%"
  subtitle：text-sm text-muted-foreground → "已完成 17%，继续加油"

  3条细进度条：
    每条：
      div flex justify-between text-xs text-muted-foreground mb-1
        span → "词汇覆盖"
        span → "1,240 / 7,250"
      Progress bar h-2 bg-muted，内部 bg-primary rounded-full，width={%}
    
    词汇覆盖：17%
    问答练习：18%
    语法完成度：26%（来自 notes 表覆盖率）
```

**区块 3 — Stage 完成列表**
```
Title：text-sm font-medium text-muted-foreground → "按 Stage 分布"

每个 Stage 行：div flex items-center gap-4 py-3 border-b border-border
  左：Badge rounded-lg px-2 py-1 text-xs
    完成：bg-primary/10 text-primary → "✓ Stage 1"
    当前：bg-primary text-primary-foreground → "Stage 3"
    未开始：bg-muted text-muted-foreground → "Stage 4"
  中间（flex-1）：
    text-sm → Book 名称
    Progress bar h-1.5 mt-1 bg-muted，内部 bg-primary
  右：text-xs text-muted-foreground → "30/30" or "7/30" or "0/30"
点击行 → 跳到 /protected/map 并激活该 Stage
```

**区块 4 — 最近14天**
```
Title：text-sm font-medium text-muted-foreground → "最近练习"

div flex gap-1 items-end（14个柱状条）：
  每个 div flex flex-col items-center gap-1
    柱条：w-6 rounded-sm bg-primary，height 按课数 0-32px，无课时 bg-muted h-1
    日期标签：text-xs text-muted-foreground → "5/1" 格式，7天显示一次
  今天：border-2 border-primary
```

---

### Page 6：复习页 `/protected/review`

**布局：** 顶部 Header + 居中单卡片，max-w-lg mx-auto

**Header**
```
div px-4 py-4 flex justify-between items-center
  左：text-xl font-bold → "今日复习"
  右：Badge bg-primary/10 text-primary → "{n}个待复习"

Progress bar + 计数：
  div flex justify-between text-sm text-muted-foreground mb-2
    → "{done} / {total} 完成"
  Progress bar h-2 bg-muted，内部 bg-primary transition-all
```

**主卡片（居中，带状态切换）**

**State 1 — 问题**
```
Card rounded-2xl border p-8 text-center
  top label：text-xs text-muted-foreground → "Book {b} · Lesson {l} · {block_type_zh}"
  Question text：text-2xl font-medium text-foreground mt-4 mb-2
  Audio button：div flex justify-center → Volume2 icon button，点击播放 audio_url
  Button：size="lg" w-full mt-8 variant="outline" → "想想看，再看答案"
```

**State 2 — 答案 + 评分**
```
Card rounded-2xl border p-8
  问题（dimmed）：text-lg text-muted-foreground opacity-60
  Separator：div border-t border-border my-4
  答案：text-xl font-medium text-foreground

  评分区：
    text-sm text-muted-foreground text-center mb-4 → "你记得吗？"
    grid grid-cols-4 gap-2
      [完全忘了]：Button size="sm" variant="outline" className="border-destructive text-destructive"
      [有点印象]：Button size="sm" variant="outline" className="border-amber-500 text-amber-600"
      [记得]：Button size="sm" variant="outline"
      [脱口而出]：Button size="sm" bg-primary text-primary-foreground
```

**Empty State — 全部完成**
```
div text-center py-16
  Trophy 64px text-primary mx-auto mb-4
  text-2xl font-bold → "今日复习完成！"
  text-sm text-muted-foreground mt-2 → "正确率 {n}% · 用时 {mm:ss}"
  div rounded-xl bg-muted p-4 mt-6 text-sm → "下次复习：明天 · 届时 {n} 个到期"
  Button size="lg" mt-6 → "返回首页"
```

---

### 所有页面共用空状态规范

```
网络错误：
  WifiOff icon 48px text-muted-foreground
  "加载失败" text-lg font-medium
  Button variant="outline" → "重试"

数据为空（如无复习任务）：
  对应图标 48px text-muted-foreground
  说明文字 text-muted-foreground
  引导按钮（如"去学新课"）

加载中：
  Skeleton 组件（shadcn/ui）模拟内容轮廓
  不用 spinner，用 skeleton（体验更好）
```
