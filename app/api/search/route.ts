import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embedQuery } from "@/lib/embedding";
import type { SearchRequest, SearchResponse, SearchResult } from "@/lib/types";

export async function POST(req: NextRequest) {
  let body: SearchRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { query, limit = 10, filter_book, filter_lesson, filter_block_types } = body;

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const cap = Math.min(Math.max(1, limit), 20);

  const [vectorResults, fulltextResults] = await Promise.all([
    runVectorSearch(supabase, query, cap, filter_book, filter_lesson, filter_block_types),
    runFulltextSearch(supabase, query, cap, filter_book, filter_lesson, filter_block_types),
  ]);

  const merged = mergeResults(vectorResults, fulltextResults, cap);
  const sources = Array.from(
    new Set(merged.map((r) => r.match_type))
  ) as SearchResponse["sources"];

  return NextResponse.json({
    results: merged,
    sources,
    query: query.trim(),
  } satisfies SearchResponse);
}

async function runVectorSearch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  query: string,
  limit: number,
  filterBook?: number,
  filterLesson?: number,
  filterBlockTypes?: string[]
): Promise<SearchResult[]> {
  let embedding: number[];
  try {
    embedding = await embedQuery(query);
  } catch {
    return [];
  }

  const { data, error } = await supabase.rpc("match_content_blocks", {
    query_embedding: `[${embedding.join(",")}]`,
    match_count: limit,
    filter_book: filterBook ?? null,
    filter_lesson: filterLesson ?? null,
    filter_block_types: filterBlockTypes ?? null,
  });

  if (error || !data) return [];

  return data.map(
    (row: {
      block_id: string;
      book_num: number;
      stage: number;
      lesson_num: number;
      book_page: number;
      pdf_page: number;
      block_type: string;
      text: string;
      similarity: number;
    }) => ({
      ...row,
      score: row.similarity,
      match_type: "vector" as const,
    })
  );
}

async function runFulltextSearch(
  supabase: Awaited<ReturnType<typeof createClient>>,
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
  });

  if (error || !data) return [];

  return data.map(
    (row: {
      block_id: string;
      book_num: number;
      stage: number;
      lesson_num: number;
      book_page: number;
      pdf_page: number;
      block_type: string;
      text: string;
      rank: number;
    }) => ({
      ...row,
      score: row.rank,
      match_type: "fulltext" as const,
    })
  );
}

function mergeResults(
  vectorResults: SearchResult[],
  fulltextResults: SearchResult[],
  limit: number
): SearchResult[] {
  const seen = new Map<string, SearchResult>();

  for (const r of vectorResults) {
    seen.set(r.block_id, r);
  }

  for (const r of fulltextResults) {
    if (!seen.has(r.block_id)) {
      seen.set(r.block_id, r);
    }
  }

  // vector results first (semantic relevance), then fulltext-only hits
  const vectorIds = new Set(vectorResults.map((r) => r.block_id));
  const ordered = [
    ...vectorResults,
    ...fulltextResults.filter((r) => !vectorIds.has(r.block_id)),
  ];

  return ordered.slice(0, limit);
}
