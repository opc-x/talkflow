"use client";

import { useState, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Mic,
  Volume2,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import type { Segment } from "@/lib/learn";
import { completeLesson } from "@/app/[locale]/protected/learn/[bookNum]/[lessonNum]/actions";
import { VocabList, type VocabTerm } from "@/components/learn/vocab-list";
import { speakEnglish } from "@/lib/speech";
import { MarketScene } from "@/components/scenes/market-scene";

type Phase = "vocab" | "question" | "answer";

interface Props {
  segments: Segment[];
  bookNum: number;
  lessonNum: number;
  lessonId: number | null;
  stageLabel: string;
  sceneImageUrl?: string | null;
  vocabTerms: VocabTerm[];
  totalSentences: number;
}

function countGrammarNotes(segments: Segment[]) {
  return segments.reduce(
    (n, seg) => n + seg.pairs.filter((p) => p.question === "").length,
    0
  );
}

export function SessionCard({
  segments,
  bookNum,
  lessonNum,
  lessonId,
  stageLabel,
  sceneImageUrl,
  vocabTerms,
  totalSentences,
}: Props) {
  const [segIdx, setSegIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("vocab");
  const [pairIdx, setPairIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [nextHref, setNextHref] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const grammarCount = useMemo(() => countGrammarNotes(segments), [segments]);

  const sentenceOffsets = useMemo(() => {
    let offset = 0;
    return segments.map((seg) => {
      const start = offset;
      offset += seg.pairs.filter((p) => p.question !== "").length;
      return start;
    });
  }, [segments]);

  if (done) {
    return (
      <LessonComplete
        lessonNum={lessonNum}
        segmentCount={segments.length}
        totalSentences={totalSentences}
        grammarCount={grammarCount}
        nextHref={nextHref}
      />
    );
  }

  const segment = segments[segIdx];
  if (!segment) return null;

  const pair = segment.pairs[pairIdx] ?? null;
  const isGrammarNote = pair !== null && pair.question === "";

  const currentSentenceIndex =
    sentenceOffsets[segIdx] +
    segment.pairs
      .slice(0, pairIdx)
      .filter((p) => p.question !== "").length +
    (phase !== "vocab" && !isGrammarNote ? 1 : 0);

  function nextPairOrSegment() {
    if (pairIdx < segment.pairs.length - 1) {
      const next = segment.pairs[pairIdx + 1];
      setPairIdx((p) => p + 1);
      setPhase(next.question === "" ? "answer" : "question");
    } else if (segIdx < segments.length - 1) {
      setSegIdx((s) => s + 1);
      setPairIdx(0);
      setPhase("vocab");
    } else {
      setDone(true);
      if (lessonId) {
        startTransition(async () => {
          const result = await completeLesson(lessonId);
          if (result.nextLesson) {
            setNextHref(
              `/protected/learn/${result.nextLesson.book_num}/${result.nextLesson.lesson_num}`
            );
          }
        });
      }
    }
  }

  function startSegment() {
    if (segment.pairs.length === 0) {
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
    } else if (segIdx > 0) {
      const prev = segments[segIdx - 1];
      setSegIdx((s) => s - 1);
      const lastPair = Math.max(prev.pairs.length - 1, 0);
      setPairIdx(lastPair);
      setPhase(prev.pairs.length > 0 ? "answer" : "vocab");
    }
  }

  const progressPct =
    totalSentences > 0
      ? Math.round((Math.min(currentSentenceIndex, totalSentences) / totalSentences) * 100)
      : 0;

  return (
    <div className="flex-1 bg-background flex flex-col">
      <header className="sticky top-14 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-foreground">
              {stageLabel} · 第{lessonNum}课
            </span>
            <span className="text-sm font-medium text-primary tabular-nums">
              {Math.min(currentSentenceIndex, totalSentences)} / {totalSentences}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6">
        {phase === "vocab" && (
          <>
            {(sceneImageUrl || segIdx === 0) && (
              <div className="mb-5 h-44 w-full overflow-hidden rounded-2xl border border-border bg-muted">
                {sceneImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sceneImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <MarketScene />
                )}
              </div>
            )}
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              本课新词
            </p>
            {vocabTerms.length > 0 ? (
              <VocabList terms={vocabTerms} />
            ) : (
              <p className="text-lg font-medium text-foreground leading-relaxed">
                {segment.vocab.split(" | ").join(" · ")}
              </p>
            )}
            <div className="flex-1" />
            <Button
              size="lg"
              className="mt-8 w-full rounded-2xl h-14"
              onClick={startSegment}
            >
              开始问答 →
            </Button>
          </>
        )}

        {phase !== "vocab" && pair && (
          <>
            {sceneImageUrl && (
              <div className="mb-4 flex justify-end">
                <div className="h-14 w-20 overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sceneImageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              </div>
            )}

            {!isGrammarNote && (
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed text-balance">
                  {pair.question}
                </p>
              </div>
            )}

            {phase === "question" && !isGrammarNote && (
              <div className="mt-8 flex flex-col gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-2xl h-12"
                  onClick={() => speakEnglish(pair.question)}
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  听问题
                </Button>
                <Button
                  size="lg"
                  className="rounded-2xl h-14"
                  onClick={() => setPhase("answer")}
                >
                  看答案
                </Button>
              </div>
            )}

            {phase === "answer" && (
              <>
                {!isGrammarNote && (
                  <>
                    <div className="border-t border-border my-6" />
                    <p className="text-xl md:text-2xl text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {pair.answer}
                    </p>
                  </>
                )}
                {isGrammarNote && (
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-sm text-primary font-medium mb-2">📌 语法注释</p>
                    <p className="text-xl leading-relaxed text-foreground whitespace-pre-wrap">
                      {pair.answer}
                    </p>
                  </div>
                )}
                <div className="mt-8 flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 rounded-2xl h-14"
                    onClick={() => setPhase(isGrammarNote ? "vocab" : "question")}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    再来
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 rounded-2xl h-14"
                    onClick={nextPairOrSegment}
                  >
                    下一句
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/protected"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            返回首页
          </Link>
        </div>
      </main>
    </div>
  );
}

function LessonComplete({
  lessonNum,
  segmentCount,
  totalSentences,
  grammarCount,
  nextHref,
}: {
  lessonNum: number;
  segmentCount: number;
  totalSentences: number;
  grammarCount: number;
  nextHref: string | null;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center max-w-sm w-full">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">🎉 第{lessonNum}课完成！</h2>
        <p className="text-sm text-muted-foreground mb-8">
          {segmentCount} 组词汇 · {totalSentences} 句问答
          {grammarCount > 0 ? ` · ${grammarCount} 条语法` : ""}
        </p>
        <div className="space-y-3">
          <Button asChild size="lg" className="w-full rounded-2xl h-14">
            <Link href={nextHref ?? `/protected/learn/1/${lessonNum + 1}`}>
              第{lessonNum + 1}课 →
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="w-full rounded-2xl h-14">
            <Link href="/protected">回首页</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
