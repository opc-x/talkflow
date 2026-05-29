-- Issue #61: term_kind classification for alignment pipeline
ALTER TABLE public.terms
  ADD COLUMN IF NOT EXISTS term_kind TEXT;

UPDATE public.terms SET term_kind = 'word' WHERE term_kind IS NULL;

ALTER TABLE public.terms
  ALTER COLUMN term_kind SET DEFAULT 'word';

ALTER TABLE public.terms
  DROP CONSTRAINT IF EXISTS terms_term_kind_check;

ALTER TABLE public.terms
  ADD CONSTRAINT terms_term_kind_check
  CHECK (
    term_kind = ANY (
      ARRAY['word'::text, 'phrase'::text, 'sentence'::text, 'grammar'::text, 'contraction'::text]
    )
  );

CREATE INDEX IF NOT EXISTS idx_terms_term_kind ON public.terms (term_kind);
