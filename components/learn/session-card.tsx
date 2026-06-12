"use client";

import { useState, useTransition, useMemo, useRef, useEffect, Component, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useParams, usePathname, useRouter } from "next/navigation";
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
import { playUtterance } from "@/lib/audio";
import {
  beginLocalListening,
  beginAiRecording,
  runPracticeFromListenHandle,
  runPracticeFromAiRecording,
  isAiPracticeEnabled,
  SpeechRecognitionError,
} from "@/lib/practice-evaluate-client";
import type { PracticeEvalMode } from "@/lib/practice-evaluate-client";
import type { ListeningHandle } from "@/lib/local-practice";
import type { AiRecordingHandle } from "@/lib/practice-evaluate-client";
import type { RoundEvaluation } from "@shared/types/assessment";
import { SpeakStage } from "@/components/learn/speak-stage";
import { EvaluationFeedback } from "@/components/speak/evaluation-feedback";
import { QaScene } from "@/components/scenes/qa-scene";
import { resolveLessonArtPack } from "@/lib/scene-art-pack";
import { scoringReference, inferVisualState } from "@/lib/parse-qa-visual";
import {
  buildLearnViewQuery,
  type LearnViewPhase,
} from "@/lib/learn-url-state";
import { COPY } from "@/lib/copy";
import { LearnVocabDevPanel } from "@/components/learn/learn-vocab-dev-panel";
import { LearnQuestionBanner } from "@/components/learn/learn-question-banner";

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

type Phase = "vocab" | "question" | "feedback" | "answer";

interface Props {
  segments: Segment[];
  bookNum: number;
  lessonNum: number;
  lessonId: number | null;
  stageLabel: string;
  sceneImageUrl?: string | null;
  sceneTitle?: string | null;
  sceneImagePrompt?: string | null;
  vocabTerms: VocabTerm[];
  totalSentences: number;
  /** Dev preview: skip vocab intro and land on first Q&A */
  initialPhase?: Phase;
  /** From URL ?phase=&seg=&pair= — shareable view for @Browser / visual peek */
  initialLearnView?: {
    phase?: LearnViewPhase;
    segIdx?: number;
    pairIdx?: number;
  };
}

function countGrammarNotes(segments: Segment[]) {
  return segments.reduce(
    (n, seg) => n + seg.pairs.filter((p) => p.question === "").length,
    0
  );
}

function clampLearnView(
  segments: Segment[],
  view?: Props["initialLearnView"],
): { phase?: LearnViewPhase; segIdx: number; pairIdx: number } {
  if (!segments.length) return { segIdx: 0, pairIdx: 0 };
  const segIdx = Math.min(
    Math.max(view?.segIdx ?? 0, 0),
    segments.length - 1,
  );
  const pairCount = segments[segIdx]?.pairs.length ?? 0;
  const pairIdx = Math.min(
    Math.max(view?.pairIdx ?? 0, 0),
    Math.max(pairCount - 1, 0),
  );
  return { phase: view?.phase, segIdx, pairIdx };
}

