/** Storyset-inspired flat props — top-down table view, soft shadows */

type Props = { dimmed?: boolean };

function SoftShadow({ wide = false }: { wide?: boolean }) {
  return (
    <ellipse
      cx="0"
      cy="8"
      rx={wide ? 34 : 26}
      ry="4"
      fill="#000"
      opacity="0.14"
    />
  );
}

export function BookSprite({ dimmed }: Props) {
  const o = dimmed ? 0.4 : 1;
  return (
    <g opacity={o}>
      <SoftShadow wide />
      <rect x="-34" y="-6" width="68" height="14" rx="3" fill="#7C2D12" />
      <rect x="-32" y="-8" width="64" height="12" rx="2" fill="#FEF3C7" />
      <rect x="-30" y="-6" width="58" height="10" rx="2" fill="#E11D48" />
      <rect x="-30" y="-6" width="7" height="10" rx="1" fill="#9F1239" />
      <rect x="-14" y="-3" width="26" height="3" rx="1" fill="#FDA4AF" opacity="0.75" />
    </g>
  );
}

export function PenSprite({ dimmed }: Props) {
  const o = dimmed ? 0.4 : 1;
  return (
    <g opacity={o}>
      <SoftShadow />
      {/* barrel */}
      <rect x="-26" y="-5" width="40" height="10" rx="5" fill="url(#penGrad)" />
      {/* grip rings */}
      <rect x="-8" y="-4" width="3" height="8" rx="1" fill="#1E40AF" opacity="0.5" />
      <rect x="-2" y="-4" width="3" height="8" rx="1" fill="#1E40AF" opacity="0.5" />
      {/* clip */}
      <path
        d="M -22 -5 L -18 -5 L -16 -12 L -20 -12 Z"
        fill="#2563EB"
        stroke="#1D4ED8"
        strokeWidth="0.5"
      />
      {/* tip cone */}
      <polygon points="14,0 22,-5 22,5" fill="#1E293B" />
      <polygon points="14,0 20,-3 20,3" fill="#334155" />
      {/* click button */}
      <rect x="-28" y="-4" width="6" height="8" rx="3" fill="#3B82F6" />
      <circle cx="-25" cy="-5" r="2" fill="#60A5FA" />
    </g>
  );
}

export function PencilSprite({ dimmed }: Props) {
  const o = dimmed ? 0.4 : 1;
  return (
    <g opacity={o}>
      <SoftShadow />
      {/* eraser */}
      <rect x="-26" y="-4" width="8" height="8" rx="2" fill="#F472B6" />
      <rect x="-24" y="-4" width="2" height="8" fill="#EC4899" opacity="0.4" />
      {/* ferrule */}
      <rect x="-18" y="-4" width="6" height="8" rx="1" fill="#D4D4D8" />
      {/* body */}
      <rect x="-12" y="-4" width="30" height="8" rx="2" fill="#FBBF24" />
      <line x1="-10" y1="-4" x2="-10" y2="4" stroke="#F59E0B" strokeWidth="0.5" opacity="0.5" />
      <line x1="-4" y1="-4" x2="-4" y2="4" stroke="#F59E0B" strokeWidth="0.5" opacity="0.5" />
      <line x1="2" y1="-4" x2="2" y2="4" stroke="#F59E0B" strokeWidth="0.5" opacity="0.5" />
      {/* sharpened tip */}
      <polygon points="18,0 26,-4 26,4" fill="#FDE68A" />
      <polygon points="18,0 24,-2.5 24,2.5" fill="#374151" />
    </g>
  );
}

export function BoxSprite({ dimmed }: Props) {
  const o = dimmed ? 0.38 : 1;
  return (
    <g opacity={o} transform="translate(0,-14)">
      <ellipse cx="0" cy="14" rx="18" ry="4" fill="#000" opacity="0.1" />
      {/* front face */}
      <rect x="-16" y="-8" width="32" height="24" rx="3" fill="#D97706" />
      {/* top flap */}
      <path d="M -16 -8 L 0 -18 L 16 -8 Z" fill="#F59E0B" />
      <path d="M -16 -8 L 0 -14 L 16 -8" fill="none" stroke="#B45309" strokeWidth="1" />
      {/* tape */}
      <rect x="-4" y="-16" width="8" height="10" rx="1" fill="#FDE68A" opacity="0.6" />
      {/* label */}
      <rect x="-8" y="0" width="16" height="8" rx="1" fill="#FEF3C7" opacity="0.5" />
    </g>
  );
}

