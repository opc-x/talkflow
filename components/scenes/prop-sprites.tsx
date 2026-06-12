/**
 * 桌面道具 SVG — 侧视/轻透视，对齐 scene-art-tokens（非方块占位）。
 */

import { SCENE_ART } from "@/components/scenes/scene-art-tokens";

type Props = { dimmed?: boolean };

const P = SCENE_ART.props;

function PropShadow({ w = 52, h = 5 }: { w?: number; h?: number }) {
  return <ellipse cx="0" cy={h} rx={w / 2} ry={h} fill="#000" opacity="0.12" />;
}

/** 横放钢笔 — 笔帽 + 笔杆 + 金属笔尖，一眼可认 */
export function PenSprite({ dimmed }: Props) {
  const o = dimmed ? 0.38 : 1;
  return (
    <g opacity={o}>
      <PropShadow w={56} />
      {/* 笔帽 */}
      <rect x="-34" y="-4" width="12" height="8" rx="4" fill={P.penCap} />
      <circle cx="-34" cy="0" r="4" fill="#3B82F6" />
      <rect x="-30" y="-5" width="3" height="10" rx="1" fill="#1D4ED8" opacity="0.5" />
      {/* 笔夹 */}
      <path
        d="M -28 -4 L -25 -4 L -24 -9 L -27 -9 Z"
        fill="#60A5FA"
        stroke="#2563EB"
        strokeWidth="0.4"
      />
      {/* 笔杆 */}
      <path
        d="M -22 -4.2 L 16 -4.2 Q 20 -4.2 22 -2.5 L 24 0 L 22 2.5 Q 20 4.2 16 4.2 L -22 4.2 Q -24 4.2 -26 2 L -27 0 L -26 -2 Q -24 -4.2 -22 -4.2 Z"
        fill={P.penBarrel}
      />
      <path
        d="M -18 -2.2 L 12 -2.2 L 12 -0.6 L -18 -0.6 Z"
        fill="#fff"
        opacity="0.18"
      />
      {/* 握纹 */}
      <line x1="-6" y1="-3.5" x2="-6" y2="3.5" stroke="#0F172A" strokeWidth="0.6" opacity="0.2" />
      <line x1="-2" y1="-3.5" x2="-2" y2="3.5" stroke="#0F172A" strokeWidth="0.6" opacity="0.2" />
      <line x1="2" y1="-3.5" x2="2" y2="3.5" stroke="#0F172A" strokeWidth="0.6" opacity="0.2" />
      {/* 金属箍 */}
      <rect x="14" y="-3.8" width="3" height="7.6" rx="0.5" fill={P.penNibMetal} />
      {/* 笔尖 */}
      <path d="M 17 0 L 28 -2.2 L 28 2.2 Z" fill={P.penNibMetal} />
      <path d="M 24 0 L 30 -1.2 L 30 1.2 Z" fill={P.penNib} />
      <path d="M 28 0 L 31 -0.8 L 31 0.8 Z" fill="#1C1917" />
    </g>
  );
}

/** 横放铅笔 — 橡皮 + 金属箍 + 六角杆 + 削尖 */
export function PencilSprite({ dimmed }: Props) {
  const o = dimmed ? 0.38 : 1;
  return (
    <g opacity={o}>
      <PropShadow w={54} />
      <rect x="-30" y="-3.5" width="8" height="7" rx="1.5" fill={P.pencilEraser} />
      <rect x="-28" y="-3.5" width="2" height="7" fill="#EC4899" opacity="0.35" />
      <rect x="-22" y="-3.5" width="5" height="7" rx="0.8" fill="#A8A29E" />
      <path
        d="M -17 -3.8 L 14 -3.8 L 14 3.8 L -17 3.8 Z"
        fill={P.pencilWood}
        stroke={P.pencilWoodDark}
        strokeWidth="0.5"
      />
      <line x1="-12" y1="-3.5" x2="-12" y2="3.5" stroke={P.pencilWoodDark} strokeWidth="0.35" opacity="0.4" />
      <line x1="-4" y1="-3.5" x2="-4" y2="3.5" stroke={P.pencilWoodDark} strokeWidth="0.35" opacity="0.4" />
      <line x1="4" y1="-3.5" x2="4" y2="3.5" stroke={P.pencilWoodDark} strokeWidth="0.35" opacity="0.4" />
      <path d="M 14 0 L 26 -3.2 L 26 3.2 Z" fill="#FDE68A" stroke={P.pencilWoodDark} strokeWidth="0.4" />
      <path d="M 22 0 L 28 -1.5 L 28 1.5 Z" fill={P.pencilGraphite} />
    </g>
  );
}

