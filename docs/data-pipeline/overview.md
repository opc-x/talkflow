# TalkFlow 数据处理流程

## 总览

当前主流程已经从旧的 `index_v2.json` 搜索索引，升级为细粒度教材结构索引。

```text
Callan Method PDF Book 1-12
        ↓
extract_pymupdf.py
        ↓
book-1.md ... book-12.md
        ↓
structured/extract_structured.py
        ↓
structured/*.json
        ↓
structured/validate_fine_index.py
        ↓
seed_supabase_structured_rest.py
        ↓
Supabase DB
```

主目标：

```text
任意 term/question/answer/note/dictation/chart
  -> block_id
  -> book_page
  -> pdf_page
  -> lesson
  -> stage/book
```

## 源文件

```text
/Users/cuijianchen/gh-projects/kb-personal/callan-method-origin
```

PDF 文件：

```text
Callan Method 1.pdf
...
Callan Method 12.pdf
```

## 第一步：PDF 到 Markdown

脚本：

```text
/Users/cuijianchen/gh-projects/kb-personal/callan-method/extract_pymupdf.py
```

输出：

```text
book-1.md
...
book-12.md
```

这个阶段处理 Callan PDF 的私有字体编码、Q/A、vocab、notes、dictation 等基础文本抽取。

## 第二步：Markdown/PDF 到细粒度结构索引

脚本：

```text
/Users/cuijianchen/gh-projects/kb-personal/callan-method/structured/extract_structured.py
```

输出：

```text
structured/course-index.json
structured/lesson-index.json
structured/page-index.json
structured/block-index.json
structured/term-index.json
structured/qa-index.json
structured/dictation-index.json
structured/chart-index.json
```

当前结构块类型：

```text
front_matter
lexical_block
grammar_note
qa_block
dictation
word_building_exercise
chart_reference
chart_page
```

当前计数：

```text
12 books
191 lessons
1327 PDF pages
9160 content blocks
7250 term entries
6503 unique normalized terms
11412 Q&A pairs
130 dictations
69 chart refs/pages
```

## 第三步：结构验收

脚本：

```text
/Users/cuijianchen/gh-projects/kb-personal/callan-method/structured/validate_fine_index.py
```

运行：

```bash
cd /Users/cuijianchen/gh-projects/kb-personal/callan-method
/opt/homebrew/bin/python3 structured/validate_fine_index.py
```

必须通过：

```text
15 PASS, 0 WARNING, 0 FAIL
PASS
```

验收覆盖：

```text
12 books present
stages 1-12 present
lessons 1-191 present
every lesson has pdf_page
book_page coverage
every content block has anchors
term -> block_id valid
Q&A -> block_id valid
no raw artifacts
no vocabulary-index contamination
book_page monotonic
pdf_page monotonic
course total_blocks matches block-index
dictations explicitly modeled
chart references/pages explicitly modeled
```

## 第四步：导入 Supabase

Schema migration：

```text
/Users/cuijianchen/gh-projects/talkflow/supabase/migrations/202605120001_callan_kb_schema.sql
```

Seed 脚本：

```text
/Users/cuijianchen/gh-projects/kb-personal/callan-method/seed_supabase_structured.py
/Users/cuijianchen/gh-projects/kb-personal/callan-method/seed_supabase_structured_pg.py
/Users/cuijianchen/gh-projects/kb-personal/callan-method/seed_supabase_structured_rest.py
```

依赖：

```bash
python3 -m venv /tmp/talkflow_venv
/tmp/talkflow_venv/bin/pip install supabase
```

环境变量：

```bash
export SUPABASE_URL="https://..."
export SUPABASE_SERVICE_ROLE_KEY="..."
```

REST 导入：

```bash
cd /Users/cuijianchen/gh-projects/kb-personal/callan-method
/tmp/talkflow_venv/bin/python3 seed_supabase_structured.py
```

2026-05-12 实际线上导入目标：

```text
project ref: frhtkmpsfyyidqijuijp
project url: https://frhtkmpsfyyidqijuijp.supabase.co
```

实际采用 `seed_supabase_structured_rest.py`，通过 Supabase MCP 先创建 schema 和一次性临时 seed policy，再用 REST seed，导入完成后删除临时 anon seed policy。

Postgres 直连导入：

```bash
cd /Users/cuijianchen/gh-projects/kb-personal/callan-method
POSTGRES_URL_NON_POOLING="postgresql://..." /tmp/talkflow_pg_venv/bin/python seed_supabase_structured_pg.py
```

注意：长期流程不要保留 anon 写权限。若没有 service role，只允许短时间开启 seed policy，导入后必须立刻撤销，并用 MCP/SQL 验证 policy 已删除。

## Supabase 表映射

```text
course-index.json      -> books
lesson-index.json      -> lessons
page-index.json        -> book_pages
block-index.json       -> content_blocks / notes / exercises
term-index.json        -> terms
qa-index.json          -> qa_pairs
dictation-index.json   -> exercises where exercise_type = 'dictation'
chart-index.json       -> chart_refs
```

## 向量处理

Schema 已预留：

```text
content_blocks.embedding
qa_pairs.question_embedding
qa_pairs.answer_embedding
notes.embedding
exercises.embedding
terms.embedding
```

执行顺序：

```text
1. 先导入关系型结构
2. 验证 counts 和 anchors
3. 再批量生成 embeddings
4. 最后创建 hnsw vector index 和检索 RPC
```

不要先上向量再补结构。没有 `book_page/pdf_page/lesson/block_id` 的向量结果，对学习 app 来说不可控。

2026-05-12 已完成：

```text
content_blocks with embedding: 9147
embedding model: text-embedding-3-small
vector index: idx_blocks_embedding_hnsw
semantic RPC: match_content_blocks
keyword RPC: search_content_blocks_text
```

## 旧流程状态

旧文件仍可作为历史参考：

```text
build_index.py
build_clusters.py
seed_supabase.py
html/index_v2.json
```

但它们不再是 app 的主数据管线。

旧模型：

```text
lessons
vocab_clusters
vocab_words
qa_pairs
```

新版替代：

```text
books
lessons
book_pages
content_blocks
terms
qa_pairs
notes
exercises
chart_refs
```

## 线上验收结果

TalkFlow 当前目标 Supabase project ref：

```text
frhtkmpsfyyidqijuijp
```

线上表数量：

```text
16 public tables
```

线上内容计数：

```text
books: 12
lessons: 191
book_pages: 1327
content_blocks: 9160
terms: 7250
qa_pairs: 11412
notes: 1803
exercises: 138
chart_refs: 69
```

线上引用完整性：

```text
term_bad_block_refs: 0
qa_bad_block_refs: 0
notes_bad_block_refs: 0
exercises_bad_block_refs: 0
charts_bad_block_refs: 0
blocks_without_pdf: 0
lesson_pages_without_book_page: 0
```

环境变量注意事项：

```text
Local .env.local points to frhtkmpsfyyidqijuijp.
Vercel Production/Development NEXT_PUBLIC_SUPABASE_URL and SUPABASE_URL were updated to frhtkmpsfyyidqijuijp on 2026-05-12.
Vercel Preview needs a non-production git branch before branch-scoped preview env can be added.
POSTGRES_* and SUPABASE_SERVICE_ROLE_KEY variables still come from the old Vercel integration and should not be treated as the app source of truth unless they are explicitly rotated to frhtkmpsfyyidqijuijp.
```
