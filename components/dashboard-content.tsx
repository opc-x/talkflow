"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle2, Mic } from "lucide-react"

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
}

const DISPLAY_STAGES = [
  { index: 1, name: "入门", emoji: "🌱" },
  { index: 2, name: "日常对话", emoji: "💬" },
  { index: 3, name: "职场流利", emoji: "💼" },
  { index: 4, name: "高级表达", emoji: "🎯" },
]

interface DashboardContentProps {
  displayName: string
  hasProgress: boolean
  lessonsDone: number
  reviewCount: number
  currentLesson?: number
  vocabPreview?: string | null
  resumeHref: string
  onboardingHref: string
  reviewHref: string
  greeting: string
  dateStr: string
  stageName: string
  stageEmoji: string
  stagePct: number
  stageIndex: number
  locale: string
}

function MarketScene() {
  return (
    <svg
      viewBox="0 0 430 192"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      role="img"
      aria-label="Mediterranean outdoor market scene"
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
      <rect x="14" y="115" width="144" height="5" fill="#B8895A" rx="2" />
      <polygon points="10,78 162,78 155,95 17,95" fill="url(#awning1)" />
      <rect x="10" y="73" width="152" height="8" fill="#C0392B" rx="1" />

      <ellipse cx="40" cy="120" rx="16" ry="8" fill="#8B4513" />
      <circle cx="30" cy="116" r="6" fill="#E74C3C" />
      <circle cx="41" cy="114" r="7" fill="#C0392B" />
      <circle cx="52" cy="116" r="6" fill="#E74C3C" />
      <circle cx="35" cy="110" r="5" fill="#E74C3C" />
      <circle cx="46" cy="109" r="6" fill="#C0392B" />

      <ellipse cx="85" cy="120" rx="14" ry="7" fill="#8B4513" />
      <path d="M74 118 Q80 107 88 111" stroke="#F1C40F" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M79 116 Q85 105 93 109" stroke="#F9E44A" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M84 117 Q90 106 98 112" stroke="#F1C40F" strokeWidth="5" fill="none" strokeLinecap="round" />

      <ellipse cx="130" cy="120" rx="14" ry="7" fill="#8B4513" />
      <circle cx="121" cy="116" r="6" fill="#7B2D8B" />
      <circle cx="131" cy="114" r="7" fill="#9B59B6" />
      <circle cx="141" cy="116" r="6" fill="#7B2D8B" />
      <line x1="121" y1="110" x2="119" y2="104" stroke="#27AE60" strokeWidth="2" />
      <line x1="131" y1="107" x2="129" y2="100" stroke="#27AE60" strokeWidth="2" />
      <line x1="141" y1="110" x2="143" y2="103" stroke="#27AE60" strokeWidth="2" />

      <rect x="158" y="68" width="6" height="62" fill="#8B6914" rx="1" />
      <rect x="268" y="68" width="6" height="62" fill="#8B6914" rx="1" />
      <rect x="154" y="115" width="124" height="14" fill="#A0784A" rx="2" />
      <rect x="154" y="115" width="124" height="5" fill="#B8895A" rx="2" />
      <polygon points="150,74 278,74 271,91 157,91" fill="url(#awning2)" />
      <rect x="150" y="69" width="128" height="8" fill="#D97706" rx="1" />

      <ellipse cx="180" cy="120" rx="14" ry="7" fill="#8B4513" />
      <rect x="170" y="109" width="6" height="14" fill="#F97316" rx="3" />
      <rect x="178" y="107" width="6" height="16" fill="#EA580C" rx="3" />
      <rect x="186" y="109" width="6" height="14" fill="#F97316" rx="3" />
      <line x1="173" y1="109" x2="171" y2="103" stroke="#16A34A" strokeWidth="2" />
      <line x1="181" y1="107" x2="179" y2="101" stroke="#16A34A" strokeWidth="2" />
      <line x1="189" y1="109" x2="191" y2="103" stroke="#16A34A" strokeWidth="2" />

      <ellipse cx="216" cy="120" rx="14" ry="7" fill="#8B4513" />
      <ellipse cx="208" cy="116" rx="7" ry="5" fill="#FACC15" />
      <ellipse cx="218" cy="114" rx="8" ry="5" fill="#EAB308" />
      <ellipse cx="228" cy="116" rx="7" ry="5" fill="#FACC15" />

      <ellipse cx="253" cy="120" rx="14" ry="7" fill="#8B4513" />
      <circle cx="244" cy="116" r="6" fill="#4ADE80" />
      <circle cx="254" cy="114" r="7" fill="#22C55E" />
      <circle cx="264" cy="116" r="6" fill="#4ADE80" />
      <line x1="244" y1="110" x2="243" y2="105" stroke="#92400E" strokeWidth="1.5" />
      <line x1="254" y1="107" x2="253" y2="102" stroke="#92400E" strokeWidth="1.5" />

      <rect x="278" y="72" width="6" height="58" fill="#8B6914" rx="1" />
      <rect x="408" y="72" width="6" height="58" fill="#8B6914" rx="1" />
      <rect x="274" y="115" width="144" height="14" fill="#A0784A" rx="2" />
      <rect x="274" y="115" width="144" height="5" fill="#B8895A" rx="2" />
      <polygon points="270,78 418,78 411,95 277,95" fill="url(#awning3)" />
      <rect x="270" y="73" width="148" height="8" fill="#15803D" rx="1" />

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

      <rect x="0" y="127" width="430" height="3" fill="#BEA47C" opacity="0.5" />
      <ellipse cx="72" cy="133" rx="6" ry="16" fill="#5D4037" opacity="0.6" />
      <circle cx="72" cy="117" r="5" fill="#5D4037" opacity="0.6" />
      <ellipse cx="220" cy="133" rx="5" ry="15" fill="#4E342E" opacity="0.5" />
      <circle cx="220" cy="118" r="4" fill="#4E342E" opacity="0.5" />
      <ellipse cx="360" cy="132" rx="6" ry="15" fill="#5D4037" opacity="0.55" />
      <circle cx="360" cy="117" r="5" fill="#5D4037" opacity="0.55" />
    </svg>
  )
}

