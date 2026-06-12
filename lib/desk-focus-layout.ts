import type { SlotId, SlotLayout } from "@/lib/visual-state";

/** Lesson 1 课桌特写 — 锚点对准桌面，scale 略大于教室景以突出道具 */
export const DESK_FOCUS_SLOT_LAYOUT: Record<SlotId, SlotLayout> = {
  table_center: { x: 200, y: 214, scale: 1.22 },
  on_book: { x: 200, y: 200, scale: 1.18 },
  under_book: { x: 200, y: 232, scale: 1.16 },
  in_box: { x: 286, y: 212, scale: 1.14 },
  table_left: { x: 118, y: 216, scale: 1.24 },
  table_right: { x: 282, y: 216, scale: 1.24 },
  wall_left: { x: 56, y: 58, scale: 1.08 },
  wall_right: { x: 344, y: 56, scale: 1.08 },
  wall_center: { x: 200, y: 74, scale: 1.12 },
  ceiling_light: { x: 200, y: 44, scale: 1.05 },
  floor: { x: 318, y: 250, scale: 1.05 },
  room_center: { x: 200, y: 166, scale: 1.1 },
  room_left: { x: 142, y: 168, scale: 1.1 },
  room_right: { x: 258, y: 168, scale: 1.1 },
};
