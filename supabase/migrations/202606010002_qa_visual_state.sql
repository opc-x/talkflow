-- Per-Q&A programmatic scene state (#65)

alter table public.qa_pairs
  add column if not exists visual_state jsonb,
  add column if not exists visual_state_status text
    check (visual_state_status in ('ok', 'needs_review', 'rule', 'llm'));

create index if not exists idx_qa_pairs_visual_state_status
  on public.qa_pairs (visual_state_status)
  where visual_state_status is not null;
