"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, BookOpen, Mic, Volume2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Segment } from "@/lib/learn";
import { completeLesson } from "@/app/protected/learn/[bookNum]/[lessonNum]/actions";

type Phase = "vocab" | "question" | "answer";

interface Props {
  segments: Segment[];
  bookNum: number;
  lessonNum: number;
  lessonId: number | null;
}

export function SessionCard({ segments, bookNum, lessonNum, lessonId }: Props) {
  const [segIdx, setSegIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("vocab");
  const [pairIdx, setPairIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [nextHref, setNextHref] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (done) {
    return (
      <LessonComplete
        bookNum={bookNum}
        lessonNum={lessonNum}
        nextHref={nextHref}
      />
    );
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
      setPhase(next.question === "" ? "answer" : "question");
    } else if (segIdx < segments.length - 1) {
      const nextSeg = segments[segIdx + 1];
      setSegIdx((s) => s + 1);
      setPairIdx(0);
      setPhase("vocab");
      void nextSeg;
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
    } else {
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
    <div className="flex-1 bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-14 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Link 
              href="/protected" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">退出</span>
            </Link>
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-foreground font-medium">
                Book {bookNum} · Lesson {lessonNum}
              </span>
            </div>
            <div className="w-16 text-right">
              <span className="text-sm font-medium text-primary">{progress}%</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-8">
        {/* Vocab card */}
        <div 
          className={`mb-6 p-6 rounded-2xl border transition-all duration-300 ${
            phase === "vocab" 
              ? "bg-primary/5 border-primary/20" 
              : "bg-card border-border opacity-60"
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              phase === "vocab" ? "bg-primary/10" : "bg-muted"
            }`}>
              <Volume2 className={`w-4 h-4 ${phase === "vocab" ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <span className={`text-xs font-medium uppercase tracking-wider ${
              phase === "vocab" ? "text-primary" : "text-muted-foreground"
            }`}>
              词汇
            </span>
          </div>
          <p
            className={`font-medium text-foreground leading-relaxed transition-all duration-300 ${
              phase === "vocab" ? "text-2xl md:text-3xl" : "text-lg"
            }`}
          >
            {segment.vocab.split(" | ").join("  ·  ")}
          </p>
        </div>

        {/* Question/Answer area */}
        {phase !== "vocab" && pair && (
          <div className="flex-1 flex flex-col gap-4">
            {/* Question card */}
            {!isGrammarNote && (
              <div className={`p-6 rounded-2xl transition-all duration-300 ${
                phase === "question" 
                  ? "bg-card border-2 border-primary shadow-lg" 
                  : "bg-card border border-border"
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      phase === "question" ? "bg-primary" : "bg-muted"
                    }`}>
                      <Mic className={`w-4 h-4 ${
                        phase === "question" ? "text-primary-foreground" : "text-muted-foreground"
                      }`} />
                    </div>
                    <span className={`text-xs font-medium uppercase tracking-wider ${
                      phase === "question" ? "text-primary" : "text-muted-foreground"
                    }`}>
                      问题
                    </span>
                  </div>
                  {segment.pairs.length > 1 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {pairIdx + 1}/{segment.pairs.length}
                    </span>
                  )}
                </div>
                <p className="text-xl md:text-2xl font-medium text-foreground leading-relaxed">
                  {pair.question}
                </p>
              </div>
            )}

            {/* Answer card */}
            {phase === "answer" && (
              <div className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                isGrammarNote 
                  ? "bg-accent/10 border-accent/30" 
                  : "bg-primary/5 border-primary/30"
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isGrammarNote ? "bg-accent/20" : "bg-primary/20"
                  }`}>
                    <CheckCircle2 className={`w-4 h-4 ${
                      isGrammarNote ? "text-accent" : "text-primary"
                    }`} />
                  </div>
                  <span className={`text-xs font-medium uppercase tracking-wider ${
                    isGrammarNote ? "text-accent" : "text-primary"
                  }`}>
                    {isGrammarNote ? "语法注释" : "答案"}
                  </span>
                </div>
                <p className={`text-xl md:text-2xl leading-relaxed ${
                  isGrammarNote ? "text-foreground" : "text-foreground/80"
                }`}>
                  {pair.answer}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="mt-8 space-y-3">
          {phase === "vocab" && (
            <Button
              size="lg"
              className="w-full rounded-2xl h-14 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={startSegment}
            >
              {segment.pairs.length === 0 ? "继续" : "开始提问"}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          )}

          {phase === "question" && (
            <Button
              size="lg"
              className="w-full rounded-2xl h-14 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setPhase("answer")}
            >
              查看答案
            </Button>
          )}

          {phase === "answer" && (
            <div className="flex gap-3">
              <Button
                size="lg"
                variant="outline"
                className="flex-1 rounded-2xl h-14 text-base font-medium border-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
                onClick={nextPairOrSegment}
              >
                <XCircle className="mr-2 w-5 h-5" />
                再练一次
              </Button>
              <Button
                size="lg"
                className="flex-1 rounded-2xl h-14 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={nextPairOrSegment}
              >
                <CheckCircle2 className="mr-2 w-5 h-5" />
                记住了
              </Button>
            </div>
          )}
        </div>

        {/* Back navigation */}
        <div className="mt-6 text-center">
          <button
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={goBack}
          >
            <ChevronLeft className="h-4 w-4" />
            上一个
          </button>
        </div>
      </main>
    </div>
  );
}

function LessonComplete({
  bookNum,
  lessonNum,
  nextHref,
}: {
  bookNum: number;
  lessonNum: number;
  nextHref: string | null;
}) {
  return (
    <div className="flex-1 bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center max-w-sm w-full">
        {/* Success animation */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          {/* Confetti dots */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32">
            <div className="absolute top-2 left-4 w-2 h-2 rounded-full bg-accent animate-pulse" />
            <div className="absolute top-4 right-2 w-3 h-3 rounded-full bg-primary/50 animate-pulse" />
            <div className="absolute bottom-4 left-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
            <div className="absolute bottom-2 right-4 w-2 h-2 rounded-full bg-accent/50 animate-pulse" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-foreground mb-2">
          太棒了！
        </h2>
        <p className="text-xl text-muted-foreground mb-2">
          Lesson {lessonNum} 完成
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Book {bookNum}
        </p>
        
        {/* Stats placeholder */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">100%</p>
            <p className="text-xs text-muted-foreground">完成度</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">+10</p>
            <p className="text-xs text-muted-foreground">经验值</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <Button
            asChild
            size="lg"
            className="w-full rounded-2xl h-14 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Link href={nextHref ?? `/protected/learn/${bookNum}/${lessonNum + 1}`}>
              下一课
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          
          <Link href="/protected">
            <Button
              size="lg"
              variant="ghost"
              className="w-full rounded-2xl h-14 text-base font-medium text-muted-foreground hover:text-foreground"
            >
              返回首页
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
