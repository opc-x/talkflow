# TalkFlow 数据库表结构设计

## 整体分层

```
静态内容层（seed 一次，永不修改）
├── lessons          191 课
├── vocab_clusters   3,256 词族
├── vocab_words      9,515 词汇
├── qa_pairs         8,794 问答对
└── scenes           ~400 场景图 + 热区坐标

用户层
├── profiles         用户扩展信息 + 角色权限
├── subscriptions    订阅状态

学习进度层
├── user_progress    用户当前进度（在第几课）
├── session_records  每次练习会话记录
├── qa_responses     每条问答的回答记录（间隔复现用）
└── cluster_schedule 词族复习计划（间隔复现调度）
```

---

## 静态内容层

### lessons

```sql
create table lessons (
  id          serial primary key,
  book        smallint not null,        -- 1–12
  lesson_num  smallint not null,        -- 1–191 (全局编号)
  stage       smallint not null,        -- 1–12
  cefr_level  varchar(5) not null,      -- A1 / A1-A2 / B1 / ...
  unique (book, lesson_num)
);
```

### vocab_clusters

```sql
create table vocab_clusters (
  id          serial primary key,
  lesson_id   integer references lessons(id),
  position    smallint not null,        -- 该课内第几个词族（排序用）
  words       text[] not null           -- ['treat', 'treatment', 'shock']
);
```

### vocab_words

```sql
create table vocab_words (
  id          serial primary key,
  cluster_id  integer references vocab_clusters(id),
  word        text not null,
  position    smallint not null         -- 词族内顺序
);
```

### qa_pairs

```sql
create table qa_pairs (
  id          serial primary key,
  cluster_id  integer references vocab_clusters(id),
  position    smallint not null,        -- 该词族内第几对
  question    text not null,
  answer      text not null,
  audio_url   text,                     -- 提前生成的问题音频（Supabase Storage / R2）
  book        smallint not null,        -- 冗余，方便查询
  lesson_num  smallint not null,        -- 冗余，方便查询
  page_index  smallint,                 -- PDF 页码（来自 index.json p 字段）
  y_coord     smallint                  -- PDF Y 坐标（来自 index.json y 字段）
);
```

### scenes

```sql
create table scenes (
  id          serial primary key,
  lesson_id   integer references lessons(id),
  image_url   text not null,
  position    smallint default 1,       -- 一课可以有多张图
  hotspots    jsonb not null default '[]'
  -- hotspots 格式:
  -- [{"word": "table", "x": 120, "y": 340, "w": 180, "h": 80}, ...]
);
```

---

## 用户层

### profiles

```sql
create table profiles (
  id           uuid primary key references auth.users(id),
  role         text not null default 'user',  -- 'admin' / 'beta' / 'user'
  nickname     text,
  avatar_url   text,
  created_at   timestamptz default now()
);
```

### subscriptions

```sql
create table subscriptions (
  id              serial primary key,
  user_id         uuid references profiles(id),
  status          text not null,   -- 'active' / 'cancelled' / 'expired'
  plan            text not null,   -- 'monthly' / 'yearly'
  started_at      timestamptz not null,
  expires_at      timestamptz not null,
  stripe_id       text             -- 接 Stripe 后填
);
```

---

## 学习进度层

### user_progress

```sql
create table user_progress (
  id              serial primary key,
  user_id         uuid references profiles(id),
  current_lesson  integer references lessons(id),
  lessons_done    integer[] default '{}',   -- 已完成课程的 lesson_num 列表
  updated_at      timestamptz default now(),
  unique (user_id)
);
```

### session_records

```sql
create table session_records (
  id              serial primary key,
  user_id         uuid references profiles(id),
  lesson_id       integer references lessons(id),
  started_at      timestamptz default now(),
  ended_at        timestamptz,
  qa_total        smallint,        -- 本次共练了几题
  qa_correct      smallint,        -- 答对几题
  duration_sec    smallint         -- 练习时长（秒）
);
```

### qa_responses

```sql
create table qa_responses (
  id              serial primary key,
  user_id         uuid references profiles(id),
  session_id      integer references session_records(id),
  qa_pair_id      integer references qa_pairs(id),
  cluster_id      integer references vocab_clusters(id),
  score           smallint not null,   -- 1=错 2=勉强 3=对
  user_transcript text,                -- Whisper 转写的用户回答
  responded_at    timestamptz default now()
);
```

### cluster_schedule

```sql
create table cluster_schedule (
  id              serial primary key,
  user_id         uuid references profiles(id),
  cluster_id      integer references vocab_clusters(id),
  next_review_at  date not null,       -- 下次复习日期
  interval_days   smallint default 1,  -- 当前间隔天数
  ease_factor     real default 2.5,    -- 难度系数（SM-2 算法）
  rep_count       smallint default 0,  -- 已复习次数
  unique (user_id, cluster_id)
);
```

---

## 数据导入说明

内容来源：`kb-personal/callan-method/html/index.json`（19,698 条）

```
index.json 字段映射：
  b  → lessons.book
  l  → lessons.lesson_num
  p  → qa_pairs.page_index
  y  → qa_pairs.y_coord
  c  → lessons.cefr_level
  t  → 'v' 入 vocab_words，'q' 入 qa_pairs
  w  → vocab_words.word
  q  → qa_pairs.question
  a  → qa_pairs.answer
```

导入顺序：
1. lessons（去重 book+lesson_num）
2. vocab_clusters（按 lesson 分组）
3. vocab_words（t='v' 的条目）
4. qa_pairs（t='q' 的条目）
5. scenes（图生成后单独导入）

---

## RLS 策略（每表都要开）

- 静态内容表（lessons / vocab_clusters / vocab_words / qa_pairs / scenes）：所有登录用户可读，无人可写
- profiles：用户只能读写自己的行
- subscriptions / user_progress / session_records / qa_responses / cluster_schedule：用户只能读写 `user_id = auth.uid()` 的行
- admin（role='admin'）：所有表全读写

---

## 待决策

- [ ] 间隔复现算法：SM-2（成熟稳定）还是自定义简化版
- [ ] qa_responses 要不要存音频录音文件 URL（用于回放纠错）
- [ ] subscriptions 先做还是 MVP 阶段跳过
