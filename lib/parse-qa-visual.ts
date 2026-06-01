import {
  isConceptQuestionType,
  detectQuestionType,
  resolveSceneTemplate,
} from "@/lib/scene-template-registry";
import type {
  AnimationPreset,
  SceneObject,
  SlotId,
  SpriteId,
  VisualState,
} from "@/lib/visual-state";
import { SPRITE_REGISTRY } from "@/lib/visual-state";

const LESSON_NOUNS = [
  "pen",
  "pencil",
  "book",
  "table",
  "chair",
  "box",
  "clock",
  "door",
  "window",
  "light",
  "room",
  "wall",
  "floor",
  "ceiling",
  "man",
  "woman",
  "boy",
  "girl",
  "ruler",
  "picture",
  "city",
  "town",
  "village",
  "house",
  "coat",
  "dress",
  "shirt",
  "shoe",
  "hat",
  "cup",
  "plate",
  "knife",
  "tree",
  "car",
  "dog",
  "cat",
] as const;

const COLOUR_WORDS: Record<string, string> = {
  black: "#1a1a1a",
  white: "#f5f5f5",
  red: "#dc2626",
  blue: "#2563eb",
  green: "#16a34a",
  yellow: "#eab308",
  brown: "#92400e",
  orange: "#ea580c",
  purple: "#9333ea",
  pink: "#ec4899",
  grey: "#6b7280",
  gray: "#6b7280",
};

