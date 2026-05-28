-- Issue #46: terms data cleanup + definition/phonetic columns

-- Step 2: remove sentence-level entries (≥8 words)
DELETE FROM public.terms
WHERE array_length(string_to_array(trim(term), ' '), 1) >= 8;

-- Step 3: dedupe within lesson (keep lower id, remove MAX(id))
DELETE FROM public.terms
WHERE id IN (
  SELECT MAX(id) FROM public.terms
  GROUP BY lesson_id, normalized
  HAVING count(*) > 1
);

-- Step 4: strip trailing punctuation from term
UPDATE public.terms
SET term = regexp_replace(term, E'[.!?,"''\']+$', '')
WHERE term ~ E'[.!?,"''\']+$';

-- Step 5: add definition and phonetic columns
ALTER TABLE public.terms ADD COLUMN IF NOT EXISTS definition TEXT;
ALTER TABLE public.terms ADD COLUMN IF NOT EXISTS phonetic TEXT;
