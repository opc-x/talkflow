import { SessionCard } from "@/components/learn/session-card";
import type { Segment } from "@/lib/learn";
import { parseLearnViewState } from "@/lib/learn-url-state";

const PREVIEW_SEGMENTS: Segment[] = [
  {
    id: "preview_block1",
    vocab: "a pen | a pencil | a book | a rubber",
    pairs: [
      { question: "What's this?", answer: "It's a pen." },
      { question: "Is this a pen or a pencil?", answer: "It's a pencil." },
      { question: "What's that?", answer: "It's a book." },
    ],
  },
];

interface Props {
  searchParams: Promise<{ phase?: string; seg?: string; pair?: string }>;
}

export default async function LearnPreviewPage({ searchParams }: Props) {
  const sp = await searchParams;
  const learnView = parseLearnViewState(
    new URLSearchParams(
      Object.entries(sp).filter(([, v]) => v != null) as [string, string][],
    ),
  );
  const initialLearnView =
    learnView.phase || learnView.segIdx != null || learnView.pairIdx != null
      ? learnView
      : sp.phase === "question"
        ? { phase: "question" as const, segIdx: 0, pairIdx: 0 }
        : undefined;

  const totalSentences = PREVIEW_SEGMENTS.reduce(
    (n, seg) => n + seg.pairs.filter((p) => p.question !== "").length,
    0,
  );

  return (
    <SessionCard
      segments={PREVIEW_SEGMENTS}
      bookNum={1}
      lessonNum={1}
      lessonId={null}
      stageLabel="🌱 入门"
      vocabTerms={[]}
      totalSentences={Math.max(totalSentences, 1)}
      initialLearnView={initialLearnView}
    />
  );
}
