/**
 * QaScene 插画 token — 与 TalkFlow 品牌 (#10B981) 对齐的教室套件。
 * 所有 scene SVG 只从这里取色，避免「随手填 hex」。
 */
export const SCENE_ART = {
  brand: {
    primary: "#10B981",
    primaryDark: "#059669",
    primaryGlow: "rgb(16 185 129 / 0.35)",
  },
  room: {
    wallTop: "#FAF7F2",
    wallBottom: "#EDE4D6",
    floorTop: "#E5D0B8",
    floorBottom: "#C4A484",
    baseboard: "#D9C8B0",
    woodLight: "#E8C9A0",
    woodMid: "#C9A87A",
    woodDark: "#8B6914",
    woodShadow: "#6B5344",
  },
  props: {
    penBarrel: "#1E3A5F",
    penBarrelHi: "#334155",
    penCap: "#2563EB",
    penNib: "#C9A227",
    penNibMetal: "#94A3B8",
    pencilWood: "#F4D03F",
    pencilWoodDark: "#D97706",
    pencilEraser: "#F9A8D4",
    pencilGraphite: "#475569",
    bookCover: "#DC2626",
    bookSpine: "#991B1B",
    bookPage: "#FFFBEB",
  },
  stroke: {
    soft: "#78716C",
    furniture: "#6B5344",
  },
} as const;
