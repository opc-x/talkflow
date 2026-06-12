"use client";

/** 贴在场景图下方的问句条 —— 提词器台词风格（与 QaScene 同卡片） */
export function LearnQuestionBanner({
  question,
  compact = false,
}: {
  question: string;
  compact?: boolean;
}) {
  const text = question.trim();
  if (!text) return null;

  return (
    <div
      className={
        compact
          ? "border-t border-white/[0.06] bg-gradient-to-b from-stone-900 via-stone-950 to-[#0b0b0b] px-4 pb-3 pt-2.5"
          : "border-t border-white/[0.06] bg-gradient-to-b from-stone-900 via-stone-950 to-[#0b0b0b] px-5 pb-5 pt-4"
      }
      data-testid="learn-question-banner"
    >
      <div className={`flex items-center justify-center gap-2 ${compact ? "mb-1" : "mb-2"}`}>
        <span
          className="h-1.5 w-1.5 rounded-full bg-emerald-400"
          style={{ animation: "cue-blink 1.6s ease-in-out infinite" }}
        />
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-emerald-400/80">
          请用英语回答
        </span>
      </div>
      <p
        className={
          compact
            ? "text-balance text-center text-lg font-semibold leading-snug tracking-tight text-white"
            : "text-balance text-center text-[1.45rem] font-semibold leading-snug tracking-tight text-white sm:text-[1.6rem]"
        }
      >
        {text}
      </p>
    </div>
  );
}
