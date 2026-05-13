# RAG Search Plan

## 目标

把 12 本 Callan Method 教材做成 app 可用的检索增强知识库。

用户输入自然语言后，系统能返回相关教材内容，并带上可溯源位置：

```text
stage / book / lesson / book_page / pdf_page / block_id
```

## 当前已完成

线上 Supabase 已有：

```text
content_blocks.embedding
embedding model: text-embedding-3-small
dimensions: 1536
embedded blocks: 9147
vector index: idx_blocks_embedding_hnsw
semantic RPC: match_content_blocks
keyword RPC: search_content_blocks_text
```

`content_blocks` 是主知识表。它覆盖：

```text
lexical_block
qa_block
grammar_note
dictation
word_building_exercise
revision_exercise
chart_reference
chart_page
front_matter
```

## Embedding 是什么

Embedding 不是给用户看的内容。

它只是检索用的语义坐标：

```text
教材文本 -> embedding -> 存到 content_blocks.embedding
用户问题 -> query_embedding -> 和 content_blocks.embedding 做相似度比较
```

输入和输出仍然是自然语言。

## 是否绑定 OpenAI

不绑定聊天模型，但绑定 embedding 坐标系。

当前教材 embedding 用的是：

```text
text-embedding-3-small
```

所以 query embedding 最好也继续用同一个模型生成。

这不影响回答模型。检索可以用 OpenAI embedding，回答可以用：

```text
OpenAI
Claude
Gemini
本地模型
```

如果以后换 embedding 模型，需要重新：

```text
1. 给整套教材生成 embedding
2. 写回 Supabase
3. 重建 vector index
4. query embedding 也换同一个模型
```

## 查询流程

语义搜索：

```text
user query
  -> server generates query_embedding
  -> Supabase RPC match_content_blocks
  -> top content blocks with anchors
  -> LLM answers using retrieved blocks
```

关键词搜索：

```text
user query
  -> Supabase RPC search_content_blocks_text
  -> exact/full-text matches
```

推荐 app 使用混合检索：

```text
1. exact lookup
   - lesson number
   - book/page
   - terms.normalized

2. full-text lookup
   - exact phrases
   - "meaning of the word"
   - grammar keywords

3. vector lookup
   - natural-language fuzzy questions
   - "how do I ask what a word means"
   - "when should I use a or an"
```

## 是否每次都要调用 embedding API

自然语言语义检索通常需要每次生成 query_embedding。

但可以减少调用：

```text
1. 缓存用户 query -> query_embedding
2. 明确单词/lesson/page 先走 exact search
3. 明确短语先走 full-text search
4. 只有模糊自然语言问题才走 vector search
```

查询 embedding 成本很低。真正更贵的一般是后续 LLM 生成回答。

## App 中能做什么

可以做：

```text
教材问答助手
Lesson 内搜索
按自然语言定位教材原文
根据教材块生成解释
根据教材块生成练习题
根据教材块做错题复习
给每个回答附带 lesson/page/source
```

示例：

```text
用户：怎么问一个单词是什么意思？

检索结果：
Book 10 / Lesson 147 / book_page 833 / pdf_page 21
Q: If you want to know the definition of a word, what kind of book do you look in?
```

## 下一步实施

1. 在 app server 增加 query embedding helper。
2. 增加 `/api/search` 或 server action。
3. 先跑 exact/full-text，再跑 vector。
4. 合并去重 top results。
5. 返回 `text + anchors`。
6. 聊天回答时强制基于 retrieved blocks。

## 验收标准

必须满足：

```text
natural-language query returns relevant content blocks
every result has book_num, lesson_num, book_page, pdf_page, block_id
exact term search does not depend on vector
lesson/page search does not depend on vector
LLM answer cites source anchors
no temporary seed/test RPC remains online
```
