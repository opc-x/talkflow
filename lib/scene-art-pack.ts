/** Swappable illustration bundles for QaScene */

export type ArtPackId = "talkflow_flat_v2" | "storyset_classroom" | "talkflow_desk_focus";

/** Sprites with Storyset SVG under public/scene-assets/storyset/props/ */
export const STORYSET_PROP_SPRITES = [
  "pen",
  "pencil",
  "book",
  "box",
  "clock",
  "light",
] as const;

export type StorysetPropSprite = (typeof STORYSET_PROP_SPRITES)[number];

const STORYSET_SET = new Set<string>(STORYSET_PROP_SPRITES);

/** Lesson 1 pilot — swap art pack without changing inferVisualState */
export function resolveLessonArtPack(
  bookNum?: number,
  lessonNum?: number,
): ArtPackId {
  if (bookNum === 1 && lessonNum === 1) return "talkflow_desk_focus";
  return "talkflow_flat_v2";
}

export function storysetPropPath(sprite: string): string | null {
  if (!STORYSET_SET.has(sprite)) return null;
  return `/scene-assets/storyset/props/${sprite}.svg`;
}

export const STORYSET_ROOM_SRC = "/scene-assets/storyset/room.svg";

export const STORYSET_ATTRIBUTION = {
  label: "Illustrations by Storyset",
  href: "https://storyset.com/",
} as const;
