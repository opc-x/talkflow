"use client"

import { Volume2 } from "lucide-react"
import { playUtterance } from "@/lib/audio"

export interface VocabTerm {
  term: string
  definition?: string | null
  phonetic?: string | null
  audioUrl?: string | null
}

interface VocabListProps {
  terms: VocabTerm[]
  /** 点词 → 场景联动 */
  activeTerm?: string | null
  onTermFocus?: (term: string) => void
}

export function VocabList({ terms, activeTerm, onTermFocus }: VocabListProps) {
  if (terms.length === 0) return null

  return (
    <div className="flex flex-col gap-0 divide-y divide-border rounded-xl border border-border overflow-hidden">
      {terms.map(({ term, definition, phonetic, audioUrl }, index) => {
        const active = activeTerm?.toLowerCase() === term.toLowerCase()
        return (
        <div
          key={`${term}-${index}`}
          className={`bg-card px-4 py-3 transition-colors ${active ? "bg-primary/10 ring-1 ring-inset ring-primary/30" : ""}`}
          data-testid="vocab-term"
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex flex-1 min-w-0 flex-col gap-0.5 text-left"
              onClick={() => onTermFocus?.(term)}
            >
              <span className={`font-medium ${active ? "text-primary" : "text-foreground"}`}>{term}</span>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                {definition && <span>{definition}</span>}
                {phonetic && <span className="text-xs">{phonetic}</span>}
              </div>
            </button>
            <button
              type="button"
              aria-label={`播放 ${term}`}
              className="rounded-lg p-2 text-primary hover:bg-primary/10 shrink-0"
              onClick={() => playUtterance(term, audioUrl)}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )})}
    </div>
  )
}
