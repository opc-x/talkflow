import type { SupabaseClient } from "@supabase/supabase-js"
import { embedQuery } from "../lib/openai.js"
import type { SearchRequest, SearchResponse, SearchResult } from "../../../shared/types/search.js"

async function runVectorSearch(
  supabase: SupabaseClient,
  query: string,
  limit: number,
  filterBook?: number,
  filterLesson?: number,
  filterBlockTypes?: string[]
): Promise<SearchResult[]> {
  let embedding: number[]
  try {
    embedding = await embedQuery(query)
  } catch {
    return []
  }

  const { data, error } = await supabase.rpc("match_content_blocks", {
    query_embedding: `[${embedding.join(",")}]`,
    match_count: limit,
    filter_book: filterBook ?? null,
    filter_lesson: filterLesson ?? null,
    filter_block_types: filterBlockTypes ?? null,
  })

  if (error || !data) return []

  return data.map(
    (row: {
      block_id: string
      book_num: number
      stage: number
      lesson_num: number
      book_page: number
      pdf_page: number
      block_type: string
      text: string
      similarity: number
    }) => ({
      ...row,
      score: row.similarity,
      match_type: "vector" as const,
    })
  )
}

async function runFulltextSearch(
  supabase: SupabaseClient,
  query: string,
  limit: number,
  filterBook?: number,
  filterLesson?: number,
  filterBlockTypes?: string[]
): Promise<SearchResult[]> {
  const { data, error } = await supabase.rpc("search_content_blocks_text", {
    query_text: query,
    match_count: limit,
    filter_book: filterBook ?? null,
    filter_lesson: filterLesson ?? null,
    filter_block_types: filterBlockTypes ?? null,
  })

  if (error || !data) return []

  return data.map(
    (row: {
      block_id: string
      book_num: number
      stage: number
      lesson_num: number
      book_page: number
      pdf_page: number
      block_type: string
      text: string
      rank: number
    }) => ({
      ...row,
      score: row.rank,
      match_type: "fulltext" as const,
    })
  )
}

function mergeResults(
  vectorResults: SearchResult[],
  fulltextResults: SearchResult[],
  limit: number
): SearchResult[] {
  const vectorIds = new Set(vectorResults.map((r) => r.block_id))
  const ordered = [
    ...vectorResults,
    ...fulltextResults.filter((r) => !vectorIds.has(r.block_id)),
  ]
  return ordered.slice(0, limit)
}

export async function searchContent(
  supabase: SupabaseClient,
  body: SearchRequest
): Promise<SearchResponse> {
  const { query, limit = 10, filter_book, filter_lesson, filter_block_types } = body
  const cap = Math.min(Math.max(1, limit), 20)

  const [vectorResults, fulltextResults] = await Promise.all([
    runVectorSearch(supabase, query, cap, filter_book, filter_lesson, filter_block_types),
    runFulltextSearch(supabase, query, cap, filter_book, filter_lesson, filter_block_types),
  ])

  const merged = mergeResults(vectorResults, fulltextResults, cap)
  const sources = Array.from(new Set(merged.map((r) => r.match_type))) as SearchResponse["sources"]

  return {
    results: merged,
    sources,
    query: query.trim(),
  }
}
