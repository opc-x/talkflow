"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import type { Segment } from "@/lib/learn";

type Phase = "vocab" | "question" | "answer";

interface Props {
  segments: Segment[];
  bookNum: number;
  lessonNum: number;
}

export function SessionCard({ segments, bookNum, lessonNum }: Props) {
  const [segIdx, setSegIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("vocab");
  const [pairIdx, setPairIdx] = useState(0);
  const [done, setDone] = useState(false);

  if (done) {
    return <LessonComplete bookNum={bookNum} lessonNum={lessonNum} />;
  }

  const segment = segments[segIdx];
  if (!segment) return null;

  const pair = segment.pairs[pairIdx] ?? null;
  const isGrammarNote = pair !== null && pair.question === "";

  // progress: count of pairs seen across all segments
  const totalItems = segments.reduce(
    (s, seg) => s + Math.max(seg.pairs.length, 1),
    0
  );
  const doneItems =
    segments
      .slice(0, segIdx)
      .reduce((s, seg) => s + Math.max(seg.pairs.length, 1), 0) + pairIdx;
  const progress = Math.round((doneItems / totalItems) * 100);

  function nextPairOrSegment() {
    if (pairIdx < segment.pairs.length - 1) {
      const next = segment.pairs[pairIdx + 1];
      setPairIdx((p) => p + 1);
      // grammar note → skip directly to answer
      setPhase(next.question === "" ? "answer" : "question");
    } else if (segIdx < segments.length - 1) {
      const nextSeg = segments[segIdx + 1];
      setSegIdx((s) => s + 1);
      setPairIdx(0);
      setPhase("vocab");
      void nextSeg; // consumed above
    } else {
      setDone(true);
    }
  }

  function startSegment() {
    if (segment.pairs.length === 0) {
      // no Q&A — just advance
      if (segIdx < segments.length - 1) {
        setSegIdx((s) => s + 1);
        setPairIdx(0);
        setPhase("vocab");
      } else {
        setDone(true);
      }
    } else {
      const first = segment.pairs[0];
      setPairIdx(0);
      setPhase(first.question === "" ? "answer" : "question");
    }
  }

  function goBack() {
    if (phase === "answer") {
      setPhase(isGrammarNote ? "vocab" : "question");
    } else if (phase === "question") {
      if (pairIdx > 0) {
        setPairIdx((p) => p - 1);
        setPhase("answer");
      } else {
        setPhase("vocab");
      }
    } else {
      // vocab → previous segment
      if (segIdx > 0) {
        const prev = segments[segIdx - 1];
        setSegIdx((s) => s - 1);
        const lastPair = Math.max(prev.pairs.length - 1, 0);
        setPairIdx(lastPair);
        setPhase(prev.pairs.length > 0 ? "answer" : "vocab");
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 tracking-wide uppercase">
          <span>
            Book {bookNum} · Lesson {lessonNum}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-0.5">
          <div
            className="bg-foreground h-0.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8 w-full max-w-lg mx-auto">
        {/* Vocab block */}
        <div className={`mb-10 transition-all duration-300 ${phase !== "vocab" ? "opacity-40" : ""}`}>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
            词汇
          </p>
          <p
            className={`font-medium text-foreground leading-relaxed transition-all duration-300 ${
              phase === "vocab" ? "text-3xl" : "text-base"
            }`}
          >
            {segment.vocab.split(" | ").join("  ·  ")}
          </p>
        </div>

        {/* Divider */}
        {phase !== "vocab" && (
          <div className="border-t border-border mb-10" />
        )}

        {/* Question */}
        {(phase === "question" || phase === "answer") && pair && !isGrammarNote && (
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
              问题
              {segment.pairs.length > 1 && (
                <span className="ml-2 normal-case">
                  {pairIdx + 1}/{segment.pairs.length}
                </span>
              )}
            </p>
            <p className="text-2xl font-medium text-foreground leading-relaxed">
              {pair.question}
            </p>
          </div>
        )}

        {/* Grammar note label */}
        {phase === "answer" && isGrammarNote && (
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              语法注释
            </p>
          </div>
        )}

        {/* Answer */}
        {phase === "answer" && pair && (
          <div className="mb-10">
            {isGrammarNote ? (
              <div className="bg-muted rounded-2xl p-5">
                <p className="text-foreground leading-relaxed text-lg">
                  {pair.answer}
                </p>
              </div>
            ) : (
              <>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
                  答案
                </p>
                <p className="text-2xl text-muted-foreground leading-relaxed">
                  {pair.answer}
                </p>
              </>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3 mt-4">
          {phase === "vocab" && (
            <Button
              size="lg"
              className="w-full rounded-2xl h-14 text-base font-normal"
              onClick={startSegment}
            >
              {segment.pairs.length === 0 ? "继续 →" : "开始提问 →"}
            </Button>
          )}

          {phase === "question" && (
            <Button
              size="lg"
              className="w-full rounded-2xl h-14 text-base font-normal"
              onClick={() => setPhase("answer")}
            >
              看答案
            </Button>
          )}

          {phase === "answer" && (
            <div className="flex gap-3">
              <Button
                size="lg"
                variant="outline"
                className="flex-1 rounded-2xl h-14 text-base font-normal"
                onClick={nextPairOrSegment}
              >
                没记住
              </Button>
              <Button
                size="lg"
                className="flex-1 rounded-2xl h-14 text-base font-normal"
                onClick={nextPairOrSegment}
              >
                记住了 ✓
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Back nav */}
      <div className="px-6 pb-16">
        <button
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={goBack}
        >
          <ChevronLeft className="h-4 w-4" />
          上一个
        </button>
      </div>
    </div>
  );
}

function LessonComplete({
  bookNum,
  lessonNum,
}: {
  bookNum: number;
  lessonNum: number;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-sm w-full">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-8">
          <span className="text-primary-foreground text-2xl">✓</span>
        </div>
        <h2 className="text-2xl font-medium text-foreground mb-2">
          Lesson {lessonNum} 完成
        </h2>
        <p className="text-muted-foreground mb-12">Book {bookNum}</p>
        <Button
          size="lg"
          className="w-full rounded-2xl h-14 text-base font-normal"
          onClick={() => {
            window.location.href = `/protected/learn/${bookNum}/${lessonNum + 1}`;
          }}
        >
          下一课 →
        </Button>
      </div>
    </div>
  );
}
