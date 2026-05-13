# TalkFlow Plans

这个目录放后续实施方案、技术路线和交叉验证用的任务说明。

当前核心结论：

```text
docs/database = 已落地的表结构和线上验证结果
docs/data-pipeline = PDF/Markdown/JSON/Supabase 数据管线
docs/plan = 下一步怎么把这些能力接进 app
```

## 文件

```text
rag-search-plan.md
  RAG、embedding、混合检索、成本和实际用法。

supabase-vercel-env-plan.md
  Supabase 项目、Vercel Production/Development/Preview 环境变量说明。
```

## 当前状态

线上 Supabase 项目：

```text
project ref: frhtkmpsfyyidqijuijp
project url: https://frhtkmpsfyyidqijuijp.supabase.co
```

已完成：

```text
12 books
191 lessons
1327 book_pages
9160 content_blocks
9147 content_blocks.embedding
HNSW vector index
semantic search RPC
keyword search RPC
```

不要再把旧 Vercel-integrated Supabase project `lqhddodpwidknzuwkgbt` 当主库。
