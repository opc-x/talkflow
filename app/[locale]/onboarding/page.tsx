"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const STAGE_OPTIONS = [
  {
    label: "还没学过 Callan",
    sub: "从 Stage 1 开始",
    book: 1,
    lesson: 1,
    recommended: false,
  },
  {
    label: "已完成 Stage 1–2",
    sub: "从 Stage 3 开始",
    book: 3,
    lesson: 31,
    recommended: true,
  },
  {
    label: "已完成 Stage 3–4",
    sub: "从 Stage 5 开始",
    book: 5,
    lesson: 91,
    recommended: false,
  },
  {
    label: "Stage 5 或以上",
    sub: "自选起点",
    book: 7,
    lesson: 131,
    recommended: false,
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const selected = selectedIdx !== null ? STAGE_OPTIONS[selectedIdx] : null;

  async function handleFinish() {
    if (!selected) return;
    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Find the lesson id
      const { data: lesson } = await supabase
        .from("lessons")
        .select("id")
        .eq("book_num", selected.book)
        .eq("lesson_num", selected.lesson)
        .single();

      if (lesson) {
        await supabase.from("user_progress").upsert(
          {
            user_id: user.id,
            current_lesson_id: lesson.id,
            lessons_done: [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      }

      router.push(
        `/protected/learn/${selected.book}/${selected.lesson}`
      );
    });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Mic className="w-6 h-6 text-primary" />
          <span className="font-bold text-xl text-foreground">TalkFlow</span>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1 */}
        {step === 0 && (
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              你学到哪里了？
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              根据你的进度推荐合适的起点
            </p>

            <div className="flex flex-col gap-3 mb-6">
              {STAGE_OPTIONS.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${
                    selectedIdx === i
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {opt.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {opt.sub}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {opt.recommended && (
                        <Badge className="bg-primary/10 text-primary border-0 text-xs font-normal">
                          推荐
                        </Badge>
                      )}
                      {selectedIdx === i && (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <Button
              size="lg"
              className="w-full rounded-xl"
              disabled={selectedIdx === null}
              onClick={() => setStep(1)}
            >
              下一步
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 2 */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-6">
              Callan 法的关键
            </h1>

            <div className="flex flex-col gap-4 mb-6">
              {[
                {
                  num: 1,
                  title: "听到问题",
                  desc: "AI 老师快速提问，跟真实课堂一样快",
                },
                {
                  num: 2,
                  title: "立刻开口",
                  desc: "不要停下来翻译，条件反射比理解更重要",
                },
                {
                  num: 3,
                  title: "听取反馈",
                  desc: "说错了 AI 立刻纠正，不会嘲笑你",
                },
              ].map((s) => (
                <div key={s.num} className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center shrink-0">
                    {s.num}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {s.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-muted p-4 mb-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                💡 Callan 法的目标是让你不经过中文思考，直接用英文反应。一开始很难，坚持
                2 周就会有明显变化。
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                size="lg"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setStep(0)}
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                上一步
              </Button>
              <Button
                size="lg"
                className="flex-1 rounded-xl"
                onClick={() => setStep(2)}
              >
                我明白了
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 2 && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Mic className="w-10 h-10 text-primary" />
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-6">
              准备好了！
            </h1>

            <Card className="rounded-2xl bg-muted border-0 p-5 mb-6 text-left">
              <p className="text-xs text-muted-foreground mb-1">你的起点</p>
              <p className="text-lg font-semibold text-foreground">
                {selected
                  ? `Book ${selected.book} · Lesson ${selected.lesson}`
                  : "Stage 3 · Book 3 · Lesson 31"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                从这里开始你的 Callan Method 口语训练
              </p>
            </Card>

            <Button
              size="lg"
              className="w-full rounded-xl mb-3"
              onClick={handleFinish}
              disabled={isPending}
            >
              {isPending ? "准备中…" : "开始第一课"}
              {!isPending && <ArrowRight className="ml-2 w-4 h-4" />}
            </Button>

            <button
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="inline w-3 h-3 mr-1" />
              返回上一步
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
