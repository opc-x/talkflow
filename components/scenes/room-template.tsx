/** TalkFlow 精美教室场景 — Lesson 1 专用，400×300 viewBox */

export function RoomTemplate() {
  return (
    <g aria-hidden>
      <defs>
        {/* 墙面渐变 - 温暖米色 */}
        <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF9F0" />
          <stop offset="50%" stopColor="#FEF5E7" />
          <stop offset="100%" stopColor="#F5EBE0" />
        </linearGradient>
        
        {/* 地板渐变 - 木质纹理 */}
        <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E8D4BC" />
          <stop offset="40%" stopColor="#DFC9B3" />
          <stop offset="100%" stopColor="#C4A484" />
        </linearGradient>
        
        {/* 桌面渐变 - 抛光木质 */}
        <linearGradient id="tableGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E0B88A" />
          <stop offset="50%" stopColor="#D4A574" />
          <stop offset="100%" stopColor="#A67C52" />
        </linearGradient>
        
        {/* 桌面高光 */}
        <linearGradient id="tableShine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        
        {/* 窗外天空渐变 */}
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </linearGradient>
        
        {/* 阳光效果 */}
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FEF9C3" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FEF9C3" stopOpacity="0" />
        </radialGradient>
        
        {/* 柔和阴影 */}
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.15" />
        </filter>
        
        {/* 内发光 */}
        <filter id="innerGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        {/* 木纹图案 */}
        <pattern id="woodGrain" width="20" height="6" patternUnits="userSpaceOnUse">
          <rect width="20" height="6" fill="#C4A484" />
          <line x1="0" y1="2" x2="20" y2="2" stroke="#B8956A" strokeWidth="0.5" opacity="0.3" />
          <line x1="0" y1="4" x2="20" y2="5" stroke="#B8956A" strokeWidth="0.3" opacity="0.2" />
        </pattern>
      </defs>

      {/* === 背景层 === */}
      {/* 墙面 */}
      <rect x="0" y="0" width="400" height="210" fill="url(#wallGrad)" />
      
      {/* 墙裙装饰线 */}
      <rect x="0" y="200" width="400" height="10" fill="#E7D3C0" />
      <rect x="0" y="200" width="400" height="2" fill="#D6C3A8" />
      
      {/* 地板 */}
      <rect x="0" y="210" width="400" height="90" fill="url(#floorGrad)" />
      
      {/* 地板木纹线条 */}
      <g opacity="0.15">
        <line x1="0" y1="230" x2="400" y2="230" stroke="#8B7355" strokeWidth="1" />
        <line x1="0" y1="255" x2="400" y2="255" stroke="#8B7355" strokeWidth="1" />
        <line x1="0" y1="280" x2="400" y2="280" stroke="#8B7355" strokeWidth="1" />
      </g>

      {/* === 窗户 === */}
      <g filter="url(#softShadow)">
        {/* 窗框外圈 */}
        <rect x="24" y="36" width="80" height="100" rx="6" fill="#6B5344" />
        {/* 天空背景 */}
        <rect x="28" y="40" width="72" height="92" rx="4" fill="url(#skyGrad)" />
        {/* 云朵 */}
        <ellipse cx="50" cy="58" rx="14" ry="6" fill="#fff" opacity="0.9" />
        <ellipse cx="60" cy="56" rx="10" ry="5" fill="#fff" opacity="0.85" />
        <ellipse cx="82" cy="72" rx="12" ry="5" fill="#fff" opacity="0.8" />
        {/* 窗框内格栅 */}
        <line x1="64" y1="40" x2="64" y2="132" stroke="#6B5344" strokeWidth="4" />
        <line x1="28" y1="86" x2="100" y2="86" stroke="#6B5344" strokeWidth="4" />
        {/* 窗框高光 */}
        <rect x="30" y="42" width="32" height="2" rx="1" fill="#fff" opacity="0.4" />
        <rect x="68" y="42" width="28" height="2" rx="1" fill="#fff" opacity="0.3" />
      </g>
      
      {/* 窗户投射的阳光 */}
      <polygon points="28,210 100,210 140,280 -10,280" fill="url(#sunGlow)" />

      {/* === 墙上装饰画 === */}
      <g filter="url(#softShadow)" transform="translate(140, 44)">
        {/* 画框 */}
        <rect x="-2" y="-2" width="52" height="42" rx="3" fill="#8B6914" />
        <rect x="0" y="0" width="48" height="38" rx="2" fill="#FFF8E7" />
        {/* 画内容 - 小风景 */}
        <rect x="2" y="2" width="44" height="34" rx="1" fill="#BAE6FD" />
        {/* 太阳 */}
        <circle cx="36" cy="12" r="6" fill="#FBBF24" />
        {/* 山 */}
        <polygon points="2,36 18,18 34,36" fill="#86EFAC" />
        <polygon points="20,36 38,14 46,36" fill="#4ADE80" />
        {/* 画框内高光 */}
        <rect x="2" y="2" width="44" height="6" rx="1" fill="#fff" opacity="0.15" />
      </g>

      {/* === 吊灯 === */}
      <g transform="translate(260, 0)">
        {/* 吊线 */}
        <line x1="0" y1="0" x2="0" y2="38" stroke="#78716C" strokeWidth="2" />
        {/* 灯罩 */}
        <ellipse cx="0" cy="46" rx="24" ry="10" fill="#FEF08A" stroke="#EAB308" strokeWidth="1.5" />
        <ellipse cx="0" cy="44" rx="20" ry="7" fill="#FFFBEB" />
        {/* 灯光效果 */}
        <ellipse cx="0" cy="120" rx="100" ry="50" fill="#FEF9C3" opacity="0.08" />
      </g>

      {/* === 门 === */}
      <g filter="url(#softShadow)">
        {/* 门框 */}
        <rect x="306" y="88" width="66" height="122" rx="3" fill="#78716C" />
        {/* 门板 */}
        <rect x="310" y="92" width="58" height="118" rx="4" fill="#B8956A" />
        {/* 门板装饰凹槽 */}
        <rect x="318" y="102" width="42" height="36" rx="2" fill="#A67C52" />
        <rect x="318" y="148" width="42" height="50" rx="2" fill="#A67C52" />
        {/* 门把手 */}
        <circle cx="356" cy="152" r="5" fill="#FCD34D" stroke="#D97706" strokeWidth="1.5" />
        <ellipse cx="356" cy="152" rx="3" ry="2" fill="#FBBF24" />
        {/* 门板高光 */}
        <rect x="312" y="94" width="8" height="114" rx="2" fill="#C4A484" opacity="0.4" />
      </g>

      {/* === 书桌 - 核心道具区 === */}
      <g filter="url(#softShadow)">
        {/* 桌面阴影 */}
        <ellipse cx="200" cy="214" rx="115" ry="12" fill="#000" opacity="0.1" />
        
        {/* 桌面主体 */}
        <rect x="88" y="182" width="224" height="26" rx="8" fill="url(#tableGrad)" />
        
        {/* 桌面高光 */}
        <rect x="92" y="184" width="216" height="10" rx="5" fill="url(#tableShine)" />
        
        {/* 桌面装饰边 */}
        <rect x="88" y="204" width="224" height="4" rx="2" fill="#8B6914" opacity="0.3" />
        
        {/* 道具放置区提示（微妙） */}
        <ellipse cx="200" cy="193" rx="95" ry="8" fill="#10B981" opacity="0.04" />
        
        {/* 桌腿 */}
        <rect x="108" y="208" width="18" height="48" rx="5" fill="#8B6914" />
        <rect x="274" y="208" width="18" height="48" rx="5" fill="#8B6914" />
        {/* 桌腿高光 */}
        <rect x="108" y="208" width="5" height="48" rx="3" fill="#A68B40" opacity="0.4" />
        <rect x="274" y="208" width="5" height="48" rx="3" fill="#A68B40" opacity="0.4" />
      </g>

      {/* === 椅子 === */}
      <g transform="translate(324, 0)">
        {/* 椅子阴影 */}
        <ellipse cx="0" cy="264" rx="26" ry="6" fill="#000" opacity="0.1" />
        {/* 椅腿 */}
        <rect x="-24" y="222" width="10" height="42" rx="4" fill="#A67C52" />
        <rect x="14" y="222" width="10" height="42" rx="4" fill="#A67C52" />
        {/* 椅座 */}
        <rect x="-28" y="212" width="56" height="14" rx="5" fill="#C4A484" />
        <rect x="-26" y="212" width="52" height="4" rx="2" fill="#D4B896" opacity="0.5" />
        {/* 椅背 */}
        <rect x="-22" y="192" width="44" height="24" rx="6" fill="#D4A574" />
        <rect x="-18" y="196" width="36" height="16" rx="4" fill="#E0C090" opacity="0.4" />
      </g>
    </g>
  );
}
