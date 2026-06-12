"use client";

import type { ReactNode } from "react";
import { isDevToolsEnabled } from "@/lib/dev-config";
import type { ArtPackId } from "@/lib/scene-art-pack";

interface Props {
  artPack: ArtPackId;
  lessonNum: number;
  segIdx: number;
  vocabTerms: string[];
  focusTerm: string | null;
  question: string;
  answer: string;
  sceneImagePrompt: string | null;
  sceneTitle?: string | null;
}

function DevTag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-200 ring-1 ring-amber-500/30">
      {children}
    </span>
  );
}

export function LearnVocabDevPanel({
  artPack,
  lessonNum,
  segIdx,
  vocabTerms,
  focusTerm,
  question,
  answer,
  sceneImagePrompt,
  sceneTitle,
}: Props) {
  if (!isDevToolsEnabled()) return null;

  return (
    <section
      className="mb-4 rounded-xl border border-dashed border-amber-500/40 bg-amber-950/30 px-3 py-3 text-amber-50"
      data-testid="learn-vocab-dev-panel"
      aria-label="开发调试信息"
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-400/90">
        Dev · vocab 调试（仅开发环境）
      </p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <DevTag>L{lessonNum}</DevTag>
        <DevTag>seg {segIdx}</DevTag>
        <DevTag>{artPack}</DevTag>
        {focusTerm ? <DevTag>focus: {focusTerm}</DevTag> : <DevTag>focus: —</DevTag>}
        {sceneTitle ? <DevTag>{sceneTitle}</DevTag> : null}
      </div>

      <div className="space-y-3 text-xs leading-relaxed">
        <div>
          <p className="mb-1 font-medium text-amber-300/90">词（本课）</p>
          <p className="break-words text-amber-50/90">
            {vocabTerms.length > 0 ? vocabTerms.join(" · ") : "—"}
          </p>
        </div>

        <div>
          <p className="mb-1 font-medium text-amber-300/90">当前联动 Q/A</p>
          <p className="text-amber-50/90">
            <span className="text-amber-400/80">Q:</span> {question}
          </p>
          <p className="mt-0.5 text-amber-50/90">
            <span className="text-amber-400/80">A:</span> {answer}
          </p>
        </div>

        <div>
          <p className="mb-1 font-medium text-amber-300/90">scenes.image_prompt</p>
          {sceneImagePrompt ? (
            <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-black/25 p-2 font-mono text-[11px] text-amber-50/85">
              {sceneImagePrompt}
            </pre>
          ) : (
            <p className="text-amber-50/60">（空 — 可在 DB scenes 表或脚本里生成）</p>
          )}
        </div>
      </div>
    </section>
  );
}
