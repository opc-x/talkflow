"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Volume2 } from "lucide-react";
import Link from "next/link";
import { rateReview } from "./actions";
import {
  beginLocalListening,
  beginAiRecording,
  runPracticeFromListenHandle,
  runPracticeFromAiRecording,
  isAiPracticeEnabled,
  SpeechRecognitionError,
} from "@/lib/practice-evaluate-client";
import type { ListeningHandle } from "@/lib/local-practice";
import type { AiRecordingHandle } from "@/lib/practice-evaluate-client";
import type { PracticeEvalMode } from "@/lib/practice-evaluate-client";
import type { RoundEvaluation } from "@shared/types/assessment";
import { MicRecordButton } from "@/components/speak/mic-record-button";
import { EvaluationFeedback } from "@/components/speak/evaluation-feedback";
import { speakEnglish } from "@/lib/speech";

interface ReviewItem {
  id: number;
  qaPairId: number;
  question: string;
  answer: string;
  book_num: number;
  lesson_num: number;
  interval_days: number;
  ease_factor: number;
  rep_count: number;
  stageLabel: string;
  daysSince: number;
}

const RATINGS = [
  { label: "完全忘了", score: 0, cls: "border-destructive text-destructive hover:bg-destructive/10" },
  { label: "有点印象", score: 1, cls: "border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950" },
  { label: "记得", score: 3, cls: "" },
  { label: "脱口而出", score: 5, cls: "bg-primary text-primary-foreground hover:bg-primary/90 border-primary" },
] as const;

type ReviewPhase = "speak" | "feedback" | "rate";

export function ReviewClient({ items }: { items: ReviewItem[] }) {
  const params = useParams();
  const locale = (params.locale as string) ?? "zh";
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<ReviewPhase>("speak");
  const [currentEval, setCurrentEval] = useState<RoundEvaluation | null>(null);
  const [evalMode, setEvalMode] = useState<PracticeEvalMode>("local");
  const [evalNote, setEvalNote] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const listenRef = useRef<ListeningHandle | null>(null);
  const recordRef = useRef<AiRecordingHandle | null>(null);
  const micActiveRef = useRef(false);
  const [correct, setCorrect] = useState(0);
  const [rateError, setRateError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const total = items.length;

  useEffect(() => {
    void navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((stream) => stream.getTracks().forEach((t) => t.stop()))
      .catch(() => {});
  }, []);

  function resetCard() {
    micActiveRef.current = false;
    listenRef.current?.abort();
    recordRef.current = null;
    setPhase("speak");
    setCurrentEval(null);
    setEvalMode("local");
    setEvalNote(null);
    setActionError(null);
    setListening(false);
  }

  if (total === 0 || idx >= total) {
    const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center pb-20 md:pb-16">
        <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground">
          {total === 0 ? "今日暂无复习任务" : "今日复习完成！"}
        </h2>
        {total > 0 && (
          <>
            <p className="text-muted-foreground mt-2 text-sm">
              答对率：{rate}% · 共 {total} 题
            </p>
            <div className="rounded-xl bg-muted p-4 mt-6 text-sm text-muted-foreground">
              做得好！养成每天复习的习惯，算法会帮你记住一切。
            </div>
          </>
        )}
        {total === 0 && (
          <p className="text-muted-foreground mt-2 text-sm">
            继续学新课，学完的词汇会自动加入复习队列
          </p>
        )}
        <Button asChild size="lg" className="mt-6 rounded-xl w-full">
          <Link href={`/${locale}/protected`}>返回首页</Link>
        </Button>
      </div>
    );
  }

  const item = items[idx];
  const doneCount = idx;

  function onMicPressStart() {
    if (micActiveRef.current) return;
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
    if (!micActiveRef.current) return;

    void (async () => {
      const input = {
        question: item.question,
        referenceAnswer: item.answer,
        roundIndex: idx,
        qaPairId: item.qaPairId,
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

  function rate(score: number) {
    startTransition(async () => {
      try {
        await rateReview(item.id, score, item.interval_days, item.ease_factor, item.rep_count);
        setRateError(null);
        if (score >= 3) setCorrect((c) => c + 1);
        setIdx((i) => i + 1);
        resetCard();
      } catch (err) {
        console.error("rateReview failed", err);
        setRateError("评分保存失败，请重试");
      }
    });
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-foreground">今日复习</h1>
        <Badge className="bg-primary/10 text-primary border-0">
          {total} 个待复习
        </Badge>
      </div>

      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>开口复习</span>
        <span className="font-medium text-foreground tabular-nums">
          {doneCount} / {total}
        </span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${total > 0 ? (doneCount / total) * 100 : 0}%` }}
        />
      </div>

      {(rateError || actionError) && (
        <p className="text-sm text-destructive text-center mb-4">
          {rateError ?? actionError}
        </p>
      )}

      <Card className="rounded-2xl border p-8">
        <p className="text-xs text-muted-foreground mb-4 text-center">
          {item.stageLabel} · 第{item.lesson_num}课 · 上次 {item.daysSince} 天前
        </p>

        {phase === "speak" && (
          <>
            <p className="text-2xl font-medium text-foreground text-center leading-relaxed mb-6">
              {item.question}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mx-auto mb-6 flex rounded-xl"
              onClick={() => speakEnglish(item.question)}
            >
              <Volume2 className="w-4 h-4 mr-2" />
              听问题
            </Button>
            <MicRecordButton
              busy={listening}
              onPressStart={onMicPressStart}
              onPressEnd={onMicPressEnd}
            />
            <button
              type="button"
              className="mt-6 w-full text-xs text-muted-foreground underline"
              onClick={() => setPhase("rate")}
            >
              想不起来，直接看答案
            </button>
          </>
        )}

        {phase === "feedback" && currentEval && (
          <EvaluationFeedback
            evaluation={currentEval}
            mode={evalMode}
            modeNote={evalNote}
            onRetry={() => {
              setCurrentEval(null);
              setEvalNote(null);
              setPhase("speak");
            }}
            onContinue={() => setPhase("rate")}
            continueLabel="看答案并评分 →"
            skipLabel="看答案并评分"
            pending={isPending}
          />
        )}

        {phase === "rate" && (
          <>
            <p className="text-lg text-muted-foreground text-center opacity-60 mb-3">
              {item.question}
            </p>
            <div className="border-t border-border mb-4" />
            <p className="text-xl font-medium text-foreground text-center mb-6 leading-relaxed">
              {item.answer}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mx-auto mb-4 flex rounded-xl"
              onClick={() => speakEnglish(item.answer, 0.8)}
            >
              <Volume2 className="w-4 h-4 mr-2" />
              听参考答案
            </Button>
            <p className="text-sm text-muted-foreground text-center mb-4">
              你记得吗？
            </p>
            <div className="grid grid-cols-4 gap-2">
              {RATINGS.map((r) => (
                <Button
                  key={r.score}
                  size="sm"
                  variant="outline"
                  className={`rounded-lg text-xs py-2 h-auto ${r.cls}`}
                  disabled={isPending}
                  onClick={() => rate(r.score)}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
