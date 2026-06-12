import type { ArtPackId } from "@/lib/scene-art-pack";
import { DESK_FOCUS_SLOT_LAYOUT } from "@/lib/desk-focus-layout";
import type { SlotId, SlotLayout } from "@/lib/visual-state";
import { SLOT_LAYOUT } from "@/lib/visual-state";

export const SCENE_VIEWBOX = { w: 400, h: 300 } as const;

export function getSlotLayout(artPack: ArtPackId | undefined, slot: SlotId): SlotLayout {
  if (artPack === "talkflow_desk_focus") {
    return DESK_FOCUS_SLOT_LAYOUT[slot] ?? DESK_FOCUS_SLOT_LAYOUT.table_center;
  }
  return SLOT_LAYOUT[slot] ?? SLOT_LAYOUT.table_center;
}

/** Map slot anchor to % for HTML overlays aligned with the SVG viewBox */
export function slotToPercent(
  slot: SlotId,
  artPack?: ArtPackId,
): { left: string; top: string; scale: number } {
  const layout = getSlotLayout(artPack, slot);
  const scale = layout.scale ?? 1;
  return {
    left: `${(layout.x / SCENE_VIEWBOX.w) * 100}%`,
    top: `${(layout.y / SCENE_VIEWBOX.h) * 100}%`,
    scale,
  };
}
