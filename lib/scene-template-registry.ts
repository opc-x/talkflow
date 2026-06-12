/**
 * Scene template registry — maps Callan-style Q types → animation + art presets.
 * Extend VisualState.templateId with entries here; assets stay swappable (SVG / Lottie / Rive).
 */

import type { AnimationPreset } from "@/lib/visual-state";

export type QuestionType =
  | "identify_what"
  | "identify_is_a"
  | "spatial_where"
  | "spatial_relation"
  | "negation"
  | "size_contrast"
  | "colour"
  | "concept"
  | "command_give"
  | "person_who"
  | "counting"
  | "discourse_why"
  | "action_progressive"
  | "meta_drill";

export type HighlightStyle = "pulse_ring" | "point_hand" | "spatial_bounce" | "shake" | "none";

export type ArtPackId = "talkflow_flat_v2" | "storyset_classroom";

export interface SceneTemplateEntry {
  id: string;
  label: string;
  questionTypes: QuestionType[];
  animation: AnimationPreset;
  highlightStyle: HighlightStyle;
  artPack: ArtPackId;
  /** Future: Lottie highlight overlay URL */
  lottieUrl?: string;
  /** Future: Rive state-machine input name */
  riveInput?: string;
}

/** Types that render concept_card — no room scene, no pen pulse */
export const CONCEPT_QUESTION_TYPES: ReadonlySet<QuestionType> = new Set([
  "concept",
  "command_give",
  "person_who",
  "counting",
  "discourse_why",
  "action_progressive",
  "meta_drill",
]);

export function isConceptQuestionType(qType: QuestionType): boolean {
  return CONCEPT_QUESTION_TYPES.has(qType);
}

export const SCENE_TEMPLATE_REGISTRY: SceneTemplateEntry[] = [
  {
    id: "deictic_what",
    label: "What's this? — identify object",
    questionTypes: ["identify_what"],
    animation: "pulse_highlight",
    highlightStyle: "pulse_ring",
    artPack: "talkflow_flat_v2",
  },
  {
    id: "deictic_is_a",
    label: "Is this a X? — yes/no identify",
    questionTypes: ["identify_is_a"],
    animation: "pulse_highlight",
    highlightStyle: "pulse_ring",
    artPack: "talkflow_flat_v2",
  },
  {
    id: "spatial_where",
    label: "Where's the X? — location query",
    questionTypes: ["spatial_where"],
    animation: "point_arrow",
    highlightStyle: "point_hand",
    artPack: "talkflow_flat_v2",
  },
  {
    id: "spatial_on_under_in",
    label: "on / under / in relation",
    questionTypes: ["spatial_relation"],
    animation: "spatial_on",
    highlightStyle: "spatial_bounce",
    artPack: "talkflow_flat_v2",
  },
  {
    id: "negation_shake",
    label: "No — wrong noun dim + shake",
    questionTypes: ["negation"],
    animation: "shake_no",
    highlightStyle: "shake",
    artPack: "talkflow_flat_v2",
  },
  {
    id: "size_contrast",
    label: "short / long / large / small",
    questionTypes: ["size_contrast"],
    animation: "size_contrast",
    highlightStyle: "pulse_ring",
    artPack: "talkflow_flat_v2",
  },
  {
    id: "colour_identify",
    label: "What colour?",
    questionTypes: ["colour"],
    animation: "pulse_highlight",
    highlightStyle: "pulse_ring",
    artPack: "talkflow_flat_v2",
  },
  {
    id: "concept_card",
    label: "Abstract / no scene",
    questionTypes: [
      "concept",
      "command_give",
      "person_who",
      "counting",
      "discourse_why",
      "action_progressive",
      "meta_drill",
    ],
    animation: "none",
    highlightStyle: "none",
    artPack: "talkflow_flat_v2",
  },
];

const SPATIAL_RELATION_RE =
  /\b(on|under|in)\s+(the\s+)?(book|box|table|floor|room|house|picture|wall)\b/i;

const META_DRILL_RE =
  /drill\s+number|^\s*answers\s*$/i;

export function detectQuestionType(question: string, answer: string): QuestionType {
  const q = question.trim();
  const a = answer.trim();
  const text = `${q} ${a}`;

  if (!q) return "concept";
  if (/give me\b/i.test(q)) return "command_give";
  if (
    /what am i doing|what'?s he doing|what'?s she doing|what are you doing|what is he doing|what is she doing/i.test(
      q
    )
  ) {
    return "action_progressive";
  }
  if (/\bwho\b/i.test(q)) return "person_who";
  if (/how many\b/i.test(q)) return "counting";
  if (/^why\b|why not/i.test(q)) return "discourse_why";
  if (META_DRILL_RE.test(q) || /what english word or phrase matches/i.test(q)) {
    return "meta_drill";
  }
  if (/\bshort\b|\blong\b|\blarge\b|\bsmall\b/i.test(text)) return "size_contrast";
  if (/what colour/i.test(q)) return "colour";
  if (/\bwhere'?s\b/i.test(q)) return "spatial_where";
  if (SPATIAL_RELATION_RE.test(text)) return "spatial_relation";
  if (/^no\b/i.test(a) || /\bisn'?t\b/i.test(a)) return "negation";
  if (/what'?s this|what is this/i.test(q)) return "identify_what";
  if (/is this (a|the)\b/i.test(q)) return "identify_is_a";
  return "concept";
}

export function resolveSceneTemplate(
  question: string,
  answer: string
): SceneTemplateEntry {
  const qType = detectQuestionType(question, answer);
  const hit =
    SCENE_TEMPLATE_REGISTRY.find((t) => t.questionTypes.includes(qType)) ??
    SCENE_TEMPLATE_REGISTRY.find((t) => t.id === "concept_card")!;

  if (qType === "spatial_relation") {
    if (/\bunder\b/i.test(`${question} ${answer}`)) {
      return { ...hit, animation: "spatial_under" };
    }
    if (/\bin the\b/i.test(`${question} ${answer}`)) {
      return { ...hit, animation: "spatial_in" };
    }
  }

  return hit;
}
