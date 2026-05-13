# Supabase And Vercel Environment Plan

## 目标

保证 TalkFlow app 使用正确的 Supabase 项目：

```text
project ref: frhtkmpsfyyidqijuijp
project url: https://frhtkmpsfyyidqijuijp.supabase.co
```

不要把旧的 Vercel-integrated Supabase project 当主库：

```text
lqhddodpwidknzuwkgbt
```

## Vercel 环境类型

Vercel 有三类环境变量：

```text
Production
  正式线上部署。

Preview
  PR / 非生产分支预览部署。

Development
  本地开发或 vercel dev。
```

在 Vercel Dashboard 位置：

```text
Vercel Dashboard
  -> talkflow project
  -> Settings
  -> Environment Variables
```

CLI 查看：

```bash
cd /Users/cuijianchen/gh-projects/talkflow
vercel env ls
```

本地 Vercel project link：

```text
/Users/cuijianchen/gh-projects/talkflow/.vercel/project.json
```

## 当前已处理

已将 Production / Development 的这些变量指向正确项目：

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_PUBLISHABLE_KEY
```

本地 `.env.local`：

```text
NEXT_PUBLIC_SUPABASE_URL=https://frhtkmpsfyyidqijuijp.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## Preview 注意事项

Vercel CLI 不允许给生产分支 `main` 设置 Preview branch env。

后续如果创建非生产分支，例如：

```text
feature/rag-search
```

再设置 Preview 环境变量。

## 重要警告

`POSTGRES_*` 和 `SUPABASE_SERVICE_ROLE_KEY` 变量可能仍来自旧 Vercel integration。

在没有明确轮换到 `frhtkmpsfyyidqijuijp` 之前，不要把它们当主库依据。

当前 app 代码主要读取：

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

## 迁移文件用途

Supabase migration 是数据库结构版本文件。

它解决的问题：

```text
1. 换机器后能重建表结构
2. 换 Supabase 项目后能复现 schema
3. 给别的 agent 明确当前数据库结构
4. 避免只在线上手工改库，最后没人知道改了什么
```

当前 schema 文件：

```text
/Users/cuijianchen/gh-projects/talkflow/supabase/migrations/202605120001_callan_kb_schema.sql
```

## 验收口径

线上 Supabase 必须满足：

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
content_blocks with embedding: 9147
idx_blocks_embedding_hnsw exists
match_content_blocks exists
search_content_blocks_text exists
temporary seed/test RPCs do not exist
```