function norm(text: string): string {
  return text
    .toLowerCase()
    // normalize ALL apostrophe variants (curly ' ' , prime ′, backtick, acute) → ASCII '
    .replace(/[‘’ʼ′`´]/g, "'")
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toSprite(noun: string): SpriteId | null {
  const n = norm(noun);
  if (SPRITE_REGISTRY.has(n)) return n as SpriteId;
  if (n === "mr brown" || (n.includes("brown") && n.includes("mr"))) return "man";
  if (n === "mrs brown" || n.includes("anna")) return "woman";
  return null;
}

function findNouns(text: string): string[] {
  const n = norm(text);
  const found: string[] = [];
  for (const word of LESSON_NOUNS) {
    const re = new RegExp(`\\b${word}\\b`, "i");
    if (re.test(n)) found.push(word);
  }
  return found;
}

/** Map a proper-name person (Mr/Mrs/Anna/Jack Brown) on the answer side → person sprite.
 * Takes the LAST name in the answer — in "isn't Anna; it's Mr" the correction is always last,
 * so this is robust even if the apostrophe in "it's" is some odd unicode variant. */
function personFromName(normAnswer: string): SpriteId | "" {
  const matches = [...normAnswer.matchAll(/\b(jack|anna|mrs|miss|mr)\b/g)];
  if (!matches.length) return "";
  const k = matches[matches.length - 1]![1]!;
  if (k === "jack") return "boy";
  if (k === "anna" || k === "mrs" || k === "miss") return "woman";
  if (k === "mr") return "man";
  return "";
}

/** Primary noun the learner should say — from answer side; empty when none found */
function focusFromAnswer(question: string, answer: string): string {
  const a = norm(answer);

  const person = personFromName(a);
  if (person) return person;

  const itsMatches = [...a.matchAll(/\bit'?s a[n]?\s+([a-z]+)/gi)];
  if (itsMatches.length > 0) {
    return itsMatches[itsMatches.length - 1]![1]!;
  }

  const yesIts = a.match(/yes,?\s+it'?s a[n]?\s+([a-z]+)/i);
  if (yesIts) return yesIts[1]!;

  const possessive = a.match(/\bthe\s+([a-z]+)'s\s+(on|under|in|short|long)/i);
  if (possessive) return possessive[1]!;

  const thisIs = a.match(/\bthis\s+([a-z]+)'s/i);
  if (thisIs) return thisIs[1]!;

  const qNouns = findNouns(question);
  if (qNouns.length > 0) return qNouns[0]!;

  const aNouns = findNouns(answer);
  if (aNouns.length > 0) return aNouns[0]!;

  return "";
}

/** People enumerated in one answer ("It's a man. It's a woman...") → roster */
function rosterFromAnswer(answer: string): SpriteId[] {
  const a = norm(answer);
  const seen = new Set<string>();
  const out: SpriteId[] = [];
  for (const m of a.matchAll(/it'?s a[n]?\s+(man|woman|boy|girl)\b/gi)) {
    const p = m[1]!;
    if (!seen.has(p)) {
      seen.add(p);
      out.push(p as SpriteId);
    }
  }
  return out;
}

const PLACE_NOUNS = ["city", "town", "village"] as const;

/** Detect place comparison (city/town/village) → outdoor contrast card */
function placeContrast(
  question: string,
  answer: string
): { wrong: SpriteId | null; right: SpriteId } | null {
  const na = norm(answer);
  const wrong = na.match(/isn'?t a[n]?\s+(city|town|village)/)?.[1] ?? null;
  let right = na.match(/it'?s a[n]?\s+(city|town|village)/)?.[1] ?? null;
  if (!right) {
    // single-image place drill ("A city's large", "Is a city large or small?")
    const text = norm(`${question} ${answer}`);
    right = PLACE_NOUNS.find((p) => new RegExp(`\\b${p}\\b`).test(text)) ?? null;
  }
  if (!right) return null;
  return {
    wrong: wrong && wrong !== right ? (wrong as SpriteId) : null,
    right: right as SpriteId,
  };
}

function colourFromAnswer(answer: string): string | null {
  const n = norm(answer);
  for (const [word, hex] of Object.entries(COLOUR_WORDS)) {
    if (new RegExp(`\\b${word}\\b`, "i").test(n)) return hex;
  }
  return null;
}

function isNegativeAnswer(answer: string): boolean {
  return /^no\b/i.test(answer.trim()) || /\bisn'?t\b/i.test(answer);
}

function wrongNounFromQuestion(question: string): string | null {
  const m = question.match(/is this (a|the)\s+([a-z]+)/i);
  return m ? m[2]! : null;
}

function spatialFromQa(
  question: string,
  answer: string
): VisualState["spatial"] | null {
  const text = norm(`${question} ${answer}`);
  const entityMatch =
    text.match(/\bthe\s+([a-z]+)'s\s+(on|under|in)\b/) ??
    text.match(/\b([a-z]+)'s\s+(on|under|in)\s+the\s+([a-z]+)/);
  if (entityMatch) {
    const entity = entityMatch[1]!;
    const relation = entityMatch[2] as "on" | "under" | "in";
    const targetMatch = text.match(
      new RegExp(`${relation}\\s+(?:the\\s+)?([a-z]+)`)
    );
    const target = targetMatch?.[1] ?? "book";
    return { relation, entity, target };
  }

  if (/\bwhere'?s\b/i.test(question)) {
    const entity = findNouns(question)[0] ?? "";
    if (!entity) return null;
    if (/\bon the\b/i.test(answer)) {
      const target = findNouns(answer).find((n) => n !== entity) ?? "book";
      return { relation: "on", entity, target };
    }
    if (/\bunder the\b/i.test(answer)) {
      const target = findNouns(answer).find((n) => n !== entity) ?? "book";
      return { relation: "under", entity, target };
    }
    if (/\bin the\b/i.test(answer)) {
      const target = findNouns(answer).find((n) => n !== entity) ?? "box";
      return { relation: "in", entity, target };
    }
  }

  if (/\bin the book\b/i.test(question) || /\bin the book\b/i.test(answer)) {
    return { relation: "in", entity: "pen", target: "book" };
  }

  return null;
}

function defaultSlot(sprite: SpriteId, spatial: VisualState["spatial"]): SlotId {
  if (spatial?.entity === sprite) {
    if (spatial.relation === "on") return "on_book";
    if (spatial.relation === "under") return "under_book";
    if (spatial.relation === "in") return "in_box";
  }
  switch (sprite) {
    case "pen":
    case "pencil":
      return "table_left";
    case "book":
      return "table_center";
    case "box":
      return "table_right";
    case "clock":
    case "light":
      return "wall_right";
    case "window":
      return "wall_left";
    case "man":
    case "woman":
    case "boy":
    case "girl":
      return "room_center";
    case "chair":
      return "floor";
    default:
      return "table_center";
  }
}

function buildBaseObjects(): SceneObject[] {
  return [
    { id: "book", sprite: "book", slot: "table_center" },
    { id: "pen", sprite: "pen", slot: "table_left" },
    { id: "pencil", sprite: "pencil", slot: "table_right" },
    { id: "box", sprite: "box", slot: "in_box" },
    { id: "clock", sprite: "clock", slot: "wall_right" },
  ];
}

/** Only show props relevant to this Q&A — less clutter, clearer focus */
function pruneObjects(
  objects: SceneObject[],
  question: string,
  answer: string,
  focus: string
): SceneObject[] {
  const text = norm(`${question} ${answer}`);
  const mentioned = new Set(findNouns(text));
  mentioned.add(focus);
  if (mentioned.has("book") || mentioned.has("pen") || mentioned.has("pencil")) {
    mentioned.add("book");
  }

  const always = new Set(["book"]);
  const kept = objects.filter(
    (o) =>
      o.highlight ||
      always.has(o.sprite) ||
      mentioned.has(o.sprite) ||
      (focus === "pen" && o.sprite === "pencil") ||
      (focus === "pencil" && o.sprite === "pen")
  );

  return kept.length >= 2 ? kept : objects.filter((o) => ["book", "pen", "pencil"].includes(o.sprite));
}

function pickAnimation(
  question: string,
  answer: string,
  spatial: VisualState["spatial"],
  negative: boolean,
  qType: ReturnType<typeof detectQuestionType>
): AnimationPreset {
  if (isConceptQuestionType(qType)) return "none";
  if (spatial) {
    if (spatial.relation === "on") return "spatial_on";
    if (spatial.relation === "under") return "spatial_under";
    if (spatial.relation === "in") return "spatial_in";
  }
  if (/\bshort\b|\blong\b|\blarge\b|\bsmall\b/i.test(`${question} ${answer}`)) {
    return "size_contrast";
  }
  if (negative) return "shake_no";
  if (/what'?s this|what is this|what colour/i.test(question)) {
    return "pulse_highlight";
  }
  if (/is this (a|the)/i.test(question)) return "pulse_highlight";
  if (/where'?s/i.test(question)) return "point_arrow";
  return "pulse_highlight";
}

function buildConceptState(
  q: string,
  a: string,
  sceneTemplate: ReturnType<typeof resolveSceneTemplate>
): VisualState {
  const focusRaw = focusFromAnswer(q, a);
  const focusSprite = focusRaw ? (toSprite(focusRaw) ?? focusRaw) : "";
  return {
    template: "concept_card",
    templateId: sceneTemplate.id,
    artPack: sceneTemplate.artPack,
    focus: focusSprite,
    objects: [],
    animation: "none",
  };
}

/**
 * Rule-based visual state from Q&A — used client-side and by batch script.
 */
export function inferVisualState(question: string, answer: string): VisualState {
  const q = question.trim();
  const a = answer.trim();

  if (!q) {
    return {
      template: "concept_card",
      focus: "",
      objects: [],
      animation: "none",
    };
  }

  const qType = detectQuestionType(q, a);
  const sceneTemplate = resolveSceneTemplate(q, a);

  // Multiple people in one answer → side-by-side roster card
  const roster = rosterFromAnswer(a);
  if (roster.length >= 2) {
    return {
      template: "roster_card",
      templateId: "people_roster",
      artPack: sceneTemplate.artPack,
      focus: roster[0]!,
      objects: [],
      animation: "none",
      roster,
    };
  }

  // Place comparison (city/town/village) → outdoor contrast card, not classroom
  const contrast = placeContrast(q, a);
  if (contrast) {
    return {
      template: "contrast_card",
      templateId: "place_contrast",
      artPack: sceneTemplate.artPack,
      focus: contrast.right,
      objects: [],
      animation: "none",
      contrast,
    };
  }

  if (isConceptQuestionType(qType)) {
    return buildConceptState(q, a, sceneTemplate);
  }

  const focusRaw = focusFromAnswer(q, a);
  let focusSprite = focusRaw ? toSprite(focusRaw) : null;

  // Colour + deictic "this" → table prop focus (A1 room, not blind pen fallback)
  if (qType === "colour" && !focusSprite) {
    const qNoun = findNouns(q)[0];
    focusSprite = qNoun ? toSprite(qNoun) : "pen";
  }

  // No noun or no drawable sprite → concept_card (no pen pulse fallback)
  if (!focusSprite) {
    return buildConceptState(q, a, sceneTemplate);
  }

  const focus = focusSprite;
  const spatial = spatialFromQa(q, a);
  const negative = isNegativeAnswer(a);
  const wrong = wrongNounFromQuestion(q);
  const animation = pickAnimation(q, a, spatial, negative, qType);
  const colourSwatch = qType === "colour" ? colourFromAnswer(a) : undefined;

  // Only blanket-dim sibling props when the focus is itself a table prop —
  // person / picture / place drills shouldn't grey-out (and ✗) the unrelated book.
  const TABLE_PROPS = new Set(["pen", "pencil", "book", "box", "clock", "table"]);
  const dimSiblings = negative && TABLE_PROPS.has(focus);

  const objects = buildBaseObjects();

  for (const obj of objects) {
    if (obj.sprite === focus) {
      obj.highlight = true;
      obj.slot = defaultSlot(obj.sprite, spatial);
    } else if (wrong && obj.sprite === toSprite(wrong) && negative) {
      obj.dimmed = true;
      obj.highlight = false;
    } else if (spatial && obj.sprite === toSprite(spatial.entity)) {
      obj.highlight = true;
      obj.slot = defaultSlot(obj.sprite, spatial);
    } else {
      obj.dimmed = dimSiblings && obj.sprite !== focus;
    }
  }

  const peopleSprites = new Set(["man", "woman", "boy", "girl"]);
  if (peopleSprites.has(focus)) {
    const personId = focus;
    if (!objects.some((o) => o.sprite === personId)) {
      objects.push({
        id: personId,
        sprite: personId as SpriteId,
        slot: "room_center",
        highlight: true,
      });
    }
  }

  // Picture is wall-mounted — point to it rather than table on/under/in motion
  let finalAnimation = animation;
  let finalSpatial = spatial;
  if (focus === "picture") {
    if (!objects.some((o) => o.sprite === "picture")) {
      objects.push({ id: "picture", sprite: "picture", slot: "wall_center", highlight: true });
    }
    finalAnimation = "point_arrow";
    finalSpatial = null;
  }

  return {
    template: "room_basic",
    templateId: sceneTemplate.id,
    artPack: sceneTemplate.artPack,
    focus,
    objects: pruneObjects(objects, q, a, focus),
    pointer: {
      target: finalSpatial?.entity ?? focus,
      style: "arrow",
    },
    animation: finalAnimation,
    spatial: finalSpatial,
    colourSwatch: colourSwatch ?? undefined,
  };
}

export function parseVisualStateJson(raw: unknown): VisualState | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return inferVisualStateFromStored(JSON.parse(raw));
    } catch {
      return null;
    }
  }
  return inferVisualStateFromStored(raw);
}

function inferVisualStateFromStored(raw: unknown): VisualState | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as VisualState;
  if (o.template !== "room_basic" && o.template !== "concept_card") return null;
  if (!Array.isArray(o.objects)) return null;
  return o;
}

/** Narrow reference for local STT scoring on identification drills */
export function scoringReference(
  question: string,
  answer: string,
  visual?: VisualState | null
): string {
  if (!visual?.focus || visual.animation === "none") return answer;
  const idPatterns =
    /what'?s this|what is this|is this (a|the)|what colour/i.test(question);
  if (!idPatterns) return answer;
  const sprite = visual.focus;
  if (/^yes/i.test(answer.trim())) {
    return `Yes, it's a ${sprite}.`;
  }
  if (/^no/i.test(answer.trim()) && /it'?s a/i.test(answer)) {
    return answer;
  }
  return `It's a ${sprite}.`;
}
