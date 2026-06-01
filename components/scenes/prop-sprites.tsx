/** TalkFlow 精美道具 — Lesson 1 专用，更精致的 SVG 绘制 */

type Props = { dimmed?: boolean };

function SoftShadow({ wide = false, color = "#000" }: { wide?: boolean; color?: string }) {
  return (
    <ellipse
      cx="0"
      cy="10"
      rx={wide ? 36 : 28}
      ry="5"
      fill={color}
      opacity="0.18"
    />
  );
}

export function BookSprite({ dimmed }: Props) {
  const o = dimmed ? 0.35 : 1;
  return (
    <g opacity={o}>
      <SoftShadow wide />
      {/* 书脊 */}
      <rect x="-38" y="-8" width="76" height="18" rx="3" fill="#7C2D12" />
      {/* 书页侧边 */}
      <rect x="-36" y="-10" width="72" height="16" rx="2" fill="#FEF3C7" />
      <g opacity="0.3">
        <line x1="-32" y1="-8" x2="-32" y2="4" stroke="#D4A574" strokeWidth="0.5" />
        <line x1="-28" y1="-8" x2="-28" y2="4" stroke="#D4A574" strokeWidth="0.5" />
        <line x1="-24" y1="-8" x2="-24" y2="4" stroke="#D4A574" strokeWidth="0.5" />
      </g>
      {/* 封面 */}
      <rect x="-34" y="-8" width="68" height="14" rx="2" fill="#E11D48" />
      {/* 封面装饰 */}
      <rect x="-34" y="-8" width="10" height="14" rx="2" fill="#9F1239" />
      {/* 书名区域 */}
      <rect x="-16" y="-5" width="32" height="4" rx="2" fill="#FDA4AF" opacity="0.8" />
      <rect x="-10" y="1" width="20" height="2" rx="1" fill="#FDA4AF" opacity="0.5" />
      {/* 高光 */}
      <rect x="-32" y="-7" width="62" height="3" rx="1" fill="#fff" opacity="0.15" />
    </g>
  );
}

export function PenSprite({ dimmed }: Props) {
  const o = dimmed ? 0.35 : 1;
  return (
    <g opacity={o}>
      <SoftShadow />
      {/* 笔身渐变 */}
      <defs>
        <linearGradient id="penBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      {/* 笔身 */}
      <rect x="-30" y="-6" width="48" height="12" rx="6" fill="url(#penBodyGrad)" />
      {/* 笔身高光 */}
      <rect x="-28" y="-5" width="44" height="3" rx="1.5" fill="#60A5FA" opacity="0.5" />
      {/* 握笔槽 */}
      <rect x="-6" y="-5" width="4" height="10" rx="2" fill="#1E40AF" opacity="0.4" />
      <rect x="2" y="-5" width="4" height="10" rx="2" fill="#1E40AF" opacity="0.4" />
      {/* 笔夹 */}
      <path d="M -26 -6 L -20 -6 L -18 -14 L -24 -14 Z" fill="#2563EB" stroke="#1D4ED8" strokeWidth="0.8" />
      <rect x="-24" y="-13" width="4" height="2" rx="1" fill="#60A5FA" />
      {/* 笔尖 */}
      <polygon points="18,0 28,-5 28,5" fill="#374151" />
      <polygon points="18,0 26,-3 26,3" fill="#6B7280" />
      <circle cx="26" cy="0" r="1" fill="#1F2937" />
      {/* 按钮 */}
      <rect x="-32" y="-4" width="6" height="8" rx="3" fill="#60A5FA" />
      <ellipse cx="-29" cy="-4" rx="2" ry="1.5" fill="#93C5FD" />
    </g>
  );
}

