-- TalkFlow Callan Method knowledge-base schema.
-- Static textbook content is seeded by service-role tooling and read by app users.

create extension if not exists vector;

create table if not exists public.books (
  id bigserial primary key,
  book_num smallint not null unique check (book_num between 1 and 12),
  stage smallint not null check (stage between 1 and 12),
  cefr_level text,
  title text,
  source_pdf text not null,
  lesson_start smallint not null,
  lesson_end smallint not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id bigserial primary key,
  book_id bigint not null references public.books(id) on delete cascade,
  book_num smallint not null check (book_num between 1 and 12),
  stage smallint not null check (stage between 1 and 12),
  lesson_num smallint not null unique check (lesson_num between 1 and 191),
  cefr_level text,
  pdf_page_start smallint,
  pdf_page_end smallint,
  book_page_start smallint,
  book_page_end smallint,
  block_count integer not null default 0,
  term_count integer not null default 0,
  qa_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.book_pages (
  id bigserial primary key,
  book_id bigint not null references public.books(id) on delete cascade,
  lesson_id bigint references public.lessons(id) on delete set null,
  book_num smallint not null,
  stage smallint not null,
  lesson_num smallint,
  pdf_page smallint not null,
  book_page smallint,
  page_kind text not null default 'content',
  block_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (book_num, pdf_page)
);

create table if not exists public.content_blocks (
  id text primary key,
  book_id bigint not null references public.books(id) on delete cascade,
  lesson_id bigint references public.lessons(id) on delete set null,
  book_page_id bigint references public.book_pages(id) on delete set null,
  book_num smallint not null,
  stage smallint not null,
  lesson_num smallint,
  pdf_page smallint not null,
  book_page smallint,
  block_type text not null,
  text text,
  source jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table if not exists public.terms (
  id bigserial primary key,
  block_id text not null references public.content_blocks(id) on delete cascade,
  book_id bigint not null references public.books(id) on delete cascade,
  lesson_id bigint references public.lessons(id) on delete set null,
  book_page_id bigint references public.book_pages(id) on delete set null,
  term text not null,
  normalized text not null,
  term_type text not null default 'vocabulary',
  book_num smallint not null,
  stage smallint not null,
  lesson_num smallint,
  pdf_page smallint not null,
  book_page smallint,
  position integer,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table if not exists public.qa_pairs (
  id bigserial primary key,
  block_id text not null references public.content_blocks(id) on delete cascade,
  book_id bigint not null references public.books(id) on delete cascade,
  lesson_id bigint references public.lessons(id) on delete set null,
  book_page_id bigint references public.book_pages(id) on delete set null,
  book_num smallint not null,
  stage smallint not null,
  lesson_num smallint,
  pdf_page smallint not null,
  book_page smallint,
  pair_index integer not null,
  question text not null,
  answer text,
  qa_type text not null default 'drill',
  audio_url text,
  metadata jsonb not null default '{}'::jsonb,
  question_embedding vector(1536),
  answer_embedding vector(1536),
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id bigserial primary key,
  block_id text not null references public.content_blocks(id) on delete cascade,
  book_id bigint not null references public.books(id) on delete cascade,
  lesson_id bigint references public.lessons(id) on delete set null,
  book_page_id bigint references public.book_pages(id) on delete set null,
  note_type text not null default 'grammar',
  text text not null,
  book_num smallint not null,
  stage smallint not null,
  lesson_num smallint,
  pdf_page smallint not null,
  book_page smallint,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id bigserial primary key,
  block_id text not null references public.content_blocks(id) on delete cascade,
  book_id bigint not null references public.books(id) on delete cascade,
  lesson_id bigint references public.lessons(id) on delete set null,
  book_page_id bigint references public.book_pages(id) on delete set null,
  exercise_type text not null,
  title text,
  text text not null,
  book_num smallint not null,
  stage smallint not null,
  lesson_num smallint,
  pdf_page smallint not null,
  book_page smallint,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table if not exists public.chart_refs (
  id bigserial primary key,
  block_id text not null references public.content_blocks(id) on delete cascade,
  book_id bigint not null references public.books(id) on delete cascade,
  lesson_id bigint references public.lessons(id) on delete set null,
  book_page_id bigint references public.book_pages(id) on delete set null,
  chart_label text,
  ref_type text not null,
  text text not null,
  book_num smallint not null,
  stage smallint not null,
  lesson_num smallint,
  pdf_page smallint not null,
  book_page smallint,
  created_at timestamptz not null default now()
);

create table if not exists public.scenes (
  id bigserial primary key,
  lesson_id bigint references public.lessons(id) on delete cascade,
  block_id text references public.content_blocks(id) on delete set null,
  image_url text not null,
  position smallint not null default 1,
  hotspots jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user',
  nickname text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null,
  plan text not null,
  started_at timestamptz not null,
  expires_at timestamptz not null,
  stripe_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  current_lesson_id bigint references public.lessons(id) on delete set null,
  lessons_done smallint[] not null default '{}',
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.session_records (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id bigint references public.lessons(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  qa_total smallint,
  qa_correct smallint,
  duration_sec integer
);

create table if not exists public.qa_responses (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id bigint references public.session_records(id) on delete set null,
  qa_pair_id bigint not null references public.qa_pairs(id) on delete cascade,
  block_id text references public.content_blocks(id) on delete set null,
  score smallint not null check (score between 1 and 5),
  user_transcript text,
  audio_url text,
  responded_at timestamptz not null default now()
);

create table if not exists public.review_schedule (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('term', 'qa_pair', 'content_block')),
  term_id bigint references public.terms(id) on delete cascade,
  qa_pair_id bigint references public.qa_pairs(id) on delete cascade,
  block_id text references public.content_blocks(id) on delete cascade,
  next_review_at date not null,
  interval_days smallint not null default 1,
  ease_factor real not null default 2.5,
  rep_count smallint not null default 0,
  unique (user_id, target_type, term_id, qa_pair_id, block_id)
);

create index if not exists idx_lessons_book_lesson on public.lessons(book_num, lesson_num);
create index if not exists idx_pages_book_pdf on public.book_pages(book_num, pdf_page);
create index if not exists idx_pages_book_page on public.book_pages(book_num, book_page);
create index if not exists idx_blocks_lesson on public.content_blocks(lesson_id);
create index if not exists idx_blocks_page on public.content_blocks(book_page_id);
create index if not exists idx_blocks_type on public.content_blocks(block_type);
create index if not exists idx_blocks_text_fts on public.content_blocks using gin (to_tsvector('english', coalesce(text, '')));
create index if not exists idx_terms_normalized on public.terms(normalized);
create index if not exists idx_terms_location on public.terms(book_num, lesson_num, book_page);
create index if not exists idx_qa_location on public.qa_pairs(book_num, lesson_num, book_page);
create index if not exists idx_qa_question_fts on public.qa_pairs using gin (to_tsvector('english', question));
create index if not exists idx_qa_answer_fts on public.qa_pairs using gin (to_tsvector('english', coalesce(answer, '')));

-- Create after content_blocks.embedding is populated.
create index if not exists idx_blocks_embedding_hnsw
on public.content_blocks
using hnsw (embedding vector_cosine_ops)
where embedding is not null;

alter table public.books enable row level security;
alter table public.lessons enable row level security;
alter table public.book_pages enable row level security;
alter table public.content_blocks enable row level security;
alter table public.terms enable row level security;
alter table public.qa_pairs enable row level security;
alter table public.notes enable row level security;
alter table public.exercises enable row level security;
alter table public.chart_refs enable row level security;
alter table public.scenes enable row level security;
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.user_progress enable row level security;
alter table public.session_records enable row level security;
alter table public.qa_responses enable row level security;
alter table public.review_schedule enable row level security;

create policy "authenticated users can read static content" on public.books for select to authenticated using (true);
create policy "authenticated users can read lessons" on public.lessons for select to authenticated using (true);
create policy "authenticated users can read book pages" on public.book_pages for select to authenticated using (true);
create policy "authenticated users can read content blocks" on public.content_blocks for select to authenticated using (true);
create policy "authenticated users can read terms" on public.terms for select to authenticated using (true);
create policy "authenticated users can read qa pairs" on public.qa_pairs for select to authenticated using (true);
create policy "authenticated users can read notes" on public.notes for select to authenticated using (true);
create policy "authenticated users can read exercises" on public.exercises for select to authenticated using (true);
create policy "authenticated users can read chart refs" on public.chart_refs for select to authenticated using (true);
create policy "authenticated users can read scenes" on public.scenes for select to authenticated using (true);

create policy "users can read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "users can update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "users can read own subscriptions" on public.subscriptions for select to authenticated using (user_id = auth.uid());
create policy "users can manage own progress" on public.user_progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users can manage own sessions" on public.session_records for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users can manage own qa responses" on public.qa_responses for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users can manage own review schedule" on public.review_schedule for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.match_content_blocks(
  query_embedding vector(1536),
  match_count integer default 10,
  filter_book smallint default null,
  filter_lesson smallint default null,
  filter_block_types text[] default null
)
returns table (
  block_id text,
  book_num smallint,
  stage smallint,
  lesson_num smallint,
  book_page smallint,
  pdf_page smallint,
  block_type text,
  text text,
  similarity double precision
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    cb.id as block_id,
    cb.book_num,
    cb.stage,
    cb.lesson_num,
    cb.book_page,
    cb.pdf_page,
    cb.block_type,
    cb.text,
    1 - (cb.embedding <=> query_embedding) as similarity
  from public.content_blocks cb
  where cb.embedding is not null
    and (filter_book is null or cb.book_num = filter_book)
    and (filter_lesson is null or cb.lesson_num = filter_lesson)
    and (filter_block_types is null or cb.block_type = any(filter_block_types))
  order by cb.embedding <=> query_embedding
  limit greatest(1, least(match_count, 50));
$$;

create or replace function public.search_content_blocks_text(
  query_text text,
  match_count integer default 10,
  filter_book smallint default null,
  filter_lesson smallint default null,
  filter_block_types text[] default null
)
returns table (
  block_id text,
  book_num smallint,
  stage smallint,
  lesson_num smallint,
  book_page smallint,
  pdf_page smallint,
  block_type text,
  text text,
  rank real
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    cb.id as block_id,
    cb.book_num,
    cb.stage,
    cb.lesson_num,
    cb.book_page,
    cb.pdf_page,
    cb.block_type,
    cb.text,
    ts_rank_cd(to_tsvector('english', coalesce(cb.text, '')), websearch_to_tsquery('english', query_text)) as rank
  from public.content_blocks cb
  where nullif(trim(query_text), '') is not null
    and to_tsvector('english', coalesce(cb.text, '')) @@ websearch_to_tsquery('english', query_text)
    and (filter_book is null or cb.book_num = filter_book)
    and (filter_lesson is null or cb.lesson_num = filter_lesson)
    and (filter_block_types is null or cb.block_type = any(filter_block_types))
  order by rank desc, cb.book_num, cb.lesson_num, cb.book_page
  limit greatest(1, least(match_count, 50));
$$;

grant execute on function public.match_content_blocks(vector(1536), integer, smallint, smallint, text[]) to authenticated;
grant execute on function public.search_content_blocks_text(text, integer, smallint, smallint, text[]) to authenticated;
