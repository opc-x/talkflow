export type BlockType =
  | "lexical_block"
  | "qa_block"
  | "grammar_note"
  | "dictation"
  | "front_matter"
  | "chart_reference"
  | "chart_page"
  | "word_building_exercise"
  | "revision_exercise"

export interface SearchResult {
  block_id: string
  book_num: number
  stage: number
  lesson_num: number
  book_page: number
  pdf_page: number
  block_type: BlockType
  text: string
  score: number
  match_type: "vector" | "fulltext"
}

export interface SearchRequest {
  query: string
  limit?: number
  filter_book?: number
  filter_lesson?: number
  filter_block_types?: BlockType[]
}

export interface SearchResponse {
  results: SearchResult[]
  sources: ("vector" | "fulltext")[]
  query: string
}
