"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Mic,
  Home,
  RotateCcw,
  User,
  Moon,
  Flame,
  CheckCircle2,
} from "lucide-react"

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
}

function MarketSVG() {
  return (
    <svg
      viewBox="0 0 430 192"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-label="Mediterranean outdoor market scene"
    >
      {/* Sky gradient */}
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

      {/* Sky */}
      <rect width="430" height="192" fill="url(#skyGrad)" />

      {/* Sun */}
      <circle cx="380" cy="32" r="22" fill="#FFD700" opacity="0.9" />
      <circle cx="380" cy="32" r="28" fill="#FFD700" opacity="0.2" />

      {/* Sea strip at horizon */}
      <rect x="0" y="105" width="430" height="12" fill="#1E90FF" opacity="0.7" />
      <rect x="0" y="110" width="430" height="4" fill="#1565C0" opacity="0.3" />

      {/* Sandy ground */}
      <rect x="0" y="117" width="430" height="75" fill="#D4B896" />
      <rect x="0" y="117" width="430" height="4" fill="#C4A882" />

      {/* ── STALL 1 (left) ── */}
      {/* Wooden post left */}
      <rect x="18" y="72" width="6" height="58" fill="#8B6914" rx="1" />
      {/* Wooden post right */}
      <rect x="148" y="72" width="6" height="58" fill="#8B6914" rx="1" />
      {/* Counter */}
      <rect x="14" y="115" width="144" height="14" fill="#A0784A" rx="2" />
      <rect x="14" y="115" width="144" height="5" fill="#B8895A" rx="2" />
      {/* Awning */}
      <polygon points="10,78 162,78 155,95 17,95" fill="url(#awning1)" />
      <rect x="10" y="73" width="152" height="8" fill="#C0392B" rx="1" />

      {/* Tomatoes basket */}
      <ellipse cx="40" cy="120" rx="16" ry="8" fill="#8B4513" />
      <circle cx="30" cy="116" r="6" fill="#E74C3C" />
      <circle cx="41" cy="114" r="7" fill="#C0392B" />
      <circle cx="52" cy="116" r="6" fill="#E74C3C" />
      <circle cx="35" cy="110" r="5" fill="#E74C3C" />
      <circle cx="46" cy="109" r="6" fill="#C0392B" />

      {/* Bananas bunch */}
      <ellipse cx="85" cy="120" rx="14" ry="7" fill="#8B4513" />
      <path d="M74 118 Q80 107 88 111" stroke="#F1C40F" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M79 116 Q85 105 93 109" stroke="#F9E44A" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M84 117 Q90 106 98 112" stroke="#F1C40F" strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* Purple onions */}
      <ellipse cx="130" cy="120" rx="14" ry="7" fill="#8B4513" />
      <circle cx="121" cy="116" r="6" fill="#7B2D8B" />
      <circle cx="131" cy="114" r="7" fill="#9B59B6" />
      <circle cx="141" cy="116" r="6" fill="#7B2D8B" />
      <line x1="121" y1="110" x2="119" y2="104" stroke="#27AE60" strokeWidth="2" />
      <line x1="131" y1="107" x2="129" y2="100" stroke="#27AE60" strokeWidth="2" />
      <line x1="141" y1="110" x2="143" y2="103" stroke="#27AE60" strokeWidth="2" />

      {/* ── STALL 2 (center) ── */}
      <rect x="158" y="68" width="6" height="62" fill="#8B6914" rx="1" />
      <rect x="268" y="68" width="6" height="62" fill="#8B6914" rx="1" />
      <rect x="154" y="115" width="124" height="14" fill="#A0784A" rx="2" />
      <rect x="154" y="115" width="124" height="5" fill="#B8895A" rx="2" />
      <polygon points="150,74 278,74 271,91 157,91" fill="url(#awning2)" />
      <rect x="150" y="69" width="128" height="8" fill="#D97706" rx="1" />

      {/* Carrots */}
      <ellipse cx="180" cy="120" rx="14" ry="7" fill="#8B4513" />
      <rect x="170" y="109" width="6" height="14" fill="#F97316" rx="3" />
      <rect x="178" y="107" width="6" height="16" fill="#EA580C" rx="3" />
      <rect x="186" y="109" width="6" height="14" fill="#F97316" rx="3" />
      <line x1="173" y1="109" x2="171" y2="103" stroke="#16A34A" strokeWidth="2" />
      <line x1="181" y1="107" x2="179" y2="101" stroke="#16A34A" strokeWidth="2" />
      <line x1="189" y1="109" x2="191" y2="103" stroke="#16A34A" strokeWidth="2" />

      {/* Lemons */}
      <ellipse cx="216" cy="120" rx="14" ry="7" fill="#8B4513" />
      <ellipse cx="208" cy="116" rx="7" ry="5" fill="#FACC15" />
      <ellipse cx="218" cy="114" rx="8" ry="5" fill="#EAB308" />
      <ellipse cx="228" cy="116" rx="7" ry="5" fill="#FACC15" />

      {/* Green apples */}
      <ellipse cx="253" cy="120" rx="14" ry="7" fill="#8B4513" />
      <circle cx="244" cy="116" r="6" fill="#4ADE80" />
      <circle cx="254" cy="114" r="7" fill="#22C55E" />
      <circle cx="264" cy="116" r="6" fill="#4ADE80" />
      <line x1="244" y1="110" x2="243" y2="105" stroke="#92400E" strokeWidth="1.5" />
      <line x1="254" y1="107" x2="253" y2="102" stroke="#92400E" strokeWidth="1.5" />

      {/* ── STALL 3 (right) ── */}
      <rect x="278" y="72" width="6" height="58" fill="#8B6914" rx="1" />
      <rect x="408" y="72" width="6" height="58" fill="#8B6914" rx="1" />
      <rect x="274" y="115" width="144" height="14" fill="#A0784A" rx="2" />
      <rect x="274" y="115" width="144" height="5" fill="#B8895A" rx="2" />
      <polygon points="270,78 418,78 411,95 277,95" fill="url(#awning3)" />
      <rect x="270" y="73" width="148" height="8" fill="#15803D" rx="1" />

      {/* Mixed veg right stall */}
      <ellipse cx="305" cy="120" rx="16" ry="7" fill="#8B4513" />
      <circle cx="295" cy="116" r="6" fill="#EF4444" />
      <circle cx="305" cy="114" r="7" fill="#DC2626" />
      <circle cx="315" cy="116" r="6" fill="#EF4444" />

      <ellipse cx="345" cy="120" rx="14" ry="7" fill="#8B4513" />
      <circle cx="336" cy="116" r="6" fill="#A855F7" />
      <circle cx="345" cy="114" r="7" fill="#9333EA" />
      <circle cx="354" cy="116" r="6" fill="#A855F7" />

      <ellipse cx="385" cy="120" rx="14" ry="7" fill="#8B4513" />
      <ellipse cx="376" cy="116" rx="7" ry="5" fill="#FACC15" />
      <ellipse cx="386" cy="114" rx="8" ry="5" fill="#EAB308" />
      <ellipse cx="396" cy="116" rx="7" ry="5" fill="#FACC15" />

      {/* Ground shadow under stalls */}
      <rect x="0" y="127" width="430" height="3" fill="#BEA47C" opacity="0.5" />

      {/* People silhouettes (simple flat) */}
      <ellipse cx="72" cy="133" rx="6" ry="16" fill="#5D4037" opacity="0.6" />
      <circle cx="72" cy="117" r="5" fill="#5D4037" opacity="0.6" />
      <ellipse cx="220" cy="133" rx="5" ry="15" fill="#4E342E" opacity="0.5" />
      <circle cx="220" cy="118" r="4" fill="#4E342E" opacity="0.5" />
      <ellipse cx="360" cy="132" rx="6" ry="15" fill="#5D4037" opacity="0.55" />
      <circle cx="360" cy="117" r="5" fill="#5D4037" opacity="0.55" />
    </svg>
  )
}