export function PencilSprite({ dimmed }: Props) {
  const o = dimmed ? 0.35 : 1;
  return (
    <g opacity={o}>
      <SoftShadow />
      {/* 橡皮 */}
      <rect x="-30" y="-5" width="10" height="10" rx="2" fill="#F472B6" />
      <rect x="-28" y="-5" width="3" height="10" fill="#EC4899" opacity="0.5" />
      {/* 金属圈 */}
      <rect x="-20" y="-5" width="8" height="10" rx="1" fill="#D4D4D8" />
      <rect x="-19" y="-4" width="6" height="2" rx="1" fill="#A1A1AA" opacity="0.5" />
      <rect x="-19" y="2" width="6" height="2" rx="1" fill="#A1A1AA" opacity="0.5" />
      {/* 铅笔身体 */}
      <rect x="-12" y="-5" width="36" height="10" rx="2" fill="#FBBF24" />
      {/* 六边形痕迹 */}
      <line x1="-8" y1="-5" x2="-8" y2="5" stroke="#F59E0B" strokeWidth="0.8" opacity="0.4" />
      <line x1="0" y1="-5" x2="0" y2="5" stroke="#F59E0B" strokeWidth="0.8" opacity="0.4" />
      <line x1="8" y1="-5" x2="8" y2="5" stroke="#F59E0B" strokeWidth="0.8" opacity="0.4" />
      <line x1="16" y1="-5" x2="16" y2="5" stroke="#F59E0B" strokeWidth="0.8" opacity="0.4" />
      {/* 高光 */}
      <rect x="-10" y="-4" width="32" height="2" rx="1" fill="#FDE68A" opacity="0.6" />
      {/* 削尖部分 */}
      <polygon points="24,0 34,-5 34,5" fill="#FDE68A" />
      <polygon points="24,0 32,-3 32,3" fill="#374151" />
      <circle cx="32" cy="0" r="1" fill="#1F2937" />
    </g>
  );
}

export function BoxSprite({ dimmed }: Props) {
  const o = dimmed ? 0.32 : 1;
  return (
    <g opacity={o} transform="translate(0,-16)">
      <ellipse cx="0" cy="18" rx="22" ry="5" fill="#000" opacity="0.15" />
      {/* 盒子正面 */}
      <rect x="-20" y="-10" width="40" height="30" rx="4" fill="#D97706" />
      {/* 盒子侧面高光 */}
      <rect x="-20" y="-10" width="6" height="30" rx="2" fill="#F59E0B" opacity="0.4" />
      {/* 盒盖 */}
      <path d="M -22 -10 L 0 -22 L 22 -10 Z" fill="#F59E0B" />
      <path d="M -20 -10 L 0 -18 L 20 -10" fill="none" stroke="#B45309" strokeWidth="1.5" />
      {/* 胶带 */}
      <rect x="-5" y="-20" width="10" height="14" rx="1" fill="#FDE68A" opacity="0.7" />
      {/* 标签 */}
      <rect x="-10" y="2" width="20" height="10" rx="2" fill="#FEF3C7" />
      <line x1="-6" y1="5" x2="6" y2="5" stroke="#D97706" strokeWidth="1" opacity="0.5" />
      <line x1="-4" y1="8" x2="4" y2="8" stroke="#D97706" strokeWidth="1" opacity="0.3" />
    </g>
  );
}

export function ClockSprite({ dimmed }: Props) {
  const o = dimmed ? 0.32 : 1;
  return (
    <g opacity={o}>
      {/* 墙面阴影 */}
      <ellipse cx="3" cy="5" rx="20" ry="4" fill="#000" opacity="0.1" />
      {/* 外框 */}
      <circle cx="0" cy="0" r="22" fill="#FEFCE8" stroke="#78716C" strokeWidth="3" />
      {/* 内框 */}
      <circle cx="0" cy="0" r="18" fill="#FFFBEB" stroke="#E5E7EB" strokeWidth="1.5" />
      {/* 刻度 */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
        <line
          key={deg}
          x1="0"
          y1={deg % 90 === 0 ? "-14" : "-15"}
          x2="0"
          y2={deg % 90 === 0 ? "-17" : "-16"}
          stroke={deg % 90 === 0 ? "#44403C" : "#A8A29E"}
          strokeWidth={deg % 90 === 0 ? 2 : 1}
          transform={`rotate(${deg})`}
        />
      ))}
      {/* 中心轴 */}
      <circle cx="0" cy="0" r="3" fill="#44403C" />
      <circle cx="0" cy="0" r="1.5" fill="#78716C" />
      {/* 时针 */}
      <line x1="0" y1="2" x2="0" y2="-10" stroke="#44403C" strokeWidth="2.5" strokeLinecap="round" />
      {/* 分针 */}
      <line x1="0" y1="2" x2="7" y2="3" stroke="#78716C" strokeWidth="2" strokeLinecap="round" />
      {/* 秒针 */}
      <line x1="0" y1="4" x2="-4" y2="8" stroke="#EF4444" strokeWidth="1" strokeLinecap="round" />
    </g>
  );
}

