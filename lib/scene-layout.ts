import type { SlotId, SlotLayout } from "@/lib/visual-state";
import { SLOT_LAYOUT } from "@/lib/visual-state";

export const SCENE_VIEWBOX = { w: 400, h: 300 } as const;

/** Map slot anchor to % for HTML overlays aligned with the SVG viewBox */
export function slotToPercent(slot: SlotId): { left: string; top: string; scale: number } {
  const layout: SlotLayout = SLOT_LAYOUT[slot] ?? SLOT_LAYOUT.table_center;
  const scale = layout.scale ?? 1;
  return {
    left: `${(layout.x / SCENE_VIEWBOX.w) * 100}%`,
    top: `${(layout.y / SCENE_VIEWBOX.h) * 100}%`,
    scale,
  };
}
