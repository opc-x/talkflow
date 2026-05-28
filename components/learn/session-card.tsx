"use client";

import { useState, useTransition, useMemo, Component, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Volume2,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import type { Segment } from "@/lib/learn";
import { completeLesson } from "@/app/[locale]/protected/learn/[bookNum]/[lessonNum]/actions";
import type { VocabTerm } from "@/components/learn/vocab-list";
import { speakEnglish } from "@/lib/speech";
import { MarketScene } from "@/components/scenes/market-scene";

const VocabList = dynamic(
  () => import("@/components/learn/vocab-list").then((mod) => mod.VocabList),
  {
    ssr: false,
    loading: () => (
      <div className="px-3 py-6 text-center text-sm text-muted-foreground">
        加载词汇…
      </div>
    ),
  },
);

class VocabListErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="px-3 py-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">词汇加载失败</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted"
          >
            点击刷新
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

type Phase = "vocab" | "question" | "answer";

interface Props {
  segments: Segment[];
  bookNum: number;
  lessonNum: number;
  lessonId: number | null;
  stageLabel: string;
  sceneImageUrl?: string | null;
  sceneTitle?: string | null;
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
  sceneTitle,
  vocabTerms,
  totalSentences,
}: Props) {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) ?? "zh";
  const homeHref = `/${locale}/protected`;

  const [segIdx, setSegIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("vocab");
  const [pairIdx, setPairIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [nextHref, setNextHref] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [thumbFailed, setThumbFailed] = useState(false);
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
        locale={locale}
        bookNum={bookNum}
        lessonNum={lessonNum}
        segmentCount={segments.length}
        totalSentences={totalSentences}
        grammarCount={grammarCount}
        nextHref={nextHref}
        saveError={saveError}
      />
    );
  }

  const segment = segments[segIdx];
  if (!segment) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12"
        style={{ background: "#111111", color: "#F5F5F5" }}
      >
        <p className="mb-4">内容加载异常</p>
        <button
          type="button"
          onClick={() => router.push(homeHref)}
          className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-[#1a1a1a]"
        >
          返回首页
        </button>
      </div>
    );
  }

  const pair = segment.pairs[pairIdx] ?? null;
  const isGrammarNote = pair !== null && pair.question === "";

  const currentSentenceIndex =
    sentenceOffsets[segIdx] +
    segment.pairs
      .slice(0, pairIdx)
      .filter((p) => p.question !== "").length +
    (phase !== "vocab" && !isGrammarNote ? 1 : 0);

  function finishLesson() {
    setDone(true);
    if (lessonId) {
      startTransition(async () => {
        try {
          const result = await completeLesson(lessonId);
          setSaveError(null);
          if (result.nextLesson) {
            setNextHref(
              `/${locale}/protected/learn/${result.nextLesson.book_num}/${result.nextLesson.lesson_num}`
            );
          }
        } catch (err) {
          console.error("completeLesson failed", err);
          setSaveError("进度保存失败，请点击重试");
        }
      });
    }
  }

  function nextPairOrSegment() {
    if (pairIdx < segment.pairs.length - 1) {
      const next = segment.pairs[pairIdx + 1];
      setPairIdx((p) => p + 1);
      setPhase(next.question === "" ? "answer" : "question");
    } else {
      let nextIdx = segIdx + 1;
      while (nextIdx < segments.length && segments[nextIdx].pairs.length === 0) {
        nextIdx++;
      }
      if (nextIdx >= segments.length) {
        finishLesson();
      } else {
        const nextSeg = segments[nextIdx];
        const first = nextSeg.pairs[0];
        setSegIdx(nextIdx);
        setPairIdx(0);
        setPhase(first.question === "" ? "answer" : "question");
      }
    }
  }

  function startSegment() {
    if (segment.pairs.length === 0) {
      let nextIdx = segIdx + 1;
      while (nextIdx < segments.length && segments[nextIdx].pairs.length === 0) {
        nextIdx++;
      }
      if (nextIdx >= segments.length) {
        finishLesson();
      } else {
        const nextSeg = segments[nextIdx];
        const first = nextSeg.pairs[0];
        setSegIdx(nextIdx);
        setPairIdx(0);
        setPhase(first.question === "" ? "answer" : "question");
      }
    } else {
      const first = segment.pairs[0];
      setPairIdx(0);
      setPhase(first.question === "" ? "answer" : "question");
    }
  }

  function exitToHome() {
    window.location.href = homeHref;
  }

  function goBack() {
    if (phase === "vocab" && segIdx === 0) {
      exitToHome();
      return;
    }
    if (phase === "answer") {
      setPhase(isGrammarNote ? "vocab" : "question");
      return;
    }
    if (phase === "question") {
      if (pairIdx > 0) {
        setPairIdx((p) => p - 1);
        setPhase("answer");
      } else {
        setPhase("vocab");
      }
      return;
    }
    if (segIdx > 0) {
      const prev = segments[segIdx - 1];
      setSegIdx((s) => s - 1);
      const lastPair = Math.max(prev.pairs.length - 1, 0);
      setPairIdx(lastPair);
      setPhase(prev.pairs.length > 0 ? "answer" : "vocab");
      return;
    }
    router.push(homeHref);
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
            {phase === "vocab" && segIdx === 0 ? (
              <a
                href={homeHref}
                className="flex min-w-[4rem] items-center gap-0.5 text-muted-foreground hover:text-foreground"
                aria-label="返回首页"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">返回</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={goBack}
                className="flex min-w-[4rem] items-center gap-0.5 text-muted-foreground hover:text-foreground"
                aria-label="上一步"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">返回</span>
              </button>
            )}
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

      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-4 pb-6">
        {phase === "vocab" && (
          <>
            <div className="relative mb-4 aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl border border-border bg-muted">
              {sceneImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sceneImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full [&_svg]:h-full [&_svg]:w-full">
                  <MarketScene />
                </div>
              )}
              <span className="absolute left-3 top-3 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-semibold text-white">
                看图说话
              </span>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10">
                <p className="text-sm font-medium text-white">
                  {sceneTitle ?? "本课场景"}
                </p>
                <p className="text-xs text-white/70">
                  {vocabTerms.length > 0
                    ? `${vocabTerms.length} 个新词 · 先看图再开口`
                    : segment.vocab.split(" | ").slice(0, 4).join(" · ")}
                </p>
              </div>
            </div>

            {vocabTerms.length > 0 ? (
              <div className="mb-4 max-h-[32vh] overflow-y-auto rounded-xl border border-border bg-card/50 px-1">
                <p className="sticky top-0 z-10 bg-card/95 px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
                  本课新词（点词可听）
                </p>
                <VocabListErrorBoundary>
                  <VocabList terms={vocabTerms} />
                </VocabListErrorBoundary>
              </div>
            ) : (
              <p className="mb-4 text-lg font-medium text-foreground leading-relaxed">
                {segment.vocab.split(" | ").join(" · ")}
              </p>
            )}
            <div className="mt-auto pt-2">
              <Button
                size="lg"
                className="w-full rounded-2xl h-14"
                onClick={startSegment}
              >
                开始问答 →
              </Button>
            </div>
          </>
        )}

        {phase !== "vocab" && pair && (
          <>
            {sceneImageUrl && !thumbFailed && (
              <div className="mb-4 flex justify-end">
                <div className="h-14 w-20 overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sceneImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setThumbFailed(true)}
                  />
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
                    <p className="text-sm text-primary font-medium mb-2">📌 语法要点</p>
                    {pair.explanation ? (
                      <p className="text-xl leading-relaxed text-foreground whitespace-pre-wrap">
                        {pair.explanation}
                      </p>
                    ) : (
                      <p className="text-xl leading-relaxed text-foreground whitespace-pre-wrap">
                        {pair.answer}
                      </p>
                    )}
                    <details className="mt-4">
                      <summary className="text-sm text-muted-foreground cursor-pointer">
                        查看原文
                      </summary>
                      <p className="mt-2 text-sm text-muted-foreground">{pair.answer}</p>
                    </details>
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
          <a
            href={homeHref}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            返回首页
          </a>
        </div>
      </main>
    </div>
  );
}

function LessonComplete({
  locale,
  bookNum,
  lessonNum,
  segmentCount,
  totalSentences,
  grammarCount,
  nextHref,
  saveError,
}: {
  locale: string;
  bookNum: number;
  lessonNum: number;
  segmentCount: number;
  totalSentences: number;
  grammarCount: number;
  nextHref: string | null;
  saveError: string | null;
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
        {saveError && (
          <p className="text-sm text-destructive mb-4">{saveError}</p>
        )}
        <div className="space-y-3">
          <Button asChild size="lg" className="w-full rounded-2xl h-14">
            <Link href={nextHref ?? `/${locale}/protected/learn/${bookNum}/${lessonNum + 1}`}>
              第{lessonNum + 1}课 →
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="w-full rounded-2xl h-14">
            <Link href={`/${locale}/protected`}>回首页</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