export function PersonSprite({ sprite, dimmed }: Props & { sprite: string }) {
  const o = dimmed ? 0.32 : 1;
  const isFemale = sprite === "woman" || sprite === "girl";
  const isChild = sprite === "boy" || sprite === "girl";
  const scale = isChild ? 0.8 : 1;
  const shirt = isFemale ? "#EC4899" : "#6366F1";
  const shirtLight = isFemale ? "#F472B6" : "#818CF8";
  const hair = isFemale ? "#78350F" : "#1C1917";
  const skin = "#FCD34D";

  return (
    <g opacity={o} transform={`scale(${scale}) translate(0,-34)`}>
      <ellipse cx="0" cy="42" rx="16" ry="5" fill="#000" opacity="0.12" />
      {/* 腿 */}
      <rect x="-9" y="26" width="8" height="16" rx="4" fill="#374151" />
      <rect x="1" y="26" width="8" height="16" rx="4" fill="#374151" />
      {/* 鞋 */}
      <ellipse cx="-5" cy="41" rx="5" ry="3" fill="#1F2937" />
      <ellipse cx="5" cy="41" rx="5" ry="3" fill="#1F2937" />
      {/* 身体 */}
      <rect x="-16" y="6" width="32" height="26" rx="10" fill={shirt} />
      {/* 身体高光 */}
      <rect x="-14" y="8" width="10" height="22" rx="5" fill={shirtLight} opacity="0.3" />
      {/* 手臂 */}
      <rect x="-22" y="10" width="10" height="18" rx="5" fill={shirt} />
      <rect x="12" y="10" width="10" height="18" rx="5" fill={shirt} />
      {/* 手 */}
      <circle cx="-17" cy="28" r="5" fill={skin} />
      <circle cx="17" cy="28" r="5" fill={skin} />
      {/* 脖子 */}
      <rect x="-5" y="0" width="10" height="10" rx="3" fill={skin} />
      {/* 头 */}
      <circle cx="0" cy="-4" r="14" fill={skin} />
      {/* 头发 */}
      {isFemale ? (
        <>
          <path
            d="M -14 -8 Q -16 4 -10 10 Q 0 14 10 10 Q 16 4 14 -8 Q 10 -18 0 -18 Q -10 -18 -14 -8"
            fill={hair}
          />
          {/* 刘海 */}
          <path d="M -10 -12 Q -6 -6 0 -10 Q 6 -6 10 -12" fill={hair} />
        </>
      ) : (
        <path d="M -14 -6 Q -12 -18 0 -18 Q 12 -18 14 -6 L 14 -2 Q 0 -10 -14 -2 Z" fill={hair} />
      )}
      {/* 眼睛 */}
      <ellipse cx="-5" cy="-4" rx="2" ry="2.5" fill="#1C1917" />
      <ellipse cx="5" cy="-4" rx="2" ry="2.5" fill="#1C1917" />
      <circle cx="-4" cy="-5" r="0.8" fill="#fff" />
      <circle cx="6" cy="-5" r="0.8" fill="#fff" />
      {/* 腮红 */}
      <ellipse cx="-8" cy="0" rx="3" ry="2" fill="#FECACA" opacity="0.5" />
      <ellipse cx="8" cy="0" rx="3" ry="2" fill="#FECACA" opacity="0.5" />
      {/* 嘴巴 */}
      <path d="M -4 4 Q 0 8 4 4" fill="none" stroke="#1C1917" strokeWidth="1.2" strokeLinecap="round" />
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