export function ClockSprite({ dimmed }: Props) {
  const o = dimmed ? 0.38 : 1;
  return (
    <g opacity={o}>
      {/* wall shadow */}
      <ellipse cx="2" cy="4" rx="18" ry="3" fill="#000" opacity="0.08" />
      {/* frame */}
      <circle cx="0" cy="0" r="18" fill="#FEFCE8" stroke="#78716C" strokeWidth="2.5" />
      <circle cx="0" cy="0" r="15" fill="#FFFBEB" stroke="#D6D3D1" strokeWidth="1" />
      {/* ticks */}
      {[0, 90, 180, 270].map((deg) => (
        <line
          key={deg}
          x1="0"
          y1="-12"
          x2="0"
          y2="-14"
          stroke="#78716C"
          strokeWidth="1.5"
          transform={`rotate(${deg})`}
        />
      ))}
      {/* hands */}
      <circle cx="0" cy="0" r="2" fill="#44403C" />
      <line x1="0" y1="0" x2="0" y2="-10" stroke="#44403C" strokeWidth="2" strokeLinecap="round" />
      <line x1="0" y1="0" x2="6" y2="2" stroke="#78716C" strokeWidth="1.5" strokeLinecap="round" />
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
      {/* legs */}
      <rect x="-8" y="24" width="7" height="14" rx="3" fill="#374151" />
      <rect x="1" y="24" width="7" height="14" rx="3" fill="#374151" />
      {/* body */}
      <rect x="-14" y="8" width="28" height="22" rx="8" fill={shirt} />
      {/* arms */}
      <rect x="-20" y="12" width="8" height="16" rx="4" fill={shirt} />
      <rect x="12" y="12" width="8" height="16" rx="4" fill={shirt} />
      {/* neck */}
      <rect x="-4" y="2" width="8" height="8" rx="2" fill="#FBBF24" />
      {/* head */}
      <circle cx="0" cy="-2" r="12" fill="#FBBF24" />
      {/* hair */}
      {isFemale ? (
        <path
          d="M -12 -6 Q -14 4 -8 8 Q 0 12 8 8 Q 14 4 12 -6 Q 8 -14 0 -14 Q -8 -14 -12 -6"
          fill={hair}
        />
      ) : (
        <path d="M -12 -4 Q -10 -14 0 -14 Q 10 -14 12 -4 L 12 -2 Q 0 -8 -12 -2 Z" fill={hair} />
      )}
      {/* face */}
      <circle cx="-4" cy="-2" r="1.5" fill="#1C1917" />
      <circle cx="4" cy="-2" r="1.5" fill="#1C1917" />
      <path d="M -3 3 Q 0 6 3 3" fill="none" stroke="#1C1917" strokeWidth="1" strokeLinecap="round" />
    </g>
  );
}

/** Place sprites are drawn centered on (0,0), baseline at y≈30, ~88 wide */
export function CitySprite({ dimmed }: Props) {
  const o = dimmed ? 0.4 : 1;
  return (
    <g opacity={o}>
      <ellipse cx="0" cy="32" rx="46" ry="5" fill="#000" opacity="0.12" />
      {/* skyscrapers */}
      <rect x="-40" y="-12" width="16" height="44" rx="1.5" fill="#64748B" />
      <rect x="-22" y="-34" width="18" height="66" rx="1.5" fill="#475569" />
      <rect x="-2" y="-24" width="16" height="56" rx="1.5" fill="#64748B" />
      <rect x="16" y="-4" width="18" height="36" rx="1.5" fill="#475569" />
      {/* roof caps */}
      <rect x="-15" y="-40" width="4" height="8" fill="#334155" />
      {/* lit windows */}
      {[
        [-36, -6], [-36, 4], [-36, 14], [-30, -6], [-30, 4], [-30, 14],
        [-18, -28], [-18, -16], [-18, -4], [-18, 8], [-11, -28], [-11, -16], [-11, -4], [-11, 8],
        [2, -18], [2, -6], [2, 6], [9, -18], [9, -6], [9, 6],
        [20, 2], [20, 12], [27, 2], [27, 12],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="3.5" height="4.5" rx="0.5" fill="#FCD34D" opacity="0.95" />
      ))}
    </g>
  );
}

