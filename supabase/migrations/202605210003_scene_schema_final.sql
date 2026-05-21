-- Scene-centric schema extensions for TalkFlow (#19)

alter table public.scenes
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists image_prompt text,
  add column if not exists image_type text
    check (image_type in ('scene', 'action', 'concept')),
  add column if not exists image_model text;

alter table public.terms
  add column if not exists cluster_name text;

alter table public.lessons
  add column if not exists embedding vector(1536);

create index if not exists idx_lessons_embedding_hnsw
  on public.lessons
  using hnsw (embedding vector_cosine_ops)
  where embedding is not null;

alter table public.qa_pairs
  add column if not exists qa_category text not null default 'lesson'
    check (qa_category in ('lesson', 'review'));

-- One scene row per lesson (upsert target for prompt generation)
create unique index if not exists idx_scenes_lesson_id_unique
  on public.scenes (lesson_id);

-- Mark accumulated review Q&A on book-end lessons (keep first 120 per lesson)
with ranked as (
  select
    id,
    row_number() over (
      partition by lesson_id
      order by pdf_page, pair_index, id
    ) as rn
  from public.qa_pairs
),
heavy as (
  select lesson_id
  from public.qa_pairs
  group by lesson_id
  having count(*) > 120
)
update public.qa_pairs q
set qa_category = case when r.rn <= 120 then 'lesson' else 'review' end
from ranked r
join heavy h on h.lesson_id = (
  select lesson_id from public.qa_pairs where id = r.id
)
where q.id = r.id;
