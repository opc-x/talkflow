/** Q&A-driven programmatic scene — types & layout registry */

export const SPRITE_IDS = [
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
  "man",
  "woman",
  "boy",
  "girl",
  "room",
  "city",
  "town",
  "village",
  "picture",
] as const;

export type SpriteId = (typeof SPRITE_IDS)[number];

export const SLOT_IDS = [
  "table_center",
  "on_book",
  "under_book",
  "in_box",
  "table_left",
  "table_right",
  "wall_left",
  "wall_right",
  "wall_center",
  "ceiling_light",
  "floor",
  "room_center",
  "room_left",
  "room_right",
] as const;

export type SizeVariant = "large" | "small" | "long" | "short";

export type SlotId = (typeof SLOT_IDS)[number];

export type AnimationPreset =
  | "pulse_highlight"
  | "point_arrow"
  | "spatial_on"
  | "spatial_under"
  | "spatial_in"
  | "size_contrast"
  | "shake_no"
  | "none";

export interface SceneObject {
  id: string;
  sprite: SpriteId;
  slot: SlotId;
  highlight?: boolean;
  dimmed?: boolean;
}

export interface VisualState {
  template: "room_basic" | "concept_card" | "contrast_card" | "roster_card";
  /** Registry entry from lib/scene-template-registry.ts */
  templateId?: string;
  artPack?: "talkflow_flat_v2" | "storyset_classroom" | "talkflow_desk_focus";
  focus: string;
  objects: SceneObject[];
  pointer?: { target: string; style: "finger" | "arrow" };
  animation: AnimationPreset;
  spatial?: {
    relation: "on" | "under" | "in";
    entity: string;
    target: string;
  } | null;
  /** Hex swatch for colour-identify drills */
  colourSwatch?: string;
  /** Outdoor wrong→right place comparison (city/town/village) */
  contrast?: {
    /** the rejected option, dimmed with ✗ — null = single-image, no comparison */
    wrong: SpriteId | null;
    /** the correct option, highlighted with ✓ */
    right: SpriteId;
  } | null;
  /** Multiple people enumerated in one answer → side-by-side roster */
  roster?: SpriteId[];
  /** Size drill — scale highlighted prop (large/small/long/short) */
  sizeVariant?: SizeVariant;
}

/** Pixel coords in 400×300 viewBox */
export interface SlotLayout {
  x: number;
  y: number;
  scale?: number;
}

/** Table top ~ y=192 in room viewBox; props sit on surface, not wall */
export const SLOT_LAYOUT: Record<SlotId, SlotLayout> = {
  table_center: { x: 200, y: 188, scale: 1 },
  on_book: { x: 200, y: 176, scale: 0.95 },
  under_book: { x: 200, y: 202, scale: 0.9 },
  in_box: { x: 268, y: 186, scale: 0.88 },
  table_left: { x: 128, y: 189, scale: 1.08 },
  table_right: { x: 272, y: 189, scale: 1.05 },
  wall_left: { x: 56, y: 78, scale: 1 },
  wall_right: { x: 342, y: 72, scale: 0.9 },
  wall_center: { x: 208, y: 104, scale: 1.2 },
  ceiling_light: { x: 200, y: 52, scale: 1.15 },
  floor: { x: 318, y: 238, scale: 1 },
  room_center: { x: 200, y: 156, scale: 1.05 },
  room_left: { x: 148, y: 158, scale: 1.08 },
  room_right: { x: 252, y: 158, scale: 1.08 },
};

export const SPRITE_REGISTRY = new Set<string>(SPRITE_IDS);

export function isValidVisualState(v: unknown): v is VisualState {
  if (!v || typeof v !== "object") return false;
  const o = v as VisualState;
  if (o.template !== "room_basic" && o.template !== "concept_card") return false;
  if (typeof o.focus !== "string") return false;
  if (o.template === "room_basic" && !o.focus) return false;
  if (!Array.isArray(o.objects)) return false;
  if (o.template === "concept_card" && o.objects.length === 0) return true;
  return o.objects.every(
    (obj) =>
      typeof obj.id === "string" &&
      SPRITE_REGISTRY.has(obj.sprite) &&
      SLOT_IDS.includes(obj.slot as SlotId)
  );
}
