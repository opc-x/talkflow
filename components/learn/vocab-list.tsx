"use client"

import { useState } from "react"
import { Volume2, ChevronDown, ChevronUp } from "lucide-react"
import { speakEnglish } from "@/lib/speech"

export interface VocabTerm {
  term: string
  ipa?: string | null
  zh_cn?: string | null
}

interface VocabListProps {
  terms: VocabTerm[]
}

export function VocabList({ terms }: VocabListProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (terms.length === 0) return null

  return (
    <div className="flex flex-col gap-0 divide-y divide-border rounded-xl border border-border overflow-hidden">
      {terms.map(({ term, ipa, zh_cn }) => {
        const isOpen = expanded === term
        return (
          <div key={term} className="bg-card px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex flex-1 min-w-0 items-center gap-2 text-left"
                onClick={() => setExpanded(isOpen ? null : term)}
              >
                <span className="font-medium text-foreground">{term}</span>
                {ipa && (
                  <span className="text-xs text-muted-foreground truncate">{ipa}</span>
                )}
                {zh_cn && (
                  isOpen ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              <button
                type="button"
                aria-label={`播放 ${term}`}
                className="rounded-lg p-2 text-primary hover:bg-primary/10"
                onClick={() => speakEnglish(term)}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            {isOpen && zh_cn && (
              <p className="mt-2 text-sm text-muted-foreground pl-0">{zh_cn}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
