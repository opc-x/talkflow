"use client"

import { Volume2 } from "lucide-react"
import { speakEnglish } from "@/lib/speech"

export interface VocabTerm {
  term: string
  definition?: string | null
  phonetic?: string | null
}

interface VocabListProps {
  terms: VocabTerm[]
}

export function VocabList({ terms }: VocabListProps) {
  if (terms.length === 0) return null

  return (
    <div className="flex flex-col gap-0 divide-y divide-border rounded-xl border border-border overflow-hidden">
      {terms.map(({ term, definition, phonetic }) => (
        <div key={term} className="bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 min-w-0 flex-col gap-0.5">
              <span className="font-medium text-foreground">{term}</span>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                {definition && <span>{definition}</span>}
                {phonetic && <span className="text-xs">{phonetic}</span>}
              </div>
            </div>
            <button
              type="button"
              aria-label={`播放 ${term}`}
              className="rounded-lg p-2 text-primary hover:bg-primary/10 shrink-0"
              onClick={() => speakEnglish(term)}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
