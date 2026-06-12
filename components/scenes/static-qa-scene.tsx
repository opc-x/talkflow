"use client";

import { motion } from "framer-motion";
import type { QaSceneLearnPhase } from "@/components/scenes/qa-scene";

interface Props {
  imageUrl: string;
  question: string;
  answer: string;
  learnPhase?: QaSceneLearnPhase;
  /** false when parent shows LearnQuestionBanner (avoid duplicate) */
  showQuestionOverlay?: boolean;
  className?: string;
  variant?: "hero" | "compact";
}

/** 一问一图 — 全幅插画 + 问句/答案叠层 */
export function StaticQaScene({
  imageUrl,
  question,
  answer,
  learnPhase,
  showQuestionOverlay = true,
  className = "",
  variant = "hero",
}: Props) {
  const sizeClass =
    variant === "hero"
      ? "aspect-[4/3] w-full min-h-[min(72vw,340px)] max-h-[min(55vh,420px)]"
      : "aspect-[4/3] w-full min-h-[7.5rem] max-h-[min(30vh,220px)]";

  const showQuestion =
    showQuestionOverlay && (learnPhase === "question" || learnPhase === "vocab");
  const showAnswer = learnPhase === "answer" || learnPhase === "feedback";

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-2xl border-2 border-stone-200/60 bg-stone-900 ${sizeClass} ${className}`}
      data-testid="qa-scene"
      data-qa-template="static_image"
      data-qa-art-pack="static_image"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-900/55 via-transparent to-stone-900/15" />

      {showQuestion && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-3 z-[4] flex justify-center px-3"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="max-w-[94%] rounded-xl bg-stone-900/85 px-4 py-2.5 text-center text-sm font-semibold leading-snug text-white backdrop-blur-sm">
            {question}
          </p>
        </motion.div>
      )}

      {showAnswer && answer && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] flex justify-center bg-gradient-to-t from-stone-900/80 to-transparent px-4 pb-3 pt-12"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="max-w-[95%] rounded-xl bg-primary px-4 py-2.5 text-center shadow-lg">
            <p className="text-[10px] font-medium uppercase tracking-wider text-primary-foreground/85">
              参考答案
            </p>
            <p className="text-base font-semibold leading-snug text-primary-foreground">{answer}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
