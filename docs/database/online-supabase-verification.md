# Online Supabase Verification

Date: 2026-05-12

Target project:

```text
project ref: frhtkmpsfyyidqijuijp
project url: https://frhtkmpsfyyidqijuijp.supabase.co
```

This is the user's own Supabase project for TalkFlow. Do not treat the old Vercel-integrated project `lqhddodpwidknzuwkgbt` as the source of truth.

## Result

Status: PASS for online schema, import counts, anchors, and block references.

Verified through Supabase MCP against `frhtkmpsfyyidqijuijp`.

## Online Counts

```text
public base tables: 16

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

## Content Types

```text
chart_page: 28
chart_reference: 41
dictation: 130
front_matter: 146
grammar_note: 1803
lexical_block: 3484
qa_block: 3520
revision_exercise: 1
word_building_exercise: 7
```

## Integrity Checks

All of these returned 0 failures:

```text
blocks_without_pdf_page
chart_refs_without_block
exercises_without_block
lesson_pages_without_book_page
notes_without_block
qa_without_block
terms_without_block
```

## Vector Readiness

Vector columns exist:

```text
content_blocks.embedding
exercises.embedding
notes.embedding
qa_pairs.answer_embedding
qa_pairs.question_embedding
terms.embedding
```

`content_blocks.embedding` is populated and usable:

```text
embedding model: text-embedding-3-small
dimensions: 1536
content_blocks with text: 9147
content_blocks with embedding: 9147
index: idx_blocks_embedding_hnsw
semantic RPC: match_content_blocks
keyword RPC: search_content_blocks_text
```

The other embedding fields are still reserved for later targeted improvements. The main semantic layer is block-level search, because every term, Q&A, note, dictation, exercise, and chart reference already resolves through a content block.

Smoke test query:

```text
How do I ask about the meaning of a word in English?
```

Top semantic result:

```text
book: 4
lesson: 60
book_page: 313
pdf_page: 95
block_type: qa_block
sample: Q: When do we use 'a' before a word, and when do we use 'an'?
```

Another high result correctly found:

```text
book: 10
lesson: 147
book_page: 833
pdf_page: 21
block_type: qa_block
sample: If you want to know the definition of a word, what kind of book do you look in?
```

## Security Cleanup

Temporary anon seed policies were used only for the one-time import. They were removed after import.

Verification result:

```text
temporary anon seed policies remaining: 0
temporary embedding seed RPC remaining: 0
temporary semantic smoke-test RPC remaining: 0
```

## Manual Spot-Check SQL

Use these in Supabase SQL Editor when manually checking PDF consistency.

Lesson/page/block check:

```sql
select id, block_type, book_num, lesson_num, book_page, pdf_page, left(text, 160) as sample
from content_blocks
where lesson_num = 8
order by pdf_page, book_page, id
limit 30;
```

Term lookup:

```sql
select term, normalized, book_num, lesson_num, book_page, pdf_page, block_id
from terms
where normalized = 'prompt'
order by book_num, lesson_num, book_page, pdf_page;
```

Q&A lookup:

```sql
select question, answer, book_num, lesson_num, book_page, pdf_page, block_id
from qa_pairs
where question ilike '%meaning of the word%'
order by book_num, lesson_num, book_page, pdf_page
limit 20;
```

Dictation lookup:

```sql
select exercise_type, title, book_num, lesson_num, book_page, pdf_page, left(text, 160) as sample
from exercises
where exercise_type = 'dictation'
order by book_num, lesson_num, pdf_page
limit 20;
```

Chart lookup:

```sql
select ref_type, chart_label, book_num, lesson_num, book_page, pdf_page, left(text, 160) as sample
from chart_refs
order by book_num, pdf_page
limit 20;
```

## Acceptance Meaning

This proves the online database matches the validated structured Callan index and has page/lesson/block traceability.

It does not prove mathematical 100% PDF text fidelity. For that, keep doing random human PDF spot checks against `book_num + lesson_num + book_page + pdf_page + block_id`.