function EmptyStateScene() {
  return (
    <div className="flex h-48 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#0d2e20] to-[#111111]">
      <Mic className="h-12 w-12 text-[#10B981] opacity-40" />
    </div>
  )
}

export function DashboardContent({
  displayName,
  hasProgress,
  lessonsDone,
  reviewCount,
  currentLesson,
  vocabPreview,
  resumeHref,
  onboardingHref,
  reviewHref,
  greeting,
  dateStr,
  stageName,
  stageEmoji,
  stagePct,
  stageIndex,
  locale,
}: DashboardContentProps) {
  return (
    <motion.main
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto min-h-full w-full max-w-[430px] px-4 pb-28 pt-4"
    >
      <motion.section variants={item} className="mb-5">
        <p className="mb-1 text-xs text-muted-foreground">{dateStr}</p>
        <h1 className="text-xl font-semibold text-foreground">
          {greeting}，{displayName}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {stageEmoji} {stageName}
          {currentLesson ? ` · 第${currentLesson}课` : ""}
        </p>
      </motion.section>

      <motion.section variants={item} className="mb-6">
        {hasProgress ? (
          <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#1a1a1a] shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
            <div className="h-48 w-full overflow-hidden">
              <MarketScene />
            </div>
            <div className="px-4 pb-5 pt-3">
              <p className="pb-2 text-sm text-white/55">
                {vocabPreview ?? "know · travel · station · platform"}
              </p>
              <motion.div
                animate={{ scale: [1, 1.025, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={resumeHref}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#10B981] text-lg font-semibold text-white shadow-[0_16px_36px_rgba(16,185,129,0.28)]"
                  >
                    <Mic className="h-5 w-5" />
                    开口练习 →
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </article>
        ) : (
          <article className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-6 text-center shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <EmptyStateScene />
            <h2 className="mt-6 text-xl font-bold text-white">开始你的英语旅程</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              3分钟口语测评，AI找到你的起点
            </p>
            <motion.div
              className="mt-6"
              animate={{ scale: [1, 1.025, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <Link
                href={onboardingHref}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#10B981] text-lg font-semibold text-white shadow-[0_16px_36px_rgba(16,185,129,0.28)]"
              >
                <Mic className="h-5 w-5" />
                开始测评 →
              </Link>
            </motion.div>
          </article>
        )}
      </motion.section>

      <motion.section variants={item} className="mb-5">
        <h2 className="mb-3 text-sm font-medium text-foreground">我的进度</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {DISPLAY_STAGES.map((stage, index) => {
            const isCompleted = stageIndex > stage.index
            const isCurrent = stageIndex === stage.index
            const isFuture = stageIndex < stage.index

            return (
              <div key={stage.index} className="flex shrink-0 items-center gap-2">
                {index > 0 && <span className="text-xs text-muted-foreground/30">→</span>}
                {isCompleted && (
                  <div className="flex flex-col items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                    <span className="whitespace-nowrap text-xs text-[#10B981]">
                      {stage.emoji} {stage.name}
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="rounded-xl border border-[#10B981] bg-[#10B981]/10 px-3 py-2">
                    <p className="whitespace-nowrap text-sm font-semibold text-[#10B981]">
                      {stage.emoji} {stage.name}
                    </p>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-[#10B981]"
                        initial={{ width: "0%" }}
                        animate={{ width: `${stagePct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-[#10B981]">{stagePct}%</p>
                  </div>
                )}
                {isFuture && (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground/30">
                    <span className="text-base">{stage.emoji}</span>
                    <span className="whitespace-nowrap text-xs">{stage.name}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </motion.section>

      <motion.section variants={item} className="mb-4 grid grid-cols-2 gap-3">
        <Link
          href={reviewHref}
          className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-4 transition-colors hover:border-[#10B981]/45"
        >
          <p className="mb-2 text-sm font-medium text-white">今日复习</p>
          <p className="text-3xl font-bold text-[#10B981]">{reviewCount}</p>
          <p className="text-xs text-muted-foreground">词到期</p>
          <p className="mt-3 text-xs font-medium text-[#10B981]">去复习 →</p>
        </Link>
        <Link
          href={`/${locale}/protected/progress`}
          className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-4 transition-colors hover:border-[#10B981]/45"
        >
          <p className="mb-2 text-sm font-medium text-white">学习数据</p>
          <p className="text-3xl font-bold text-white">{lessonsDone}</p>
          <p className="text-xs text-muted-foreground">课已完成</p>
          <p className="mt-3 text-xs font-medium text-[#10B981]">查看 →</p>
        </Link>
      </motion.section>

      <motion.div variants={item}>
        <Link
          href={`/${locale}/protected/map`}
          className="block py-3 text-center text-sm text-muted-foreground/70 transition-colors hover:text-foreground"
        >
          全部课程地图 →
        </Link>
      </motion.div>
    </motion.main>
  )
}
