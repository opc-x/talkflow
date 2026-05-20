import { SessionCard } from "@/components/learn/session-card";
import type { Segment } from "@/lib/learn";

const PREVIEW_SEGMENTS: Segment[] = [
  {
    id: "preview_block1",
    vocab: "a pen | a pencil | a book | a rubber",
    pairs: [
      {
        question: "What's this?",
        answer: "It's a pen.",
      },
      {
        question: "Is this a pen or a pencil?",
        answer: "It's a pencil.",
      },
      {
        question: "What's that?",
        answer: "It's a book.",
      },
    ],
  },
  {
    id: "preview_block2",
    vocab: "long | short | tall",
    pairs: [
      {
        question: "Is the table long or short?",
        answer: "It's long.",
      },
      {
        question: "Is the pencil long or short?",
        answer: "It's short.",
      },
    ],
  },
  {
    id: "preview_block3",
    vocab: "on | under | behind | in front of",
    pairs: [
      {
        question: "Where's the book?",
        answer: "It's on the table.",
      },
      {
        question: "Where's the rubber?",
        answer: "It's under the table.",
      },
      {
        question: "Where's the pencil?",
        answer: "It's behind the book.",
      },
    ],
  },
  {
    id: "preview_block4",
    vocab: "this | that | here | there",
    pairs: [
      { question: "", answer: "We use 'this' for things near us, 'that' for things far away." },
      {
        question: "Is this here or there?",
        answer: "It's here.",
      },
    ],
  },
];

export default function LearnPreviewPage() {
  const totalSentences = PREVIEW_SEGMENTS.reduce(
    (n, seg) => n + seg.pairs.filter((p) => p.question !== "").length,
    0
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
    />
  );
}