/** 合上的书 — 能看到封面 + 书脊 */
export function BookSprite({ dimmed }: Props) {
  const o = dimmed ? 0.38 : 1;
  return (
    <g opacity={o}>
      <PropShadow w={60} h={6} />
      <path
        d="M -30 6 L -30 -6 L 28 -6 L 28 6 Z"
        fill={P.bookSpine}
      />
      <path
        d="M -28 5 L -28 -5 L 30 -5 L 30 5 Z"
        fill={P.bookCover}
      />
      <path
        d="M -26 4 L -26 -4 L 28 -4 L 28 4 Z"
        fill={P.bookPage}
      />
      <line x1="-8" y1="-3" x2="18" y2="-3" stroke="#FECACA" strokeWidth="1" opacity="0.7" />
      <rect x="-30" y="-6" width="4" height="12" rx="1" fill={P.bookSpine} />
    </g>
  );
}

export function BoxSprite({ dimmed }: Props) {
  const o = dimmed ? 0.38 : 1;
  return (
    <g opacity={o} transform="translate(0,-12)">
      <ellipse cx="0" cy="12" rx="18" ry="4" fill="#000" opacity="0.1" />
      <path d="M -16 4 L 16 4 L 16 20 L -16 20 Z" fill="#D97706" stroke="#B45309" strokeWidth="0.8" />
      <path d="M -16 4 L 0 -8 L 16 4 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="0.6" />
      <rect x="-4" y="-10" width="8" height="8" rx="1" fill="#FDE68A" opacity="0.7" />
    </g>
  );
}

export function ClockSprite({ dimmed }: Props) {
  const o = dimmed ? 0.38 : 1;
  return (
    <g opacity={o}>
      <ellipse cx="2" cy="5" rx="17" ry="3" fill="#000" opacity="0.08" />
      <circle cx="0" cy="0" r="17" fill="#FFFBEB" stroke={SCENE_ART.stroke.soft} strokeWidth="2" />
      <circle cx="0" cy="0" r="14" fill="#FEFCE8" />
      {[0, 90, 180, 270].map((deg) => (
        <line
          key={deg}
          x1="0"
          y1="-11"
          x2="0"
          y2="-13.5"
          stroke={SCENE_ART.stroke.soft}
          strokeWidth="1.2"
          transform={`rotate(${deg})`}
        />
      ))}
      <circle cx="0" cy="0" r="1.8" fill="#44403C" />
      <line x1="0" y1="0" x2="0" y2="-9" stroke="#44403C" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="0" y1="0" x2="5" y2="2" stroke="#78716C" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  );
}

export function PersonSprite({ sprite, dimmed }: Props & { sprite: string }) {
  const o = dimmed ? 0.38 : 1;
  const isFemale = sprite === "woman" || sprite === "girl";
  const isChild = sprite === "boy" || sprite === "girl";
  const scale = isChild ? 0.82 : 1;
  const shirt = isFemale ? "#EC4899" : "#6366F1";
  const hair = isFemale ? "#78350F" : "#1C1917";

  return (
    <g opacity={o} transform={`scale(${scale}) translate(0,-32)`}>
      <ellipse cx="0" cy="38" rx="14" ry="4" fill="#000" opacity="0.1" />
      <rect x="-8" y="24" width="7" height="14" rx="3" fill="#374151" />
      <rect x="1" y="24" width="7" height="14" rx="3" fill="#374151" />
      <rect x="-14" y="8" width="28" height="22" rx="8" fill={shirt} />
      <rect x="-20" y="12" width="8" height="16" rx="4" fill={shirt} />
      <rect x="12" y="12" width="8" height="16" rx="4" fill={shirt} />
      <rect x="-4" y="2" width="8" height="8" rx="2" fill="#FBBF24" />
      <circle cx="0" cy="-2" r="12" fill="#FBBF24" />
      {isFemale ? (
        <path
          d="M -12 -6 Q -14 4 -8 8 Q 0 12 8 8 Q 14 4 12 -6 Q 8 -14 0 -14 Q -8 -14 -12 -6"
          fill={hair}
        />
      ) : (
        <path d="M -12 -4 Q -10 -14 0 -14 Q 10 -14 12 -4 L 12 -2 Q 0 -8 -12 -2 Z" fill={hair} />
      )}
      <circle cx="-4" cy="-2" r="1.5" fill="#1C1917" />
      <circle cx="4" cy="-2" r="1.5" fill="#1C1917" />
      <path d="M -3 3 Q 0 6 3 3" fill="none" stroke="#1C1917" strokeWidth="1" strokeLinecap="round" />
    </g>
  );
}

