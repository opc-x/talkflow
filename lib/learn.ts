export type BlockType = "lexical_block" | "qa_block" | "grammar_note";

/** term_kind values shown in lesson "新词" / vocab lists */
export const VOCAB_TERM_KINDS = ["word", "phrase"] as const;
export type VocabTermKind = (typeof VOCAB_TERM_KINDS)[number];

export interface ContentBlock {
  id: string;
  block_type: BlockType;
  text: string;
  book_num: number;
  lesson_num: number;
  book_page: number;
  pdf_page: number;
  stage: number;
  ai_explanation?: string | null;
}

import type { VisualState } from "@/lib/visual-state";

export interface QAPair {
  question: string; // empty string for grammar notes
  answer: string;
  explanation?: string | null; // grammar_note: Chinese AI explanation
  qaPairId?: number;
  audioUrl?: string | null;
  visualState?: VisualState | null;
  /** Per-pair illustration (one image per Q&A) */
  sceneImageUrl?: string | null;
}

export interface Segment {
  id: string;
  vocab: string;
  pairs: QAPair[];
}

export function blockNum(id: string): number {
  const m = id.match(/_block(\d+)$/);
  return m ? parseInt(m[1]) : 0;
}

export function compareBlockIds(a: string, b: string): number {
  const pdf = (id: string) => {
    const m = id.match(/pdf(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  };
  const pa = pdf(a);
  const pb = pdf(b);
  if (pa !== pb) return pa - pb;
  return blockNum(a) - blockNum(b);
}

function parseBlock(block: ContentBlock): QAPair[] {
  const text = block.text?.trim() ?? "";
  if (!text) return [];

  if (block.block_type === "grammar_note") {
    return [
      {
        question: "",
        answer: text,
        explanation: block.ai_explanation ?? null,
      },
    ];
  }

  // Split "Q: ... A: ... | Q: ... A: ..." into individual pairs
  const rawPairs = text.split(" | Q: ");
  return rawPairs.map((raw) => {
    // First element has "Q: " prefix, rest don't
    const body = raw.startsWith("Q: ") ? raw.slice(3) : raw;
    const aIdx = body.indexOf(" A: ");
    if (aIdx === -1) return { question: body.trim(), answer: "" };
    return {
      question: body.slice(0, aIdx).trim(),
      answer: body.slice(aIdx + 4).trim(),
    };
  });
}

export function groupIntoSegments(blocks: ContentBlock[]): Segment[] {
  const sorted = [...blocks].sort((a, b) => {
    if (a.pdf_page !== b.pdf_page) return a.pdf_page - b.pdf_page;
    return blockNum(a.id) - blockNum(b.id);
  });

  const segments: Segment[] = [];
  let i = 0;

  while (i < sorted.length) {
    const block = sorted[i];
    if (block.block_type !== "lexical_block") {
      i++;
      continue;
    }

    const pairs: QAPair[] = [];
    let j = i + 1;
    while (j < sorted.length && sorted[j].block_type !== "lexical_block") {
      pairs.push(...parseBlock(sorted[j]));
      j++;
    }

    if (block.text?.trim()) {
      segments.push({ id: block.id, vocab: block.text.trim(), pairs });
    }
    i = j;
  }

  return segments;
}

function qaPairKey(question: string, answer: string) {
  return `${question.trim().toLowerCase()}|${answer.trim().toLowerCase()}`;
}

/** Attach DB qa_pair ids + audio_url + visual_state to parsed segment pairs */
export function enrichSegmentsWithQaPairs(
  segments: Segment[],
  rows: {
    id: number;
    question: string;
    answer: string | null;
    audio_url: string | null;
    visual_state?: unknown;
    scene_image_url?: string | null;
  }[]
): Segment[] {
  const map = new Map(
    rows.map((r) => [qaPairKey(r.question, r.answer ?? ""), r])
  );

  return segments.map((seg) => ({
    ...seg,
    pairs: seg.pairs.map((pair) => {
      if (!pair.question) return pair;
      const row = map.get(qaPairKey(pair.question, pair.answer));
      if (!row) return pair;
      const visualState = parseStoredVisualState(row.visual_state);
      const sceneImageUrl =
        row.scene_image_url &&
        row.scene_image_url !== "pending" &&
        row.scene_image_url !== ""
          ? row.scene_image_url
          : null;
      return {
        ...pair,
        qaPairId: row.id,
        audioUrl: row.audio_url,
        visualState,
        sceneImageUrl,
      };
    }),
  }));
}

function parseStoredVisualState(raw: unknown): VisualState | null {
  if (!raw || typeof raw !== "object") {
    if (typeof raw === "string") {
      try {
        return parseStoredVisualState(JSON.parse(raw));
      } catch {
        return null;
      }
    }
    return null;
  }
  const o = raw as VisualState;
  if (!Array.isArray(o.objects)) return null;
  return o;
}