export function SessionCard({
  segments,
  bookNum,
  lessonNum,
  lessonId,
  stageLabel,
  sceneImageUrl,
  sceneTitle,
  sceneImagePrompt = null,
  vocabTerms,
  totalSentences,
  initialPhase,
  initialLearnView,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = (params.locale as string) ?? "zh";
  const homeHref = `/${locale}/protected`;

  const viewSeed = useMemo(
    () => clampLearnView(segments, initialLearnView),
    [segments, initialLearnView],
  );

  const sceneArtPack = useMemo(
    () => resolveLessonArtPack(bookNum, lessonNum),
    [bookNum, lessonNum],
  );

  const [segIdx, setSegIdx] = useState(viewSeed.segIdx);
  const [phase, setPhase] = useState<Phase>(
    initialPhase ?? viewSeed.phase ?? "vocab",
  );
  const [pairIdx, setPairIdx] = useState(viewSeed.pairIdx);
  const [done, setDone] = useState(false);
  const [nextHref, setNextHref] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentEval, setCurrentEval] = useState<RoundEvaluation | null>(null);
  const [evalMode, setEvalMode] = useState<PracticeEvalMode>("local");
  const [evalNote, setEvalNote] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const listenRef = useRef<ListeningHandle | null>(null);
  const recordRef = useRef<AiRecordingHandle | null>(null);
  const micActiveRef = useRef(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    void navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((stream) => stream.getTracks().forEach((t) => t.stop()))
      .catch(() => {});
  }, []);

  /** Keep URL in sync so copying the address bar = Agent @Browser sees the same step */
  useEffect(() => {
    if (done) return;
    const q = buildLearnViewQuery(phase, segIdx, pairIdx);
    router.replace(`${pathname}?${q}`, { scroll: false });
  }, [phase, segIdx, pairIdx, pathname, router, done]);

  const grammarCount = useMemo(() => countGrammarNotes(segments), [segments]);

  const sentenceOffsets = useMemo(() => {
    let offset = 0;
    return segments.map((seg) => {
      const start = offset;
      offset += seg.pairs.filter((p) => p.question !== "").length;
      return start;
    });
  }, [segments]);

  const segment = segments[segIdx];
  const firstQaPair = useMemo(
    () => segment?.pairs.find((p) => p.question.trim() !== "") ?? null,
    [segment],
  );
  const [vocabFocusTerm, setVocabFocusTerm] = useState<string | null>(null);

  useEffect(() => {
    setVocabFocusTerm(null);
  }, [segIdx]);

  const vocabScene = useMemo(() => {
    if (vocabFocusTerm) {
      const t = vocabFocusTerm.trim();
      return { question: "What's this?", answer: `It's a ${t}.` };
    }
    if (firstQaPair) {
      return { question: firstQaPair.question, answer: firstQaPair.answer };
    }
    return { question: "What's this?", answer: "It's a pen." };
  }, [vocabFocusTerm, firstQaPair]);

  const vocabSubcaption = useMemo(() => {
    if (!segment) return "";
    if (vocabTerms.length > 0) {
      return `${COPY.vocabHint(vocabTerms.length)} · 点词联动场景`;
    }
    return segment.vocab.split(" | ").slice(0, 4).join(" · ");
  }, [vocabTerms.length, segment, segment?.vocab]);

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

  const pairVisualState = pair?.question
    ? (pair.visualState ?? inferVisualState(pair.question, pair.answer))
    : null;

  const showQuestionBanner =
    phase === "question" &&
    Boolean(pair?.question) &&
    !isGrammarNote &&
    pairVisualState?.template !== "concept_card";

  /** 开口说阶段：场景 + 问句 + 麦克风尽量一屏，少滚动 */
  const isQuestionSpeak = phase === "question" && !isGrammarNote;

  const currentSentenceIndex =
    sentenceOffsets[segIdx] +
    segment.pairs
      .slice(0, pairIdx)
      .filter((p) => p.question !== "").length +
    (phase !== "vocab" && !isGrammarNote ? 1 : 0);

  function resetSpeakState() {
    micActiveRef.current = false;
    listenRef.current?.abort();
    recordRef.current = null;
    setCurrentEval(null);
    setEvalNote(null);
    setActionError(null);
    setListening(false);
  }

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
    resetSpeakState();
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
    resetSpeakState();
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

  function onMicPressStart() {
    if (!pair || micActiveRef.current || pair.question === "") return;
    micActiveRef.current = true;
    setActionError(null);
    setEvalNote(null);
    setListening(true);
    if (isAiPracticeEnabled()) {
      recordRef.current = beginAiRecording(12000);
    } else {
      listenRef.current = beginLocalListening(12000);
    }
  }

  function onMicPressEnd() {
    if (!micActiveRef.current || !pair) return;

    void (async () => {
      const input = {
        question: pair.question,
        referenceAnswer: pair.answer,
        scoringAnswer: scoringReference(
          pair.question,
          pair.answer,
          pair.visualState ?? inferVisualState(pair.question, pair.answer)
        ),
        roundIndex: pairIdx,
        qaPairId: pair.qaPairId,
      };

      try {
        let result;
        if (isAiPracticeEnabled()) {
          const rec = recordRef.current;
          if (!rec) throw new Error("录音未启动");
          result = await runPracticeFromAiRecording(input, rec);
        } else {
          const handle = listenRef.current;
          if (!handle) throw new SpeechRecognitionError("语音识别未启动");
          handle.stop();
          result = await runPracticeFromListenHandle(input, handle);
        }
        setCurrentEval(result.evaluation);
        setEvalMode(result.mode);
        setEvalNote(result.fallbackNote ?? null);
        setPhase("feedback");
      } catch (err) {
        listenRef.current?.abort();
        if (err instanceof SpeechRecognitionError) {
          setActionError(err.message);
        } else {
          setActionError(err instanceof Error ? err.message : "录音或评估失败");
        }
      } finally {
        micActiveRef.current = false;
        setListening(false);
        listenRef.current = null;
        recordRef.current = null;
      }
    })();
  }

  function goBack() {
    if (phase === "vocab" && segIdx === 0) {
      exitToHome();
      return;
    }
    if (phase === "feedback") {
      setPhase("question");
      setCurrentEval(null);
      return;
    }
    if (phase === "answer") {
      setPhase(currentEval ? "feedback" : isGrammarNote ? "vocab" : "question");
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
    <div
      className={
        isQuestionSpeak
          ? "flex min-h-0 flex-1 flex-col bg-background max-md:h-[calc(100dvh-9rem)] max-md:max-h-[calc(100dvh-9rem)]"
          : "flex flex-1 flex-col bg-background"
      }
    >
      <header
        className={`sticky top-14 z-10 border-b border-border bg-background/80 backdrop-blur-sm ${isQuestionSpeak ? "shrink-0" : ""}`}
      >
        <div className={`max-w-2xl mx-auto px-4 ${isQuestionSpeak ? "py-2.5" : "py-4"}`}>
          <div
            className={`flex items-center justify-between ${isQuestionSpeak ? "mb-2" : "mb-3"}`}
          >
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

      <main
        className={
          isQuestionSpeak
            ? "mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden px-4 py-2 pb-3 max-md:pb-4 md:py-4 md:pb-28"
            : "mx-auto flex flex-1 flex-col max-w-2xl w-full px-4 py-4 pb-28"
        }
        data-learn-phase={phase}
      >
        {phase === "vocab" && (
          <>
            <div
              className="relative mb-4 aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl"
              data-testid="learn-vocab-scene"
            >
              <QaScene
                key={`vocab-${vocabScene.question}-${vocabScene.answer}`}
                question={vocabScene.question}
                answer={vocabScene.answer}
                variant="hero"
                interactive
                learnPhase="vocab"
                artPack={sceneArtPack}
                sceneTitle={sceneTitle ?? COPY.sceneFallbackTitle}
                sceneSubcaption={vocabSubcaption}
                className="absolute inset-0 h-full rounded-none border-0 shadow-none"
              />
            </div>

            {vocabTerms.length > 0 ? (
              <div className="mb-4 max-h-[32vh] overflow-y-auto rounded-xl border border-border bg-card/50 px-1">
                <p className="sticky top-0 z-10 bg-card/95 px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
                  本课新词（点词 → 场景联动 · 喇叭发音）
                </p>
                <VocabListErrorBoundary>
                  <VocabList
                    terms={vocabTerms}
                    activeTerm={vocabFocusTerm}
                    onTermFocus={(term) => {
                      setVocabFocusTerm(term);
                      void playUtterance(term, vocabTerms.find((t) => t.term === term)?.audioUrl);
                    }}
                  />
                </VocabListErrorBoundary>
              </div>
            ) : (
              <p className="mb-4 text-lg font-medium text-foreground leading-relaxed">
                {segment.vocab.split(" | ").join(" · ")}
              </p>
            )}

            <LearnVocabDevPanel
              artPack={sceneArtPack}
              lessonNum={lessonNum}
              segIdx={segIdx}
              vocabTerms={vocabTerms.map((t) => t.term)}
              focusTerm={vocabFocusTerm}
              question={vocabScene.question}
              answer={vocabScene.answer}
              sceneImagePrompt={sceneImagePrompt}
              sceneTitle={sceneTitle}
            />

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
          <div className={isQuestionSpeak ? "flex min-h-0 flex-1 flex-col" : undefined}>
            {!isGrammarNote ? (
              showQuestionBanner ? (
                <div
                  className={`stage-rise stage-rise-1 shrink-0 overflow-hidden rounded-2xl border border-stone-800/80 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.65)] ${isQuestionSpeak ? "mb-2" : "mb-4"}`}
                  data-testid="learn-scene-with-question"
                >
                  <QaScene
                    key={`${segIdx}-${pairIdx}-${pair.question}-${phase}`}
                    question={pair.question}
                    answer={pair.answer}
                    sceneImageUrl={pair.sceneImageUrl}
                    variant={isQuestionSpeak ? "compact" : "hero"}
                    interactive
                    learnPhase={phase}
                    artPack={sceneArtPack}
                    suppressInSceneQuestion
                    className="!mb-0 !rounded-none !border-0 !shadow-none"
                  />
                  <LearnQuestionBanner
                    question={pair.question}
                    compact={isQuestionSpeak}
                  />
                </div>
              ) : (
                <QaScene
                  key={`${segIdx}-${pairIdx}-${pair.question}-${phase}`}
                  question={pair.question}
                  answer={pair.answer}
                  sceneImageUrl={pair.sceneImageUrl}
                  variant={phase === "question" ? "compact" : "hero"}
                  interactive
                  learnPhase={phase}
                  artPack={sceneArtPack}
                  className={isQuestionSpeak ? "mb-2 shrink-0" : "mb-4"}
                />
              )
            ) : (
              <div className="relative mb-4 aspect-[4/3] max-h-[28vh] w-full shrink-0 overflow-hidden rounded-2xl border border-border bg-muted flex items-center justify-center">
                <p className="text-sm text-muted-foreground px-6 text-center">语法要点</p>
              </div>
            )}

            {phase === "question" && !isGrammarNote && (
              <div className="stage-rise stage-rise-2 relative mt-2 flex min-h-0 flex-1 flex-col justify-center overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0b0b0b] px-4 pb-4 pt-3 md:mt-4 md:px-6 md:pb-7 md:pt-6">
                {/* 聚光灯地面光晕 */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-40 md:h-56"
                  style={{
                    background:
                      "radial-gradient(60% 90% at 50% 100%, rgba(16,185,129,0.14), transparent 70%)",
                  }}
                />
                <div className="relative min-h-0">
                  {actionError && (
                    <p className="mb-2 text-center text-sm text-rose-400 md:mb-4">{actionError}</p>
                  )}
                  <SpeakStage
                    compact
                    busy={listening}
                    onPressStart={onMicPressStart}
                    onPressEnd={onMicPressEnd}
                    onListen={() => playUtterance(pair.question, pair.audioUrl)}
                  />
                </div>
              </div>
            )}

            {phase === "feedback" && currentEval && !isGrammarNote && (
              <div className="mt-6 flex flex-col flex-1">
                {actionError && (
                  <p className="text-sm text-destructive text-center mb-3">{actionError}</p>
                )}
                <EvaluationFeedback
                  evaluation={currentEval}
                  mode={evalMode}
                  modeNote={evalNote}
                  onRetry={() => {
                    setCurrentEval(null);
                    setEvalNote(null);
                    setPhase("question");
                  }}
                  onContinue={() => setPhase("answer")}
                />
              </div>
            )}

            {phase === "answer" && (
              <>
                {!isGrammarNote && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 self-center rounded-xl"
                      onClick={() => speakEnglish(pair.answer, 0.8)}
                    >
                      <Volume2 className="w-4 h-4 mr-2" />
                      再听一遍参考答案
                    </Button>
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
                    onClick={() => {
                      resetSpeakState();
                      setPhase(isGrammarNote ? "vocab" : "question");
                    }}
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
          </div>
        )}

        {phase !== "question" && (
          <div className="mt-6 text-center">
            <a
              href={homeHref}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              返回首页
            </a>
          </div>
        )}
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
