/** 教室背景 — 色板见 scene-art-tokens.ts */

import { SCENE_ART } from "@/components/scenes/scene-art-tokens";
import { RoomChair, RoomDesk } from "@/components/scenes/room-furniture";

const W = SCENE_ART.room;

export function RoomTemplate() {
  return (
    <g aria-hidden>
      <defs>
        <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={W.wallTop} />
          <stop offset="100%" stopColor={W.wallBottom} />
        </linearGradient>
        <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={W.floorTop} />
          <stop offset="100%" stopColor={W.floorBottom} />
        </linearGradient>
        <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FEF9C3" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#FEF9C3" stopOpacity="0" />
        </radialGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.08" />
        </filter>
      </defs>

      <rect x="0" y="0" width="400" height="208" fill="url(#wallGrad)" />
      <rect x="0" y="200" width="400" height="6" fill={W.baseboard} />
      <rect x="0" y="206" width="400" height="94" fill="url(#floorGrad)" />

      {/* window */}
      <g filter="url(#softShadow)">
        <rect x="30" y="46" width="72" height="84" rx="9" fill="#A8CFF5" stroke={W.woodShadow} strokeWidth="1.5" />
        <rect x="36" y="52" width="60" height="72" rx="5" fill="#DCEBFA" />
        <line x1="66" y1="46" x2="66" y2="130" stroke={W.woodShadow} strokeWidth="1.2" />
        <line x1="30" y1="88" x2="102" y2="88" stroke={W.woodShadow} strokeWidth="1.2" />
      </g>

      {/* picture */}
      <rect x="120" y="52" width="42" height="34" rx="6" fill="#F5E6C8" stroke={W.woodShadow} strokeWidth="1.2" />
      <rect x="126" y="58" width="30" height="22" rx="3" fill="#BAE6FD" />
      <circle cx="141" cy="65" r="4.5" fill="#FBBF24" />
      <path d="M 126 77 Q 141 68 156 77" fill="#86EFAC" />

      {/* lamp */}
      <line x1="200" y1="20" x2="200" y2="40" stroke="#A8A29E" strokeWidth="1.2" />
      <ellipse cx="200" cy="46" rx="20" ry="8" fill="#FEF08A" stroke="#CA8A04" strokeWidth="0.8" opacity="0.9" />
      <ellipse cx="200" cy="50" rx="65" ry="24" fill="url(#lampGlow)" />

      {/* door */}
      <rect x="310" y="94" width="54" height="110" rx="7" fill={W.woodMid} stroke={W.woodShadow} strokeWidth="1.2" />
      <rect x="316" y="100" width="42" height="98" rx="5" fill={W.woodLight} />
      <circle cx="350" cy="150" r="3.5" fill="#FCD34D" stroke="#D97706" strokeWidth="0.7" />

      <RoomDesk />
      <RoomChair />
    </g>
  );
}
