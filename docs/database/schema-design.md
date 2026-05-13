# TalkFlow 数据库表结构设计

版本：Callan Method 细粒度知识库版。

核心目标不是只做“能搜到词和问答”，而是让 app 可以从任意最小内容项反查到教材位置：

```text
term / question / answer / note / dictation / chart
  -> content_block
  -> book_page
  -> pdf_page
  -> lesson
  -> stage/book
  -> source PDF
```

## 当前结论

旧版 `lessons + vocab_clusters + vocab_words + qa_pairs` 只能算 MVP 搜索结构，不适合后续做完整学习 app。

新版以 `content_blocks` 为核心。词汇、问答、笔记、听写、练习、图表引用都挂到 block 上。向量字段需要预留，但 embedding 不应该替代结构化锚点。

## 内容层

静态内容来自：

```text
/Users/cuijianchen/gh-projects/kb-personal/callan-method/structured/*.json
```

当前验收结果：

```text
12 books
191 lessons
1327 PDF pages
9160 content blocks
7250 term entries
11412 Q&A pairs
130 dictations
69 chart refs/pages
validate_fine_index.py: PASS, 15/15
```

线上 Supabase 状态：

```text
project ref: frhtkmpsfyyidqijuijp
project url: https://frhtkmpsfyyidqijuijp.supabase.co
public tables: 16
books: 12
lessons: 191
book_pages: 1327
content_blocks: 9160
terms: 7250
qa_pairs: 11412
notes: 1803
exercises: 138
chart_refs: 69
bad block refs: 0
content_blocks with embeddings: 9147
vector index: idx_blocks_embedding_hnsw
semantic RPC: match_content_blocks
keyword RPC: search_content_blocks_text
verified via Supabase MCP on 2026-05-12
```

### books

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

### lessons

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

### book_pages

`pdf_page` 是 PDF 物理页；`book_page` 是教材页面左侧印出来的内部页码。两个都要存。

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

### content_blocks

这是核心表。

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

`block_type` 当前必须覆盖：

```text
front_matter
lexical_block
grammar_note
qa_block
dictation
word_building_exercise
revision_exercise
chart_reference
chart_page
```

后续如果提取更细，可以扩展：

```text
reading_exercise
phrase_exercise
vocabulary_index
back_matter
```

### terms

```sql
create table terms (
  id bigserial primary key,
  block_id text not null references content_blocks(id) on delete cascade,
  book_id bigint not null references books(id) on delete cascade,
  lesson_id bigint references lessons(id) on delete set null,
  book_page_id bigint references book_pages(id) on delete set null,
  term text not null,
  normalized text not null,
  term_type text default 'vocabulary',
  book_num smallint not null,
  stage smallint not null,
  lesson_num smallint,
  pdf_page smallint not null,
  book_page smallint,
  position integer,
  metadata jsonb default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz default now()
);
```

这里不要再把相同页码的一组词强叫“词族”。更准确叫 `lexical_block` 或 `vocabulary block`。真正的 word family 可以以后作为 `term_type = 'word_family_member'` 或独立派生表补。

### qa_pairs

```sql
create table qa_pairs (
  id bigserial primary key,
  block_id text not null references content_blocks(id) on delete cascade,
  book_id bigint not null references books(id) on delete cascade,
  lesson_id bigint references lessons(id) on delete set null,
  book_page_id bigint references book_pages(id) on delete set null,
  book_num smallint not null,
  stage smallint not null,
  lesson_num smallint,
  pdf_page smallint not null,
  book_page smallint,
  pair_index integer not null,
  question text not null,
  answer text,
  qa_type text default 'drill',
  audio_url text,
  metadata jsonb default '{}'::jsonb,
  question_embedding vector(1536),
  answer_embedding vector(1536),
  created_at timestamptz default now()
);
```

### notes

```sql
create table notes (
  id bigserial primary key,
  block_id text not null references content_blocks(id) on delete cascade,
  book_id bigint not null references books(id) on delete cascade,
  lesson_id bigint references lessons(id) on delete set null,
  book_page_id bigint references book_pages(id) on delete set null,
  note_type text default 'grammar',
  text text not null,
  book_num smallint not null,
  stage smallint not null,
  lesson_num smallint,
  pdf_page smallint not null,
  book_page smallint,
  embedding vector(1536),
  created_at timestamptz default now()
);
```

### exercises

听写也放这里，因为从学习产品角度它是练习。

```sql
create table exercises (
  id bigserial primary key,
  block_id text not null references content_blocks(id) on delete cascade,
  book_id bigint not null references books(id) on delete cascade,
  lesson_id bigint references lessons(id) on delete set null,
  book_page_id bigint references book_pages(id) on delete set null,
  exercise_type text not null,
  title text,
  text text not null,
  book_num smallint not null,
  stage smallint not null,
  lesson_num smallint,
  pdf_page smallint not null,
  book_page smallint,
  metadata jsonb default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz default now()
);
```

### chart_refs

```sql
create table chart_refs (
  id bigserial primary key,
  block_id text not null references content_blocks(id) on delete cascade,
  book_id bigint not null references books(id) on delete cascade,
  lesson_id bigint references lessons(id) on delete set null,
  book_page_id bigint references book_pages(id) on delete set null,
  chart_label text,
  ref_type text not null,
  text text not null,
  book_num smallint not null,
  stage smallint not null,
  lesson_num smallint,
  pdf_page smallint not null,
  book_page smallint,
  created_at timestamptz default now()
);
```