export function CitySprite({ dimmed }: Props) {
  const o = dimmed ? 0.4 : 1;
  return (
    <g opacity={o}>
      <ellipse cx="0" cy="32" rx="46" ry="5" fill="#000" opacity="0.12" />
      <rect x="-40" y="-12" width="16" height="44" rx="1.5" fill="#64748B" />
      <rect x="-22" y="-34" width="18" height="66" rx="1.5" fill="#475569" />
      <rect x="-2" y="-24" width="16" height="56" rx="1.5" fill="#64748B" />
      <rect x="16" y="-4" width="18" height="36" rx="1.5" fill="#475569" />
      {[
        [-36, -6], [-30, 4], [-18, -16], [-11, 4], [2, -6], [20, 12],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="3.5" height="4.5" rx="0.5" fill="#FCD34D" opacity="0.9" />
      ))}
    </g>
  );
}

export function TownSprite({ dimmed }: Props) {
  const o = dimmed ? 0.4 : 1;
  return (
    <g opacity={o}>
      <ellipse cx="0" cy="32" rx="42" ry="5" fill="#000" opacity="0.12" />
      <rect x="-34" y="2" width="22" height="30" rx="1.5" fill="#A8A29E" />
      <rect x="-12" y="-12" width="24" height="44" rx="1.5" fill="#78716C" />
      <path d="M -14 -12 L 0 -24 L 14 -12 Z" fill="#9A3412" />
      <rect x="14" y="6" width="22" height="26" rx="1.5" fill="#A8A29E" />
    </g>
  );
}

export function VillageSprite({ dimmed }: Props) {
  const o = dimmed ? 0.4 : 1;
  return (
    <g opacity={o}>
      <ellipse cx="0" cy="32" rx="40" ry="5" fill="#000" opacity="0.12" />
      <rect x="-32" y="14" width="5" height="18" rx="2" fill="#92400E" />
      <circle cx="-29.5" cy="8" r="13" fill="#4D7C0F" />
      <rect x="-8" y="8" width="30" height="24" rx="1.5" fill="#FEF3C7" stroke="#D6D3D1" strokeWidth="1" />
      <path d="M -11 8 L 7 -8 L 25 8 Z" fill="#B45309" />
      <rect x="2" y="18" width="9" height="14" rx="1" fill="#92400E" />
    </g>
  );
}

export function PictureSprite({ dimmed }: Props) {
  const o = dimmed ? 0.4 : 1;
  return (
    <g opacity={o}>
      <rect x="-18" y="-14" width="36" height="28" rx="2" fill="#F5E6C8" stroke="#B08968" strokeWidth="2" />
      <rect x="-13" y="-9" width="26" height="18" rx="1" fill="#BFDBFE" />
      <circle cx="6" cy="-3" r="3.5" fill="#FBBF24" />
      <path d="M -13 9 L -4 0 L 3 6 L 9 1 L 13 9 Z" fill="#86EFAC" />
    </g>
  );
}

/** 桌面高亮 — 对齐 RoomDesk 桌面区域 */
export function TableSprite({ dimmed }: Props) {
  const o = dimmed ? 0.4 : 1;
  return (
    <g opacity={o}>
      <ellipse cx="0" cy="8" rx="52" ry="6" fill="#000" opacity="0.1" />
      <rect x="-48" y="-6" width="96" height="14" rx="4" fill="#C4A574" stroke="#A68B5B" strokeWidth="1.2" />
      <rect x="-44" y="-4" width="88" height="4" rx="2" fill="#D4B896" opacity="0.55" />
    </g>
  );
}

/** 吊灯 — 对齐 room-template 顶灯 */
export function LightSprite({ dimmed }: Props) {
  const o = dimmed ? 0.4 : 1;
  return (
    <g opacity={o}>
      <ellipse cx="0" cy="18" rx="28" ry="10" fill="#FEF9C3" opacity="0.35" />
      <line x1="0" y1="-26" x2="0" y2="-6" stroke="#A8A29E" strokeWidth="1.2" />
      <ellipse cx="0" cy="0" rx="18" ry="7" fill="#FEF08A" stroke="#CA8A04" strokeWidth="0.8" />
    </g>
  );
}

/** 房间整体 — 半透明框表示「room」 */
export function RoomSprite({ dimmed }: Props) {
  const o = dimmed ? 0.35 : 0.55;
  return (
    <g opacity={o}>
      <rect x="-92" y="-72" width="184" height="128" rx="12" fill="none" stroke="#10B981" strokeWidth="2.5" strokeDasharray="8 6" />
      <text
        x="0"
        y="4"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#10B981"
        fontSize="14"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        ROOM
      </text>
    </g>
  );
}

export function PropSpriteDefs() {
  return (
    <defs>
      <linearGradient id="penBarrelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="50%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
      <filter id="propDrop" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.15" />
      </filter>
    </defs>
  );
}