export function TownSprite({ dimmed }: Props) {
  const o = dimmed ? 0.4 : 1;
  return (
    <g opacity={o}>
      <ellipse cx="0" cy="32" rx="42" ry="5" fill="#000" opacity="0.12" />
      {/* mid-rise houses */}
      <rect x="-34" y="2" width="22" height="30" rx="1.5" fill="#A8A29E" />
      <rect x="-12" y="-12" width="24" height="44" rx="1.5" fill="#78716C" />
      <rect x="14" y="6" width="22" height="26" rx="1.5" fill="#A8A29E" />
      {/* pitched roof on tallest */}
      <path d="M -14 -12 L 0 -24 L 14 -12 Z" fill="#9A3412" />
      {/* windows */}
      {[
        [-30, 8], [-22, 8], [-30, 18], [-22, 18],
        [-8, -4], [0, -4], [-8, 8], [0, 8], [-8, 20], [0, 20],
        [18, 12], [26, 12], [18, 22], [26, 22],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="4" height="5" rx="0.5" fill="#FDE68A" opacity="0.9" />
      ))}
    </g>
  );
}

export function VillageSprite({ dimmed }: Props) {
  const o = dimmed ? 0.4 : 1;
  return (
    <g opacity={o}>
      <ellipse cx="0" cy="32" rx="40" ry="5" fill="#000" opacity="0.12" />
      {/* tree */}
      <rect x="-32" y="14" width="5" height="18" rx="2" fill="#92400E" />
      <circle cx="-29.5" cy="8" r="13" fill="#4D7C0F" />
      <circle cx="-22" cy="12" r="9" fill="#65A30D" />
      {/* cottage */}
      <rect x="-8" y="8" width="30" height="24" rx="1.5" fill="#FEF3C7" stroke="#D6D3D1" strokeWidth="1" />
      <path d="M -11 8 L 7 -8 L 25 8 Z" fill="#B45309" />
      {/* chimney */}
      <rect x="14" y="-6" width="6" height="12" fill="#92400E" />
      {/* door + window */}
      <rect x="2" y="18" width="9" height="14" rx="1" fill="#92400E" />
      <rect x="-4" y="14" width="7" height="7" rx="1" fill="#FDE68A" />
      <rect x="13" y="14" width="7" height="7" rx="1" fill="#FDE68A" />
    </g>
  );
}

export function PictureSprite({ dimmed }: Props) {
  const o = dimmed ? 0.4 : 1;
  return (
    <g opacity={o}>
      <rect x="-18" y="-14" width="36" height="28" rx="2" fill="#FCD34D" stroke="#B45309" strokeWidth="2.5" />
      <rect x="-13" y="-9" width="26" height="18" rx="1" fill="#BFDBFE" />
      {/* little landscape inside */}
      <circle cx="6" cy="-3" r="3.5" fill="#FBBF24" />
      <path d="M -13 9 L -4 0 L 3 6 L 9 1 L 13 9 Z" fill="#86EFAC" />
    </g>
  );
}

export function FocusLabel({ label }: { label: string }) {
  const w = Math.min(72, Math.max(48, label.length * 7 + 24));
  return (
    <g transform="translate(0, -34)">
      <rect x={-w / 2} y="-10" width={w} height="18" rx="9" fill="#10B981" />
      <rect x={-w / 2} y="-10" width={w} height="18" rx="9" fill="url(#labelShine)" opacity="0.2" />
      <text
        x="0"
        y="1"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="8.5"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="0.4"
      >
        {label.toUpperCase()}
      </text>
    </g>
  );
}

/** Shared SVG defs — mount once in scene root */
export function PropSpriteDefs() {
  return (
    <defs>
      <linearGradient id="penGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="60%" stopColor="#1D4ED8" />
        <stop offset="100%" stopColor="#1E40AF" />
      </linearGradient>
      <linearGradient id="labelShine" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fff" />
        <stop offset="100%" stopColor="transparent" />
      </linearGradient>
    </defs>
  );
}