### scenes

```sql
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

## 向量字段与检索函数

当前已经完成第一优先级：`content_blocks.embedding`。

线上状态：

```text
embedding model: text-embedding-3-small
dimensions: 1536
content_blocks with text: 9147
content_blocks with embedding: 9147
vector index: idx_blocks_embedding_hnsw
```

暂时不把 `terms.embedding` 当主检索层。原因：单词太短，单独做 embedding 语义价值有限。真正好用的是 block 级检索：用户搜一个意思，返回相关 block，再带出 lesson/book_page/pdf_page。

检索策略：

```text
exact: terms.normalized
full-text: content_blocks.text / qa_pairs.question / qa_pairs.answer
vector: content_blocks.embedding
return anchors: book/stage/lesson/book_page/pdf_page/block_id
```

### match_content_blocks

语义检索。输入 app 侧生成的 query embedding，返回最接近的内容块和教材位置。

```sql
select *
from match_content_blocks(
  query_embedding := '[...]'::vector,
  match_count := 10,
  filter_book := null,
  filter_lesson := null,
  filter_block_types := null
);
```

返回字段：

```text
block_id
book_num
stage
lesson_num
book_page
pdf_page
block_type
text
similarity
```

### search_content_blocks_text

关键词/全文检索。适合查明确词组，比如 `meaning of the word`、`dictionary`、`present perfect`。

```sql
select *
from search_content_blocks_text(
  query_text := 'meaning of the word',
  match_count := 10,
  filter_book := null,
  filter_lesson := null,
  filter_block_types := null
);
```

### App 侧用法

用户搜索一句话时：

```text
1. app server 用 OpenAI 生成 query embedding
2. 调 Supabase RPC match_content_blocks
3. 返回 block 文本和 book/lesson/page anchors
4. UI 可直接跳到 Stage / Lesson / Page / 内容块
```

## 用户层

### profiles

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user',
  nickname text,
  avatar_url text,
  created_at timestamptz default now()
);
```

### subscriptions

```sql
create table subscriptions (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null,
  plan text not null,
  started_at timestamptz not null,
  expires_at timestamptz not null,
  stripe_id text,
  created_at timestamptz default now()
);
```

## 学习进度层

### user_progress

```sql
create table user_progress (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  current_lesson_id bigint references lessons(id) on delete set null,
  lessons_done smallint[] default '{}',
  updated_at timestamptz default now(),
  unique (user_id)
);
```

### session_records

```sql
create table session_records (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  lesson_id bigint references lessons(id) on delete set null,
  started_at timestamptz default now(),
  ended_at timestamptz,
  qa_total smallint,
  qa_correct smallint,
  duration_sec integer
);
```

### qa_responses

```sql
create table qa_responses (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  session_id bigint references session_records(id) on delete set null,
  qa_pair_id bigint not null references qa_pairs(id) on delete cascade,
  block_id text references content_blocks(id) on delete set null,
  score smallint not null,
  user_transcript text,
  audio_url text,
  responded_at timestamptz default now()
);
```

### review_schedule

比旧的 `cluster_schedule` 更通用，可以调度 term、Q&A、block。

```sql
create table review_schedule (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  target_type text not null,
  term_id bigint references terms(id) on delete cascade,
  qa_pair_id bigint references qa_pairs(id) on delete cascade,
  block_id text references content_blocks(id) on delete cascade,
  next_review_at date not null,
  interval_days smallint default 1,
  ease_factor real default 2.5,
  rep_count smallint default 0
);
```

## 文件落点

Schema migration:

```text
/Users/cuijianchen/gh-projects/talkflow/supabase/migrations/202605120001_callan_kb_schema.sql
```

Seed script:

```text
/Users/cuijianchen/gh-projects/kb-personal/callan-method/seed_supabase_structured.py
/Users/cuijianchen/gh-projects/kb-personal/callan-method/seed_supabase_structured_pg.py
/Users/cuijianchen/gh-projects/kb-personal/callan-method/seed_supabase_structured_rest.py
```

Seed 前必须先跑：

```bash
/opt/homebrew/bin/python3 structured/extract_structured.py
/opt/homebrew/bin/python3 structured/validate_fine_index.py
```

验收必须看到：

```text
15 PASS, 0 WARNING, 0 FAIL
PASS
```

## RLS 策略

静态内容表：

```text
books / lessons / book_pages / content_blocks / terms / qa_pairs / notes / exercises / chart_refs / scenes
```

登录用户可读；客户端不可写。写入只走 service role seed 或一次性受控 seed 流程。

2026-05-12 线上导入曾临时开启 anon seed policy。导入完成后已通过 Supabase MCP 删除，`temporary anon seed` policies 剩余 0 条。

用户数据表：

```text
profiles / subscriptions / user_progress / session_records / qa_responses / review_schedule
```

用户只能读写自己的数据，`user_id = auth.uid()`。

## 迁移判断

旧表：

```text
vocab_clusters
vocab_words
cluster_schedule
```

不建议作为主模型继续发展。它们可以被新模型替代：

```text
vocab_clusters -> content_blocks where block_type = 'lexical_block'
vocab_words -> terms
cluster_schedule -> review_schedule
```
