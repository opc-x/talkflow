-- Link vocabulary terms to the Q&A pair where they first appear in a lesson segment.

ALTER TABLE public.terms
  ADD COLUMN IF NOT EXISTS qa_pair_id bigint REFERENCES public.qa_pairs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_terms_qa_pair_id ON public.terms (qa_pair_id);

COMMENT ON COLUMN public.terms.qa_pair_id IS
  'First qa_pair in the same segment (lexical_block + following qa_blocks) whose question+answer contains this term.';
COMMENT ON COLUMN public.terms.position IS
  '1-based index of the term within its lexical_block pipe-separated list (PDF import order).';
