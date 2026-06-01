/** Rafiki-style classroom — Storyset palette, 400×300 viewBox */

export function RoomTemplate() {
  return (
    <g aria-hidden>
      <defs>
        <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF9F3" />
          <stop offset="100%" stopColor="#F5EBE0" />
        </linearGradient>
        <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E8D4BC" />
          <stop offset="100%" stopColor="#C4A484" />
        </linearGradient>
        <linearGradient id="tableGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D4A574" />
          <stop offset="100%" stopColor="#A67C52" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
        </filter>
      </defs>

      <rect x="0" y="0" width="400" height="208" fill="url(#wallGrad)" />
      <rect x="0" y="200" width="400" height="8" fill="#E7D3C0" />
      <rect x="0" y="208" width="400" height="92" fill="url(#floorGrad)" />

      {/* window */}
      <g filter="url(#softShadow)">
        <rect x="28" y="42" width="72" height="88" rx="6" fill="#93C5FD" stroke="#6B5344" strokeWidth="2.5" />
        <rect x="34" y="48" width="60" height="76" rx="3" fill="#BFDBFE" />
        <line x1="64" y1="42" x2="64" y2="130" stroke="#6B5344" strokeWidth="2" />
        <line x1="28" y1="86" x2="100" y2="86" stroke="#6B5344" strokeWidth="2" />
      </g>
      <polygon points="36,208 108,208 128,268 16,268" fill="#FEF9C3" opacity="0.18" />

      {/* picture */}
      <rect x="118" y="50" width="44" height="36" rx="4" fill="#FDE68A" stroke="#A67C52" strokeWidth="2" />
      <rect x="124" y="56" width="32" height="24" rx="2" fill="#BAE6FD" />
      <circle cx="140" cy="64" r="5" fill="#FBBF24" />
      <path d="M 124 76 Q 140 66 156 76" fill="#86EFAC" />

      {/* lamp */}
      <line x1="200" y1="18" x2="200" y2="44" stroke="#A8A29E" strokeWidth="2" />
      <ellipse cx="200" cy="50" rx="26" ry="12" fill="#FEF08A" stroke="#EAB308" strokeWidth="1.5" />
      <ellipse cx="200" cy="118" rx="90" ry="42" fill="#FEF9C3" opacity="0.08" />

      {/* door */}
      <rect x="310" y="92" width="58" height="116" rx="5" fill="#B8956A" stroke="#78716C" strokeWidth="2" />
      <circle cx="354" cy="148" r="4.5" fill="#FCD34D" stroke="#D97706" strokeWidth="1" />

      {/* desk — focal surface for props */}
      <ellipse cx="200" cy="210" rx="108" ry="10" fill="#000" opacity="0.07" />
      <rect x="96" y="184" width="208" height="20" rx="6" fill="url(#tableGrad)" filter="url(#softShadow)" />
      <rect x="102" y="188" width="196" height="11" rx="4" fill="#E8C9A0" opacity="0.55" />
      {/* prop zone hint (subtle) */}
      <ellipse cx="200" cy="194" rx="88" ry="6" fill="#10B981" opacity="0.06" />
      <rect x="112" y="204" width="14" height="44" rx="4" fill="#8B6914" />
      <rect x="274" y="204" width="14" height="44" rx="4" fill="#8B6914" />

      {/* chair */}
      <ellipse cx="322" cy="256" rx="24" ry="5" fill="#000" opacity="0.08" />
      <rect x="300" y="218" width="9" height="40" rx="3" fill="#A67C52" />
      <rect x="336" y="218" width="9" height="40" rx="3" fill="#A67C52" />
      <rect x="296" y="210" width="48" height="9" rx="4" fill="#C4A484" />
      <rect x="304" y="198" width="32" height="18" rx="5" fill="#D4A574" />
    </g>
  );
}