export default function DashboardPage() {
  const [hasProgress, setHasProgress] = useState(true)
  const [reviewCount] = useState(12)

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] font-sans">
      {/* Demo toggle — fixed top-right, outside main layout */}
      <button
        onClick={() => setHasProgress((p) => !p)}
        className="fixed top-3 right-[calc(50%-215px+4px)] z-[100] text-[10px] font-mono bg-[#1a1a1a] border border-[rgba(255,255,255,0.12)] text-[rgba(245,245,245,0.5)] rounded-md px-2 py-1 hover:text-[#10B981] transition-colors"
        style={{ right: "calc(max(0px, (100vw - 430px)/2) + 4px)" }}
      >
        {hasProgress ? "▶ has progress" : "▶ no progress"}
      </button>

      <div className="max-w-[430px] mx-auto relative">
        {/* ── TOP NAV ── */}
        <header className="sticky top-0 z-50 h-14 px-4 bg-[#111111]/80 backdrop-blur-sm border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          {/* Left: logo */}
          <div className="flex items-center">
            <Mic className="w-4 h-4 text-[#10B981] mr-1.5" />
            <span className="text-lg font-bold text-[#10B981]">TalkFlow</span>
          </div>

          {/* Right: streak + moon + avatar */}
          <div className="flex items-center gap-2">
            {/* Flame badge */}
            <div className="flex items-center gap-1 bg-orange-950 text-orange-400 rounded-full px-2.5 py-1 text-xs font-medium">
              <Flame className="w-3.5 h-3.5" />
              <span>7天</span>
            </div>
            <Moon className="w-5 h-5 text-[rgba(245,245,245,0.4)]" />
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#10B981] text-white text-sm font-bold flex items-center justify-center select-none">
              张
            </div>
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <motion.main
          className="px-4 pt-4 pb-28"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Greeting */}
          <motion.div variants={itemVariants}>
            <h1 className="text-xl font-semibold text-[#F5F5F5]">早上好，张三</h1>
            <p className="text-sm text-[rgba(245,245,245,0.5)] mt-0.5 mb-5">
              💬 日常对话 · 第28课
            </p>
          </motion.div>

          {/* ── HERO CARD ── */}
          <motion.div variants={itemVariants}>
            {hasProgress ? (
              /* Progress hero */
              <div className="rounded-3xl overflow-hidden bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] mb-6">
                {/* Scene image */}
                <div className="h-48 w-full overflow-hidden">
                  <MarketSVG />
                </div>

                {/* Vocab row */}
                <div className="px-4 pt-3 pb-1.5">
                  <p className="text-sm text-[rgba(245,245,245,0.5)]">
                    know · travel · station · platform
                  </p>
                </div>

                {/* CTA */}
                <div className="px-4 pb-5 pt-2">
                  <motion.div
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    <motion.button
                      className="w-full h-14 rounded-2xl bg-[#10B981] text-white text-lg font-semibold flex items-center justify-center gap-2 cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Mic className="w-5 h-5" />
                      开口练习 →
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            ) : (
              /* No-progress hero */
              <div className="rounded-3xl p-8 text-center bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] mb-6">
                {/* Fallback illustration */}
                <div className="bg-gradient-to-br from-[#0d2e20] to-[#111111] h-48 w-full flex items-center justify-center rounded-2xl mb-6">
                  <Mic className="w-12 h-12 text-[#10B981] opacity-40" />
                </div>
                <h2 className="text-xl font-bold text-[#F5F5F5] mb-2">
                  开始你的英语旅程
                </h2>
                <p className="text-sm text-[rgba(245,245,245,0.5)] mb-6">
                  3分钟口语测评，AI找到你的起点
                </p>
                <motion.div
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <motion.button
                    className="w-full h-14 rounded-2xl bg-[#10B981] text-white text-lg font-semibold flex items-center justify-center gap-2 cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Mic className="w-5 h-5" />
                    开始测评 →
                  </motion.button>
                </motion.div>
              </div>
            )}
          </motion.div>

          {/* ── STAGE PROGRESS ── */}
          <motion.div variants={itemVariants} className="mb-4">
            <p className="text-sm font-medium text-[#F5F5F5] mb-3">我的进度</p>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {/* Stage 1 — completed */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span className="text-xs text-[#10B981] whitespace-nowrap">🌱 入门</span>
              </div>

              <span className="text-xs text-[rgba(245,245,245,0.25)] shrink-0">→</span>

              {/* Stage 2 — current */}
              <div className="shrink-0 rounded-xl border border-[#10B981] px-3 py-2 bg-[#10B981]/10">
                <p className="text-sm font-semibold text-[#10B981] whitespace-nowrap">
                  💬 日常对话
                </p>
                {/* Progress bar */}
                <div className="h-1 w-full bg-[rgba(255,255,255,0.1)] rounded-full mt-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-[#10B981] rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "43%" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs text-[#10B981] mt-1">43%</p>
              </div>

              <span className="text-xs text-[rgba(245,245,245,0.25)] shrink-0">→</span>

              {/* Stage 3 — future */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <span className="text-base text-[rgba(245,245,245,0.2)]">💼</span>
                <span className="text-xs text-[rgba(245,245,245,0.2)] whitespace-nowrap">
                  职场流利
                </span>
              </div>

              <span className="text-xs text-[rgba(245,245,245,0.25)] shrink-0">→</span>

              {/* Stage 4 — future */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <span className="text-base text-[rgba(245,245,245,0.2)]">🎯</span>
                <span className="text-xs text-[rgba(245,245,245,0.2)] whitespace-nowrap">
                  高级表达
                </span>
              </div>
            </div>
          </motion.div>

          {/* ── SECONDARY CARDS ── */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-4">
            {/* 今日复习 */}
            <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[rgba(255,255,255,0.08)]">
              <p className="text-sm font-medium text-[#F5F5F5] mb-2">今日复习</p>
              {reviewCount > 0 ? (
                <>
                  <p className="text-3xl font-bold text-[#10B981]">12</p>
                  <p className="text-xs text-[rgba(245,245,245,0.5)]">词到期</p>
                  <span className="text-xs text-[#10B981] mt-3 block">去复习 →</span>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-[rgba(245,245,245,0.3)]">暂无</p>
                  <p className="text-xs text-[rgba(245,245,245,0.4)]">今日已完成</p>
                </>
              )}
            </div>

            {/* 学习数据 */}
            <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[rgba(255,255,255,0.08)]">
              <p className="text-sm font-medium text-[#F5F5F5] mb-2">学习数据</p>
              <p className="text-3xl font-bold text-[#F5F5F5]">30</p>
              <p className="text-xs text-[rgba(245,245,245,0.5)]">课已完成</p>
              <span className="text-xs text-[#10B981] mt-3 block">查看 →</span>
            </div>
          </motion.div>

          {/* Map link */}
          <motion.div variants={itemVariants}>
            <span className="text-sm text-center text-[rgba(245,245,245,0.3)] block py-3 cursor-pointer hover:text-[rgba(245,245,245,0.5)] transition-colors">
              全部课程地图 →
            </span>
          </motion.div>
        </motion.main>

        {/* ── BOTTOM TAB BAR ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          <div className="max-w-[430px] mx-auto h-16 bg-[#111111] border-t border-[rgba(255,255,255,0.08)] flex items-center justify-around relative pt-1 pointer-events-auto">
            {/* Tab: 首页 (active) */}
            <button className="flex flex-col items-center gap-0.5 cursor-pointer">
              <Home className="w-5 h-5 text-[#10B981]" />
              <span className="text-xs text-[#10B981]">首页</span>
            </button>

            {/* Spacer left */}
            <div className="w-14" />

            {/* Center raised mic button */}
            <motion.button
              className="absolute left-1/2 -translate-x-1/2 -translate-y-5 w-14 h-14 rounded-full bg-[#10B981] shadow-[0_0_0_4px_#111111,0_0_24px_rgba(16,185,129,0.6)] flex items-center justify-center cursor-pointer"
              animate={{ scale: [1, 1.07, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              aria-label="开始说话"
            >
              <Mic className="w-6 h-6 text-white" />
            </motion.button>

            {/* Tab: 复习 */}
            <button className="flex flex-col items-center gap-0.5 relative cursor-pointer">
              <RotateCcw className="w-5 h-5 text-[rgba(245,245,245,0.4)]" />
              <span className="text-xs text-[rgba(245,245,245,0.4)]">复习</span>
              {/* Badge */}
              <span className="absolute -top-1 -right-2 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                12
              </span>
            </button>

            {/* Tab: 我的 */}
            <button className="flex flex-col items-center gap-0.5 cursor-pointer">
              <User className="w-5 h-5 text-[rgba(245,245,245,0.4)]" />
              <span className="text-xs text-[rgba(245,245,245,0.4)]">我的</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}
