"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import Link from "next/link";
import { rateReview } from "./actions";

interface ReviewItem {
  id: number;
  question: string;
  answer: string;
  book_num: number;
  lesson_num: number;
  interval_days: number;
  ease_factor: number;
  rep_count: number;
}

const RATINGS = [
  { label: "完全忘了", score: 0, cls: "border-destructive text-destructive hover:bg-destructive/10" },
  { label: "有点印象", score: 2, cls: "border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950" },
  { label: "记得", score: 3, cls: "" },
  { label: "脱口而出", score: 5, cls: "bg-primary text-primary-foreground hover:bg-primary/90 border-primary" },
] as const;

export function ReviewClient({ items }: { items: ReviewItem[] }) {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [isPending, startTransition] = useTransition();
  const total = items.length;

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
              正确率 {rate}% · 共 {total} 题
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
          <Link href="/protected">返回首页</Link>
        </Button>
      </div>
    );
  }

  const item = items[idx];
  const pct = Math.round((idx / total) * 100);

  function rate(score: number) {
    startTransition(async () => {
      await rateReview(item.id, score, item.interval_days, item.ease_factor, item.rep_count);
      if (score >= 3) setCorrect((c) => c + 1);
      setIdx((i) => i + 1);
      setRevealed(false);
    });
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-foreground">今日复习</h1>
        <Badge className="bg-primary/10 text-primary border-0">
          {total} 个待复习
        </Badge>
      </div>

      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>
          {idx} / {total} 完成
        </span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Card */}
      <Card className="rounded-2xl border p-8">
        <p className="text-xs text-muted-foreground mb-4 text-center">
          Book {item.book_num} · Lesson {item.lesson_num} · 词汇复习
        </p>

        {!revealed ? (
          <>
            <p className="text-2xl font-medium text-foreground text-center leading-relaxed mb-8">
              {item.question}
            </p>
            <Button
              size="lg"
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => setRevealed(true)}
            >
              想想看，再看答案
            </Button>
          </>
        ) : (
          <>
            <p className="text-lg text-muted-foreground text-center opacity-60 mb-3">
              {item.question}
            </p>
            <div className="border-t border-border mb-4" />
            <p className="text-xl font-medium text-foreground text-center mb-6 leading-relaxed">
              {item.answer}
            </p>

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
