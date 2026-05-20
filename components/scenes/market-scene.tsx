export function MarketScene() {
  return (
    <svg
      viewBox="0 0 430 192"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      role="img"
      aria-label="Outdoor market scene"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#87CEEB" />
          <stop offset="100%" stopColor="#B8E4F7" />
        </linearGradient>
        <linearGradient id="awning1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#E05A3A" />
          <stop offset="16.66%" stopColor="#F5F5F5" />
          <stop offset="33.33%" stopColor="#E05A3A" />
          <stop offset="50%" stopColor="#F5F5F5" />
          <stop offset="66.66%" stopColor="#E05A3A" />
          <stop offset="83.33%" stopColor="#F5F5F5" />
          <stop offset="100%" stopColor="#E05A3A" />
        </linearGradient>
        <linearGradient id="awning2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="16.66%" stopColor="#FEFCE8" />
          <stop offset="33.33%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#FEFCE8" />
          <stop offset="66.66%" stopColor="#F59E0B" />
          <stop offset="83.33%" stopColor="#FEFCE8" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="awning3" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#16A34A" />
          <stop offset="16.66%" stopColor="#DCFCE7" />
          <stop offset="33.33%" stopColor="#16A34A" />
          <stop offset="50%" stopColor="#DCFCE7" />
          <stop offset="66.66%" stopColor="#16A34A" />
          <stop offset="83.33%" stopColor="#DCFCE7" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
      </defs>
      <rect width="430" height="192" fill="url(#skyGrad)" />
      <circle cx="380" cy="32" r="22" fill="#FFD700" opacity="0.9" />
      <circle cx="380" cy="32" r="28" fill="#FFD700" opacity="0.2" />
      <rect x="0" y="105" width="430" height="12" fill="#1E90FF" opacity="0.7" />
      <rect x="0" y="110" width="430" height="4" fill="#1565C0" opacity="0.3" />
      <rect x="0" y="117" width="430" height="75" fill="#D4B896" />
      <rect x="0" y="117" width="430" height="4" fill="#C4A882" />
      <rect x="18" y="72" width="6" height="58" fill="#8B6914" rx="1" />
      <rect x="148" y="72" width="6" height="58" fill="#8B6914" rx="1" />
      <rect x="14" y="115" width="144" height="14" fill="#A0784A" rx="2" />
      <polygon points="10,78 162,78 155,95 17,95" fill="url(#awning1)" />
      <ellipse cx="40" cy="120" rx="16" ry="8" fill="#8B4513" />
      <circle cx="30" cy="116" r="6" fill="#E74C3C" />
      <circle cx="41" cy="114" r="7" fill="#C0392B" />
      <rect x="158" y="68" width="6" height="62" fill="#8B6914" rx="1" />
      <rect x="268" y="68" width="6" height="62" fill="#8B6914" rx="1" />
      <polygon points="150,74 278,74 271,91 157,91" fill="url(#awning2)" />
      <rect x="278" y="72" width="6" height="58" fill="#8B6914" rx="1" />
      <rect x="408" y="72" width="6" height="58" fill="#8B6914" rx="1" />
      <polygon points="270,78 418,78 411,95 277,95" fill="url(#awning3)" />
    </svg>
  )
}
