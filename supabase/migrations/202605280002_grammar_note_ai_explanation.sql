-- grammar_note blocks: pre-generated Chinese AI explanations
ALTER TABLE public.content_blocks
ADD COLUMN IF NOT EXISTS ai_explanation TEXT;

COMMENT ON COLUMN public.content_blocks.ai_explanation IS
  'Chinese grammar explanation for grammar_note blocks; NULL for other block types';
