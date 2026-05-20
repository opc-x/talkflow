import { apiFetch } from "./client"
import type { SearchRequest, SearchResponse } from "@shared/types/search"

export async function searchContent(body: SearchRequest) {
  return apiFetch<SearchResponse>("/search", {
    method: "POST",
    body: JSON.stringify(body),
  })
}
