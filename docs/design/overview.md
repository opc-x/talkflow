# TalkFlow 产品 & 知识库设计全览

> 更新：2026-05-14
> 本文整合产品定位、学习 UX、知识库结构、数据管线、向量检索各方向设计，作为团队对齐和新成员上手的单一来源。

---

## 目录

1. [产品定位](#1-产品定位)
2. [核心学习流程](#2-核心学习流程)
3. [场景图 + 音频设计](#3-场景图--音频设计)
4. [知识库结构](#4-知识库结构)
5. [数据管线](#5-数据管线)
6. [向量检索设计](#6-向量检索设计)
7. [知识库质量评估](#7-知识库质量评估)
8. [当前实现状态](#8-当前实现状态)
9. [待决策事项](#9-待决策事项)

---

## 1. 产品定位

### 核心 Loop

```
场景图片 → 动画引导 → AI 实时对话 → 可见进度 → 激励回来 → 循环
```

### 差异化组合

| 要素 | 作用 |
|------|------|
| 看图说话（场景图） | 降低开口焦虑，有具体锚点 |
| 动画模拟引导 | 替代真人教师示范 |
| AI 实时陪练 | 随时随地，不怕被嫌烦 |
| 阶梯式游戏化奖励 | 解决坚持不下去的问题 |
| 承诺退款保证 | 打破"花钱没效果"的信任壁垒 |
| 价格 | 打破线下机构高收费，直接降维打击 |

这五要素的完整组合在市场上没有竞品实现过。

### 竞品扫描

| 竞品 | 缺什么 |
|------|--------|
| Duolingo | 没实时对话 |
| Speak | 没情景引导，无游戏化，且贵 |
| ELSA | 只纠发音 |
| 线下 Callan | 贵且时间固定 |

### 产品评分：78 / 100

**卡分原因（仅两个）：**
1. 退款承诺需要真实数据背书才能用
2. Callan 内容要重组绕开版权风险（成立的话分数更高）

---

## 2. 核心学习流程

### Callan Method 原子单元

```
词汇引入 → 被提问 → 回答 → 下一个
```

对应数据库：

```
lexical_block（词汇组）
  └── qa_block × N（紧跟的问答，直到下一个 lexical_block）
```

用户在 App 里顺序走完一课，不随机。

### 学习 Session 页面（第一版）

**状态 1：展示词汇 + 问题**

```
┌─────────────────────────────────────┐
│  Book 1  ·  Lesson 1               │  进度条
│  ████████░░░░░░░░░░░░  12%         │
├─────────────────────────────────────┤
│                                     │
│   pen | pencil | book               │  词汇组（大字）
│                                     │
│   ─────────────────────             │
│                                     │
│   Q: What's this?                   │  当前问题
│                                     │
│         [ 看答案 ]                  │
│                                     │
└─────────────────────────────────────┘
         ← 上一个
```

**状态 2：答案显示 + 反馈**

```
┌─────────────────────────────────────┐
│  Book 1  ·  Lesson 1               │
│  ████████░░░░░░░░░░░░  12%         │
├─────────────────────────────────────┤
│                                     │
│   pen | pencil | book               │
│                                     │
│   ─────────────────────             │
│                                     │
│   Q: What's this?                   │
│   A: It's a pen.                    │  答案出现
│                                     │
│   [ 没记住 · 再来 ]  [ 记住了 ✓ ]  │  SM2 反馈
│                                     │
└─────────────────────────────────────┘
         ← 上一个
```

### 数据流

```
用户打开 Session
  → 读 user_progress（上次到哪一课）
  → 拉对应 lesson 的所有 content_blocks（按顺序）
  → 按 lexical_block → qa_block 分组展示
  → 用户反馈（记住/没记住）→ 写 review_schedule（SM2）
  → 进度 +1 → 写 user_progress
```

**相关表：** `content_blocks` · `user_progress` · `review_schedule` · `session_records`

### 第一版明确不做

- ❌ 语音输入/识别
- ❌ 统计 dashboard
- ❌ SM2 复习队列（表已预留，逻辑第二版加）
- ❌ 社交 / 语伴功能
- ❌ 搜索 UI（API 已有，UI 后加）

---

## 3. 场景图 + 音频设计

### 设计原则

Callan Q&A 是固定脚本，永远不变 → 能提前生成的全部提前生成，实时调用只做必须实时的部分。

### 场景图 + 热区

Callan 词汇按场景聚集，一张图覆盖一组词：

```
Lesson 1: table, chair, wall, floor, ceiling, window, door...
→ 一张"教室/室内"场景图覆盖全部
```

**12 本书估计需要 60–100 张场景图，不是 19,698 张。**

热区数据结构：

```json
{
  "scene_id": "classroom-basic",
  "image_url": "https://xxx.supabase.co/storage/scenes/classroom-basic.png",
  "hotspots": [
    { "word": "table",   "x": 120, "y": 340, "w": 180, "h": 80 },
    { "word": "chair",   "x": 310, "y": 380, "w": 90,  "h": 120 },
    { "word": "window",  "x": 40,  "y": 80,  "w": 200, "h": 150 },
    { "word": "ceiling", "x": 0,   "y": 0,   "w": 640, "h": 60  }
  ]
}
```

前端渲染：

```tsx
<div className="relative">
  <img src={scene.imageUrl} />
  {activeWord && (
    <div
      className="absolute border-2 border-yellow-400 animate-pulse rounded"
      style={{ top: hotspot.y, left: hotspot.x, width: hotspot.w, height: hotspot.h }}
    />
  )}
</div>
```

### 问题音频

**为什么提前生成：**
- Callan 问题是死的固定脚本，永远不变
- 实时 TTS 有延迟、有抖动、有 API 成本
- 提前生成 = 零延迟 + 声音永远一致 + 边际成本为零

**生成方案：**
- TTS 引擎：OpenAI `tts-1`
- 数量：19,698 条问题
- 一次性成本：~100 万字符 × $15/1M = **约 $15**
- 存储：Supabase Storage

文件命名规范：

```
audio/questions/b{book}-l{lesson}-q{index}.mp3

示例：
audio/questions/b1-l1-q0.mp3
audio/questions/b1-l1-q1.mp3
```

### 整体架构

```
固定资源（提前生成，存 Supabase Storage）
├── 场景图（60–100 张）
├── 热区坐标（JSON，存数据库）
└── 问题音频（19,698 个 .mp3）

实时调用（每次练习）
├── 用户说话 → Whisper STT → 转文字
├── 文字 + 标准答案 → Claude API → 评估 + 纠错
└── 评估结果 → 下一题 or 重复
```

### 成本结构

| 部分 | 成本类型 | 估算 |
|------|---------|------|
| 问题音频生成 | 一次性 | ~$15 |
| 场景图生成 | 一次性 | ~$30–50（AI 生图） |
| Whisper STT | 每用户每次 | $0.006/分钟 |
| Claude 评估 | 每用户每次 | ~$0.05–0.10/课 |

20 分钟一节课，每用户边际成本约 **$0.10–0.15**。

---

## 4. 知识库结构

### 设计原则

从任意最小内容项可反查到教材原始位置：

```
term / question / answer / note / dictation / chart
  → content_block
  → book_page
  → pdf_page
  → lesson
  → stage / book
  → source PDF
```

### 内容层（静态，只读）

#### books

```sql
create table books (
  id bigserial primary key,
  book_num smallint not null unique,
  stage smallint not null,
  cefr_level text,
  title text,
  source_pdf text not null,
  lesson_start smallint not null,
  lesson_end smallint not null,
  created_at timestamptz default now()
);
```

#### lessons

```sql
create table lessons (
  id bigserial primary key,
  book_id bigint not null references books(id) on delete cascade,
  book_num smallint not null,
  stage smallint not null,
  lesson_num smallint not null unique,
  cefr_level text,
  pdf_page_start smallint,
  pdf_page_end smallint,
  book_page_start smallint,
  book_page_end smallint,
  block_count integer default 0,
  term_count integer default 0,
  qa_count integer default 0,
  created_at timestamptz default now()
);
```

#### book_pages

`pdf_page` 是 PDF 物理页；`book_page` 是教材内部页码。两个都要存。

```sql
create table book_pages (
  id bigserial primary key,
  book_id bigint not null references books(id) on delete cascade,
  lesson_id bigint references lessons(id) on delete set null,
  book_num smallint not null,
  stage smallint not null,
  lesson_num smallint,
  pdf_page smallint not null,
  book_page smallint,
  page_kind text not null default 'content',
  block_ids text[] default '{}',
  unique (book_num, pdf_page)
);
```

#### content_blocks（核心表）

```sql
create table content_blocks (
  id text primary key,
  book_id bigint not null references books(id) on delete cascade,
  lesson_id bigint references lessons(id) on delete set null,
  book_page_id bigint references book_pages(id) on delete set null,
  book_num smallint not null,
  stage smallint not null,
  lesson_num smallint,
  pdf_page smallint not null,
  book_page smallint,
  block_type text not null,
  text text,
  source jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz default now()
);
```

Block 类型：

| block_type | 说明 |
|------------|------|
| `lexical_block` | 词汇组（核心学习单元）|
| `qa_block` | 问答对，紧跟 lexical_block |
| `grammar_note` | 语法说明 |
| `dictation` | 听写练习 |
| `word_building_exercise` | 构词练习 |
| `revision_exercise` | 复习活动 |
| `chart_reference` / `chart_page` | 图表引用 |
| `front_matter` | 书籍前言 |

#### terms

```sql
create table terms (
  id bigserial primary key,
  block_id text not null references content_blocks(id) on delete cascade,
  -- ... book/lesson/page anchors ...
  term text not null,
  normalized text not null,
  term_type text default 'vocabulary',
  position integer,
  embedding vector(1536),
  created_at timestamptz default now()
);
```

#### qa_pairs

```sql
create table qa_pairs (
  id bigserial primary key,
  block_id text not null references content_blocks(id) on delete cascade,
  -- ... book/lesson/page anchors ...
  pair_index integer not null,
  question text not null,
  answer text,
  qa_type text default 'drill',
  audio_url text,
  question_embedding vector(1536),
  answer_embedding vector(1536),
  created_at timestamptz default now()
);
```

#### notes / exercises / chart_refs / scenes

```sql
-- notes: 语法注释，挂 block_id
-- exercises: 听写 + 构词 + 复习练习
-- chart_refs: 图表引用
-- scenes: 场景图 + hotspots JSONB
create table scenes (
  id bigserial primary key,
  lesson_id bigint references lessons(id) on delete cascade,
  block_id text references content_blocks(id) on delete set null,
  image_url text not null,
  position smallint default 1,
  hotspots jsonb not null default '[]',
  created_at timestamptz default now()
);
```

### 用户层

```sql
-- profiles: 用户信息（role, nickname, avatar_url）
-- subscriptions: 订阅计划（status, plan, stripe_id）
```

### 学习进度层

```sql
-- user_progress: 当前 lesson + lessons_done[]
-- session_records: 每次 session（时长、正确数）
-- qa_responses: 每条回答（score, user_transcript, audio_url）
-- review_schedule: SM2 复习队列（next_review_at, interval_days, ease_factor）
```

### RLS 策略

**静态内容表**（`books / lessons / book_pages / content_blocks / terms / qa_pairs / notes / exercises / chart_refs / scenes`）：登录用户可读，任何客户端不可写，写入只走 service role seed。

**用户数据表**（`profiles / subscriptions / user_progress / session_records / qa_responses / review_schedule`）：`user_id = auth.uid()`，用户只能读写自己的数据。

---

## 5. 数据管线

### 总流程

```
Callan Method PDF Book 1–12
        ↓ extract_pymupdf.py
book-1.md ... book-12.md
        ↓ structured/extract_structured.py
structured/*.json（8 个索引文件）
        ↓ structured/validate_fine_index.py（15 项验收）
        ↓ seed_supabase_structured_rest.py
Supabase DB
        ↓ 批量生成 embedding（OpenAI text-embedding-3-small）
        ↓ 创建 HNSW 向量索引
```

### 第一步：PDF → Markdown

脚本：`kb-personal/callan-method/extract_pymupdf.py`

处理 Callan PDF 私有字体编码，提取 Q/A、vocab、notes、dictation 文本。

### 第二步：Markdown → 细粒度 JSON 索引

脚本：`kb-personal/callan-method/structured/extract_structured.py`

输出 8 个 JSON 索引：

| 文件 | 对应 Supabase 表 |
|------|----------------|
| `course-index.json` | `books` |
| `lesson-index.json` | `lessons` |
| `page-index.json` | `book_pages` |
| `block-index.json` | `content_blocks / notes / exercises` |
| `term-index.json` | `terms` |
| `qa-index.json` | `qa_pairs` |
| `dictation-index.json` | `exercises (exercise_type='dictation')` |
| `chart-index.json` | `chart_refs` |

### 第三步：结构验收

```bash
cd kb-personal/callan-method
/opt/homebrew/bin/python3 structured/validate_fine_index.py
# 必须看到：15 PASS, 0 WARNING, 0 FAIL
```

验收覆盖 15 项，包括：全书全课全页锚点完整性、block/term/QA 反查链无断点、书页单调递增、临时 artifacts 清零等。

### 第四步：导入 Supabase

Schema migration：`talkflow/supabase/migrations/202605120001_callan_kb_schema.sql`

```bash
# REST 方式（推荐）
cd kb-personal/callan-method
/tmp/talkflow_venv/bin/python3 seed_supabase_structured_rest.py
```

**注意**：临时 anon seed policy 导入后必须立刻删除，用 MCP/SQL 验证 policy 剩余 0 条。

### 第五步：向量处理

执行顺序（不能反）：

```
1. 先导入关系型结构并验证 counts 和 anchors
2. 批量生成 embeddings（text-embedding-3-small，1536 维）
3. 最后创建 HNSW 向量索引
```

lexical_block 的 embedding 策略（2026-05-14 修复）：

```
原问题：3,484 个 lexical_block 平均 25 字符，如 "or"、"large | small"，单词列表语义太弱

修复：embedding 输入 = 词汇文本 + 紧跟的 qa_block / grammar_note 文本
效果：
  - "or" 的最近邻包含 "long | short"（sim 0.831）
  - "large | small" 的最近邻包含 "tall | short"（sim 0.748）
```

---

## 6. 向量检索设计

### 检索层次（推荐混合）

```
1. exact    → terms.normalized（词汇精确匹配）
2. fulltext → content_blocks.text / qa_pairs.question / qa_pairs.answer
3. vector   → content_blocks.embedding（自然语言模糊语义）
```

### 语义检索 RPC

```sql
select * from match_content_blocks(
  query_embedding := '[...]'::vector,
  match_count     := 10,
  filter_book     := null,
  filter_lesson   := null,
  filter_block_types := null
);
-- 返回：block_id, book_num, stage, lesson_num, book_page, pdf_page, block_type, text, similarity
```

### 全文检索 RPC

```sql
select * from search_content_blocks_text(
  query_text   := 'meaning of the word',
  match_count  := 10,
  filter_book  := null,
  filter_lesson := null,
  filter_block_types := null
);
```

### App 侧调用流程

```
用户输入自然语言
  → app server 用 OpenAI 生成 query_embedding（text-embedding-3-small）
  → 并行调 match_content_blocks + search_content_blocks_text
  → 合并去重，按 score 排序
  → 返回 text + book/lesson/page anchors
  → LLM 基于检索结果生成回答，并附原文位置
```

**embedding 模型绑定**：教材 embedding 用 `text-embedding-3-small`，query embedding 必须用同一模型。换模型需重新生成所有教材 embedding 并重建向量索引。

### App 当前实现

- `POST /api/search` — hybrid 检索路由（已实现，auth 端到端待验证）
- `lib/embedding.ts` — OpenAI query embedding 封装
- `lib/types.ts` — `BlockType / SearchResult / SearchRequest / SearchResponse` 类型定义

---

## 7. 知识库质量评估

> 评估时间：2026-05-14

### 四维评分

| 维度 | 分数 | 主要扣分原因 |
|------|------|------------|
| 教材完整度 | **84 / 100** | 图表无视觉内容（-6）；音频完全缺失（-8）；13 块无 embedding（-2）|
| 向量化质量 | **74 / 100** | qa_pairs embedding 未完成（-10）；notes embedding 未完成（-8）；auth 未端到端验证（-5）|
| 听说 B2 够用指数 | **91 / 100** | 口音单一，缺乏英/美/澳混合（-9）|
| 高频练习到 B2 概率 | **83 / 100** | Stage 7–12 复杂度跳跃风险；高频练习持续性是最大变量 |

### Block 分布 & 向量质量

| 类型 | 数量 | 平均字符 | 向量质量 |
|------|------|---------|--------|
| `qa_block` | 3,520 | 334 | 好（原本有完整句子）|
| `lexical_block` | 3,484 | 25 | 修复后好（contextual embedding）|
| `grammar_note` | 1,803 | 70 | 中（待 contextual 增强）|
| `dictation` | 130 | 521 | 好 |
| `front_matter` | 146 | 238 | 一般 |

### 产品量化模块方向

**学习进度：**
- 用户掌握词汇数 / 7,250（词汇覆盖率）
- 用户能流利回答的 qa_pair 数 / 11,412（口语输出覆盖率）
- 已完成 Stage 数（Stage 1–12）

**掌握度（每个 lexical_block）：**
- 反应速度：答题延迟（毫秒）
- 准确率：回答是否包含关键词
- SM2 间隔重复（`review_schedule` 表已预留）

**口语模块（关键缺口）：**

Callan 的核心机制是实时压力——老师以母语者语速提问，学生立刻回答，不允许停顿翻译。App 必须复制这个机制：
- AI 扮演 Callan 老师，按书中 Q&A 提问
- 语音识别评估回答延迟和关键词
- 语伴模块让真人互相做 Callan 式问答

**没有这个模块，内容掌握度高也只是「认识但说不出来」。**

---

## 8. 当前实现状态

### 线上 Supabase

```
project ref: frhtkmpsfyyidqijuijp
URL: https://frhtkmpsfyyidqijuijp.supabase.co
tables: 16
```

| 表 | 行数 | 状态 |
|----|------|------|
| books | 12 | ✓ |
| lessons | 191 | ✓ |
| book_pages | 1,327 | ✓ |
| content_blocks | 9,160 | ✓（9,147 有 embedding）|
| terms | 7,250 | ✓ |
| qa_pairs | 11,412 | ✓ |
| notes | 1,803 | ✓ |
| exercises | 138 | ✓ |
| chart_refs | 69 | ✓ |
| bad refs | 0 | ✓ 引用完整性全通过 |

向量索引：`idx_blocks_embedding_hnsw`（HNSW cosine distance）

### App 路由

```
/learn-preview              → 无需登录的学习预览（SessionCard 静态数据）
/protected/learn/[b]/[l]   → 正式学习页（从 DB 拉内容）
/api/search                → POST，hybrid 检索（实现中）
```

### 功能实现状态

| 功能 | 状态 |
|------|------|
| 用户认证（login/signup/forgot-password）| ✅ 完成 |
| 学习 Session UI（vocab → Q&A → 反馈）| ✅ MVP 完成 |
| Dark mode 适配 | ✅ 2026-05-14 修复 |
| 混合搜索 API | ⚠️ 实现，auth 待验证 |
| SM2 复习逻辑 | ❌ 表已预留，逻辑未写 |
| 问题音频（TTS 预生成）| ❌ 设计完成，未执行 |
| 场景图 + 热区 | ❌ 设计完成，未执行 |
| AI 实时对话评估 | ❌ 架构设计阶段 |
| 统计 dashboard | ❌ 未开始 |
| 用户进度恢复 | ❌ 代码有 TODO |

---

## 9. 待决策事项

### 学习 Session

- **翻页方式**：手动点「下一个」/ 反馈后自动跳 / 键盘快捷键（Space=看答案，← →=翻页）
- **Session 范围**：整课（20-40 block）/ 一页（5-10 block）/ 自定义题数（10/20/30）

### 场景图

- 风格：写实 / 扁平插画 / 卡通
- 热区管理工具：内嵌后台 / 独立脚本

### 音频

- TTS 声音：英式 or 美式，男声 or 女声

### 环境变量注意

- `POSTGRES_*` 和 `SUPABASE_SERVICE_ROLE_KEY` 仍来自旧 Vercel integration，不要把旧 project `lqhddodpwidknzuwkgbt` 当主库
- Vercel Preview 环境需要创建非 production 分支后才能绑定 branch-scoped env
