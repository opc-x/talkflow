/** 课桌特写背景 — 轻透视 + 环境光，道具用 prop-sprites（见 scene-sprites） */

import { SCENE_ART } from "@/components/scenes/scene-art-tokens";

const W = SCENE_ART.room;
const S = SCENE_ART.stroke;

export function DeskFocusRoomTemplate() {
  return (
    <g aria-hidden>
      <defs>
        <linearGradient id="dfWall" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFCF8" />
          <stop offset="55%" stopColor={W.wallTop} />
          <stop offset="100%" stopColor={W.wallBottom} />
        </linearGradient>
        <linearGradient id="dfFloor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={W.floorTop} />
          <stop offset="100%" stopColor={W.floorBottom} />
        </linearGradient>
        <linearGradient id="dfDeskTop" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F0D4A8" />
          <stop offset="45%" stopColor={W.woodLight} />
          <stop offset="100%" stopColor={W.woodMid} />
        </linearGradient>
        <linearGradient id="dfDeskEdge" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={W.woodMid} />
          <stop offset="100%" stopColor={W.woodDark} />
        </linearGradient>
        <linearGradient id="dfWindowSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B8DCFA" />
          <stop offset="100%" stopColor="#DCEBFA" />
        </linearGradient>
        <radialGradient id="dfWindowGlow" cx="30%" cy="25%" r="70%">
          <stop offset="0%" stopColor="#FFF9E6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFF9E6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dfLampWarm" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0" />
        </radialGradient>
        <filter id="dfSoftShadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.1" />
        </filter>
      </defs>

      <rect x="0" y="0" width="400" height="202" fill="url(#dfWall)" />
      <rect x="0" y="198" width="400" height="5" fill={W.baseboard} />
      <rect x="0" y="203" width="400" height="97" fill="url(#dfFloor)" />

      {/* 窗光落在桌面 */}
      <ellipse cx="118" cy="228" rx="150" ry="72" fill="url(#dfWindowGlow)" opacity="0.85" />
      <ellipse cx="200" cy="210" rx="170" ry="90" fill="url(#dfLampWarm)" />

      {/* 窗户 */}
      <g filter="url(#dfSoftShadow)" transform="translate(32, 36)">
        <rect x="0" y="0" width="78" height="66" rx="9" fill={W.woodMid} stroke={S.furniture} strokeWidth="1.2" />
        <rect x="5" y="5" width="68" height="56" rx="6" fill="url(#dfWindowSky)" />
        <rect x="5" y="5" width="68" height="56" rx="6" fill="url(#dfWindowGlow)" opacity="0.6" />
        <line x1="39" y1="5" x2="39" y2="61" stroke={S.furniture} strokeWidth="1" opacity="0.45" />
        <line x1="5" y1="33" x2="73" y2="33" stroke={S.furniture} strokeWidth="1" opacity="0.45" />
        <rect x="12" y="12" width="18" height="14" rx="2" fill="#FFF7ED" opacity="0.35" />
      </g>

      {/* 挂画 */}
      <g filter="url(#dfSoftShadow)" transform="translate(292, 38)">
        <rect x="0" y="0" width="72" height="52" rx="5" fill="#8B6914" opacity="0.35" />
        <rect x="3" y="3" width="66" height="46" rx="4" fill="#F5E6C8" stroke={S.furniture} strokeWidth="1" />
        <rect x="9" y="9" width="54" height="34" rx="2" fill="#BAE6FD" />
        <circle cx="28" cy="20" r="7" fill="#FBBF24" />
        <path d="M 12 36 Q 36 24 60 36" fill="#86EFAC" />
      </g>

      {/* 吊灯 */}
      <line x1="200" y1="8" x2="200" y2="28" stroke="#A8A29E" strokeWidth="1.4" />
      <ellipse cx="200" cy="34" rx="22" ry="9" fill="#FEF08A" stroke="#CA8A04" strokeWidth="0.8" />
      <ellipse cx="200" cy="38" rx="8" ry="3" fill="#FDE047" opacity="0.5" />

      {/* 课桌 — 桌面 + 厚度 + 腿 */}
      <ellipse cx="200" cy="262" rx="158" ry="11" fill="#000" opacity="0.09" />
      <path
        d="M 18 178 L 382 178 L 368 268 L 32 268 Z"
        fill="url(#dfDeskEdge)"
        stroke={W.woodShadow}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M 28 168 L 372 168 L 360 252 L 40 252 Z"
        fill="url(#dfDeskTop)"
        stroke={W.woodShadow}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M 40 176 L 352 176 L 346 244 L 46 244 Z"
        fill="#fff"
        opacity="0.14"
      />
      <line x1="70" y1="188" x2="330" y2="188" stroke={W.woodDark} strokeWidth="0.6" opacity="0.12" />
      <line x1="90" y1="208" x2="310" y2="208" stroke={W.woodDark} strokeWidth="0.5" opacity="0.1" />
      <line x1="40" y1="176" x2="352" y2="176" stroke="#fff" strokeWidth="2.5" opacity="0.35" />
      <path d="M 52 252 L 62 252 L 58 288 L 48 288 Z" fill={W.woodDark} opacity="0.9" />
      <path d="M 338 252 L 348 252 L 352 288 L 342 288 Z" fill={W.woodShadow} opacity="0.9" />
    </g>
  );
}
